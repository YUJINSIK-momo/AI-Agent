import { Pool } from "pg"

let _pool: Pool | null = null

export function getConnectionString(): string | undefined {
  const raw = process.env.SUPABASE_URL ?? process.env.DATABASE_URL
  const s = raw?.trim()
  return s || undefined
}

export type DatabaseHealth = {
  configured: boolean
  connected: boolean
  latencyMs?: number
  error?: string
}

export async function checkDatabase(): Promise<DatabaseHealth> {
  const connectionString = getConnectionString()
  if (!connectionString) return { configured: false, connected: false }
  const started = Date.now()
  try {
    await getPool().query("SELECT 1 AS ok")
    return { configured: true, connected: true, latencyMs: Date.now() - started }
  } catch (err) {
    return { configured: true, connected: false, error: err instanceof Error ? err.message : String(err) }
  }
}

function getPool(): Pool {
  const connectionString = getConnectionString()
  if (!connectionString) throw new Error("SUPABASE_URL 또는 DATABASE_URL이 설정되어 있지 않습니다.")
  if (!_pool) {
    _pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
  }
  return _pool
}

export async function initDB(): Promise<void> {
  if (!getConnectionString()) {
    console.warn("[DB] SUPABASE_URL/DATABASE_URL 없음 — 테이블 초기화 생략")
    return
  }

  await getPool().query(`
    -- 대화 기록
    CREATE TABLE IF NOT EXISTS conversations (
      id         SERIAL PRIMARY KEY,
      agent_id   VARCHAR(20)  NOT NULL,
      session_id VARCHAR(36),
      role       VARCHAR(10)  NOT NULL,
      content    TEXT         NOT NULL,
      created_at TIMESTAMPTZ  DEFAULT NOW()
    );

    -- session_id 컬럼이 없는 기존 테이블에 추가
    ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS session_id VARCHAR(36);

    -- 보고서
    CREATE TABLE IF NOT EXISTS reports (
      id          SERIAL PRIMARY KEY,
      agent_id    VARCHAR(20)  NOT NULL,
      report_type VARCHAR(50)  NOT NULL,
      content     TEXT         NOT NULL,
      created_at  TIMESTAMPTZ  DEFAULT NOW()
    );

    -- 아침 브리핑 일일 보고서
    CREATE TABLE IF NOT EXISTS daily_reports (
      id         SERIAL PRIMARY KEY,
      date       DATE         NOT NULL DEFAULT CURRENT_DATE,
      agent_id   VARCHAR(20)  NOT NULL,
      content    TEXT         NOT NULL,
      created_at TIMESTAMPTZ  DEFAULT NOW()
    );

    -- 인덱스
    CREATE INDEX IF NOT EXISTS idx_conversations_agent_id   ON conversations (agent_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations (session_id);
    CREATE INDEX IF NOT EXISTS idx_reports_agent_id         ON reports (agent_id);
    CREATE INDEX IF NOT EXISTS idx_reports_created_at       ON reports (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_daily_reports_date       ON daily_reports (date DESC);
    CREATE INDEX IF NOT EXISTS idx_daily_reports_agent_id   ON daily_reports (agent_id);
  `)

  console.log("[DB] Tables & indexes ready")
}

export async function saveMessage(
  agentId: string,
  role: "user" | "agent",
  content: string,
  sessionId?: string
): Promise<void> {
  await getPool().query(
    "INSERT INTO conversations (agent_id, session_id, role, content) VALUES ($1, $2, $3, $4)",
    [agentId, sessionId ?? null, role, content]
  )
}

export async function getHistory(
  agentId: string,
  limit = 10,
  sessionId?: string
): Promise<Array<{ role: string; content: string }>> {
  const result = sessionId
    ? await getPool().query<{ role: string; content: string }>(
        `SELECT role, content FROM conversations
         WHERE agent_id = $1 AND session_id = $2
         ORDER BY created_at DESC LIMIT $3`,
        [agentId, sessionId, limit]
      )
    : await getPool().query<{ role: string; content: string }>(
        `SELECT role, content FROM conversations
         WHERE agent_id = $1
         ORDER BY created_at DESC LIMIT $2`,
        [agentId, limit]
      )
  return result.rows.reverse()
}

export async function saveReport(
  agentId: string,
  reportType: string,
  content: string
): Promise<void> {
  await getPool().query(
    "INSERT INTO reports (agent_id, report_type, content) VALUES ($1, $2, $3)",
    [agentId, reportType, content]
  )
}

export async function getReports(
  agentId?: string,
  limit = 20
): Promise<Array<{ id: number; agent_id: string; report_type: string; content: string; created_at: string }>> {
  const result = agentId
    ? await getPool().query(
        "SELECT id, agent_id, report_type, content, created_at FROM reports WHERE agent_id = $1 ORDER BY created_at DESC LIMIT $2",
        [agentId, limit]
      )
    : await getPool().query(
        "SELECT id, agent_id, report_type, content, created_at FROM reports ORDER BY created_at DESC LIMIT $1",
        [limit]
      )
  return result.rows as Array<{ id: number; agent_id: string; report_type: string; content: string; created_at: string }>
}

export async function saveDailyReport(
  agentId: string,
  content: string,
  date?: string
): Promise<void> {
  await getPool().query(
    "INSERT INTO daily_reports (agent_id, content, date) VALUES ($1, $2, $3)",
    [agentId, content, date ?? new Date().toISOString().slice(0, 10)]
  )
}

export async function getDailyReports(
  date?: string,
  agentId?: string
): Promise<Array<{ id: number; date: string; agent_id: string; content: string; created_at: string }>> {
  const targetDate = date ?? new Date().toISOString().slice(0, 10)
  const result = agentId
    ? await getPool().query(
        "SELECT id, date, agent_id, content, created_at FROM daily_reports WHERE date = $1 AND agent_id = $2 ORDER BY created_at DESC",
        [targetDate, agentId]
      )
    : await getPool().query(
        "SELECT id, date, agent_id, content, created_at FROM daily_reports WHERE date = $1 ORDER BY created_at DESC",
        [targetDate]
      )
  return result.rows as Array<{ id: number; date: string; agent_id: string; content: string; created_at: string }>
}
