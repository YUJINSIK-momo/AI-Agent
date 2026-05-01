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

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`/api/github${path}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    const detail = body.error ?? `HTTP ${res.status}`
    throw new Error(detail)
  }
  return res.json() as Promise<T>
}

export const githubApi = {
  repo: () => get<RepoInfo>("/repo"),
  commits: () => get<Commit[]>("/commits"),
  tree: () => get<TreeResponse>("/tree"),
  pulls: () => get<unknown[]>("/pulls"),
  issues: () => get<unknown[]>("/issues"),
}

export function formatCtoReport(
  repo: RepoInfo,
  commits: Commit[],
  tree: TreeResponse,
): string {
  const fileCount = tree.tree.filter((f) => f.type === "blob").length
  const dirCount = tree.tree.filter((f) => f.type === "tree").length
  const lastUpdated = new Date(repo.updated_at).toLocaleDateString("ko-KR")

  const commitSection =
    commits.length === 0
      ? "• 아직 커밋이 없습니다."
      : commits
          .slice(0, 5)
          .map((c) => {
            const date = new Date(c.commit.author.date).toLocaleDateString("ko-KR")
            const msg = c.commit.message.split("\n")[0].slice(0, 50)
            return `• [${date}] ${msg}`
          })
          .join("\n")

  const fileSection =
    fileCount === 0
      ? "• 아직 파일이 없습니다."
      : tree.tree
          .filter((f) => f.type === "blob")
          .slice(0, 8)
          .map((f) => `• ${f.path}`)
          .join("\n")

  return `## CTO 분석 보고서

**Repository:** ${repo.full_name}
**브랜치:** ${repo.default_branch} | **파일:** ${fileCount}개 | **폴더:** ${dirCount}개
**Star:** ${repo.stargazers_count} | **Fork:** ${repo.forks_count} | **Issue:** ${repo.open_issues_count}
**최종 업데이트:** ${lastUpdated}

**최근 커밋 (${commits.length}건):**
${commitSection}

**주요 파일:**
${fileSection}

분석 완료. Repository에 코드를 푸시하면 파일 구조와 커밋 내역을 바로 분석할 수 있습니다.`
}
