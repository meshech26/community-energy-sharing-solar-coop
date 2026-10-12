require('dotenv').config();
const mongoose = require('mongoose');
const nacl = require('tweetnacl');
const util = require('tweetnacl-util');
const User = require('../models/User');
const Message = require('../models/Message');

function createSeed(str) {
  const seed = new Uint8Array(32);
  const s = String(str);
  for (let i = 0; i < 32; i++) {
    const code = s.charCodeAt(i % s.length) || 0;
    seed[i] = (code * 31 + i * 17) % 256;
  }
  return seed;
}

function getKeyPair(email) {
  const seed = createSeed(email);
  const kp = nacl.box.keyPair.fromSecretKey(seed);
  return {
    publicKey: util.encodeBase64(kp.publicKey),
    secretKey: util.encodeBase64(kp.secretKey),
  };
}

async function testPopulate() {
  await mongoose.connect(process.env.MONGO_URI);
  const kavindi = await User.findOne({ email: 'user@solarcoop.com' });
  const myKeyPair = getKeyPair(kavindi.email);
  const myIdStr = kavindi._id.toString();

  const messages = await Message.find({
    $or: [{ senderId: kavindi._id }, { receiverId: kavindi._id }]
  })
    .populate('senderId', 'name email publicKey')
    .populate('receiverId', 'name email publicKey')
    .sort({ createdAt: -1 })
    .limit(10);

  console.log('Testing decryption of populated messages for Kavindi:');
  for (const m of messages) {
    if (!m.senderId || !m.receiverId) continue;
    const senderIdStr = m.senderId._id.toString();
    const isMe = senderIdStr === myIdStr;
    const otherParty = isMe ? m.receiverId : m.senderId;
    const otherPubKey = otherParty?.publicKey;

    try {
      const ciphertext = util.decodeBase64(m.ciphertext);
      const nonce = util.decodeBase64(m.nonce);
      const otherPub = util.decodeBase64(otherPubKey);
      const mySec = util.decodeBase64(myKeyPair.secretKey);

      const decryptedBytes = nacl.box.open(ciphertext, nonce, otherPub, mySec);
      const text = decryptedBytes ? util.encodeUTF8(decryptedBytes) : 'DECRYPTION_FAILED';
      console.log(`[Msg ${m._id}] from ${m.senderId.name} to ${m.receiverId.name} -> "${text}" (isMe: ${isMe})`);
    } catch(e) {
      console.log(`[Msg ${m._id}] Error:`, e.message);
    }
  }
  process.exit(0);
}
testPopulate();
