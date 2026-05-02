import { Router } from "express"
import type { Request, Response } from "express"
import { askAgent } from "../lib/claude"
import { saveMessage, getHistory, saveReport, saveDailyReport, getDailyReports } from "../lib/db"

const router = Router()

const AGENT_IDS = ["ceo", "cpo", "cto", "pm", "dev", "qa", "data", "marketing", "cs", "ops"]

// ── 고정 경로 먼저 (/:id 보다 위에 있어야 함) ──────────────────────────

// GET /api/agent/list
router.get("/list", (_req: Request, res: Response) => {
  res.json(AGENT_IDS.map((id) => ({ id })))
})

// GET /api/agent/daily-reports?date=2026-05-02&agentId=pm
router.get("/daily-reports", async (req: Request, res: Response) => {
  const date = req.query["date"] as string | undefined
  const agentId = req.query["agentId"] as string | undefined
  try {
    const reports = await getDailyReports(date, agentId)
    res.json({ reports })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" })
  }
})

// ── 동적 경로 (:id) ────────────────────────────────────────────────────

// POST /api/agent/:id/message
router.post("/:id/message", async (req: Request, res: Response) => {
  const id = req.params["id"] as string
  const { message, sessionId, companyContext } = req.body as {
    message: string
    sessionId?: string
    companyContext?: string
  }

  if (!message) { res.status(400).json({ error: "message is required" }); return }
  if (!AGENT_IDS.includes(id)) { res.status(404).json({ error: `Agent '${id}' not found` }); return }

  try {
    let claudeHistory: Array<{ role: "user" | "assistant"; content: string }> = []
    try {
      const history = await getHistory(id, 6, sessionId)
      claudeHistory = history.map((h) => ({
        role: (h.role === "agent" ? "assistant" : "user") as "user" | "assistant",
        content: h.content,
      }))
      await saveMessage(id, "user", message, sessionId)
    } catch (dbErr) {
      console.warn(`[DB] read/write skipped:`, dbErr instanceof Error ? dbErr.message : dbErr)
    }

    const reply = await askAgent(id, message, claudeHistory, companyContext)

    try {
      await saveMessage(id, "agent", reply, sessionId)
    } catch (dbErr) {
      console.warn(`[DB] save reply skipped:`, dbErr instanceof Error ? dbErr.message : dbErr)
    }

    res.json({ agent: id, userMessage: message, reply, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error(`[agent/${id}] error:`, err)
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" })
  }
})

// GET /api/agent/:id/history?limit=20&sessionId=xxx
router.get("/:id/history", async (req: Request, res: Response) => {
  const id = req.params["id"] as string
  const limit = parseInt((req.query["limit"] as string) || "20", 10)
  const sessionId = req.query["sessionId"] as string | undefined

  if (!AGENT_IDS.includes(id)) { res.status(404).json({ error: `Agent '${id}' not found` }); return }

  try {
    const history = await getHistory(id, limit, sessionId)
    res.json({ agent: id, history })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" })
  }
})

// POST /api/agent/:id/report  — CTO 분석 결과 등 단발성 보고서 저장
router.post("/:id/report", async (req: Request, res: Response) => {
  const id = req.params["id"] as string
  const { content, reportType } = req.body as { content: string; reportType?: string }

  if (!content) { res.status(400).json({ error: "content is required" }); return }
  if (!AGENT_IDS.includes(id)) { res.status(404).json({ error: `Agent '${id}' not found` }); return }

  try {
    await saveReport(id, reportType ?? "general", content)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" })
  }
})

// POST /api/agent/:id/daily-report
router.post("/:id/daily-report", async (req: Request, res: Response) => {
  const id = req.params["id"] as string
  const { content, date } = req.body as { content: string; date?: string }

  if (!content) { res.status(400).json({ error: "content is required" }); return }
  if (!AGENT_IDS.includes(id)) { res.status(404).json({ error: `Agent '${id}' not found` }); return }

  try {
    await saveDailyReport(id, content, date)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" })
  }
})

export default router
