const crypto = require('crypto');

// Algorithm and key configuration
const ALGORITHM = 'aes-256-gcm';
// Default dev fallback key (32 bytes = 256 bits) if ENCRYPTION_KEY is not in .env
const DEV_KEY = '12345678901234567890123456789012'; 

function getMasterKey() {
  const rawKey = process.env.ENCRYPTION_KEY || DEV_KEY;
  // Ensure exactly 32 bytes (256-bit key) using SHA-256 digest of key string
  return crypto.createHash('sha256').update(rawKey).digest();
}

/**
 * Encrypts cleartext string into an IV:AuthTag:Ciphertext format
 * @param {string} text - Cleartext data to encrypt
 * @returns {string|null} Encrypted string or null
 */
function encrypt(text) {
  if (!text) return null;
  try {
    const key = getMasterKey();
    const iv = crypto.randomBytes(12); // 96-bit IV for AES-GCM
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Package IV, AuthTag, and Encrypted ciphertext together separated by colons
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('[Encryption Error]', err.message);
    throw new Error('Data encryption failed.');
  }
}

/**
 * Decrypts string formatted as IV:AuthTag:Ciphertext
 * @param {string} encryptedPayload - Encrypted payload string
 * @returns {string|null} Decrypted cleartext or null
 */
function decrypt(encryptedPayload) {
  if (!encryptedPayload) return null;
  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) {
      // Fallback: If payload is not in IV:AuthTag:Ciphertext format (e.g., unencrypted legacy string), return as is
      return encryptedPayload;
    }
    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getMasterKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('[Decryption Error]', err.message);
    throw new Error('Data decryption failed.');
  }
}

module.exports = {
  encrypt,
  decrypt,
};
