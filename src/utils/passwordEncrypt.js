/**
 * Client-side password encryption utility
 * Uses AES-GCM encryption to encrypt passwords before sending to server
 * This prevents passwords from appearing in plain text in DevTools Network tab
 * 
 * The server will decrypt this and then hash with bcrypt as before
 */

/**
 * Encrypt a password using AES-GCM
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Base64-encoded encrypted data (iv + encrypted password)
 */
export async function encryptPassword(password) {
  // Get encryption key from environment variable or use a default (for development)
  // In production, this should be set via VITE_PASSWORD_ENCRYPTION_KEY
  const keyString = import.meta.env.VITE_PASSWORD_ENCRYPTION_KEY || 'default-encryption-key-32-chars-long!!';
  // Convert key string to ArrayBuffer (must be 32 bytes for AES-256)
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyString.padEnd(32, '0').slice(0, 32));
  
  // Import key for encryption
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Generate a random IV (Initialization Vector) - 12 bytes for GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Convert password to ArrayBuffer
  const passwordData = encoder.encode(password);

  // Encrypt the password
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128, // 16 bytes authentication tag
    },
    cryptoKey,
    passwordData
  );

  // Extract ciphertext and auth tag from encrypted data
  // GCM mode: encryptedData contains ciphertext + auth tag (last 16 bytes)
  const ciphertext = new Uint8Array(encryptedData.slice(0, -16));
  const authTag = new Uint8Array(encryptedData.slice(-16));

  // Combine IV + ciphertext + auth tag
  const combined = new Uint8Array(iv.length + ciphertext.length + authTag.length);
  combined.set(iv, 0);
  combined.set(ciphertext, iv.length);
  combined.set(authTag, iv.length + ciphertext.length);
  // Convert to base64 for transmission
  return btoa(String.fromCharCode(...combined));
}
