import { describe, it, expect } from "vitest"
import { encryptEnvelope, decryptEnvelope } from "./envelope.js"

process.env.MASTER_KEY =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

describe("Envelope Encryption", () => {
  it("encrypt → decrypt works", () => {
    const record = encryptEnvelope("party", { amount: 100 })
    const decrypted = decryptEnvelope(record)
    expect(decrypted).toEqual({ amount: 100 })
  })

  it("tampered ciphertext fails", () => {
    const record = encryptEnvelope("party", { amount: 100 })
    record.payload_ct = record.payload_ct.slice(0, -2) + "aa"
    expect(() => decryptEnvelope(record)).toThrow()
  })

  it("tampered tag fails", () => {
    const record = encryptEnvelope("party", { amount: 100 })
    record.payload_tag = record.payload_tag.slice(0, -2) + "aa"
    expect(() => decryptEnvelope(record)).toThrow()
  })

  it("wrong nonce length fails", () => {
    const record = encryptEnvelope("party", { amount: 100 })
    record.payload_nonce = "aa"
    expect(() => decryptEnvelope(record)).toThrow()
  })

  it("invalid hex fails", () => {
    const record = encryptEnvelope("party", { amount: 100 })
    record.payload_ct = "zzzz"
    expect(() => decryptEnvelope(record)).toThrow()
  })
})
