import crypto from "node:crypto"
import { randomUUID } from "node:crypto"
import {
  generateRandomBytes,
  aesEncrypt,
  aesDecrypt
} from "./aes.js"

const MASTER_KEY = crypto.randomBytes(32)

export type TxSecureRecord = {
  id: string
  partyId: string
  createdAt: string
  payload_nonce: string
  payload_ct: string
  payload_tag: string
  dek_wrap_nonce: string
  dek_wrapped: string
  dek_wrap_tag: string
  alg: "AES-256-GCM"
  mk_version: 1
}

export function encryptEnvelope(partyId: string, payload: unknown): TxSecureRecord {
  const id = randomUUID()
  const createdAt = new Date().toISOString()

  const dek = generateRandomBytes(32)
  const payloadBuffer = Buffer.from(JSON.stringify(payload))

  const payloadEnc = aesEncrypt(dek, payloadBuffer)
  const wrapped = aesEncrypt(MASTER_KEY, dek)

  return {
    id,
    partyId,
    createdAt,
    payload_nonce: payloadEnc.nonce.toString("hex"),
    payload_ct: payloadEnc.ciphertext.toString("hex"),
    payload_tag: payloadEnc.tag.toString("hex"),
    dek_wrap_nonce: wrapped.nonce.toString("hex"),
    dek_wrapped: wrapped.ciphertext.toString("hex"),
    dek_wrap_tag: wrapped.tag.toString("hex"),
    alg: "AES-256-GCM",
    mk_version: 1
  }
}

export function decryptEnvelope(record: TxSecureRecord) {
  const dek = aesDecrypt(
    MASTER_KEY,
    Buffer.from(record.dek_wrap_nonce, "hex"),
    Buffer.from(record.dek_wrapped, "hex"),
    Buffer.from(record.dek_wrap_tag, "hex")
  )

  const payload = aesDecrypt(
    dek,
    Buffer.from(record.payload_nonce, "hex"),
    Buffer.from(record.payload_ct, "hex"),
    Buffer.from(record.payload_tag, "hex")
  )

  return JSON.parse(payload.toString())
}
