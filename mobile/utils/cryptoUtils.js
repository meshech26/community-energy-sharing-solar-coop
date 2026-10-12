import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

// Ensure PRNG is available in all environments (Expo, React Native, Web)
try {
  nacl.randomBytes(1);
} catch (e) {
  nacl.setPRNG((x, n) => {
    for (let i = 0; i < n; i++) {
      x[i] = Math.floor(Math.random() * 256);
    }
  });
}

// In-memory key store for session persistence
const keyStore = new Map();

/**
 * Generate a 32-byte seed from a user identifier (e.g. email or userId)
 * Ensures reproducible keypairs per member on device during testing/sessions.
 */
function createSeedFromIdentifier(identifier) {
  const seed = new Uint8Array(32);
  const str = String(identifier || 'solar-share-user');
  for (let i = 0; i < 32; i++) {
    const charCode = str.charCodeAt(i % str.length) || 0;
    seed[i] = (charCode * 31 + i * 17) % 256;
  }
  return seed;
}

/**
 * Safely decode base64 without throwing TypeError
 */
function safeDecodeBase64(str) {
  if (!str || typeof str !== 'string') return null;
  let s = str.trim();
  while (s.length % 4 !== 0) {
    s += '=';
  }
  try {
    return util.decodeBase64(s);
  } catch (e) {
    return null;
  }
}

/**
 * Get or generate user's Curve25519 E2EE keypair
 * Returns { publicKey: string, secretKey: string } in Base64
 */
export function getUserKeyPair(identifier) {
  const key = String(identifier || 'default');
  if (keyStore.has(key)) {
    return keyStore.get(key);
  }

  const seed = createSeedFromIdentifier(key);
  const keyPair = nacl.box.keyPair.fromSecretKey(seed);

  const result = {
    publicKey: util.encodeBase64(keyPair.publicKey),
    secretKey: util.encodeBase64(keyPair.secretKey),
  };

  keyStore.set(key, result);
  return result;
}

/**
 * Encrypt a plain text message for a recipient using TweetNaCl box
 * @param {string} plainText
 * @param {string} recipientPublicKeyBase64
 * @param {string} senderSecretKeyBase64
 * @returns {{ ciphertext: string, nonce: string }}
 */
export function encryptMessage(plainText, recipientPublicKeyBase64, senderSecretKeyBase64) {
  if (!plainText || !recipientPublicKeyBase64 || !senderSecretKeyBase64) {
    throw new Error('Missing parameters for encryption');
  }

  const msgUint8 = util.decodeUTF8(plainText);
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const recipientPubKey = safeDecodeBase64(recipientPublicKeyBase64);
  const senderSecKey = safeDecodeBase64(senderSecretKeyBase64);

  if (!recipientPubKey || !senderSecKey) {
    throw new Error('Invalid encryption keys');
  }

  const encryptedBox = nacl.box(msgUint8, nonce, recipientPubKey, senderSecKey);
  if (!encryptedBox) {
    throw new Error('Failed to encrypt message');
  }

  return {
    ciphertext: util.encodeBase64(encryptedBox),
    nonce: util.encodeBase64(nonce),
  };
}

/**
 * Decrypt a message from a sender using TweetNaCl box.open
 * @param {string} ciphertextBase64
 * @param {string} nonceBase64
 * @param {string} senderPublicKeyBase64
 * @param {string} recipientSecretKeyBase64
 * @returns {string} Decrypted plain text or fallback error indicator
 */
export function decryptMessage(ciphertextBase64, nonceBase64, senderPublicKeyBase64, recipientSecretKeyBase64) {
  try {
    if (!ciphertextBase64 || !nonceBase64 || !senderPublicKeyBase64 || !recipientSecretKeyBase64) {
      return '';
    }

    const ciphertext = safeDecodeBase64(ciphertextBase64);
    const nonce = safeDecodeBase64(nonceBase64);
    const senderPubKey = safeDecodeBase64(senderPublicKeyBase64);
    const recipientSecKey = safeDecodeBase64(recipientSecretKeyBase64);

    if (!ciphertext || !nonce || !senderPubKey || !recipientSecKey) {
      return '🔐 [Encrypted Message]';
    }

    const decryptedBytes = nacl.box.open(ciphertext, nonce, senderPubKey, recipientSecKey);
    if (!decryptedBytes) {
      return '🔐 [Encrypted Message]';
    }

    return util.encodeUTF8(decryptedBytes);
  } catch (err) {
    return '🔐 [Encrypted Message]';
  }
}
