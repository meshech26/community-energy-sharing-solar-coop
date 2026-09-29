const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config({ quiet: true });
const Household = require('../models/Household');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Transfer = require('../models/AdminTransferRequest');
const codes = require('../services/invitationCode');
const { createHousehold, ensureSeedHousehold } = require('../services/householdService');

test('household onboarding preserves membership and uses secure server-generated codes', async (t) => {
  const database = `solarshare_onboarding_test_${randomUUID().replaceAll('-', '')}`;
  let server;
  const originalGenerator = codes.generateInvitationCode;
  try {
    assert.ok(process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI, { dbName: database, serverSelectionTimeoutMS: 5000 });
    await Promise.all([Household.init(), User.init(), Notification.init(), Transfer.init()]);
    // Legacy record deliberately has no nameKey. New code must not migrate it.
    const legacyId = new mongoose.Types.ObjectId();
    await Household.collection.insertOne({ _id: legacyId, name: 'Household 01', invitationCode: 'H01-SOLAR' });
    const legacyBefore = await Household.collection.findOne({ _id: legacyId });
    const [admin, member] = await User.create(['admin', 'member'].map((name) => ({ name, email: `${name}@example.test`, password: 'test-fixture-not-for-login', household: legacyId, isCoopAdmin: name === 'admin' })));
    process.env.JWT_SECRET = 'onboarding-test-only-secret';
    const tokens = new Map([admin, member].map((user) => [String(user._id), jwt.sign({ userId: user._id }, process.env.JWT_SECRET)]));
    const app = express(); app.use(express.json());
    app.use('/api/households', require('../routes/householdRoutes'));
    app.use('/api/auth', require('../routes/authRoutes'));
    app.use('/api/admin-transfers', require('../routes/adminTransferRoutes'));
    server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    const request = async (path, user = admin, method = 'GET', body) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, { method,
        headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${tokens.get(String(user._id))}` } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return { status: response.status, data: await response.json() };
    };
    await t.test('model creates formatted codes only for new records without codes', async () => {
      const generated = await Household.createWithInvitationCode({ name: 'Generated model household' });
      assert.match(generated.invitationCode, /^SOLAR-[A-HJ-NP-Z2-9]{4}$/);
      const direct = new Household({ name: 'Direct model household' });
      await direct.save();
      assert.match(direct.invitationCode, /^SOLAR-[A-HJ-NP-Z2-9]{4}$/);
      const old = await Household.findById(legacyId);
      await old.validate();
      assert.equal(old.invitationCode, 'H01-SOLAR');
      assert.deepEqual(await Household.collection.findOne({ _id: legacyId }), legacyBefore);
      const many = await Promise.all(Array.from({ length: 20 }, (_, n) => createHousehold({ name: `Random household ${n}` })));
      assert.equal(new Set(many.map((h) => h.invitationCode)).size, 20);
    });
    await t.test('deterministic seeds preserve values and omitted seed codes generate once', async () => {
      const original = await ensureSeedHousehold({ name: 'Household 01', invitationCode: 'H01-SOLAR' });
      assert.equal(String(original._id), String(legacyId));
      for (let n = 2; n <= 8; n += 1) {
        const input = { name: `Household 0${n}`, invitationCode: `H0${n}-SOLAR` };
        const first = await ensureSeedHousehold(input);
        const again = await ensureSeedHousehold(input);
        assert.equal(first.invitationCode, input.invitationCode);
        assert.equal(String(first._id), String(again._id));
      }
      const first = await ensureSeedHousehold({ name: 'Seed without a code' });
      const again = await ensureSeedHousehold({ name: 'Seed without a code' });
      assert.equal(first.invitationCode, again.invitationCode);
      assert.match(first.invitationCode, /^SOLAR-[A-HJ-NP-Z2-9]{4}$/);
      assert.deepEqual(await Household.collection.findOne({ _id: legacyId }), legacyBefore);
    });
    await t.test('code collisions retry safely, exhaust at five attempts, and explicit codes are never replaced', async () => {
      await createHousehold({ name: 'Collision fixture', invitationCode: 'SS-AAAAAAAA' });
      let attempts = 0;
      codes.generateInvitationCode = () => (++attempts === 1 ? 'SS-AAAAAAAA' : 'SS-BBBBBBBB');
      try {
        const saved = await createHousehold({ name: 'Collision retry' });
        assert.equal(saved.invitationCode, 'SS-BBBBBBBB');
        assert.equal(attempts, 2);
        attempts = 0;
        codes.generateInvitationCode = () => { attempts += 1; return 'SS-AAAAAAAA'; };
        const failed = await request('/households', admin, 'POST', { name: 'Exhausted retries' });
        assert.equal(failed.status, 503);
        assert.equal(attempts, 5);
        assert.equal(await Household.countDocuments({ name: 'Exhausted retries' }), 0);
        assert.equal(JSON.stringify(failed.data).includes('SS-AAAAAAAA'), false);
        await assert.rejects(createHousehold({ name: 'Explicit duplicate', invitationCode: 'SS-AAAAAAAA' }), (err) => err.code === 11000);
        assert.equal(attempts, 5);
      } finally { codes.generateInvitationCode = originalGenerator; }
    });
    let generated;
    await t.test('only current admin creates/lists; members cannot choose or obtain codes', async () => {
      for (const user of [null, member]) {
        assert.equal((await request('/households', user)).status, user ? 403 : 401);
        assert.equal((await request('/households', user, 'POST', { name: 'Unauthorized' })).status, user ? 403 : 401);
      }
      assert.equal((await request('/households', admin, 'POST', { name: 'Custom code', invitationCode: 'MY-CODE' })).status, 400);
      for (const name of [undefined, '', '   ', 12, 'x'.repeat(101)]) assert.equal((await request('/households', admin, 'POST', { name })).status, 400);
      const result = await request('/households', admin, 'POST', { name: ' Lake View Household ' });
      assert.equal(result.status, 201);
      generated = result.data.household;
      assert.equal(generated.name, 'Lake View Household');
      assert.match(generated.invitationCode, /^SOLAR-[A-HJ-NP-Z2-9]{4}$/);
      assert.deepEqual(Object.keys(generated).sort(), ['id', 'invitationCode', 'name']);
      assert.ok((await request('/households')).data.households.some((h) => h.id === generated.id));
    });
    await t.test('duplicate household names are rejected, including concurrent creates and legacy names', async () => {
      assert.equal((await request('/households', admin, 'POST', { name: 'household 01' })).status, 409);
      assert.equal((await request('/households', admin, 'POST', { name: ' lake view household ' })).status, 409);
      const results = await Promise.all(['Concurrent household', 'CONCURRENT HOUSEHOLD'].map((name) => request('/households', admin, 'POST', { name })));
      assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
      assert.deepEqual(await Household.collection.findOne({ _id: legacyId }), legacyBefore);
    });
    await t.test('generated codes support familiar registration with whitespace/lowercase; login needs no code', async () => {
      const payload = { name: 'Resident', email: 'resident@example.test', password: 'Resident123', invitationCode: ` ${generated.invitationCode.toLowerCase()} ` };
      const registered = await request('/auth/register', null, 'POST', payload);
      assert.equal(registered.status, 201);
      assert.equal(registered.data.user.household, generated.id);
      assert.equal(registered.data.user.isCoopAdmin, false);
      assert.equal('invitationCode' in registered.data.user, false);
      const before = (await Household.findById(generated.id)).invitationCode;
      const login = await request('/auth/login', null, 'POST', { email: payload.email, password: payload.password });
      assert.equal(login.status, 200);
      assert.equal(login.data.user.household, generated.id);
      assert.equal((await Household.findById(generated.id)).invitationCode, before);
      const invalid = await request('/auth/register', null, 'POST', { ...payload, email: 'invalid@example.test', invitationCode: 'NOT-A-CODE' });
      assert.equal(invalid.status, 400);
      assert.equal(invalid.data.message, 'The household invitation code is invalid.');
      assert.equal(JSON.stringify(invalid.data).includes(generated.invitationCode), false);
    });
    await t.test('database failures have safe responses without raw errors or codes', async () => {
      const original = Household.find;
      Household.find = () => { throw new Error('private MongoDB error with code data'); };
      try {
        const result = await request('/households');
        assert.equal(result.status, 500);
        assert.equal(result.data.message, 'Unable to load households. Please try again.');
      } finally { Household.find = original; }
    });
    await t.test('admin transfer preserves every code/reference and reverses household-management authorization', async () => {
      const before = await Household.find().sort({ _id: 1 }).lean();
      const roleRequest = await request('/admin-transfers', admin, 'POST', { targetUserId: String(member._id) });
      assert.equal(roleRequest.status, 201);
      assert.equal((await request(`/admin-transfers/${roleRequest.data.request.id}/accept`, member, 'POST')).status, 200);
      assert.deepEqual(await Household.find().sort({ _id: 1 }).lean(), before);
      for (const user of [admin, member]) assert.equal(String((await User.findById(user._id)).household), String(legacyId));
      assert.equal((await request('/households', admin)).status, 403);
      assert.equal((await request('/households', admin, 'POST', { name: 'Former admin attempt' })).status, 403);
      assert.equal((await request('/households', member)).status, 200);
      assert.equal((await request('/households', member, 'POST', { name: 'Successor onboarding' })).status, 201);
    });
  } finally {
    codes.generateInvitationCode = originalGenerator;
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === database) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
