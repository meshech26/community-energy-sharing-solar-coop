const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config({ quiet: true });
const User = require('../models/User');
const Household = require('../models/Household');
const reset = require('../services/passwordResetService');
const mail = require('../services/passwordResetEmail');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

test('operator reset command refuses production and missing development opt-in', () => {
  for (const env of [{ NODE_ENV: 'production', ALLOW_LOCAL_RESET_DEMO: 'true' }, { NODE_ENV: 'development', ALLOW_LOCAL_RESET_DEMO: '' }]) {
    const result = spawnSync(process.execPath, [path.join(__dirname, '../scripts/demoPasswordReset.js')], { env: { ...process.env, ...env }, encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /Requires NODE_ENV=development/);
  }
});

test('account management is additive, private and preserves membership', async (t) => {
  const database = `solarshare_account_test_${crypto.randomUUID().replaceAll('-', '')}`;
  let server;
  const oldSecret = process.env.JWT_SECRET;
  const oldEnv = process.env.NODE_ENV;
  const originalSend = mail.sendResetLink;
  const originalConfig = mail.assertConfigured;
  const deliveries = [];
  mail.assertConfigured = () => {};
  mail.sendResetLink = async (email, token) => { deliveries.push({ email, token }); };
  try {
    process.env.NODE_ENV = 'test'; process.env.JWT_SECRET = 'account-test-only';
    await mongoose.connect(process.env.MONGO_URI, { dbName: database });
    const household = await Household.create({ name: 'Account test household', invitationCode: 'H01-SOLAR' });
    const user = await User.create({ name: 'Resident', email: 'resident@example.test', password: await bcrypt.hash('Original123', 12), household: household._id, isCoopAdmin: true });
    const householdBefore = await Household.findById(household._id).lean();
    const app = express(); app.use(express.json()); app.use('/api/auth', require('../routes/authRoutes'));
    server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    const token = jwt.sign({ userId: String(user._id) }, process.env.JWT_SECRET);
    const request = async (path, body, authenticated = false) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/${path}`, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(authenticated ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      return { status: response.status, data: await response.json() };
    };
    await t.test('forgot response cannot enumerate accounts or disclose reset tokens', async () => {
      const known = await request('forgot-password', { email: ' RESIDENT@example.test ' });
      const unknown = await request('forgot-password', { email: 'unknown@example.test' });
      assert.equal(known.status, 200); assert.deepEqual(known, unknown);
      assert.deepEqual(Object.keys(known.data), ['message']);
      assert.equal(deliveries.length, 1);
      assert.equal(deliveries[0].email, user.email);
      const stored = await User.findById(user._id).select('+passwordResetTokenHash +passwordResetExpiresAt');
      assert.match(stored.passwordResetTokenHash, /^[a-f0-9]{64}$/);
      assert.equal(stored.passwordResetTokenHash, reset.hashToken(deliveries[0].token));
      assert.notEqual(stored.passwordResetTokenHash, deliveries[0].token);
      assert.ok(stored.passwordResetExpiresAt > new Date());
      assert.ok(stored.passwordResetExpiresAt <= new Date(Date.now() + 15 * 60 * 1000));
    });
    await t.test('profile and existing me omit all credentials and use current role', async () => {
      assert.equal((await request('account')).status, 401);
      for (const path of ['account', 'me']) {
        const result = await request(path, null, true);
        assert.equal(result.status, 200);
        for (const field of ['password', 'passwordResetTokenHash', 'passwordResetExpiresAt', 'adminTransferRevision']) assert.equal(field in result.data.user, false);
      }
      assert.equal((await request('account', null, true)).data.user.householdName, household.name);
      await User.updateOne({ _id: user._id }, { $set: { isCoopAdmin: false } });
      assert.equal((await request('account', null, true)).data.user.isCoopAdmin, false);
      await User.updateOne({ _id: user._id }, { $set: { isCoopAdmin: true } });
    });
    await t.test('invalid, expired, mismatched and weak resets fail safely', async () => {
      const validToken = await reset.issueReset(user.email);
      const data = { token: validToken, newPassword: 'Replacement123', confirmPassword: 'Replacement123' };
      assert.equal((await request('reset-password', { ...data, token: 'bad' })).status, 400);
      assert.equal((await request('reset-password', { ...data, token: crypto.randomBytes(32).toString('hex') })).status, 400);
      assert.equal((await request('reset-password', { ...data, confirmPassword: 'different' })).status, 400);
      assert.equal((await request('reset-password', { ...data, newPassword: 'short', confirmPassword: 'short' })).status, 400);
      await User.updateOne({ _id: user._id }, { passwordResetExpiresAt: new Date(0) });
      assert.equal((await request('reset-password', data)).data.message, 'This password reset link is invalid or has expired.');
    });
    await t.test('secure token is hashed, resets once atomically and new login works', async () => {
      await request('forgot-password', { email: user.email });
      const raw = deliveries.at(-1).token;
      const stored = await User.findById(user._id).select('+passwordResetTokenHash');
      assert.notEqual(stored.passwordResetTokenHash, raw);
      assert.equal(stored.passwordResetTokenHash, reset.hashToken(raw));
      const payload = { token: raw, newPassword: 'Replacement123', confirmPassword: 'Replacement123', isCoopAdmin: false, household: 'ignored' };
      const responses = await Promise.all([request('reset-password', payload), request('reset-password', payload)]);
      assert.deepEqual(responses.map((r) => r.status).sort(), [200, 400]);
      const updated = await User.findById(user._id).select('+password +passwordResetTokenHash +passwordResetExpiresAt');
      assert.ok(await bcrypt.compare(payload.newPassword, updated.password));
      assert.notEqual(updated.password, payload.newPassword);
      assert.equal(updated.passwordResetTokenHash, undefined); assert.equal(updated.passwordResetExpiresAt, undefined);
      assert.equal((await request('login', { email: user.email, password: 'Original123' })).status, 401);
      assert.equal((await request('login', { email: user.email, password: payload.newPassword })).status, 200);
    });
    await t.test('change requires current credentials, preserves role and clears pending resets', async () => {
      const data = { currentPassword: 'Replacement123', newPassword: 'Changed123', confirmPassword: 'Changed123' };
      assert.equal((await request('change-password', data)).status, 401);
      assert.equal((await request('change-password', { ...data, currentPassword: '' }, true)).status, 400);
      assert.equal((await request('change-password', { ...data, currentPassword: 'wrong' }, true)).status, 400);
      assert.equal((await request('change-password', { ...data, confirmPassword: 'wrong' }, true)).status, 400);
      const outstanding = await reset.issueReset(user.email);
      assert.equal((await request('change-password', { ...data, userId: 'ignored', household: 'ignored', isCoopAdmin: false }, true)).status, 200);
      assert.equal((await request('reset-password', { token: outstanding, newPassword: 'Override123', confirmPassword: 'Override123' })).status, 400);
      const updated = await User.findById(user._id).select('+password');
      assert.ok(await bcrypt.compare(data.newPassword, updated.password));
      assert.equal(updated.isCoopAdmin, true); assert.equal(String(updated.household), String(household._id));
      assert.equal((await request('login', { email: user.email, password: 'Replacement123' })).status, 401);
      assert.equal((await request('login', { email: user.email, password: data.newPassword })).status, 200);
      assert.deepEqual(await Household.findById(household._id).lean(), householdBefore);
    });
    await t.test('production without email fails closed for known and unknown accounts', async () => {
      process.env.NODE_ENV = 'production';
      mail.assertConfigured = () => { throw new Error('Configuration missing'); };
      const a = await request('forgot-password', { email: user.email });
      const b = await request('forgot-password', { email: 'unknown@example.test' });
      assert.equal(a.status, 503); assert.deepEqual(a, b);
    });
    await t.test('SMTP failure and unknown account have identical public responses and safe logs', async () => {
      mail.assertConfigured = () => {};
      mail.sendResetLink = async () => { throw new Error('private-provider-error'); };
      const originalWarn = console.warn; const logs = [];
      console.warn = (...args) => logs.push(args.join(' '));
      try {
        const known = await request('forgot-password', { email: user.email });
        const unknown = await request('forgot-password', { email: 'unknown@example.test' });
        assert.equal(known.status, 200); assert.deepEqual(known, unknown);
        assert.deepEqual(logs, ['Password reset request could not be completed.']);
      } finally { console.warn = originalWarn; }
    });
  } finally {
    mail.sendResetLink = originalSend; mail.assertConfigured = originalConfig;
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.name === database) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    if (oldSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = oldSecret;
    if (oldEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldEnv;
  }
});
