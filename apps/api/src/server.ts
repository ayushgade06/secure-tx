import "dotenv/config"
import Fastify from "fastify"
import cors from "@fastify/cors"
import {
  encryptEnvelope,
  decryptEnvelope,
  TxSecureRecord
} from "@secure-tx/crypto"

const app = Fastify()

const store = new Map<string, TxSecureRecord>()

async function bootstrap() {
  await app.register(cors, {
    origin: true
  })

  app.get("/", async () => {
    return { status: "ok" }
  })

  app.post("/tx/encrypt", async (request, reply) => {
    const body = request.body as {
      partyId: string
      payload: unknown
    }

    if (
      typeof body?.partyId !== "string" ||
      body.partyId.trim() === "" ||
      body.payload === undefined
    ) {
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

  await app.listen({ port: 3001, host: "0.0.0.0" })
  console.log("API running")
}

bootstrap().catch((err) => {
  console.error(err)
  process.exit(1)
})
