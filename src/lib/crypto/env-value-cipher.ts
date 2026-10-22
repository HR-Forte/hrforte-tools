import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { ENV_VARS_ENCRYPTION_KEY } from '@/config/server';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getKey(): Buffer {
  const keyEnv = ENV_VARS_ENCRYPTION_KEY.trim();
  if (!keyEnv) {
    throw new Error('ENV_VARS_ENCRYPTION_KEY is not set. Use a 32-byte hex key (e.g. openssl rand -hex 32).');
  }
  const buf = Buffer.from(keyEnv, 'hex');
  if (buf.length !== KEY_LENGTH) {
    throw new Error(`ENV_VARS_ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (64 hex chars), got ${buf.length} bytes.`);
  }
  return buf;
}

/**
 * Encrypts a plain text value for storage. Uses AES-256-GCM with a random IV.
 * Stored format: base64(iv || authTag || ciphertext).
 */
export function encryptEnvValue(plainText: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const blob = Buffer.concat([iv, authTag, encrypted]);
  return blob.toString('base64');
}

/**
 * Decrypts a value stored by encryptEnvValue.
 */
export function decryptEnvValue(cipherText: string): string {
  const key = getKey();
  const blob = Buffer.from(cipherText, 'base64');
  if (blob.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Invalid encrypted value: too short');
  }
  const iv = blob.subarray(0, IV_LENGTH);
  const authTag = blob.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = blob.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
}
