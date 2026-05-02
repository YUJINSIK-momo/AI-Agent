import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import agentRouter from "./routes/agent"
import githubRouter from "./routes/github"
import { checkDatabase, initDB } from "./lib/db"

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 4000

const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(",").map((o) => o.trim())

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) callback(null, true)
      else callback(new Error(`CORS: ${origin} is not allowed`))
    },
  })
)
app.use(express.json())

app.use("/api/agent", agentRouter)
app.use("/api/github", githubRouter)

app.get("/api/health", async (_req, res) => {
  const database = await checkDatabase()
  res.json({ status: "ok", time: new Date().toISOString(), database })
})

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})

initDB().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err)
  console.warn(`[DB] Init skipped (${msg}) — conversations won't be saved`)
})
