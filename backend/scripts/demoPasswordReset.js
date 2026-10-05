// Explicit local operator action, never called by an HTTP request or server logger.
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const { issueReset } = require('../services/passwordResetService');
async function main() {
  if (process.env.NODE_ENV !== 'development' || process.env.ALLOW_LOCAL_RESET_DEMO !== 'true') throw new Error('Requires NODE_ENV=development and ALLOW_LOCAL_RESET_DEMO=true for an authorized local demo only.');
  const [email, origin] = process.argv.slice(2);
  if (!email || !origin) throw new Error('Usage: node scripts/demoPasswordReset.js email frontend-origin');
  const url = new URL(origin);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Provide a valid frontend origin.');
  await mongoose.connect(process.env.MONGO_URI);
  const token = await issueReset(email.trim().toLowerCase());
  if (!token) throw new Error('No local demo account found.');
  url.pathname = '/'; url.search = ''; url.hash = `reset-password/${token}`;
  process.stdout.write(`Private demo reset link (15 minutes; do not share or save):\n${url.href}\n`);
}
main().catch((err) => { process.stderr.write(`${err.message}\n`); process.exitCode = 1; }).finally(() => mongoose.disconnect());
