import crypto from "node:crypto";
export function generateRandomBytes(length) {
    return crypto.randomBytes(length);
}
export function aesEncrypt(key, plaintext) {
    const nonce = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, nonce);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return { nonce, ciphertext, tag };
}
export function aesDecrypt(key, nonce, ciphertext, tag) {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, nonce);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
    ]);
    return decrypted;
}
