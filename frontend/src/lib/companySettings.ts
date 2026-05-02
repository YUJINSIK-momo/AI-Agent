/** localStorage에 두는 회사·제품 맥락 — 향후 API/에이전트 프롬프트에 주입 */

export const COMPANY_SETTINGS_KEY = "connect-ai-company-settings-v1"

export interface CompanySettings {
  /** 회사 또는 제품명 */
  companyName: string
  /** 산업·도메인 (예: B2B SaaS, 게임) */
  industry: string
  /** 한 줄 소개 */
  tagline: string
  /**
   * 개발자가 참고하는 GitHub URL 목록 (저장소, 이슈, 위키 등)
   * 한 줄에 하나씩. 토큰·비밀 경로는 적지 말 것.
   */
  developerGithubUrls: string
  /** 기본 브랜치 (CTO/분석 기본 가정) */
  defaultGitBranch: string
  /** 사내 문서·위키·Notion 등 (공개 가능한 URL만) */
  docsUrl: string
  /** 기술 오너, 온콜, 슬랙 채널명 등 (비밀 연락처 금지) */
  engineeringContactNote: string
  /**
   * 에이전트가 판단할 때 참고할 배경
   * (서비스 범위, 사용자, 톤, 금지 사항 등)
   */
  agentContext: string
  /**
   * API 연동 메모 (베이스 URL, 인증 방식, 레이트리밋 등)
   * 실제 비밀키는 저장하지 말 것 — 개발 환경 변수 사용 권장
   */
  apiIntegrationNotes: string
}

export const defaultCompanySettings: CompanySettings = {
  companyName: "",
  industry: "",
  tagline: "",
  developerGithubUrls: "",
  defaultGitBranch: "main",
  docsUrl: "",
  engineeringContactNote: "",
  agentContext: "",
  apiIntegrationNotes: "",
}

export function loadCompanySettings(): CompanySettings {
  try {
    const raw = localStorage.getItem(COMPANY_SETTINGS_KEY)
    if (!raw) return { ...defaultCompanySettings }
    const p = JSON.parse(raw) as Partial<CompanySettings>
    return { ...defaultCompanySettings, ...p }
  } catch {
    return { ...defaultCompanySettings }
  }
}

export function saveCompanySettings(s: CompanySettings): void {
  localStorage.setItem(COMPANY_SETTINGS_KEY, JSON.stringify(s))
}

/** CTO/PM 등에 넘길 때 한 블록 텍스트로 합침 (비어 있으면 빈 문자열) */
export function formatCompanyContextForAgents(s: CompanySettings): string {
  const lines: string[] = []
  if (s.companyName.trim()) lines.push(`회사·제품: ${s.companyName.trim()}`)
  if (s.industry.trim()) lines.push(`산업·도메인: ${s.industry.trim()}`)
  if (s.tagline.trim()) lines.push(`소개: ${s.tagline.trim()}`)
  if (s.developerGithubUrls.trim()) {
    lines.push(`\n[GitHub 참고 URL]\n${s.developerGithubUrls.trim()}`)
  }
  if (s.defaultGitBranch.trim()) lines.push(`기본 브랜치: ${s.defaultGitBranch.trim()}`)
  if (s.docsUrl.trim()) lines.push(`문서·위키: ${s.docsUrl.trim()}`)
  if (s.engineeringContactNote.trim()) {
    lines.push(`\n[기술·연락 메모]\n${s.engineeringContactNote.trim()}`)
  }
  if (s.agentContext.trim()) lines.push(`\n[업무 맥락]\n${s.agentContext.trim()}`)
  if (s.apiIntegrationNotes.trim()) lines.push(`\n[연동 참고]\n${s.apiIntegrationNotes.trim()}`)
  return lines.join("\n").trim()
}
