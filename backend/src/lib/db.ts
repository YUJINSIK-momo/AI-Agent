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

/** SELECT 1로 연결·응답 시간 확인 (풀 없으면 생성) */
export async function checkDatabase(): Promise<DatabaseHealth> {
  const connectionString = getConnectionString()
  if (!connectionString) {
    return { configured: false, connected: false }
  }
  const started = Date.now()
  try {
    await getPool().query("SELECT 1 AS ok")
    return {
      configured: true,
      connected: true,
      latencyMs: Date.now() - started,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { configured: true, connected: false, error: message }
  }
}

function getPool(): Pool {
  const connectionString = getConnectionString()
  if (!connectionString) {
    throw new Error("SUPABASE_URL 또는 DATABASE_URL이 설정되어 있지 않습니다.")
  }
  if (!_pool) {
    _pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    })
  }
  return _pool
}

export async function initDB(): Promise<void> {
  if (!getConnectionString()) {
    console.warn("[DB] SUPABASE_URL/DATABASE_URL 없음 — 테이블 초기화 생략")
    return
  }
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id        SERIAL PRIMARY KEY,
      agent_id  VARCHAR(20)  NOT NULL,
      role      VARCHAR(10)  NOT NULL,
      content   TEXT         NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reports (
      id          SERIAL PRIMARY KEY,
      agent_id    VARCHAR(20)  NOT NULL,
      report_type VARCHAR(50)  NOT NULL,
      content     TEXT         NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  console.log("[DB] Tables ready")
}

export async function saveMessage(
  agentId: string,
  role: "user" | "agent",
  content: string
): Promise<void> {
  await getPool().query(
    "INSERT INTO conversations (agent_id, role, content) VALUES ($1, $2, $3)",
    [agentId, role, content]
  )
}

export async function getHistory(
  agentId: string,
  limit = 10
): Promise<Array<{ role: string; content: string }>> {
  const result = await getPool().query<{ role: string; content: string }>(
    `SELECT role, content
     FROM conversations
     WHERE agent_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
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
