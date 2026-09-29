const nodemailer = require('nodemailer');

function configuration() {
  const { SMTP_HOST: host, SMTP_PORT, SMTP_SECURE, SMTP_USER: user, SMTP_PASS: pass, EMAIL_FROM: from, PASSWORD_RESET_BASE_URL } = process.env;
  const port = Number(SMTP_PORT);
  if (!host || !from || !Number.isInteger(port) || port < 1 || port > 65535 || !['true', 'false'].includes(SMTP_SECURE) || Boolean(user) !== Boolean(pass)) throw new Error('Email configuration unavailable');
  const base = new URL(PASSWORD_RESET_BASE_URL);
  if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password || base.search || base.hash || (process.env.NODE_ENV === 'production' && base.protocol !== 'https:')) throw new Error('Invalid reset URL configuration');
  return { host, port, secure: SMTP_SECURE === 'true', user, pass, from, base };
}

const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
async function sendResetLink(email, token) {
  const config = configuration();
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('Invalid reset token');
  config.base.hash = `reset-password/${token}`;
  const link = config.base.href;
  const transport = nodemailer.createTransport({
    host: config.host, port: config.port, secure: config.secure,
    requireTLS: !config.secure,
    ...(config.user ? { auth: { user: config.user, pass: config.pass } } : {}),
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    logger: false, debug: false, disableFileAccess: true, disableUrlAccess: true,
  });
  try {
    const result = await transport.sendMail({
      from: config.from, to: email, subject: 'Reset your Solar Share password',
      text: `Hello,\n\nWe received a request to reset your Solar Share password.\n\nReset Password: ${link}\n\nThis link expires in 15 minutes.\n\nIf you did not request a password reset, you can ignore this email.\n\nSolar Share`,
      html: `<p>Hello,</p><p>We received a request to reset your Solar Share password.</p><p><a href="${escapeHtml(link)}">Reset Password</a></p><p>This link expires in 15 minutes.</p><p>If you did not request a password reset, you can ignore this email.</p><p>Solar Share</p>`,
    });
    if (!result.accepted?.length) throw new Error('Email not accepted');
  } finally { transport.close(); }
}
module.exports = { assertConfigured: configuration, sendResetLink };
