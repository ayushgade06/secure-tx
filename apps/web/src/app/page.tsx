"use client"

import { useState } from "react"

export default function Page() {
  const API = process.env.NEXT_PUBLIC_API_URL

  const [partyId, setPartyId] = useState("")
  const [payload, setPayload] = useState('{ "amount": 100, "currency": "AED" }')
  const [recordId, setRecordId] = useState("")
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const encrypt = async () => {
    try {
      setError("")
      setResult(null)

      if (!partyId.trim()) {
        throw new Error("partyId is required")
      }

      let parsedPayload
      try {
        parsedPayload = JSON.parse(payload)
      } catch {
        throw new Error("Invalid JSON payload")
      }

      setLoading(true)

      const res = await fetch(`${API}/tx/encrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partyId: partyId.trim(),
          payload: parsedPayload
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Encryption failed")

      setRecordId(data.id)
      setResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecord = async () => {
    try {
      setError("")
      setResult(null)

      if (!recordId.trim()) {
        throw new Error("recordId is required")
      }

      setLoading(true)

      const res = await fetch(`${API}/tx/${recordId.trim()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Fetch failed")

      setResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const decrypt = async () => {
    try {
      setError("")
      setResult(null)

      if (!recordId.trim()) {
        throw new Error("recordId is required")
      }

      setLoading(true)

      const res = await fetch(`${API}/tx/${recordId.trim()}/decrypt`, {
        method: "POST"
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Decryption failed")

      setResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ padding: 40, maxWidth: 800 }}>
      <h1>Secure Transactions</h1>

      <div>
        <input
          placeholder="partyId"
          value={partyId}
          onChange={(e) => setPartyId(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <textarea
          rows={6}
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <button onClick={encrypt} disabled={loading}>
          {loading ? "Processing..." : "Encrypt & Save"}
        </button>
      </div>

      <hr style={{ margin: "20px 0" }} />

      <div>
        <input
          placeholder="recordId"
          value={recordId}
          onChange={(e) => setRecordId(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <button onClick={fetchRecord} disabled={loading}>
          Fetch
        </button>

        <button onClick={decrypt} disabled={loading} style={{ marginLeft: 10 }}>
          Decrypt
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <pre style={{ marginTop: 20 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  )
}
