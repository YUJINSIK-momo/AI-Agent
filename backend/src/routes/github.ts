import { Router } from "express"
import type { Request, Response } from "express"

const router = Router()

const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? ""
const REPO_OWNER = "YUJINSIK-momo"
const REPO_NAME = "AI-Agent"

async function githubFetch(path: string, emptyOnConflict = false) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  }
  if (GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`
  }
  const res = await fetch(`https://api.github.com${path}`, { headers })
  if (res.status === 409 && emptyOnConflict) return []
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  return res.json()
}

// Repository 구조 조회
router.get("/repo", async (_req: Request, res: Response) => {
  try {
    const data = await githubFetch(`/repos/${REPO_OWNER}/${REPO_NAME}`)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// 최근 Commit 목록
router.get("/commits", async (_req: Request, res: Response) => {
  try {
    const data = await githubFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=10`, true)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// 파일 구조 (루트)
router.get("/tree", async (_req: Request, res: Response) => {
  try {
    const repo = await githubFetch(`/repos/${REPO_OWNER}/${REPO_NAME}`) as { default_branch: string }
    const branch = repo.default_branch
    const data = await githubFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${branch}?recursive=1`, true)
    res.json(Array.isArray(data) ? { tree: [] } : data)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// Pull Request 목록
router.get("/pulls", async (_req: Request, res: Response) => {
  try {
    const data = await githubFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/pulls?state=all&per_page=10`)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// Issue 목록
router.get("/issues", async (_req: Request, res: Response) => {
  try {
    const data = await githubFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=open&per_page=10`)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

export default router
