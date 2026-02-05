import crypto from "crypto";

/**
 * Encryption utilities for storing sensitive data like Plaid access tokens.
 * Uses AES-256-GCM with random IV for each encryption.
 * 
 * IMPORTANT: These functions should only be used server-side.
 * Never import this module in client-side code.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get the encryption key from environment variables.
 * Key must be at least 32 bytes (256 bits) for AES-256.
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  
  // If the key is base64 encoded, decode it
  const keyBuffer = Buffer.from(key, "base64");
  
  if (keyBuffer.length < 32) {
    throw new Error("ENCRYPTION_KEY must be at least 32 bytes when decoded");
  }
  
  // Use only first 32 bytes if longer
  return keyBuffer.slice(0, 32);
}

/**
 * Encrypt a plaintext string.
 * Returns a base64-encoded string containing: IV + ciphertext + auth tag
 * 
 * @param plaintext - The string to encrypt
 * @returns Base64-encoded encrypted data
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV + ciphertext + auth tag
  const combined = Buffer.concat([iv, encrypted, authTag]);
  
  return combined.toString("base64");
}

/**
 * Decrypt a base64-encoded encrypted string.
 * 
 * @param encryptedData - Base64-encoded string containing IV + ciphertext + auth tag
 * @returns Decrypted plaintext string
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedData, "base64");
  
  // Extract IV, ciphertext, and auth tag
  const iv = combined.slice(0, IV_LENGTH);
  const authTag = combined.slice(-AUTH_TAG_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH, -AUTH_TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  
  return decrypted.toString("utf8");
}

/**
 * Check if encryption is properly configured.
 * Useful for health checks.
 */
export function isEncryptionConfigured(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a new encryption key.
 * Useful for initial setup.
 * 
 * @returns Base64-encoded 32-byte key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("base64");
}
