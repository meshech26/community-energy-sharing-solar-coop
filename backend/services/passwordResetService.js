const crypto = require('node:crypto');
const User = require('../models/User');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
async function issueReset(email) {
  const token = crypto.randomBytes(32).toString('hex');
  const user = await User.findOneAndUpdate({ email }, { $set: {
    passwordResetTokenHash: hashToken(token),
    passwordResetExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
  } });
  return user ? token : null;
}
module.exports = { issueReset, hashToken };
