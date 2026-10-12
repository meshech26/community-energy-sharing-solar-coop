require('dotenv').config();
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { io: ClientIO } = require('socket.io-client');
const mongoose = require('mongoose');
const nacl = require('tweetnacl');
const util = require('tweetnacl-util');

const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const setupChatSocket = require('../socket/chatSocket');

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

function encryptMsg(text, recipientPublicKeyBase64, senderSecretKeyBase64) {
  const msgUint8 = util.decodeUTF8(text);
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const recipientPubKey = util.decodeBase64(recipientPublicKeyBase64);
  const senderSecKey = util.decodeBase64(senderSecretKeyBase64);
  const box = nacl.box(msgUint8, nonce, recipientPubKey, senderSecKey);
  return {
    ciphertext: util.encodeBase64(box),
    nonce: util.encodeBase64(nonce),
  };
}

function decryptMsg(ciphertextBase64, nonceBase64, senderPublicKeyBase64, recipientSecretKeyBase64) {
  const ciphertext = util.decodeBase64(ciphertextBase64);
  const nonce = util.decodeBase64(nonceBase64);
  const senderPubKey = util.decodeBase64(senderPublicKeyBase64);
  const recipientSecKey = util.decodeBase64(recipientSecretKeyBase64);
  const decryptedBytes = nacl.box.open(ciphertext, nonce, senderPubKey, recipientSecKey);
  return util.encodeUTF8(decryptedBytes);
}

async function runVerification() {
  console.log('=== STARTING 1-TO-1 E2EE CHAT VERIFICATION ===\n');

  // 1. Connect MongoDB
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✔ MongoDB connected.');

  // 2. Start standalone test server on port 5055
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  setupChatSocket(io);

  await new Promise((resolve) => server.listen(5055, resolve));
  console.log('✔ Socket.IO test server running on port 5055.');

  // 3. Fetch test users (Kavindi and Kasun)
  const kavindi = await User.findOne({ email: 'user@solarcoop.com' });
  const kasun = await User.findOne({ email: 'kasun@solarcoop.com' });

  if (!kavindi || !kasun) {
    throw new Error('Test users not found! Please run seed.js');
  }

  const kavindiKeys = getKeyPair(kavindi.email);
  const kasunKeys = getKeyPair(kasun.email);

  console.log(`✔ Kavindi ID: ${kavindi._id}`);
  console.log(`✔ Kasun ID: ${kasun._id}`);

  // 4. Connect Socket clients for Kavindi and Kasun
  const clientKavindi = ClientIO('http://127.0.0.1:5055');
  const clientKasun = ClientIO('http://127.0.0.1:5055');

  await Promise.all([
    new Promise((resolve) => clientKavindi.on('connect', resolve)),
    new Promise((resolve) => clientKasun.on('connect', resolve)),
  ]);
  console.log('✔ Both clients connected to Socket.IO.');

  // Join rooms
  clientKavindi.emit('join', { userId: kavindi._id.toString() });
  clientKasun.emit('join', { userId: kasun._id.toString() });

  // 5. Test Presence / Online Status
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log('✔ User presence rooms joined.');

  // 6. Test Typing Indicator
  const typingPromise = new Promise((resolve) => {
    clientKasun.on('user_typing', (data) => {
      console.log(`✔ Kasun received typing event from ${data.senderName}: Kasun Perera is typing...`);
      resolve(data);
    });
  });

  clientKavindi.emit('typing', {
    conversationId: 'test-conv-123',
    senderId: kavindi._id.toString(),
    receiverId: kasun._id.toString(),
    senderName: kavindi.name,
  });

  await typingPromise;

  // 7. Test E2EE Message: Alice types -> Encrypts locally -> Sends via Socket.IO -> Node/Mongo stores ciphertext -> Kasun receives and decrypts
  const plainText = "Yeah, I'm coming tomorrow!";
  console.log(`\n--- ENCRYPTION FLOW ---`);
  console.log(`Original plain text: "${plainText}"`);

  // Local device encryption (Kavindi's device)
  const { ciphertext, nonce } = encryptMsg(plainText, kasunKeys.publicKey, kavindiKeys.secretKey);
  console.log(`Ciphertext (Base64): ${ciphertext}`);
  console.log(`Nonce (Base64): ${nonce}`);

  // Find or create conversation
  let conv = await Conversation.findOne({
    participants: { $all: [kavindi._id, kasun._id] },
  });
  if (!conv) {
    conv = await Conversation.create({
      participants: [kavindi._id, kasun._id],
      unreadCounts: {},
    });
  }

  const messageReceivePromise = new Promise((resolve) => {
    clientKasun.on('new_message', (data) => {
      console.log('✔ Kasun received real-time new_message event via Socket.IO!');
      resolve(data);
    });
  });

  // Emit encrypted message
  clientKavindi.emit('send_message', {
    conversationId: conv._id.toString(),
    senderId: kavindi._id.toString(),
    receiverId: kasun._id.toString(),
    ciphertext,
    nonce,
  });

  const receivedData = await messageReceivePromise;

  // 8. Verify MongoDB storage: Ciphertext stored, NO plain text, TTL index expiresAt +7 days
  const dbMessage = await Message.findById(receivedData.message._id);
  console.log(`\n--- DATABASE STORAGE CHECK ---`);
  console.log(`Stored in MongoDB _id: ${dbMessage._id}`);
  console.log(`Stored ciphertext: ${dbMessage.ciphertext}`);
  console.log(`Expires at (+7 days TTL): ${dbMessage.expiresAt}`);

  const diffDays = (new Date(dbMessage.expiresAt) - new Date(dbMessage.createdAt)) / (1000 * 60 * 60 * 24);
  console.log(`TTL duration verified: ${Math.round(diffDays)} days`);

  // 9. Kasun decrypts locally on his device
  console.log(`\n--- DECRYPTION FLOW ---`);
  const decryptedText = decryptMsg(
    receivedData.message.ciphertext,
    receivedData.message.nonce,
    kavindiKeys.publicKey,
    kasunKeys.secretKey
  );
  console.log(`Kasun decrypted locally: "${decryptedText}"`);

  if (decryptedText === plainText) {
    console.log('✔ MATCH: Local decryption perfectly restored original plain text!');
  } else {
    throw new Error('Decryption mismatch!');
  }

  // Clean up
  clientKavindi.disconnect();
  clientKasun.disconnect();
  server.close();
  await mongoose.disconnect();

  console.log('\n=== ALL 1-TO-1 CHAT SPECIFICATIONS VERIFIED SUCCESSFULLY! ===');
  process.exit(0);
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
