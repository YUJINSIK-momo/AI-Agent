import { Router } from "express"
import type { Request, Response } from "express"
import { askAgent } from "../lib/claude"
import { saveMessage, getHistory } from "../lib/db"

const router = Router()

const AGENT_IDS = ["ceo", "cpo", "cto", "pm", "dev", "qa", "data", "marketing", "cs", "ops"]

// POST /api/agent/:id/message
router.post("/:id/message", async (req: Request, res: Response) => {
  const id = req.params["id"] as string
  const { message } = req.body as { message: string }

  if (!message) {
    res.status(400).json({ error: "message is required" })
    return
  }

  if (!AGENT_IDS.includes(id)) {
    res.status(404).json({ error: `Agent '${id}' not found` })
    return
  }

  try {
    let claudeHistory: Array<{ role: "user" | "assistant"; content: string }> = []
    try {
      const history = await getHistory(id, 6)
      claudeHistory = history.map((h) => ({
        role: (h.role === "agent" ? "assistant" : "user") as "user" | "assistant",
        content: h.content,
      }))
      await saveMessage(id, "user", message)
    } catch (dbErr) {
      console.warn(`[DB] read/write skipped:`, dbErr instanceof Error ? dbErr.message : dbErr)
    }

    const reply = await askAgent(id, message, claudeHistory)

    try {
      await saveMessage(id, "agent", reply)
    } catch (dbErr) {
      console.warn(`[DB] save reply skipped:`, dbErr instanceof Error ? dbErr.message : dbErr)
    }

    res.json({
      agent: id,
      userMessage: message,
      reply,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error(`[agent/${id}] error:`, err)
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" })
  }
})

// GET /api/agent/:id/history
router.get("/:id/history", async (req: Request, res: Response) => {
  const id = req.params["id"] as string
  const limit = parseInt((req.query["limit"] as string) || "20", 10)

  if (!AGENT_IDS.includes(id)) {
    res.status(404).json({ error: `Agent '${id}' not found` })
    return
  }

  try {
    const history = await getHistory(id, limit)
    res.json({ agent: id, history })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" })
  }
})

// GET /api/agent/list
router.get("/list", (_req: Request, res: Response) => {
  res.json(AGENT_IDS.map((id) => ({ id })))
})

export default router
