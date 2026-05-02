import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles } from "lucide-react"
import { AGENTS, WALK_BOUNDS, type AgentId, clampInto } from "@/lib/officeLayout"
import { getPmDailyBrief } from "@/lib/pmDailyBrief"
import { OfficeFloor } from "@/components/OfficeFloor"

type Positions = Record<AgentId, { x: number; y: number }>

const OFFICE_TIPS = [
  "CTO 실행은 가운데 채팅에서 [실행]으로 GitHub 분석을 돌릴 수 있어요.",
  "에이전트는 각자 맡은 구역 안에서만 조용히 움직여요.",
  "Agent Report 탭에서 연동 상태와 Daily Workflow를 확인하세요.",
] as const

export interface OfficeMiniMapProps {
  /** 대시보드에서 선택 중인 에이전트 — 링 강조 */
  highlightId: AgentId
  onSelectAgent?: (id: AgentId) => void
  /** 대시보드 OUTPUT 카운터 (있으면 상단 바에 표시) */
  outputCount?: number
  /** Agent Report와 동일한 상태 문자열 */
  workflowStatus?: string
}

/**
 * 대시보드 우측 패널용 미니 오피스 — 라이브 바, 스포트라이트, 퀵 로스터, 팁.
 */
export function OfficeMiniMap({
  highlightId,
  onSelectAgent,
  outputCount,
  workflowStatus,
}: OfficeMiniMapProps) {
  const [positions, setPositions] = useState<Positions>(
    () => Object.fromEntries(AGENTS.map(a => [a.id, { ...a.zone }])) as Positions,
  )
  const [now, setNow] = useState(() => new Date())
  const [tipIdx, setTipIdx] = useState(0)

  const idle = useRef(true)
  useEffect(() => {
    const MAX_STEP = 1.6
    const t = window.setInterval(() => {
      if (!idle.current) return
      setPositions(prev => {
        const next = { ...prev }
        for (const agent of AGENTS) {
          if (Math.random() > 0.35) continue
          const b = WALK_BOUNDS[agent.id]
          const cur = prev[agent.id]
          next[agent.id] = {
            x: clampInto(cur.x + (Math.random() - 0.5) * MAX_STEP * 2, b.minX, b.maxX),
            y: clampInto(cur.y + (Math.random() - 0.5) * MAX_STEP * 2, b.minY, b.maxY),
          }
        }
        return next
      })
    }, 900)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = window.setInterval(
      () => setTipIdx(i => (i + 1) % OFFICE_TIPS.length),
      7000,
    )
    return () => clearInterval(id)
  }, [])

  const selected = AGENTS.find(a => a.id === highlightId)!
  const pmAgent = AGENTS.find(a => a.id === "pm")!
  const PmIcon = pmAgent.icon
  const pmBrief = getPmDailyBrief(now)

  return (
    <div className="flex flex-col gap-3">
      {/* 상단 상태 바 */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-gradient-to-r from-amber-500/10 via-white/[0.04] to-violet-500/10 px-3 py-2">
        <span className="flex items-center gap-2 text-[10px] font-bold tracking-wide text-emerald-400">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-35" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          </span>
          오피스 LIVE
        </span>
        <time className="font-mono text-[10px] tabular-nums text-white/55" suppressHydrationWarning>
          {now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </time>
        {outputCount != null && (
          <span className="rounded-md bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-amber-300/95">
            OUTPUT {outputCount}
          </span>
        )}
      </div>

      {/* 미니맵 + 그라데이션 프레임 */}
      <div
        className="relative rounded-xl bg-gradient-to-br from-amber-400/35 via-white/15 to-indigo-400/35 p-px shadow-[0_0_24px_-4px_rgba(245,158,11,0.25)]"
        onMouseEnter={() => { idle.current = false }}
        onMouseLeave={() => { idle.current = true }}
      >
        <div className="relative aspect-video w-full overflow-hidden rounded-[11px] bg-[#070914]">
          <OfficeFloor variant="fill" roundedClassName="rounded-[11px]" />
          {AGENTS.map(agent => {
            const pos = positions[agent.id]
            const active = highlightId === agent.id
            return (
              <motion.button
                key={agent.id}
                type="button"
                title={agent.kr}
                aria-label={agent.kr}
                className="absolute z-10 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                animate={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  x: "-50%",
                  y: "-50%",
                }}
                transition={{ type: "tween", duration: 0.75, ease: [0.25, 0.1, 0.25, 1] }}
                onClick={() => onSelectAgent?.(agent.id)}
              >
                <motion.span
                  className={`relative block h-8 w-8 overflow-hidden rounded-xl border-2 bg-[#12141c]/90 shadow-md ${
                    active ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-[#070914]" : ""
                  }`}
                  style={{ borderColor: agent.color }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img
                    src={`/img/agents/${agent.id}.png`}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                  />
                </motion.span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* PM · 오늘의 AI 스냅샷 (매일 기준 짧은 브리핑) */}
      <section
        className="rounded-xl border p-px shadow-inner"
        style={{
          borderColor: `${pmAgent.color}44`,
          background: `linear-gradient(145deg, ${pmAgent.color}18 0%, transparent 45%)`,
        }}
        aria-labelledby="pm-daily-brief-heading"
      >
        <div className="rounded-[11px] border border-white/8 bg-[#0b0d16]/95 px-3 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3
              id="pm-daily-brief-heading"
              className="flex items-center gap-2 text-[11px] font-bold text-white"
            >
              <PmIcon size={14} style={{ color: pmAgent.color }} aria-hidden />
              <span style={{ color: pmAgent.color }}>PM</span>
              <span className="font-semibold text-white/70">· 오늘의 AI 스냅샷</span>
            </h3>
            <time
              dateTime={pmBrief.dateKey}
              className="shrink-0 text-[9px] tabular-nums text-white/35"
            >
              {pmBrief.dateKey.replace(/-/g, ".")}
            </time>
          </div>
          <p className="mb-2 text-[11px] font-semibold leading-snug text-emerald-100/90">
            {pmBrief.headline}
          </p>
          <ul className="space-y-1.5 text-[10px] leading-relaxed text-white/60">
            {pmBrief.bullets.map((line, i) => (
              <li key={`${pmBrief.dateKey}-${i}`} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400/70" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 선택된 에이전트 스포트라이트 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={highlightId}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-white/12 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-3 shadow-inner"
        >
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-lg"
              style={{
                background: `${selected.color}22`,
                border: `1px solid ${selected.color}55`,
                boxShadow: `0 0 16px ${selected.color}33`,
              }}
            >
              <selected.icon size={22} style={{ color: selected.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{selected.name}</span>
                <span className="text-[11px] text-white/45">· {selected.kr}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-white/55">
                {selected.desc}
              </p>
              {workflowStatus && (
                <p className="mt-2 text-[10px] text-amber-200/70">
                  상태: <span className="font-medium text-amber-200/90">{workflowStatus}</span>
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 퀵 로스터 */}
      <div>
        <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">
          <Sparkles className="h-3 w-3 text-amber-400/80" aria-hidden />
          빠른 선택
        </div>
        <div className="flex flex-wrap gap-1.5">
          {AGENTS.map(agent => {
            const on = highlightId === agent.id
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => onSelectAgent?.(agent.id)}
                className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-semibold transition ${
                  on
                    ? "border-amber-400/60 bg-amber-500/15 text-amber-200"
                    : "border-white/10 bg-white/[0.04] text-white/55 hover:border-white/20 hover:bg-white/[0.07] hover:text-white/80"
                }`}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: agent.color, boxShadow: on ? `0 0 8px ${agent.color}` : undefined }}
                />
                {agent.kr}
              </button>
            )
          })}
        </div>
      </div>

      {/* 팁 로테이션 */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] px-3 py-2.5">
        <AnimatePresence mode="wait">
          <motion.p
            key={tipIdx}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.2 }}
            className="text-[10px] leading-relaxed text-violet-100/75"
          >
            <span className="mr-1.5 opacity-70" aria-hidden>💡</span>
            {OFFICE_TIPS[tipIdx]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
