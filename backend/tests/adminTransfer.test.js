const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config({ quiet: true });
const User = require('../models/User');
const Household = require('../models/Household');
const Proposal = require('../models/Proposal');
const Notification = require('../models/Notification');
const Transfer = require('../models/AdminTransferRequest');

test('administrator succession: real replica-set transactions and security', async (t) => {
  const database = `solarshare_transfer_test_${randomUUID().replaceAll('-', '')}`;
  const secret = 'isolated-transfer-test-secret';
  process.env.JWT_SECRET = secret;
  let server;
  try {
    assert.ok(process.env.MONGO_URI, 'MONGO_URI must point to a transaction-capable development deployment.');
    await mongoose.connect(process.env.MONGO_URI, { dbName: database, serverSelectionTimeoutMS: 5000 });
    await Promise.all([User.init(), Household.init(), Proposal.init(), Notification.init(), Transfer.init()]);
    const households = await Household.create([1, 2, 3].map((n) => ({ name: `Household ${n}`, invitationCode: `TRANSFER-${n}` })));
    const [admin, target, other] = await User.create(households.map((h, n) => ({ name: ['Current admin', 'Target member', 'Other member'][n], email: `transfer${n}@example.test`, password: 'unused-test-hash', household: h._id, isCoopAdmin: n === 0 })));
    const tokens = new Map([admin, target, other].map((u) => [String(u._id), jwt.sign({ userId: u._id }, secret)]));
    const app = express(); app.use(express.json());
    app.use('/api/auth', require('../routes/authRoutes'));
    app.use('/api/proposals', require('../routes/proposalRoutes'));
    app.use('/api/notifications', require('../routes/notificationRoutes'));
    app.use('/api/admin-transfers', require('../routes/adminTransferRoutes'));
    server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    const request = async (path, user = admin, method = 'GET', body) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, { method,
        headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${tokens.get(String(user._id))}` } : {}) },
        ...(body && method !== 'GET' ? { body: JSON.stringify(body) } : {}),
      });
      return { status: response.status, data: await response.json() };
    };
    const nominate = async (user = target) => {
      const result = await request('/admin-transfers', admin, 'POST', { targetUserId: String(user._id) });
      assert.equal(result.status, 201, result.data.message);
      return result.data.request;
    };
    const respond = (id, user, action) => request(`/admin-transfers/${id}/${action}`, user, 'POST');
    const unchanged = async () => {
      assert.equal((await User.findById(admin._id)).isCoopAdmin, true);
      assert.equal((await User.findById(target._id)).isCoopAdmin, false);
      assert.equal(await User.countDocuments({ isCoopAdmin: true }), 1);
    };
    await t.test('only admin sees eligible members; whitelist excludes self and invalid households', async () => {
      const orphan = await User.create({ name: 'Orphan', email: 'orphan@example.test', password: 'unused', household: new mongoose.Types.ObjectId() });
      assert.equal((await request('/admin-transfers/members', null)).status, 401);
      assert.equal((await request('/admin-transfers/members', target)).status, 403);
      const result = await request('/admin-transfers/members');
      assert.equal(result.status, 200);
      assert.deepEqual(result.data.members.map((u) => u.id).sort(), [String(target._id), String(other._id)].sort());
      assert.equal(JSON.stringify(result.data).includes('password'), false);
      assert.equal(JSON.stringify(result.data).includes('invitationCode'), false);
      assert.equal((await request('/admin-transfers', target, 'POST', { targetUserId: String(other._id) })).status, 403);
      assert.equal((await request('/admin-transfers', admin, 'POST', { targetUserId: String(admin._id) })).status, 400);
      assert.equal((await request('/admin-transfers', admin, 'POST', { targetUserId: 'bad' })).status, 400);
      assert.equal((await request('/admin-transfers', admin, 'POST', { targetUserId: String(orphan._id) })).status, 409);
      assert.equal((await request('/admin-transfers', admin, 'POST', { targetUserId: String(new mongoose.Types.ObjectId()) })).status, 409);
    });
    await t.test('concurrent nominations create one pending request and one targeted notification, without role changes', async () => {
      const results = await Promise.all([target, target].map((u) => request('/admin-transfers', admin, 'POST', { targetUserId: String(u._id) })));
      assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
      assert.equal(await Transfer.countDocuments({ status: 'pending' }), 1);
      assert.equal(await Notification.countDocuments({ type: 'admin_transfer_request' }), 1);
      await unchanged();
      const id = results.find((r) => r.status === 201).data.request.id;
      assert.equal((await request(`/admin-transfers/${id}`, other)).status, 403);
      assert.equal((await respond(id, other, 'accept')).status, 403);
      assert.equal((await respond(id, other, 'decline')).status, 403);
      assert.equal((await respond(id, target, 'cancel')).status, 403);
      const inbox = (await request('/notifications', target)).data;
      assert.equal(inbox.unreadCount, 1);
      assert.equal(inbox.notifications[0].transferRequestId, id);
      assert.equal((await request('/notifications', other)).data.unreadCount, 0);
      assert.equal((await respond(id, target, 'decline')).status, 200);
      assert.equal((await Transfer.findById(id)).status, 'declined');
      assert.ok((await Transfer.findById(id)).respondedAt);
      assert.equal((await respond(id, target, 'accept')).status, 409);
      assert.equal((await request('/notifications', target)).data.unreadCount, 0);
      await unchanged();
    });
    await t.test('cancelled requests cannot be accepted and repeated cancellation is rejected', async () => {
      const r = await nominate();
      assert.equal((await respond(r.id, admin, 'cancel')).status, 200);
      assert.equal((await respond(r.id, target, 'accept')).status, 409);
      assert.equal((await respond(r.id, admin, 'cancel')).status, 409);
      await unchanged();
    });
    await t.test('deleted target and invalid household reject acceptance without partial changes', async () => {
      const r = await nominate();
      await User.updateOne({ _id: target._id }, { household: new mongoose.Types.ObjectId() });
      assert.equal((await respond(r.id, target, 'accept')).status, 409);
      await unchanged();
      await User.updateOne({ _id: target._id }, { household: target.household });
      await respond(r.id, admin, 'cancel');
      const temporary = await User.create({ name: 'Temporary', email: 'temporary@example.test', password: 'unused', household: target.household });
      tokens.set(String(temporary._id), jwt.sign({ userId: temporary._id }, secret));
      const deleted = await nominate(temporary);
      await User.deleteOne({ _id: temporary._id });
      assert.equal((await respond(deleted.id, temporary, 'accept')).status, 401);
      assert.equal((await respond(deleted.id, admin, 'cancel')).status, 200);
      await unchanged();
    });
    await t.test('unexpected multiple admins fail closed and do not repair live roles', async () => {
      const r = await nominate();
      await User.updateOne({ _id: target._id }, { isCoopAdmin: true });
      assert.equal((await respond(r.id, target, 'accept')).status, 409);
      assert.equal((await Transfer.findById(r.id)).status, 'pending');
      await User.updateOne({ _id: target._id }, { isCoopAdmin: false });
      await respond(r.id, admin, 'cancel');
      await unchanged();
    });
    await t.test('a failure after both role writes rolls back users, request and notifications', async () => {
      const r = await nominate();
      const before = await Notification.countDocuments();
      const original = Notification.create;
      Notification.create = async () => { throw new Error('Injected transaction failure'); };
      try { assert.equal((await respond(r.id, target, 'accept')).status, 500); }
      finally { Notification.create = original; }
      await unchanged();
      assert.equal((await Transfer.findById(r.id)).status, 'pending');
      assert.equal((await Transfer.findById(r.id)).respondedAt, null);
      assert.equal(await Notification.countDocuments(), before);
      assert.equal((await respond(r.id, admin, 'cancel')).status, 200);
    });
    let draft;
    await t.test('double acceptance commits once; exactly one admin and membership remains unchanged', async () => {
      draft = await Proposal.create({ title: 'Original project', summary: 'Summary', description: 'Description', benefits: 'Benefits', householdImpact: 'Impact', estimatedCost: 100,
        votingStartDate: new Date(Date.now() + 86400000), votingDeadline: new Date(Date.now() + 172800000), createdBy: admin._id });
      const before = await User.find({ _id: { $in: [admin._id, target._id] } }).select('+password').lean();
      const r = await nominate();
      const results = await Promise.all([respond(r.id, target, 'accept'), respond(r.id, target, 'accept')]);
      assert.deepEqual(results.map((v) => v.status).sort(), [200, 409]);
      assert.equal((await User.findById(admin._id)).isCoopAdmin, false);
      assert.equal((await User.findById(target._id)).isCoopAdmin, true);
      assert.equal(await User.countDocuments({ isCoopAdmin: true }), 1);
      assert.equal((await Transfer.findById(r.id)).status, 'accepted');
      assert.equal(await Notification.countDocuments({ transferRequest: r.id, type: 'admin_transfer_accepted' }), 1);
      for (const user of before) {
        const after = await User.findById(user._id).select('+password');
        for (const key of ['name', 'email', 'password', 'household']) assert.equal(String(after[key]), String(user[key]));
      }
    });
    await t.test('unchanged JWTs use live roles: former admin loses all management and successor manages original proposals', async () => {
      for (const [path, method] of [
        ['/proposals', 'POST'], ['/proposals/admin/mine', 'GET'], [`/proposals/${draft._id}/draft`, 'PATCH'],
        [`/proposals/${draft._id}/draft`, 'DELETE'], [`/proposals/${draft._id}/publish`, 'POST'],
        [`/proposals/${draft._id}/cancel`, 'POST'], [`/proposals/${draft._id}/archive`, 'PATCH'], ['/admin-transfers', 'POST'],
      ]) assert.equal((await request(path, admin, method, {})).status, 403);
      assert.equal((await request(`/proposals/${draft._id}`, admin)).status, 403);
      assert.equal((await request('/auth/me', admin)).data.user.isCoopAdmin, false);
      assert.equal((await request('/auth/me', target)).data.user.isCoopAdmin, true);
      assert.equal((await request('/proposals/admin/mine', target)).data.proposals[0].id, String(draft._id));
      assert.equal((await request(`/proposals/${draft._id}`, target)).status, 200);
      assert.equal((await request(`/proposals/${draft._id}/draft`, target, 'PATCH', { title: 'Successor edited' })).status, 200);
      assert.equal((await request(`/proposals/${draft._id}/publish`, target, 'POST')).status, 200);
      assert.equal((await request(`/proposals/${draft._id}/cancel`, target, 'POST', { cancellationReason: 'Plans changed' })).status, 200);
      assert.equal((await request(`/proposals/${draft._id}/archive`, target, 'PATCH')).status, 200);
      assert.equal(String((await Proposal.findById(draft._id)).createdBy), String(admin._id));
    });
    await t.test('accept versus cancel has one winner, no partial state, terminal request cannot be reused', async () => {
      const r = await request('/admin-transfers', target, 'POST', { targetUserId: String(other._id) });
      assert.equal(r.status, 201);
      const results = await Promise.all([respond(r.data.request.id, other, 'accept'), respond(r.data.request.id, target, 'cancel')]);
      assert.equal(results.filter((v) => v.status === 200).length, 1);
      assert.ok(results.every((v) => [200, 403, 409].includes(v.status)));
      const stored = await Transfer.findById(r.data.request.id);
      assert.ok(['accepted', 'cancelled'].includes(stored.status));
      assert.equal((await User.findById(other._id)).isCoopAdmin, stored.status === 'accepted');
      assert.equal((await User.findById(target._id)).isCoopAdmin, stored.status !== 'accepted');
      assert.equal(await User.countDocuments({ isCoopAdmin: true }), 1);
    });
    await t.test('registration cannot self-promote and still validates invitation code; same login works', async () => {
      const payload = { name: 'New member', email: 'registered@example.test', password: 'TestMember123', invitationCode: 'INVALID', isCoopAdmin: true };
      assert.equal((await request('/auth/register', null, 'POST', payload)).status, 400);
      const result = await request('/auth/register', null, 'POST', { ...payload, invitationCode: households[0].invitationCode });
      assert.equal(result.status, 201);
      assert.equal(result.data.user.isCoopAdmin, false);
      assert.equal(result.data.user.household, String(households[0]._id));
      assert.equal((await request('/auth/login', null, 'POST', { email: payload.email, password: payload.password })).status, 200);
      assert.equal((await request('/auth/login', null, 'POST', { email: payload.email, password: 'wrong' })).status, 401);
    });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    // Never drop the database from MONGO_URI; only the exact generated test database.
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === database) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
