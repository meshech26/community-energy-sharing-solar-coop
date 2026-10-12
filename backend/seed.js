require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nacl = require('tweetnacl');
const util = require('tweetnacl-util');
const User = require('./models/User');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

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
    rawKeyPair: kp,
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

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    // Clear existing chat data and users
    await User.deleteMany();
    await Conversation.deleteMany();
    await Message.deleteMany();
    console.log('Cleared existing database collections.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create Admin
    const adminKeys = getKeyPair('admin@solarcoop.com');
    const admin = await User.create({
      name: 'Coop Admin',
      email: 'admin@solarcoop.com',
      password: hashedPassword,
      isCoopAdmin: true,
      publicKey: adminKeys.publicKey,
      householdId: new mongoose.Types.ObjectId(),
    });

    // Create Member 1 (Kavindi Perera)
    const userKeys = getKeyPair('user@solarcoop.com');
    const user = await User.create({
      name: 'Kavindi Perera',
      email: 'user@solarcoop.com',
      password: hashedPassword,
      isCoopAdmin: false,
      publicKey: userKeys.publicKey,
      householdId: new mongoose.Types.ObjectId(),
    });

    // Create Member 2 (Sunil Fernando)
    const member2Keys = getKeyPair('sunil@solarcoop.com');
    const member2 = await User.create({
      name: 'Sunil Fernando',
      email: 'sunil@solarcoop.com',
      password: hashedPassword,
      isCoopAdmin: false,
      publicKey: member2Keys.publicKey,
      householdId: new mongoose.Types.ObjectId(),
    });

    // Create Chat contacts
    const kasunKeys = getKeyPair('kasun@solarcoop.com');
    const kasun = await User.create({
      name: 'Kasun Perera',
      email: 'kasun@solarcoop.com',
      password: hashedPassword,
      isCoopAdmin: false,
      publicKey: kasunKeys.publicKey,
      householdId: new mongoose.Types.ObjectId(),
    });

    const nimalKeys = getKeyPair('nimal@solarcoop.com');
    const nimal = await User.create({
      name: 'Nimal Fernando',
      email: 'nimal@solarcoop.com',
      password: hashedPassword,
      isCoopAdmin: false,
      publicKey: nimalKeys.publicKey,
      householdId: new mongoose.Types.ObjectId(),
    });

    const amalKeys = getKeyPair('amal@solarcoop.com');
    const amal = await User.create({
      name: 'Amal Silva',
      email: 'amal@solarcoop.com',
      password: hashedPassword,
      isCoopAdmin: false,
      publicKey: amalKeys.publicKey,
      householdId: new mongoose.Types.ObjectId(),
    });

    const danielKeys = getKeyPair('daniel@solarcoop.com');
    const daniel = await User.create({
      name: 'Daniel',
      email: 'daniel@solarcoop.com',
      password: hashedPassword,
      isCoopAdmin: false,
      publicKey: danielKeys.publicKey,
      householdId: new mongoose.Types.ObjectId(),
    });

    console.log('Seed users created with Curve25519 E2EE public keys.');

    // Helper to create encrypted message with 7-day TTL
    const createEncryptedMessage = async (convId, sender, receiver, text, minutesAgo = 0, isRead = true) => {
      const createdAt = new Date(Date.now() - minutesAgo * 60 * 1000);
      const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7-day TTL
      const senderKeys = getKeyPair(sender.email);
      const { ciphertext, nonce } = encryptMsg(text, receiver.publicKey, senderKeys.secretKey);

      return await Message.create({
        conversationId: convId,
        senderId: sender._id,
        receiverId: receiver._id,
        ciphertext,
        nonce,
        read: isRead,
        createdAt,
        expiresAt,
      });
    };

    // 1. Conversation: Kavindi <-> Kasun Perera (with 1 unread message for Kavindi!)
    const convKasun = await Conversation.create({
      participants: [user._id, kasun._id],
      unreadCounts: { [user._id.toString()]: 1, [kasun._id.toString()]: 0 },
    });

    await createEncryptedMessage(convKasun._id, kasun, user, 'Hey, how are you?', 45, true);
    await createEncryptedMessage(convKasun._id, user, kasun, "I'm good 😂", 42, true);
    await createEncryptedMessage(convKasun._id, kasun, user, 'What are you doing?', 40, true);
    const lastKasunMsg = await createEncryptedMessage(convKasun._id, kasun, user, 'Are you coming tomorrow?', 5, false);

    convKasun.lastMessage = {
      ciphertext: lastKasunMsg.ciphertext,
      nonce: lastKasunMsg.nonce,
      senderId: kasun._id,
      createdAt: lastKasunMsg.createdAt,
    };
    await convKasun.save();

    // 2. Conversation: Kavindi <-> Nimal Fernando
    const convNimal = await Conversation.create({
      participants: [user._id, nimal._id],
      unreadCounts: { [user._id.toString()]: 0, [nimal._id.toString()]: 0 },
    });
    const lastNimalMsg = await createEncryptedMessage(convNimal._id, nimal, user, 'See you tomorrow 👍', 120, true);
    convNimal.lastMessage = {
      ciphertext: lastNimalMsg.ciphertext,
      nonce: lastNimalMsg.nonce,
      senderId: nimal._id,
      createdAt: lastNimalMsg.createdAt,
    };
    await convNimal.save();

    // 3. Conversation: Kavindi <-> Amal Silva
    const convAmal = await Conversation.create({
      participants: [user._id, amal._id],
      unreadCounts: { [user._id.toString()]: 0, [amal._id.toString()]: 0 },
    });
    const lastAmalMsg = await createEncryptedMessage(convAmal._id, amal, user, 'Okay, sounds good', 1440, true); // Yesterday
    convAmal.lastMessage = {
      ciphertext: lastAmalMsg.ciphertext,
      nonce: lastAmalMsg.nonce,
      senderId: amal._id,
      createdAt: lastAmalMsg.createdAt,
    };
    await convAmal.save();

    // 4. Conversation: Kavindi <-> Daniel
    const convDaniel = await Conversation.create({
      participants: [user._id, daniel._id],
      unreadCounts: { [user._id.toString()]: 0, [daniel._id.toString()]: 0 },
    });
    const lastDanielMsg = await createEncryptedMessage(convDaniel._id, daniel, user, 'Are you coming?', 4320, true); // 3 days ago
    convDaniel.lastMessage = {
      ciphertext: lastDanielMsg.ciphertext,
      nonce: lastDanielMsg.nonce,
      senderId: daniel._id,
      createdAt: lastDanielMsg.createdAt,
    };
    await convDaniel.save();

    console.log('Initial sample encrypted conversations seeded:');
    console.log('- Kasun Perera (1 unread message)');
    console.log('- Nimal Fernando');
    console.log('- Amal Silva');
    console.log('- Daniel');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
