/**
 * FinTrack AI - Cryptography Service
 * Uses Web Crypto API for zero-knowledge encryption.
 * AES-GCM for encryption, PBKDF2 for key derivation.
 */

const ENCRYPTION_ALGORITHM = "AES-GCM";
const DERIVATION_ALGORITHM = "PBKDF2";
const HASH_ALGORITHM = "SHA-256";
const ITERATIONS = 100000;
const KEY_LENGTH = 256;

/**
 * Derives a CryptoKey from a 6-digit PIN and a salt.
 */
export async function deriveKeyFromPin(pin: string, salt: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const pinData = enc.encode(pin);
  const saltData = enc.encode(salt);

  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    pinData,
    { name: DERIVATION_ALGORITHM },
    false,
    ["deriveBits", "deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: DERIVATION_ALGORITHM,
      salt: saltData,
      iterations: ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    baseKey,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Exports a CryptoKey to a serializable JWK format.
 */
export async function exportVaultKey(key: CryptoKey): Promise<JsonWebKey> {
  return window.crypto.subtle.exportKey("jwk", key);
}

/**
 * Imports a CryptoKey from JWK format.
 */
export async function importVaultKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a string value.
 */
export async function encryptData(text: string, key: CryptoKey): Promise<string> {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedData = enc.encode(text);

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv: iv,
    },
    key,
    encodedData
  );

  // Combine IV and Ciphertext into a single string
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Efficient conversion to base64
  const CHUNK_SIZE = 0x8000; // 32KB chunks to avoid stack limits
  const chunks = [];
  for (let i = 0; i < combined.length; i += CHUNK_SIZE) {
    chunks.push(String.fromCharCode.apply(null, combined.subarray(i, i + CHUNK_SIZE) as unknown as number[]));
  }
  return btoa(chunks.join(""));
}

/**
 * Decrypts a base64 encoded combined string (IV + Ciphertext).
 */
export async function decryptData(combinedBase64: string, key: CryptoKey): Promise<string> {
  try {
    const binary = atob(combinedBase64);
    const combined = Uint8Array.from(binary, (c) => c.charCodeAt(0));

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: iv,
      },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    throw new Error("Invalid key or corrupted data");
  }
}

/**
 * Convenience helpers for different data types
 */
export const CryptoUtils = {
  async encryptString(value: string, key: CryptoKey): Promise<string> {
    return encryptData(value, key);
  },

  async encryptNumber(value: number, key: CryptoKey): Promise<string> {
    return encryptData(String(value), key);
  },
  
  async decryptString(encrypted: string, key: CryptoKey): Promise<string> {
    return decryptData(encrypted, key);
  },
  
  async decryptNumber(encrypted: string, key: CryptoKey): Promise<number> {
    const decrypted = await decryptData(encrypted, key);
    return Number(decrypted);
  }
};
