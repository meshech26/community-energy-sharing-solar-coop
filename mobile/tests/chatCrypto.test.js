import { getUserKeyPair, encryptMessage, decryptMessage } from '../utils/cryptoUtils';

describe('End-to-End Encryption (E2EE) with TweetNaCl', () => {
  test('generates valid base64 public and secret keys for users', () => {
    const aliceKeys = getUserKeyPair('user@solarcoop.com');
    const bobKeys = getUserKeyPair('kasun@solarcoop.com');

    expect(aliceKeys.publicKey).toBeDefined();
    expect(aliceKeys.secretKey).toBeDefined();
    expect(bobKeys.publicKey).toBeDefined();
    expect(bobKeys.secretKey).toBeDefined();

    expect(aliceKeys.publicKey).not.toEqual(bobKeys.publicKey);
  });

  test('successfully encrypts on sender side and decrypts on recipient side', () => {
    const aliceKeys = getUserKeyPair('user@solarcoop.com');
    const kasunKeys = getUserKeyPair('kasun@solarcoop.com');

    const originalText = 'Yeah, I\'m coming tomorrow!';

    // Alice encrypts for Kasun
    const { ciphertext, nonce } = encryptMessage(
      originalText,
      kasunKeys.publicKey,
      aliceKeys.secretKey
    );

    expect(ciphertext).toBeDefined();
    expect(nonce).toBeDefined();
    expect(ciphertext).not.toEqual(originalText);

    // Kasun decrypts from Alice
    const decrypted = decryptMessage(
      ciphertext,
      nonce,
      aliceKeys.publicKey,
      kasunKeys.secretKey
    );

    expect(decrypted).toBe(originalText);
  });

  test('Alice can also decrypt her own sent message using Kasun\'s public key', () => {
    const aliceKeys = getUserKeyPair('user@solarcoop.com');
    const kasunKeys = getUserKeyPair('kasun@solarcoop.com');

    const originalText = 'What are you doing?';

    const { ciphertext, nonce } = encryptMessage(
      originalText,
      kasunKeys.publicKey,
      aliceKeys.secretKey
    );

    // Alice decrypts her own sent message
    const aliceDecrypted = decryptMessage(
      ciphertext,
      nonce,
      kasunKeys.publicKey,
      aliceKeys.secretKey
    );

    expect(aliceDecrypted).toBe(originalText);
  });

  test('handles invalid or corrupted ciphertext gracefully without crashing', () => {
    const aliceKeys = getUserKeyPair('user@solarcoop.com');
    const kasunKeys = getUserKeyPair('kasun@solarcoop.com');

    const result = decryptMessage(
      'corrupted-ciphertext',
      'invalid-nonce',
      kasunKeys.publicKey,
      aliceKeys.secretKey
    );

    expect(result).toBe('🔐 [Encrypted Message]');
  });
});
