export interface RepoInfo {
  name: string
  full_name: string
  description: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  default_branch: string
  updated_at: string
}

export interface Commit {
  sha: string
  commit: {
    message: string
    author: { name: string; date: string }
  }
}

export interface TreeFile {
  path: string
  type: "blob" | "tree"
}

export interface TreeResponse {
  tree: TreeFile[]
}

const REPO_OWNER = "YUJINSIK-momo"
const REPO_NAME = "AI-Agent"

// 로컬: 백엔드 프록시 / 프로덕션(GitHub Pages): GitHub API 직접 호출
async function get<T>(path: string): Promise<T> {
  if (import.meta.env.PROD) {
    return githubDirect<T>(path)
  }
  const res = await fetch(`/api/github${path}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

async function githubDirect<T>(path: string): Promise<T> {
  const token = import.meta.env.VITE_GITHUB_TOKEN as string | undefined
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const pathMap: Record<string, string> = {
    "/repo":    `/repos/${REPO_OWNER}/${REPO_NAME}`,
    "/commits": `/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=10`,
    "/pulls":   `/repos/${REPO_OWNER}/${REPO_NAME}/pulls?state=all&per_page=10`,
    "/issues":  `/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=open&per_page=10`,
  }

  if (path === "/tree") {
    const repoRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`, { headers })
    if (!repoRes.ok) throw new Error(`GitHub API error: ${repoRes.status}`)
    const repo = await repoRes.json() as { default_branch: string }
    const treeRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${repo.default_branch}?recursive=1`,
      { headers }
    )
    if (treeRes.status === 409) return { tree: [] } as T
    if (!treeRes.ok) throw new Error(`GitHub API error: ${treeRes.status}`)
    return treeRes.json() as Promise<T>
  }

  const url = pathMap[path]
  if (!url) throw new Error(`Unknown path: ${path}`)
  const res = await fetch(`https://api.github.com${url}`, { headers })
  if (res.status === 409) return [] as T
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  return res.json() as Promise<T>
}

export const githubApi = {
  repo:    () => get<RepoInfo>("/repo"),
  commits: () => get<Commit[]>("/commits"),
  tree:    () => get<TreeResponse>("/tree"),
  pulls:   () => get<unknown[]>("/pulls"),
  issues:  () => get<unknown[]>("/issues"),
}

export function formatCtoReport(
  repo: RepoInfo,
  commits: Commit[],
  tree: TreeResponse,
): string {
  const fileCount = tree.tree.filter((f) => f.type === "blob").length
  const dirCount  = tree.tree.filter((f) => f.type === "tree").length
  const lastUpdated = new Date(repo.updated_at).toLocaleDateString("ko-KR")

  const commitSection =
    commits.length === 0
      ? "• 아직 커밋이 없습니다."
      : commits.slice(0, 5).map((c) => {
          const date = new Date(c.commit.author.date).toLocaleDateString("ko-KR")
          const msg  = c.commit.message.split("\n")[0].slice(0, 50)
          return `• [${date}] ${msg}`
        }).join("\n")

  const fileSection =
    fileCount === 0
      ? "• 아직 파일이 없습니다."
      : tree.tree.filter((f) => f.type === "blob").slice(0, 8)
          .map((f) => `• ${f.path}`).join("\n")

  return `## CTO 분석 보고서

**Repository:** ${repo.full_name}
**브랜치:** ${repo.default_branch} | **파일:** ${fileCount}개 | **폴더:** ${dirCount}개
**Star:** ${repo.stargazers_count} | **Fork:** ${repo.forks_count} | **Issue:** ${repo.open_issues_count}
**최종 업데이트:** ${lastUpdated}

**최근 커밋 (${commits.length}건):**
${commitSection}

**주요 파일:**
${fileSection}

분석 완료. 코드 품질 점검이나 특정 파일 리뷰가 필요하면 말씀해주세요.`
}
