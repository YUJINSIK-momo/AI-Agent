import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  Search, Send, Sparkles, GitBranch, Zap, Users, Code2, Bug,
  BarChart3, Megaphone, Headphones, Settings2, Crown, Boxes, Clock3, Loader2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { githubApi, formatCtoReport } from "@/lib/github"

const agents = [
  { id: "ceo",       name: "CEO",       kr: "대표",       icon: Crown,      desc: "최종 의사결정 / 승인",        active: true },
  { id: "cpo",       name: "CPO",       kr: "제품 총괄",  icon: Boxes,      desc: "제품 방향 / 우선순위",        active: true },
  { id: "cto",       name: "CTO",       kr: "기술 총괄",  icon: GitBranch,  desc: "GitHub 코드 분석 / 리뷰",     active: true },
  { id: "pm",        name: "PM",        kr: "기획",       icon: Users,      desc: "기획서 / MVP / 요구사항",     active: true },
  { id: "dev",       name: "Developer", kr: "개발자",     icon: Code2,      desc: "구현 / 코드 작성",            active: true },
  { id: "qa",        name: "QA",        kr: "테스트",     icon: Bug,        desc: "버그 / 테스트 케이스",        active: false },
  { id: "data",      name: "Data",      kr: "데이터 분석", icon: BarChart3, desc: "지표 / 전환율 / 리포트",      active: false },
  { id: "marketing", name: "Marketing", kr: "마케팅",     icon: Megaphone,  desc: "콘텐츠 / 브랜딩",            active: false },
  { id: "cs",        name: "CS",        kr: "고객 대응",  icon: Headphones, desc: "FAQ / 일본어 응대",           active: false },
  { id: "ops",       name: "Ops",       kr: "자동화",     icon: Settings2,  desc: "운영 플로우 / 자동화",        active: false },
] as const

type AgentId = typeof agents[number]["id"]

const sampleReplies: Record<AgentId, string> = {
  ceo:       "대표 권한으로 전체 Agent 보고를 취합합니다. 최종 승인 또는 보류 결정을 내려주세요.",
  cpo:       "현재 우선순위는 1) CTO GitHub 분석, 2) QA 테스트 케이스 작성, 3) Agent UI MVP 완성입니다.",
  cto:       "GitHub 분석을 시작하려면 우측 상단 [실행] 버튼을 눌러주세요.",
  pm:        "MVP 범위는 Agent 카드, 채팅창, CTO GitHub 분석 버튼, 보고서 출력 영역까지로 추천합니다.",
  dev:       "프론트는 React + shadcn/ui, 백엔드는 Node.js + Express 구조로 설계하는 것이 좋습니다.",
  qa:        "테스트 항목: Agent 선택, 메시지 전송, CTO 실행, 응답 출력, 모바일 UI 깨짐 여부입니다.",
  data:      "초기 지표는 Agent 실행 횟수, 성공률, 응답 시간, 사용자 승인율로 잡으면 됩니다.",
  marketing: "콘텐츠 방향은 '혼자 운영하는 AI 회사', '10명의 AI 직원', 'GitHub 자동 코드 리뷰'가 좋습니다.",
  cs:        "고객 대응 Agent는 일본어 LINE 문구, FAQ 정리, 클레임 답변 초안을 담당합니다.",
  ops:       "자동화는 매일 아침 GitHub 변경사항 분석 → CTO 보고서 → QA 체크리스트 생성 흐름이 좋습니다.",
}

interface Message {
  role: "user" | "agent"
  agent: AgentId
  text: string
}

interface SidebarStatus {
  status: string
  repoName: string
  outputCount: number
}

export default function AIAgentDashboard() {
  const [selected, setSelected] = useState<AgentId>("cto")
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    { role: "agent", agent: "cto", text: "안녕하세요. [실행] 버튼을 눌러 GitHub Repository를 분석합니다." },
  ])
  const [loading, setLoading] = useState(false)
  const [sidebar, setSidebar] = useState<SidebarStatus>({
    status: "대기 중",
    repoName: "-",
    outputCount: 0,
  })

  const currentAgent = useMemo(() => agents.find((a) => a.id === selected), [selected])

  const addAgentMessage = (text: string) => {
    setMessages((prev) => [...prev, { role: "agent", agent: selected, text }])
    setSidebar((prev) => ({ ...prev, outputCount: prev.outputCount + 1 }))
  }

  const runCtoAnalysis = async () => {
    setLoading(true)
    setSidebar((prev) => ({ ...prev, status: "분석 중..." }))
    addAgentMessage("GitHub Repository 분석을 시작합니다...")

    try {
      const [repo, commits, tree] = await Promise.all([
        githubApi.repo(),
        githubApi.commits(),
        githubApi.tree(),
      ])
      const report = formatCtoReport(repo, commits, tree)
      addAgentMessage(report)
      setSidebar({ status: "분석 완료", repoName: repo.full_name, outputCount: sidebar.outputCount + 2 })
    } catch (err) {
      addAgentMessage(`분석 실패: ${err instanceof Error ? err.message : "백엔드 서버를 확인해주세요."}`)
      setSidebar((prev) => ({ ...prev, status: "오류 발생" }))
    } finally {
      setLoading(false)
    }
  }

  const handleRun = () => {
    if (selected === "cto") {
      void runCtoAnalysis()
    } else {
      addAgentMessage(sampleReplies[selected])
    }
  }

  const sendMessage = () => {
    if (!input.trim()) return
    const text = input.trim()
    setMessages((prev) => [...prev, { role: "user", agent: selected, text }])
    setInput("")
    setTimeout(() => {
      addAgentMessage(sampleReplies[selected])
    }, 300)
  }

  return (
    <div className="min-h-screen bg-[#07080d] text-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[390px_1fr_360px]">

        {/* Left Sidebar */}
        <aside className="border-r border-white/10 bg-[#0c0d14] p-5">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 shadow-lg shadow-amber-500/10">
                <Sparkles size={22} />
              </div>
              <div>
                <h1 className="text-lg font-bold">Connect AI</h1>
                <p className="text-xs text-white/45">Virtual AI Office</p>
              </div>
            </div>
            <Button size="icon" variant="ghost" className="rounded-xl text-white/60 hover:text-white">
              <Settings2 size={18} />
            </Button>
          </div>

          <div className="mb-5 grid grid-cols-3 gap-3">
            <StatusBox label="DAY" value="1" />
            <StatusBox label="TIME" value={new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} />
            <StatusBox label="OUTPUT" value={String(sidebar.outputCount)} />
          </div>

          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={17} />
            <Input
              placeholder="Agent 검색"
              className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {agents.map((agent, i) => {
              const Icon = agent.icon
              const isSelected = selected === agent.id
              return (
                <motion.button
                  key={agent.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelected(agent.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? "border-amber-400/60 bg-amber-400/10 shadow-lg shadow-amber-500/10"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <Icon size={20} className={isSelected ? "text-amber-300" : "text-white/55"} />
                    <span className={`h-2 w-2 rounded-full ${agent.active ? "bg-emerald-400" : "bg-white/20"}`} />
                  </div>
                  <div className="text-sm font-bold">{agent.name}</div>
                  <div className="mt-1 text-xs text-white/45">{agent.kr}</div>
                </motion.button>
              )
            })}
          </div>
        </aside>

        {/* Main Chat */}
        <main className="relative flex min-h-screen flex-col bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08),transparent_35%),#080910]">
          <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div>
              <p className="text-xs text-white/40">Agent Workspace</p>
              <h2 className="text-xl font-bold">{currentAgent?.kr} 사무실</h2>
            </div>
            <Button
              onClick={handleRun}
              disabled={loading}
              className="rounded-xl bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 size={16} className="mr-2 animate-spin" /> 분석 중</>
              ) : (
                <><Zap size={16} className="mr-2" /> 실행</>
              )}
            </Button>
          </header>

          <section className="flex-1 overflow-y-auto p-6">
            <Card className="mx-auto max-w-3xl border-white/10 bg-white/[0.04] text-white shadow-2xl">
              <CardContent className="p-6">
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300">
                    {currentAgent && <currentAgent.icon size={26} />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{currentAgent?.name}</h3>
                    <p className="mt-1 text-white/55">{currentAgent?.desc}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {messages.slice(-20).map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                          msg.role === "user"
                            ? "bg-amber-500 text-black"
                            : "bg-white/8 text-white/80"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-2xl bg-white/8 px-4 py-3 text-sm text-white/50">
                        <Loader2 size={14} className="animate-spin" /> GitHub 데이터 불러오는 중...
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          <footer className="border-t border-white/10 p-5">
            <div className="mx-auto flex max-w-3xl gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="한 줄 명령을 내려주세요. 팀이 알아서 일합니다."
                className="border-0 bg-transparent text-white placeholder:text-white/35 focus-visible:ring-0"
              />
              <Button
                onClick={sendMessage}
                disabled={loading}
                className="rounded-xl bg-amber-500 text-black hover:bg-amber-400"
              >
                <Send size={17} />
              </Button>
            </div>
          </footer>
        </main>

        {/* Right Sidebar */}
        <aside className="hidden border-l border-white/10 bg-[#101116] p-5 lg:block">
          <h3 className="mb-4 text-sm font-bold text-white/70">Agent Report</h3>
          <div className="space-y-3">
            <ReportItem title="현재 선택 Agent" value={currentAgent?.name ?? "-"} />
            <ReportItem
              title="상태"
              value={sidebar.status}
              highlight={sidebar.status === "분석 완료"}
            />
            <ReportItem
              title="연동"
              value={selected === "cto" ? "GitHub API 연결됨" : "내부 Agent"}
            />
            <ReportItem
              title="Repository"
              value={sidebar.repoName}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-300">
              <Clock3 size={16} /> Daily Workflow
            </div>
            <ol className="space-y-2 text-sm text-white/55">
              <li>1. CTO GitHub 변경사항 분석</li>
              <li>2. PM 기능 아이디어 정리</li>
              <li>3. QA 테스트 포인트 작성</li>
              <li>4. CPO 전체 보고서 생성</li>
            </ol>
          </div>
        </aside>

      </div>
    </div>
  )
}

function StatusBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
      <div className="text-[10px] text-white/35">{label}</div>
      <div className="mt-1 font-mono text-sm font-bold text-amber-300">{value}</div>
    </div>
  )
}

function ReportItem({ title, value, highlight = false }: { title: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-xs text-white/35">{title}</div>
      <div className={`mt-1 text-sm font-semibold ${highlight ? "text-emerald-400" : "text-white/80"}`}>
        {value}
      </div>
    </div>
  )
}
