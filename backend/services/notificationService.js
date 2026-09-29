const Notification = require('../models/Notification');
const Proposal = require('../models/Proposal');
const Household = require('../models/Household');
const User = require('../models/User');
const Vote = require('../models/Vote');

const positiveNumber = (value, fallback) => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : fallback;
const reminderWindowMs = () => positiveNumber(process.env.VOTING_REMINDER_WINDOW_MINUTES, 1440) * 60000;
const reminderIntervalMs = () => positiveNumber(process.env.NOTIFICATION_CHECK_INTERVAL_SECONDS, 60) * 1000;

const isVotingOpen = (proposal, now) => proposal && ['active', 'upcoming'].includes(proposal.status)
  && new Date(proposal.votingStartDate) <= now && new Date(proposal.votingDeadline) > now;

async function eligibleUsers(proposal, publishedOnly = false) {
  const households = await Household.distinct('_id');
  return User.find({ household: { $in: households }, ...(publishedOnly ? { createdAt: { $lte: proposal.publishedAt } } : {}) })
    .select('_id household').lean();
}

async function insertOnce(proposal, users, type, title, message, expiresAt = proposal.votingDeadline) {
  for (const user of users) {
    try {
      await Notification.updateOne(
        { recipient: user._id, proposal: proposal._id, type, stage: 'once' },
        { $setOnInsert: { household: user.household, title, message, isRead: false, isSuppressed: false,
          expiresAt } },
        { upsert: true }
      );
    } catch (error) {
      // A concurrent worker may have inserted the same unique event.
      if (error.code !== 11000) throw error;
    }
  }
}

async function createPublicationNotifications(proposal) {
  if (!proposal.publishedAt || proposal.status === 'draft') return;
  if (proposal.status !== 'cancelled') {
    await insertOnce(proposal, await eligibleUsers(proposal, true), 'proposal_published',
      'New community proposal', `${proposal.title} is now available.`);
  }
  await Proposal.updateOne({ _id: proposal._id }, { $set: { publicationNotificationsPending: false } });
}

async function createDeadlineReminders(proposal, now = new Date()) {
  // Recheck persisted state in case the worker loaded this proposal before cancellation.
  if (!await Proposal.exists({ _id: proposal._id, status: { $in: ['active', 'upcoming'] } })) return;
  if (!isVotingOpen(proposal, now) || new Date(proposal.votingDeadline) - now > reminderWindowMs()) return;
  const users = await eligibleUsers(proposal);
  const byHousehold = new Map();
  for (const user of users) {
    const key = String(user.household);
    byHousehold.set(key, [...(byHousehold.get(key) || []), user]);
  }
  for (const [household, members] of byHousehold) {
    // Only existence is needed; no voting choice is read.
    if (await Vote.exists({ proposal: proposal._id, household })) continue;
    await insertOnce(proposal, members, 'voting_deadline_reminder', 'Voting closes soon',
      `Your household can still vote on ${proposal.title}. Open the proposal to check the deadline.`);
  }
}

async function createCancellationNotifications(proposal) {
  if (!proposal.publishedAt || proposal.status !== 'cancelled') return;
  const now = new Date();
  await Notification.updateMany({ proposal: proposal._id, type: { $in: ['proposal_published', 'voting_deadline_reminder'] } },
    { $set: { expiresAt: now, isSuppressed: true } });
  const compact = (value, length) => {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    return text.length > length ? `${text.slice(0, length - 1)}…` : text;
  };
  const reason = compact(proposal.cancellationReason, 160);
  const days = positiveNumber(process.env.CANCELLED_NOTIFICATION_RETENTION_DAYS, 30);
  await insertOnce(proposal, await eligibleUsers(proposal, true), 'proposal_cancelled', 'Proposal cancelled',
    `${compact(proposal.title, 100)} has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
    new Date(now.getTime() + days * 86400000));
  await Proposal.updateOne({ _id: proposal._id }, { $set: { cancellationNotificationsPending: false } });
}

async function suppressIneligibleReminders(recipient, now = new Date()) {
  const query = { type: 'voting_deadline_reminder', isSuppressed: false, ...(recipient ? { recipient } : {}) };
  const reminders = await Notification.find(query).select('_id proposal household').lean();
  for (const reminder of reminders) {
    const proposal = await Proposal.findById(reminder.proposal).select('status votingStartDate votingDeadline').lean();
    if (!isVotingOpen(proposal, now) || await Vote.exists({ proposal: reminder.proposal, household: reminder.household })) {
      await Notification.updateOne({ _id: reminder._id }, { $set: { isSuppressed: true } });
    }
  }
}

async function runNotificationCycle(now = new Date()) {
  const cancellations = await Proposal.find({ cancellationNotificationsPending: true, status: 'cancelled' });
  for (const proposal of cancellations) await createCancellationNotifications(proposal);
  const pending = await Proposal.find({ publicationNotificationsPending: true });
  for (const proposal of pending) await createPublicationNotifications(proposal);
  const approaching = await Proposal.find({
    status: { $in: ['active', 'upcoming'] },
    votingStartDate: { $lte: now },
    votingDeadline: { $gt: now, $lte: new Date(now.getTime() + reminderWindowMs()) },
  });
  for (const proposal of approaching) await createDeadlineReminders(proposal, now);
  await suppressIneligibleReminders(null, now);
}

function startNotificationWorker() {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try { await runNotificationCycle(); }
    catch (error) { console.error('Notification check failed:', error.message); }
    finally { running = false; }
  };
  const timer = setInterval(tick, reminderIntervalMs());
  timer.unref();
  void tick();
  return () => clearInterval(timer);
}

// Only these voting-action types depend on a live proposal. Future types can
// supply their own expiresAt without inheriting the voting deadline rule.
async function relevantNotificationFilter(recipient, now = new Date()) {
  const votingTypes = ['proposal_published', 'voting_deadline_reminder'];
  const proposals = await Proposal.distinct('_id', {
    status: { $in: ['active', 'upcoming'] }, votingDeadline: { $gt: now },
  });
  return { recipient, isSuppressed: false, $and: [
    { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
    // Also covers legacy records with no expiresAt and cancelled/deleted proposals.
    { $or: [{ type: { $nin: votingTypes } }, { proposal: { $in: proposals } }] },
  ] };
}

module.exports = { createPublicationNotifications, createCancellationNotifications, createDeadlineReminders, suppressIneligibleReminders,
  runNotificationCycle, startNotificationWorker, reminderWindowMs, reminderIntervalMs, isVotingOpen, relevantNotificationFilter };
