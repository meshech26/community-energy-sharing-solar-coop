const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
const Household = require('../models/Household');
const User = require('../models/User');
const Proposal = require('../models/Proposal');
const Vote = require('../models/Vote');
const Notification = require('../models/Notification');
const { runNotificationCycle, createPublicationNotifications, createCancellationNotifications, createDeadlineReminders } = require('../services/notificationService');

// Tests never use MONGO_URI or load .env. Only this freshly named local database
// is created and dropped. No normal project data is read or changed.
const database = `solarshare_notification_tests_${randomUUID().replaceAll('-', '')}`;
let server, base, admin, member, sibling, other;
const secret = 'notification-integration-test-only';
const now = new Date();
before(async () => {
  process.env.JWT_SECRET = secret;
  process.env.VOTING_REMINDER_WINDOW_MINUTES = '60';
  await mongoose.connect(`mongodb://127.0.0.1:27017/${database}`, { serverSelectionTimeoutMS: 5000 });
  await Promise.all([Household.init(), User.init(), Proposal.init(), Vote.init(), Notification.init()]);
  const [h1, h2] = await Household.create([{ name: 'Test household 1', invitationCode: 'TEST1' }, { name: 'Test household 2', invitationCode: 'TEST2' }]);
  [admin, member, sibling, other] = await User.create([
    { name: 'Test admin', email: 'admin@example.test', password: 'not-a-login', household: h1._id, isCoopAdmin: true },
    { name: 'Test member', email: 'member@example.test', password: 'not-a-login', household: h1._id },
    { name: 'Test sibling', email: 'sibling@example.test', password: 'not-a-login', household: h1._id },
    { name: 'Test other', email: 'other@example.test', password: 'not-a-login', household: h2._id },
  ]);
  const app = express(); app.use(express.json());
  app.use('/api/auth', require('../routes/authRoutes'));
  app.use('/api/proposals', require('../routes/proposalRoutes'));
  app.use('/api/notifications', require('../routes/notificationRoutes'));
  server = await new Promise((resolve) => { const listening = app.listen(0, '127.0.0.1', () => resolve(listening)); });
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1 && mongoose.connection.name === database) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

async function request(path, user = member, method = 'GET', body) {
  const response = await fetch(`${base}${path}`, { method, headers: {
    'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${jwt.sign({ userId: String(user._id) }, secret)}` } : {}),
  }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, data: await response.json() };
}
const payload = (title = 'Test proposal') => ({ title, summary: 'Summary', description: 'Description', benefits: 'Benefits', estimatedCost: 10,
  householdImpact: 'Impact', votingStartDate: new Date(now.getTime() - 60000), votingDeadline: new Date(now.getTime() + 30 * 60000) });
async function proposal(title, status = 'active') {
  return Proposal.create({ ...payload(title), createdBy: admin._id, status, publishedAt: status === 'draft' ? null : new Date() });
}

test('notification integration and existing household rules', async (t) => {
  let published;
  await t.test('draft creation creates no notifications; publish creates one for every eligible member including admin', async () => {
    const draft = await request('/proposals', admin, 'POST', payload());
    assert.equal(draft.status, 201);
    assert.equal(await Notification.countDocuments({ proposal: draft.data.proposal.id }), 0);
    const result = await request(`/proposals/${draft.data.proposal.id}/publish`, admin, 'POST');
    assert.equal(result.status, 200);
    published = await Proposal.findById(result.data.proposal.id);
    assert.equal(await Notification.countDocuments({ proposal: published._id, type: 'proposal_published' }), 4);
    assert.equal(published.publicationNotificationsPending, false);
  });
  await t.test('publish retry and concurrent fan-out do not duplicate records', async () => {
    assert.equal((await request(`/proposals/${published._id}/publish`, admin, 'POST')).status, 409);
    await Promise.all([createPublicationNotifications(published), createPublicationNotifications(published)]);
    assert.equal(await Notification.countDocuments({ proposal: published._id }), 4);
  });
  await t.test('normal member cannot publish or create a proposal', async () => {
    assert.equal((await request('/proposals', member, 'POST', payload())).status, 403);
    assert.equal((await request(`/proposals/${published._id}/publish`, member, 'POST')).status, 403);
  });
  await t.test('reminders are household-aware and retry-safe', async () => {
    await Vote.create({ proposal: published._id, household: member.household, submittedBy: member._id, choice: 'abstain' });
    await Promise.all([createDeadlineReminders(published), createDeadlineReminders(published)]);
    assert.equal(await Notification.countDocuments({ proposal: published._id, type: 'voting_deadline_reminder' }), 1);
    assert.ok(await Notification.exists({ proposal: published._id, recipient: other._id, type: 'voting_deadline_reminder' }));
    assert.equal(await Notification.countDocuments({ proposal: published._id, household: member.household, type: 'voting_deadline_reminder' }), 0);
  });
  await t.test('draft, cancelled, closed, future, and outside-window proposals produce no reminder', async () => {
    for (const status of ['draft', 'cancelled', 'closed']) {
      const item = await proposal(status, status); await createDeadlineReminders(item);
      assert.equal(await Notification.countDocuments({ proposal: item._id }), 0);
    }
    for (const overrides of [ { votingStartDate: new Date(now.getTime() + 60000) }, { votingDeadline: new Date(now.getTime() + 120 * 60000) } ]) {
      const item = await Proposal.create({ ...payload(), createdBy: admin._id, status: 'upcoming', ...overrides });
      await createDeadlineReminders(item); assert.equal(await Notification.countDocuments({ proposal: item._id }), 0);
    }
  });
  await t.test('authenticated inbox returns only the current recipient and safe fields', async () => {
    const result = await request('/notifications', member);
    assert.equal(result.status, 200); assert.equal(result.data.notifications.length, 1);
    assert.equal(result.data.unreadCount, 1);
    assert.deepEqual(Object.keys(result.data.notifications[0]).sort(), ['createdAt', 'id', 'isRead', 'message', 'proposalId', 'title', 'type']);
    assert.equal((await request('/notifications', null)).status, 401);
    assert.equal((await request('/notifications?page=Infinity', member)).status, 400);
  });
  await t.test('ownership, invalid IDs, missing IDs, and mark-as-read are enforced', async () => {
    const item = await Notification.findOne({ recipient: member._id, type: 'proposal_published' });
    assert.equal((await request(`/notifications/${item._id}/read`, other, 'PATCH')).status, 404);
    assert.equal((await request(`/notifications/${item._id}/read`, null, 'PATCH')).status, 401);
    assert.equal((await request('/notifications/bad-id/read', member, 'PATCH')).status, 400);
    assert.equal((await request(`/notifications/${new mongoose.Types.ObjectId()}/read`, member, 'PATCH')).status, 404);
    assert.equal((await request(`/notifications/${item._id}/read`, member, 'PATCH')).data.notification.isRead, true);
    assert.equal((await request('/notifications', member)).data.unreadCount, 0);
    assert.equal((await request('/notifications', sibling)).data.unreadCount, 1);
  });
  await t.test('confirmed vote removes outstanding reminders for all members of the household', async () => {
    const vote = await request(`/proposals/${published._id}/vote`, other, 'POST', { choice: 'yes' });
    assert.equal(vote.status, 201);
    assert.equal((await request('/notifications', other)).data.notifications.some((item) => item.type === 'voting_deadline_reminder'), false);
    assert.ok((await request('/notifications', other)).data.notifications.some((item) => item.type === 'proposal_published' && item.proposalId === String(published._id)));
    assert.equal((await request(`/proposals/${published._id}/vote`, other, 'POST', { choice: 'no' })).status, 409);
    assert.equal((await request(`/proposals/${published._id}/results`, member)).status, 409);
  });
  await t.test('suppressed reminders cannot be opened after closure or cancellation', async () => {
    for (const status of ['closed', 'cancelled']) {
      const item = await proposal(`Becoming ${status}`); await createDeadlineReminders(item);
      const reminder = await Notification.findOne({ proposal: item._id, recipient: member._id });
      await Proposal.updateOne({ _id: item._id }, { $set: { status } });
      assert.equal((await request(`/notifications/${reminder._id}/read`, member, 'PATCH')).status, 404);
    }
  });
  await t.test('worker recovers a pending publish and ignores historical unmarked proposals', async () => {
    const item = await proposal('Recover publish');
    await Proposal.updateOne({ _id: item._id }, { $set: { publicationNotificationsPending: true } });
    const historical = await proposal('Old publication');
    await runNotificationCycle(); await runNotificationCycle();
    assert.equal(await Notification.countDocuments({ proposal: item._id, type: 'proposal_published' }), 4);
    assert.equal(await Notification.countDocuments({ proposal: historical._id, type: 'proposal_published' }), 0);
  });
  await t.test('registration, login, and JWT access remain functional with notification routes', async () => {
    const registered = await request('/auth/register', null, 'POST', { name: 'New member', email: 'new@example.test', password: 'TestMember123!', invitationCode: 'TEST2' });
    assert.equal(registered.status, 201);
    const login = await request('/auth/login', null, 'POST', { email: 'new@example.test', password: 'TestMember123!' });
    assert.equal(login.status, 200);
    const response = await fetch(`${base}/notifications`, { headers: { Authorization: `Bearer ${login.data.token}` } });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).unreadCount, 0);
  });
  await t.test('deadline expiry excludes both types and unread counts without deleting records; reading preserves expiry', async () => {
    const item = await proposal('Expiry lifecycle');
    await createPublicationNotifications(item); await createDeadlineReminders(item);
    const records = await Notification.find({ proposal: item._id, recipient: member._id });
    assert.equal(records.length, 2);
    for (const record of records) assert.equal(record.expiresAt.getTime(), item.votingDeadline.getTime());
    const before = (await request('/notifications')).data;
    assert.equal(before.notifications.filter((entry) => entry.proposalId === String(item._id)).length, 2);
    const publication = records.find((entry) => entry.type === 'proposal_published');
    assert.equal((await request(`/notifications/${publication._id}/read`, member, 'PATCH')).status, 200);
    const afterRead = (await request('/notifications')).data;
    assert.equal(afterRead.notifications.filter((entry) => entry.proposalId === String(item._id)).length, 2);
    assert.equal(afterRead.unreadCount, before.unreadCount - 1);
    assert.equal((await Notification.findById(publication._id)).expiresAt.getTime(), item.votingDeadline.getTime());
    // Expired records stay in MongoDB: API filtering, not physical cleanup, hides them.
    await Notification.updateMany({ proposal: item._id }, { $set: { expiresAt: new Date(0) } });
    const expired = (await request('/notifications')).data;
    assert.equal(expired.notifications.some((entry) => entry.proposalId === String(item._id)), false);
    assert.equal(expired.unreadCount, afterRead.unreadCount - 1);
    assert.equal((await request(`/notifications/${publication._id}/read`, member, 'PATCH')).status, 404);
    assert.equal(await Notification.countDocuments({ proposal: item._id, recipient: member._id }), 2);
  });
  await t.test('legacy notifications without expiresAt follow the proposal deadline', async () => {
    const item = await proposal('Legacy expiry');
    await createPublicationNotifications(item); await createDeadlineReminders(item);
    await Notification.updateMany({ proposal: item._id }, { $unset: { expiresAt: '' } });
    assert.equal((await request('/notifications')).data.notifications.filter((entry) => entry.proposalId === String(item._id)).length, 2);
    await Proposal.updateOne({ _id: item._id }, { $set: { votingDeadline: new Date(0) } });
    assert.equal((await request('/notifications')).data.notifications.some((entry) => entry.proposalId === String(item._id)), false);
  });
  await t.test('published cancellation creates private retry-safe notices with independent retention', async () => {
    process.env.CANCELLED_NOTIFICATION_RETENTION_DAYS = '7';
    const item = await proposal('Cancelled battery project');
    await createPublicationNotifications(item); await createDeadlineReminders(item);
    const reason = 'Supplier is unavailable';
    assert.equal((await request(`/proposals/${item._id}/cancel`, member, 'POST', { cancellationReason: reason })).status, 403);
    assert.equal((await request(`/proposals/${item._id}/cancel`, admin, 'POST', { cancellationReason: reason })).status, 200);
    const cancelled = await Proposal.findById(item._id);
    assert.equal(cancelled.cancellationReason, reason);
    await Promise.all([createCancellationNotifications(cancelled), createCancellationNotifications(cancelled)]);
    assert.equal(await Notification.countDocuments({ proposal: item._id, type: 'proposal_cancelled' }), await User.countDocuments({ createdAt: { $lte: item.publishedAt } }));
    const notice = await Notification.findOne({ proposal: item._id, recipient: member._id, type: 'proposal_cancelled' });
    assert.match(notice.message, /Supplier is unavailable/);
    assert.ok(Math.abs(notice.expiresAt - notice.createdAt - 7 * 86400000) < 5000);
    assert.ok(notice.expiresAt > item.votingDeadline);
    await createDeadlineReminders(item); // stale worker snapshot must not recreate reminders
    const inbox = (await request('/notifications')).data;
    assert.deepEqual(inbox.notifications.filter((entry) => entry.proposalId === String(item._id)).map((entry) => entry.type), ['proposal_cancelled']);
    assert.equal((await request(`/notifications/${notice._id}/read`, other, 'PATCH')).status, 404);
    assert.equal((await request(`/notifications/${notice._id}/read`, member, 'PATCH')).status, 200);
    const read = (await request('/notifications')).data;
    assert.equal(read.unreadCount, inbox.unreadCount - 1);
    assert.ok(read.notifications.some((entry) => entry.id === String(notice._id) && entry.isRead));
    const details = await request(`/proposals/${item._id}`);
    assert.equal(details.data.proposal.status, 'cancelled');
    assert.equal(details.data.proposal.cancellationReason, reason);
    assert.notEqual((await request(`/proposals/${item._id}/vote`, member, 'POST', { choice: 'yes' })).status, 201);
    await Notification.updateOne({ _id: notice._id }, { $set: { expiresAt: new Date(0) } });
    assert.equal((await request('/notifications')).data.notifications.some((entry) => entry.id === String(notice._id)), false);
    delete process.env.CANCELLED_NOTIFICATION_RETENTION_DAYS;
  });
  await t.test('draft deletion sends no cancellation notice and pending cancellation recovers', async () => {
    const draft = await proposal('Deleted draft', 'draft');
    assert.equal((await request(`/proposals/${draft._id}/draft`, admin, 'DELETE')).status, 200);
    assert.equal(await Notification.countDocuments({ proposal: draft._id }), 0);
    const item = await proposal('Retry cancellation');
    await Proposal.updateOne({ _id: item._id }, { $set: { status: 'cancelled', cancellationReason: 'Changed plans', cancellationNotificationsPending: true } });
    await runNotificationCycle(); await runNotificationCycle();
    const notices = await Notification.find({ proposal: item._id, recipient: member._id });
    assert.equal(notices.length, 1);
    assert.equal(notices[0].type, 'proposal_cancelled');
    assert.ok(Math.abs(notices[0].expiresAt - notices[0].createdAt - 30 * 86400000) < 5000);
    assert.equal((await Proposal.findById(item._id)).cancellationNotificationsPending, false);
  });
  await t.test('archive enforces authentication, current role and actual lifecycle, including duplicate requests', async () => {
    const item = await proposal('Archive permissions', 'cancelled');
    const path = `/proposals/${item._id}/archive`;
    assert.equal((await request(path, null, 'PATCH')).status, 401);
    assert.equal((await request(path, member, 'PATCH')).status, 403);
    // Former admins must be denied too; creator-only authority is superseded by succession.
    const anotherAdmin = await User.create({ name: 'Former admin', email: 'archive-admin@example.test', password: 'not-a-login', household: other.household, isCoopAdmin: false });
    assert.equal((await request(path, anotherAdmin, 'PATCH')).status, 403);
    assert.equal((await request('/proposals/invalid/archive', admin, 'PATCH')).status, 400);
    assert.equal((await request(`/proposals/${new mongoose.Types.ObjectId()}/archive`, admin, 'PATCH')).status, 404);
    for (const status of ['draft', 'upcoming', 'active', 'closed']) {
      const forbidden = await proposal(`No archive ${status}`, status);
      assert.equal((await request(`/proposals/${forbidden._id}/archive`, admin, 'PATCH', { status: 'cancelled' })).status, 409);
      assert.equal((await Proposal.findById(forbidden._id)).archivedAt, null);
    }
    const responses = await Promise.all([request(path, admin, 'PATCH'), request(path, admin, 'PATCH')]);
    assert.deepEqual(responses.map((entry) => entry.status).sort(), [200, 409]);
    const stored = await Proposal.findById(item._id);
    assert.ok(stored.archivedAt instanceof Date);
    assert.equal(String(stored.archivedBy), String(admin._id));
    assert.equal(stored.status, 'cancelled');
    assert.equal((await request(path, admin, 'PATCH')).status, 409);
    assert.equal((await Proposal.findById(item._id)).archivedAt.getTime(), stored.archivedAt.getTime());
  });
  await t.test('archive preserves history, votes and cancellation notifications and is read-only', async () => {
    const item = await proposal('Archived historical project');
    await createPublicationNotifications(item);
    await createDeadlineReminders(item);
    assert.equal((await request(`/proposals/${item._id}/vote`, member, 'POST', { choice: 'yes' })).status, 201);
    const reason = 'Supplier withdrew';
    assert.equal((await request(`/proposals/${item._id}/cancel`, admin, 'POST', { cancellationReason: reason })).status, 200);
    const noticesBefore = await Notification.find({ proposal: item._id }).sort({ _id: 1 }).lean();
    assert.ok(noticesBefore.some((entry) => entry.type === 'proposal_cancelled'));
    const votesBefore = await Vote.find({ proposal: item._id }).lean();
    const archived = await request(`/proposals/${item._id}/archive`, admin, 'PATCH');
    assert.equal(archived.status, 200);
    assert.equal(archived.data.proposal.cancellationReason, reason);
    assert.equal(archived.data.proposal.description, item.description);
    assert.equal('choice' in archived.data.proposal, false);
    await createDeadlineReminders(item); // stale worker snapshot must stay harmless
    assert.deepEqual(await Notification.find({ proposal: item._id }).sort({ _id: 1 }).lean(), noticesBefore);
    assert.deepEqual(await Vote.find({ proposal: item._id }).lean(), votesBefore);
    const managed = (await request('/proposals/admin/mine', admin)).data.proposals;
    assert.ok(managed.some((entry) => entry.id === String(item._id) && entry.archivedAt && entry.status === 'cancelled'));
    assert.equal((await request('/proposals', member)).data.proposals.some((entry) => entry.id === String(item._id)), false);
    const details = await request(`/proposals/${item._id}`, member);
    assert.equal(details.status, 200); // existing cancellation notice links remain valid
    assert.equal(details.data.proposal.archivedAt, archived.data.proposal.archivedAt);
    for (const [suffix, method, body] of [
      ['draft', 'PATCH', { title: 'Changed' }], ['draft', 'DELETE'], ['publish', 'POST'],
      ['cancel', 'POST', { cancellationReason: 'Changed' }], ['vote', 'POST', { choice: 'no' }],
    ]) assert.equal((await request(`/proposals/${item._id}/${suffix}`, admin, method, body)).status, 409);
    const stored = await Proposal.findById(item._id);
    assert.equal(stored.status, 'cancelled');
    assert.equal(stored.title, item.title);
    assert.equal(stored.cancellationReason, reason);
  });
  await t.test('household status is private and enforces concurrent/admin uniqueness', async () => {
    const item = await proposal('Household status');
    assert.deepEqual((await request(`/proposals/${item._id}/vote/status`)).data, { hasVoted: false });
    const results = await Promise.all([request(`/proposals/${item._id}/vote`, member, 'POST', { choice: 'yes' }), request(`/proposals/${item._id}/vote`, sibling, 'POST', { choice: 'no' })]);
    assert.deepEqual(results.map((entry) => entry.status).sort(), [201, 409]);
    for (const user of [member, sibling, admin]) {
      assert.deepEqual((await request(`/proposals/${item._id}/vote/status`, user)).data, { hasVoted: true });
      const listed = (await request('/proposals', user)).data.proposals.find((entry) => entry.id === String(item._id));
      assert.equal(listed.householdHasVoted, true);
      assert.equal('choice' in listed, false); assert.equal('submittedBy' in listed, false);
    }
    assert.equal((await request(`/proposals/${item._id}/vote`, admin, 'POST', { choice: 'abstain' })).status, 409);
    assert.deepEqual((await request(`/proposals/${item._id}/vote/status?householdId=${member.household}`, other)).data, { hasVoted: false });
    assert.equal((await request('/proposals', other)).data.proposals.find((entry) => entry.id === String(item._id)).householdHasVoted, false);
    assert.equal(await Vote.countDocuments({ proposal: item._id, household: member.household }), 1);
  });
});
