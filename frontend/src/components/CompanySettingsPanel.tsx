import { useEffect, useState, type ReactNode } from "react"
import { Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  type CompanySettings,
  defaultCompanySettings,
  loadCompanySettings,
  saveCompanySettings,
} from "@/lib/companySettings"

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-[11px] font-semibold text-white/55">{children}</label>
}

const inputClass =
  "border-white/10 bg-white/[0.06] text-white placeholder:text-white/30 focus-visible:ring-amber-400/40"

const textareaClass = `min-h-[88px] w-full resize-y rounded-xl border px-3 py-2 text-sm ${inputClass} focus-visible:outline-none focus-visible:ring-2`

/** 상단 탭「회사 설정」전용 전체 화면 */
export function CompanySettingsScreen() {
  const [draft, setDraft] = useState<CompanySettings>(defaultCompanySettings)
  const [savedPulse, setSavedPulse] = useState(false)

  useEffect(() => {
    setDraft(loadCompanySettings())
  }, [])

  const save = () => {
    saveCompanySettings(draft)
    setSavedPulse(true)
    window.setTimeout(() => setSavedPulse(false), 1200)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-[#07080d] text-white">
      <div className="mx-auto w-full max-w-2xl space-y-5 px-4 py-6 pb-24">
        <header className="flex items-start gap-3 border-b border-white/10 pb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
            <Settings2 size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">회사 설정</h1>
            <p className="mt-1 text-xs text-white/45">
              GitHub · 문서 · 에이전트 맥락 — 저장은 이 브라우저에만 됩니다. 비밀키는 .env 등으로 관리하세요.
            </p>
          </div>
        </header>

        <div className="space-y-4">
          <div>
            <FieldLabel>회사·제품명</FieldLabel>
            <Input
              value={draft.companyName}
              onChange={e => setDraft(d => ({ ...d, companyName: e.target.value }))}
              placeholder="예: Connect AI"
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel>산업·도메인</FieldLabel>
            <Input
              value={draft.industry}
              onChange={e => setDraft(d => ({ ...d, industry: e.target.value }))}
              placeholder="예: B2B SaaS, AI 오피스"
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel>한 줄 소개</FieldLabel>
            <Input
              value={draft.tagline}
              onChange={e => setDraft(d => ({ ...d, tagline: e.target.value }))}
              placeholder="예: 10명의 AI 직원이 일하는 가상 회사"
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel>개발자용 GitHub 주소 (한 줄에 하나)</FieldLabel>
            <textarea
              value={draft.developerGithubUrls}
              onChange={e => setDraft(d => ({ ...d, developerGithubUrls: e.target.value }))}
              placeholder={
                "https://github.com/org/repo\nhttps://github.com/org/repo/wiki/…\n(PAT·시크릿은 저장하지 마세요)"
              }
              className={`${textareaClass} min-h-[100px] font-mono text-[11px]`}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>기본 Git 브랜치</FieldLabel>
              <Input
                value={draft.defaultGitBranch}
                onChange={e => setDraft(d => ({ ...d, defaultGitBranch: e.target.value }))}
                placeholder="main"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel>문서·위키 URL</FieldLabel>
              <Input
                value={draft.docsUrl}
                onChange={e => setDraft(d => ({ ...d, docsUrl: e.target.value }))}
                placeholder="https://… (내부 링크는 팀 규칙에 맞게)"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <FieldLabel>기술 오너·연락 메모</FieldLabel>
            <textarea
              value={draft.engineeringContactNote}
              onChange={e => setDraft(d => ({ ...d, engineeringContactNote: e.target.value }))}
              placeholder={
                "예: 백엔드 담당 @이름, 온콜 슬랙 #dev-incident (개인 전화·토큰은 적지 않기)"
              }
              className={`${textareaClass} min-h-[72px]`}
            />
          </div>
          <div>
            <FieldLabel>에이전트용 업무 맥락</FieldLabel>
            <textarea
              value={draft.agentContext}
              onChange={e => setDraft(d => ({ ...d, agentContext: e.target.value }))}
              placeholder={
                "서비스 범위, 주요 사용자, 말투·톤, 절대 하지 말 것(법/보안), 우선순위 가치 등"
              }
              className={textareaClass}
            />
          </div>
          <div>
            <FieldLabel>API 연동 메모 (비밀값 금지)</FieldLabel>
            <textarea
              value={draft.apiIntegrationNotes}
              onChange={e => setDraft(d => ({ ...d, apiIntegrationNotes: e.target.value }))}
              placeholder={
                "예: GitHub API만 사용, 베이스 URL은 개발 서버, OAuth는 아직 없음 …"
              }
              className={textareaClass}
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Button
            type="button"
            onClick={save}
            className="w-full rounded-xl bg-amber-500 font-semibold text-black hover:bg-amber-400 sm:w-auto sm:min-w-[140px]"
          >
            저장
          </Button>
          {savedPulse && (
            <p className="text-[11px] font-medium text-emerald-400/90">저장되었습니다.</p>
          )}
        </div>
      </div>
    </div>
  )
}
