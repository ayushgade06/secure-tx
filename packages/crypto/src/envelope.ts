import { randomUUID } from "node:crypto"
import {
  generateRandomBytes,
  aesEncrypt,
  aesDecrypt
} from "./aes.js"

function getMasterKey(): Buffer {
  const key = Buffer.from(process.env.MASTER_KEY ?? "", "hex")

  if (key.length !== 32) {
    throw new Error("MASTER_KEY must be 32 bytes (hex)")
  }

  return key
}

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

function isValidHex(value: string) {
  return (
    typeof value === "string" &&
    /^[0-9a-fA-F]+$/.test(value) &&
    value.length % 2 === 0
  )
}

function assertLength(buf: Buffer, expected: number, name: string) {
  if (buf.length !== expected) {
    throw new Error(`${name} must be ${expected} bytes`)
  }
}

export function encryptEnvelope(
  partyId: string,
  payload: unknown
): TxSecureRecord {
  const id = randomUUID()
  const dek = generateRandomBytes(32)

  const payloadBuffer = Buffer.from(JSON.stringify(payload))

  const encryptedPayload = aesEncrypt(dek, payloadBuffer)
  const encryptedDek = aesEncrypt(getMasterKey(), dek)

  return {
    id,
    partyId,
    createdAt: new Date().toISOString(),
    payload_nonce: encryptedPayload.nonce.toString("hex"),
    payload_ct: encryptedPayload.ciphertext.toString("hex"),
    payload_tag: encryptedPayload.tag.toString("hex"),
    dek_wrap_nonce: encryptedDek.nonce.toString("hex"),
    dek_wrapped: encryptedDek.ciphertext.toString("hex"),
    dek_wrap_tag: encryptedDek.tag.toString("hex"),
    alg: "AES-256-GCM",
    mk_version: 1
  }
}

export function decryptEnvelope(record: TxSecureRecord) {
  if (
    !isValidHex(record.dek_wrap_nonce) ||
    !isValidHex(record.dek_wrapped) ||
    !isValidHex(record.dek_wrap_tag) ||
    !isValidHex(record.payload_nonce) ||
    !isValidHex(record.payload_ct) ||
    !isValidHex(record.payload_tag)
  ) {
    throw new Error("Invalid hex encoding")
  }

  const dekWrapNonce = Buffer.from(record.dek_wrap_nonce, "hex")
  const dekWrapped = Buffer.from(record.dek_wrapped, "hex")
  const dekWrapTag = Buffer.from(record.dek_wrap_tag, "hex")

  const payloadNonce = Buffer.from(record.payload_nonce, "hex")
  const payloadCt = Buffer.from(record.payload_ct, "hex")
  const payloadTag = Buffer.from(record.payload_tag, "hex")

  assertLength(dekWrapNonce, 12, "dek_wrap_nonce")
  assertLength(dekWrapTag, 16, "dek_wrap_tag")
  assertLength(payloadNonce, 12, "payload_nonce")
  assertLength(payloadTag, 16, "payload_tag")

  if (dekWrapped.length === 0) {
    throw new Error("Invalid wrapped DEK")
  }

  if (payloadCt.length === 0) {
    throw new Error("Invalid ciphertext")
  }

  const dek = aesDecrypt(
    getMasterKey(),
    dekWrapNonce,
    dekWrapped,
    dekWrapTag
  )

  const payloadBuffer = aesDecrypt(
    dek,
    payloadNonce,
    payloadCt,
    payloadTag
  )

  try {
    return JSON.parse(payloadBuffer.toString())
  } catch {
    throw new Error("Invalid decrypted payload")
  }
}
