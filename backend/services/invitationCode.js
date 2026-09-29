const crypto = require('node:crypto');

// 32 symbols, 20 random bits; omit visually ambiguous I, O, 0 and 1.
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateInvitationCode() {
  return `SOLAR-${Array.from({ length: 4 }, () => alphabet[crypto.randomInt(alphabet.length)]).join('')}`;
}
module.exports = { generateInvitationCode };
