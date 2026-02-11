export declare function generateRandomBytes(length: number): NonSharedBuffer;
export declare function aesEncrypt(key: Buffer, plaintext: Buffer): {
    nonce: NonSharedBuffer;
    ciphertext: Buffer<ArrayBuffer>;
    tag: NonSharedBuffer;
};
export declare function aesDecrypt(key: Buffer, nonce: Buffer, ciphertext: Buffer, tag: Buffer): Buffer<ArrayBuffer>;
