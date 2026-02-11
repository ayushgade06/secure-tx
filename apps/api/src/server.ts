import Fastify from "fastify"
import {
  encryptEnvelope,
  decryptEnvelope,
  TxSecureRecord
} from "@secure-tx/crypto"

const app = Fastify()

const store = new Map<string, TxSecureRecord>()

app.post("/tx/encrypt", async (request, reply) => {
  const body = request.body as {
    partyId: string
    payload: unknown
  }

  if (!body?.partyId || !body?.payload) {
    return reply.status(400).send({ error: "Invalid input" })
  }

  const record = encryptEnvelope(body.partyId, body.payload)
  store.set(record.id, record)

  return record
})

app.get("/tx/:id", async (request, reply) => {
  const { id } = request.params as { id: string }
  const record = store.get(id)

  if (!record) {
    return reply.status(404).send({ error: "Not found" })
  }

  return record
})

app.post("/tx/:id/decrypt", async (request, reply) => {
  const { id } = request.params as { id: string }
  const record = store.get(id)

  if (!record) {
    return reply.status(404).send({ error: "Not found" })
  }

  try {
    const decrypted = decryptEnvelope(record)
    return { payload: decrypted }
  } catch {
    return reply.status(400).send({ error: "Decryption failed" })
  }
})

app.listen({ port: 3001 })
