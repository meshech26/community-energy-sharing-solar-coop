const { test } = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');
const mail = require('../services/passwordResetEmail');

test('SMTP email safely uses configured origin and existing reset fragment without network delivery', async () => {
  const values = { SMTP_HOST: 'smtp.example.test', SMTP_PORT: '587', SMTP_SECURE: 'false', SMTP_USER: 'example-user', SMTP_PASS: 'test-only-password', EMAIL_FROM: 'Solar Share <no-reply@example.test>', PASSWORD_RESET_BASE_URL: 'https://solar.example.test/app/', NODE_ENV: 'production' };
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  const original = nodemailer.createTransport;
  let options; let sent; let closed = false;
  Object.assign(process.env, values);
  nodemailer.createTransport = (config) => { options = config; return { sendMail: async (message) => { sent = message; return { accepted: ['resident@example.test'] }; }, close: () => { closed = true; } }; };
  try {
    const token = 'a'.repeat(64);
    await mail.sendResetLink('resident@example.test', token);
    assert.equal(sent.to, 'resident@example.test');
    assert.equal(sent.subject, 'Reset your Solar Share password');
    assert.ok(sent.text.includes(`https://solar.example.test/app/#reset-password/${token}`));
    assert.ok(sent.html.includes(`href="https://solar.example.test/app/#reset-password/${token}"`));
    assert.ok(sent.text.includes('15 minutes'));
    assert.equal(sent.text.includes(values.SMTP_PASS), false);
    assert.equal(options.logger, false); assert.equal(options.debug, false);
    assert.equal(options.requireTLS, true); assert.equal(closed, true);
    process.env.PASSWORD_RESET_BASE_URL = 'http://solar.example.test';
    assert.throws(() => mail.assertConfigured());
    process.env.PASSWORD_RESET_BASE_URL = 'https://user:password@solar.example.test';
    assert.throws(() => mail.assertConfigured());
    process.env.PASSWORD_RESET_BASE_URL = values.PASSWORD_RESET_BASE_URL;
    process.env.SMTP_HOST = '';
    assert.throws(() => mail.assertConfigured());
  } finally {
    nodemailer.createTransport = original;
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});
