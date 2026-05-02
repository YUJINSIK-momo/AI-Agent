import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, Send, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { githubApi, formatCtoReport } from "@/lib/github"
import {
  type AgentId,
  type AgentDef,
  AGENTS,
  WALK_BOUNDS,
  clampInto,
} from "@/lib/officeLayout"
import { OfficeFloor } from "@/components/OfficeFloor"

type AgentStatus = "idle" | "working"

const DAILY_SEQUENCE: { id: AgentId; report: string; delay: number }[] = [
  { id: "cto",       delay: 0,     report: "GitHub 변경사항 분석 완료. 위험 코드 0건, 개선 포인트 2건." },
  { id: "pm",        delay: 2500,  report: "오늘의 AI 트렌드 정리. MCP 프로토콜 주목 요망." },
  { id: "qa",        delay: 5000,  report: "테스트 포인트 3개 작성 완료. 예외 케이스 2건 발견." },
  { id: "marketing", delay: 7500,  report: "오늘 콘텐츠 제안: 'AI 직원이 일하는 오피스'." },
  { id: "cpo",       delay: 10000, report: "일일 보고 취합 완료. 오늘 우선순위: Dev → QA 검증." },
]

const SAMPLE_REPLIES: Record<AgentId, string> = {
  ceo:       "전체 Agent 보고를 취합합니다. 최종 승인 또는 보류를 결정해주세요.",
  cpo:       "우선순위: 1) CTO 분석, 2) QA 케이스, 3) Agent UI MVP 완성.",
  cto:       "[실행] 버튼으로 GitHub Repository를 분석할 수 있습니다.",
  pm:        "MVP 범위: Agent 카드, 채팅창, CTO GitHub 버튼, 보고서 출력.",
  dev:       "React + shadcn/ui, Node.js + Express 구조 설계 완료.",
  qa:        "Agent 선택, 메시지 전송, CTO 실행, 응답 출력, 모바일 UI 확인.",
  data:      "초기 지표: 실행 횟수, 성공률, 응답 시간, 사용자 승인율.",
  marketing: "'혼자 운영하는 AI 회사', '10명의 AI 직원' 콘텐츠 방향 제안.",
  cs:        "일본어 LINE 문구, FAQ 정리, 클레임 답변 초안 담당.",
  ops:       "GitHub 분석 → CTO 보고서 → QA 체크리스트 자동화 흐름 설계.",
}

interface AgentState {
  status: AgentStatus
  bubble: string | null
}

interface ChatMsg { role: "user" | "agent"; text: string }
type Positions = Record<AgentId, { x: number; y: number }>

// ──────────────────────────────────────────
// Agent sprite
// ──────────────────────────────────────────

function AgentSprite({
  agent, state, position, isSelected, onClick,
}: {
  agent: AgentDef
  state: AgentState
  position: { x: number; y: number }
  isSelected: boolean
  onClick: () => void
}) {
  const working = state.status === "working"
  const HALF = 24 // half of 48px sprite
  const prevPos = useRef(position)
  const [walking, setWalking] = useState(false)
  const [facingLeft, setFacingLeft] = useState(false)

  useEffect(() => {
    const dx = position.x - prevPos.current.x
    const dy = position.y - prevPos.current.y
    const dist = Math.hypot(dx, dy)
    if (dist <= 0.12) return
    if (Math.abs(dx) > 0.04) setFacingLeft(dx < 0)
    setWalking(true)
    const t = window.setTimeout(() => setWalking(false), 900)
    prevPos.current = position
    return () => clearTimeout(t)
  }, [position.x, position.y])

  return (
    <motion.div
      className="absolute cursor-pointer select-none"
      animate={{ left: `${position.x}%`, top: `${position.y}%` }}
      transition={{
        type: "tween",
        duration: 0.9,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      style={{
        marginLeft: -HALF,
        marginTop: -HALF,
        zIndex: isSelected ? 26 : state.bubble ? 22 : 10,
      }}
      onClick={onClick}
    >
      {/* Speech bubble — 배경 위에서도 읽히도록 고대비 패널 */}
      <AnimatePresence>
        {state.bubble && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.94 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className="absolute bottom-full mb-2 left-1/2 pointer-events-none w-max max-w-[min(220px,calc(100vw-2rem))]"
            style={{ transform: "translateX(-50%)", zIndex: 40 }}
          >
            <div
              className="relative rounded-xl px-3 py-2 text-left text-[11px] font-semibold leading-snug text-zinc-100"
              style={{
                background: "rgba(14,16,28,0.97)",
                border: `2px solid ${agent.color}`,
                boxShadow: `
                  0 0 0 1px rgba(0,0,0,0.55),
                  0 6px 14px rgba(0,0,0,0.45),
                  0 16px 40px rgba(0,0,0,0.5),
                  0 0 28px ${agent.color}45
                `,
                textShadow: "0 1px 3px rgba(0,0,0,0.9)",
              }}
            >
              <span
                className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider opacity-90"
                style={{ color: agent.color }}
              >
                {agent.kr}
              </span>
              {state.bubble}
            </div>
            <div className="relative flex justify-center" style={{ height: 0 }}>
              <div
                className="absolute top-0 h-2.5 w-2.5 -translate-y-1/2 rotate-45 border-r-2 border-b-2"
                style={{
                  background: "rgba(14,16,28,0.97)",
                  borderColor: agent.color,
                  boxShadow: "2px 2px 6px rgba(0,0,0,0.35)",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Body — 작업 중: 활발한 바운스 / 이동 중: 걸음 리듬 / 대기: 잔잔한 호흡 */}
      <motion.div
        animate={
          working
            ? { y: [0, -5, 0], rotate: [0, -1.2, 0, 1.2, 0] }
            : walking
              ? { y: [0, -2.2, 0, -2.8, 0], x: [0, 0.8, 0, -0.8, 0] }
              : { y: [0, -1.6, 0], x: 0 }
        }
        transition={
          working
            ? { repeat: Infinity, duration: 0.58, ease: "easeInOut" }
            : walking
              ? { repeat: Infinity, duration: 0.44, ease: "linear" }
              : { repeat: Infinity, duration: 2.75, ease: "easeInOut" }
        }
      >
        {/* Selection ring */}
        {isSelected && (
          <motion.div
            className="absolute -inset-2 rounded-full"
            style={{ boxShadow: `0 0 0 2px ${agent.color}` }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1.3 }}
          />
        )}
        {/* Glow when working */}
        {working && (
          <motion.div
            className="absolute -inset-4 rounded-full blur-xl pointer-events-none"
            style={{ background: `${agent.color}25` }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 0.85 }}
          />
        )}

        {/* Avatar */}
        <div
          className="relative flex h-12 w-12 items-center justify-center rounded-2xl overflow-hidden"
          style={{
            background: `${agent.color}1e`,
            border: `2px solid ${isSelected || working ? agent.color : `${agent.color}50`}`,
            boxShadow: working ? `0 0 16px ${agent.color}70` : isSelected ? `0 0 8px ${agent.color}55` : undefined,
          }}
        >
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{ scaleX: facingLeft ? -1 : 1 }}
            transition={{ type: "tween", duration: 0.18, ease: "easeOut" }}
            style={{ transformOrigin: "50% 50%" }}
          >
            <img
              src={`/img/agents/${agent.id}.png`}
              alt={agent.name}
              className="absolute inset-0 h-full w-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
            />
          </motion.div>
          <agent.icon size={22} style={{ color: agent.color }} className="relative z-[1] drop-shadow-sm" />
        </div>

        {/* Name — 스프라이트 하단 라벨 */}
        <div
          className="mt-1.5 mx-auto w-fit max-w-[76px] truncate rounded-md px-1.5 py-0.5 text-center text-[9px] font-bold tracking-tight text-zinc-100"
          style={{
            background: "rgba(10,12,20,0.94)",
            border: `1px solid ${agent.color}`,
            boxShadow: "0 2px 10px rgba(0,0,0,0.55)",
            textShadow: "0 1px 2px #000",
          }}
        >
          {agent.kr}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ──────────────────────────────────────────
// Main component
// ──────────────────────────────────────────

export default function OfficeScene() {
  const [agentStates, setAgentStates] = useState<Record<AgentId, AgentState>>(
    () => Object.fromEntries(AGENTS.map(a => [a.id, { status: "idle" as AgentStatus, bubble: null }])) as Record<AgentId, AgentState>
  )
  const [positions, setPositions] = useState<Positions>(
    () => Object.fromEntries(AGENTS.map(a => [a.id, { ...a.zone }])) as Positions
  )
  const [selected, setSelected] = useState<AgentId | null>(null)
  const [chats, setChats] = useState<Record<AgentId, ChatMsg[]>>(
    () => Object.fromEntries(AGENTS.map(a => [a.id, [{ role: "agent" as const, text: a.idleMsg }]])) as Record<AgentId, ChatMsg[]>
  )
  const [input, setInput] = useState("")
  const [dailyRunning, setDailyRunning] = useState(false)
  const [ctoLoading, setCtoLoading] = useState(false)

  // ref so interval can read latest status without stale closure
  const statesRef = useRef(agentStates)
  useEffect(() => { statesRef.current = agentStates }, [agentStates])

  // ── Random wandering (자기 구역 WALK_BOUNDS 안에서만 작은 스텝으로 이동) ──
  useEffect(() => {
    const MAX_STEP = 2.4
    const timer = setInterval(() => {
      setPositions(prev => {
        const next = { ...prev }
        for (const agent of AGENTS) {
          const status = statesRef.current[agent.id].status
          if (status === "working") {
            next[agent.id] = { ...agent.zone }
            continue
          }
          if (Math.random() > 0.42) continue
          const b = WALK_BOUNDS[agent.id]
          const cur = prev[agent.id]
          next[agent.id] = {
            x: clampInto(cur.x + (Math.random() - 0.5) * MAX_STEP * 2, b.minX, b.maxX),
            y: clampInto(cur.y + (Math.random() - 0.5) * MAX_STEP * 2, b.minY, b.maxY),
          }
        }
        return next
      })
    }, 550)
    return () => clearInterval(timer)
  }, [])

  // ── Helpers ───────────────────────────────
  const setWorking = useCallback((id: AgentId, msg: string) => {
    setAgentStates(prev => ({ ...prev, [id]: { status: "working", bubble: msg } }))
    setPositions(prev => ({ ...prev, [id]: AGENTS.find(a => a.id === id)!.zone }))
  }, [])

  const setIdle = useCallback((id: AgentId) => {
    setAgentStates(prev => ({ ...prev, [id]: { status: "idle", bubble: null } }))
  }, [])

  const addChat = useCallback((id: AgentId, role: "user" | "agent", text: string) => {
    setChats(prev => ({ ...prev, [id]: [...prev[id], { role, text }] }))
  }, [])

  // ── Daily workflow ─────────────────────────
  const runDailyWorkflow = useCallback(() => {
    if (dailyRunning) return
    setDailyRunning(true)
    DAILY_SEQUENCE.forEach(({ id, report, delay }) => {
      const def = AGENTS.find(a => a.id === id)!
      setTimeout(() => {
        setWorking(id, def.workMsg)
        addChat(id, "agent", report)
        setTimeout(() => setIdle(id), 3200)
      }, delay)
    })
    const last = DAILY_SEQUENCE[DAILY_SEQUENCE.length - 1].delay
    setTimeout(() => setDailyRunning(false), last + 4000)
  }, [dailyRunning, setWorking, setIdle, addChat])

  // ── Run agent ─────────────────────────────
  const runAgent = useCallback(async (id: AgentId) => {
    const def = AGENTS.find(a => a.id === id)!
    if (id === "cto") {
      setCtoLoading(true)
      setWorking("cto", "GitHub 분석 중...")
      try {
        const [repo, commits, tree] = await Promise.all([
          githubApi.repo(), githubApi.commits(), githubApi.tree(),
        ])
        addChat("cto", "agent", formatCtoReport(repo, commits, tree))
        setWorking("cto", "분석 완료!")
        setTimeout(() => setIdle("cto"), 3000)
      } catch (err) {
        addChat("cto", "agent", `분석 실패: ${err instanceof Error ? err.message : "서버를 확인해주세요."}`)
        setIdle("cto")
      } finally {
        setCtoLoading(false)
      }
    } else {
      setWorking(id, def.workMsg)
      addChat(id, "agent", SAMPLE_REPLIES[id])
      setTimeout(() => setIdle(id), 4000)
    }
  }, [setWorking, setIdle, addChat])

  // ── Chat ──────────────────────────────────
  const sendMessage = useCallback(() => {
    if (!input.trim() || !selected) return
    const text = input.trim()
    setInput("")
    addChat(selected, "user", text)
    setTimeout(() => addChat(selected, "agent", SAMPLE_REPLIES[selected]), 400)
  }, [input, selected, addChat])

  const selectedAgent = selected ? AGENTS.find(a => a.id === selected) : null

  return (
    <div className="flex min-h-0 flex-1 w-full flex-col overflow-hidden bg-[#06070f] text-white">

      {/* Header */}
      <header className="z-30 flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0b0c18]/90 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-lg">🏢</div>
          <div>
            <h1 className="text-sm font-bold leading-none">Connect AI Office</h1>
            <p className="mt-0.5 text-[10px] text-white/40">Game-like AI Office System</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedAgent && (
            <Button
              onClick={() => void runAgent(selectedAgent.id)}
              disabled={ctoLoading}
              size="sm"
              className="h-7 rounded-lg bg-amber-500 px-3 text-[11px] font-semibold text-black hover:bg-amber-400"
            >
              {ctoLoading
                ? <Loader2 size={12} className="mr-1 animate-spin" />
                : <Zap size={12} className="mr-1" />}
              {selectedAgent.kr} 실행
            </Button>
          )}
          <Button
            onClick={runDailyWorkflow}
            disabled={dailyRunning}
            size="sm"
            variant="outline"
            className="h-7 rounded-lg border-white/20 px-3 text-[11px] text-white/60 hover:bg-white/10 hover:text-white"
          >
            {dailyRunning && <Loader2 size={11} className="mr-1 animate-spin" />}
            일일 보고
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">

        {/* Office canvas — 16:9, 최대 1280px, 영역 안에서 가로·세로 중앙 */}
        <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center bg-[#06070f] px-4 py-4">
          <div
            className="relative mx-auto w-full max-w-[1280px] shrink-0 overflow-hidden rounded-xl shadow-2xl shadow-black/60"
            style={{ aspectRatio: "16 / 9" }}
          >
            <OfficeFloor variant="absolute" roundedClassName="rounded-xl" />
            {AGENTS.map(agent => (
              <AgentSprite
                key={agent.id}
                agent={agent}
                state={agentStates[agent.id]}
                position={positions[agent.id]}
                isSelected={selected === agent.id}
                onClick={() => setSelected(prev => prev === agent.id ? null : agent.id)}
              />
            ))}
            {!selected && (
              <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2">
                <p
                  className="max-w-[90vw] rounded-xl border-2 border-white/25 bg-[#0c0e18]/95 px-4 py-2 text-center text-[11px] font-medium leading-snug text-zinc-100 shadow-[0_10px_40px_rgba(0,0,0,0.75)] backdrop-blur-md sm:max-w-md"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.85)" }}
                >
                  Agent를 클릭해 대화하거나 [일일 보고]를 실행해보세요
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Side panel */}
        <AnimatePresence>
          {selectedAgent && (
            <motion.aside
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="relative z-10 flex min-h-0 w-72 shrink-0 flex-col border-l border-white/10 bg-[#0d0e1a]/95 backdrop-blur"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: `${selectedAgent.color}20`, border: `1px solid ${selectedAgent.color}45` }}
                  >
                    <selectedAgent.icon size={17} style={{ color: selectedAgent.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold">{selectedAgent.name} · {selectedAgent.kr}</div>
                    <div className="text-[10px] text-white/40">{selectedAgent.desc}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-lg p-1 text-white/35 hover:bg-white/10 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Chat */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {chats[selectedAgent.id].map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[88%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-amber-500 text-black font-medium"
                          : "bg-white/[0.07] text-white/80"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="border-t border-white/10 p-3">
                <div className="flex gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-2">
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                    placeholder="명령을 입력하세요..."
                    className="h-6 border-0 bg-transparent p-0 text-[11px] text-white placeholder:text-white/30 focus-visible:ring-0"
                  />
                  <Button
                    onClick={sendMessage}
                    size="icon"
                    className="h-6 w-6 shrink-0 rounded-lg bg-amber-500 text-black hover:bg-amber-400"
                  >
                    <Send size={11} />
                  </Button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
