import { describe, it, expect, beforeAll } from "vitest";
import { encrypt, decrypt, isEncryptionConfigured, generateEncryptionKey } from "./encryption";

describe("encryption utilities", () => {
  beforeAll(() => {
    // Set a valid encryption key for tests
    process.env.ENCRYPTION_KEY = generateEncryptionKey();
  });

  describe("encrypt and decrypt", () => {
    it("should encrypt and decrypt a simple string", () => {
      const plaintext = "Hello, World!";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should encrypt and decrypt a JSON string", () => {
      const data = { accessToken: "test-token-123", itemId: "item-456" };
      const plaintext = JSON.stringify(data);
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(JSON.parse(decrypted)).toEqual(data);
    });

    it("should produce different ciphertext for same plaintext (random IV)", () => {
      const plaintext = "Same text";
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should handle empty string", () => {
      const plaintext = "";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle unicode characters", () => {
      const plaintext = "Hello 世界 🌍 مرحبا";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle long strings", () => {
      const plaintext = "a".repeat(10000);
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe("isEncryptionConfigured", () => {
    it("should return true when ENCRYPTION_KEY is set", () => {
      expect(isEncryptionConfigured()).toBe(true);
    });

    it("should return false when ENCRYPTION_KEY is not set", () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;

      expect(isEncryptionConfigured()).toBe(false);

      process.env.ENCRYPTION_KEY = originalKey;
    });
  });

  describe("generateEncryptionKey", () => {
    it("should generate a valid base64 key", () => {
      const key = generateEncryptionKey();

      // Should be base64 encoded
      expect(() => Buffer.from(key, "base64")).not.toThrow();

      // Decoded should be 32 bytes
      const decoded = Buffer.from(key, "base64");
      expect(decoded.length).toBe(32);
    });

    it("should generate unique keys", () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();

      expect(key1).not.toBe(key2);
    });
  });
});
