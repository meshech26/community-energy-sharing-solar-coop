const mongoose = require('mongoose');
const User = require('../models/User');
const Household = require('../models/Household');
const Notification = require('../models/Notification');
const Transfer = require('../models/AdminTransferRequest');

const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const validId = (id) => { if (!mongoose.isObjectIdOrHexString(id)) fail(400, 'Invalid member or transfer ID.'); };
const safeUser = (user) => user && ({ id: user._id, name: user.name, email: user.email,
  household: user.household?._id || user.household, householdName: user.household?.name });
async function safeTransfer(id) {
  const request = await Transfer.findById(id).populate('currentAdmin targetUser', 'name email household');
  return { id: request._id, currentAdmin: safeUser(request.currentAdmin), targetUser: safeUser(request.targetUser),
    status: request.status, createdAt: request.createdAt, respondedAt: request.respondedAt };
}
const handle = (action) => async (req, res) => {
  try { await action(req, res); }
  catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A transfer request is already pending. Refresh to view it.' });
    if (error.code === 20 || error.code === 303) return res.status(503).json({ message: 'Administrator transfer requires a transaction-capable database.' });
    return res.status(error.status || 500).json({ message: error.status ? error.message : 'Unable to complete administrator transfer. Please refresh and try again.' });
  }
};
async function transaction(action) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(() => action(session), {
      readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, readPreference: 'primary',
    });
  } finally { await session.endSession(); }
}
async function currentAdmin(session) {
  const admins = await User.find({ isCoopAdmin: true }).session(session || null);
  if (admins.length !== 1) fail(409, 'The community must have exactly one current administrator. Please contact the project maintainer.');
  // Serialize nomination/response against another transfer changing this user's role.
  // A real write (not a no-op) makes stale transaction snapshots conflict and retry.
  if (session) await User.updateOne({ _id: admins[0]._id, isCoopAdmin: true }, { $inc: { adminTransferRevision: 1 } }, { session });
  return admins[0];
}
async function eligibleTarget(id, session) {
  const user = await User.findById(id).session(session);
  if (!user || user.isCoopAdmin || !await Household.exists({ _id: user.household }).session(session)) {
    fail(409, 'This member is no longer eligible to become administrator.');
  }
  return user;
}
async function notify(user, request, type, title, message, session) {
  await Notification.create([{ recipient: user._id, household: user.household, transferRequest: request._id,
    type, stage: String(request._id), title, message }], { session });
}

exports.summary = handle(async (req, res) => {
  const admin = await currentAdmin();
  const pending = await Transfer.findOne({ status: 'pending' });
  res.json({ currentAdmin: safeUser(admin), pendingRequest: pending ? await safeTransfer(pending._id) : null });
});
exports.members = handle(async (req, res) => {
  const households = await Household.distinct('_id');
  const members = await User.find({ isCoopAdmin: false, household: { $in: households } })
    .select('name email household').populate('household', 'name').sort({ name: 1, _id: 1 });
  res.json({ members: members.map(safeUser) });
});
exports.create = handle(async (req, res) => {
  validId(req.body?.targetUserId);
  const id = await transaction(async (session) => {
    const admin = await currentAdmin(session);
    if (!admin._id.equals(req.user._id)) fail(403, 'Only the current administrator can nominate a member.');
    if (admin._id.equals(req.body.targetUserId)) fail(400, 'Select another registered household member.');
    const target = await eligibleTarget(req.body.targetUserId, session);
    const [request] = await Transfer.create([{ currentAdmin: admin._id, targetUser: target._id }], { session });
    await notify(target, request, 'admin_transfer_request', 'Administrator role request',
      `${admin.name} has nominated you to become the Co-op Administrator.`, session);
    return request._id;
  });
  res.status(201).json({ request: await safeTransfer(id) });
});
exports.details = handle(async (req, res) => {
  validId(req.params.id);
  const request = await Transfer.findById(req.params.id);
  if (!request) fail(404, 'Transfer request not found.');
  if (!request.targetUser.equals(req.user._id) && !request.currentAdmin.equals(req.user._id)) fail(403, 'This transfer request is not addressed to you.');
  res.json({ request: await safeTransfer(request._id) });
});
exports.respond = (status) => handle(async (req, res) => {
  validId(req.params.id);
  await transaction(async (session) => {
    const request = await Transfer.findById(req.params.id).session(session);
    if (!request) fail(404, 'Transfer request not found.');
    const authorized = status === 'cancelled' ? request.currentAdmin : request.targetUser;
    if (!authorized.equals(req.user._id)) fail(403, 'You cannot respond to this transfer request.');
    if (request.status !== 'pending') fail(409, 'This transfer request is no longer pending.');
    const admin = await currentAdmin(session);
    if (!admin._id.equals(request.currentAdmin)) fail(409, 'The administrator has changed. This request can no longer be used.');
    if (status === 'accepted') {
      const target = await eligibleTarget(request.targetUser, session);
      const oldResult = await User.updateOne({ _id: admin._id, isCoopAdmin: true }, { $set: { isCoopAdmin: false } }, { session });
      const newResult = await User.updateOne({ _id: target._id, isCoopAdmin: false }, { $set: { isCoopAdmin: true } }, { session });
      if (oldResult.modifiedCount !== 1 || newResult.modifiedCount !== 1) fail(409, 'Administrator permissions changed. Please refresh.');
      await notify(admin, request, 'admin_transfer_accepted', 'Administrator transfer completed',
        `${target.name} is now the Co-op Administrator.`, session);
    } else if (status === 'declined') {
      await notify(admin, request, 'admin_transfer_declined', 'Administrator request declined',
        'The nominated member declined. You remain the Co-op Administrator.', session);
    }
    request.status = status;
    request.respondedAt = new Date();
    await request.save({ session });
    await Notification.updateMany({ transferRequest: request._id, type: 'admin_transfer_request' },
      { $set: { isRead: true, isSuppressed: true } }, { session });
  });
  res.json({ request: await safeTransfer(req.params.id) });
});
