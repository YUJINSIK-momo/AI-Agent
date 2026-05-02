import type { ElementType } from "react"
import {
  Crown, Boxes, GitBranch, Users, Code2, Bug,
  BarChart3, Megaphone, Headphones, Settings2,
} from "lucide-react"

/** 오피스 씬 / 미니맵 공통 — 배경 이미지(애니메이션풍 평면도) 영역과 동일 기준 */
export type AgentId =
  | "ceo" | "cpo" | "cto" | "pm" | "dev" | "data" | "qa" | "marketing" | "cs" | "ops"

export type WalkBounds = { minX: number; maxX: number; minY: number; maxY: number }

export const WALK_BOUNDS: Record<AgentId, WalkBounds> = {
  cpo:       { minX: 6,  maxX: 30, minY: 10, maxY: 32 },
  ceo:       { minX: 40, maxX: 56, minY: 6,  maxY: 22 },
  cto:       { minX: 66, maxX: 93, minY: 8,  maxY: 32 },
  pm:        { minX: 6,  maxX: 30, minY: 36, maxY: 54 },
  data:      { minX: 40, maxX: 58, minY: 38, maxY: 54 },
  dev:       { minX: 66, maxX: 93, minY: 36, maxY: 54 },
  marketing: { minX: 8,  maxX: 34, minY: 56, maxY: 74 },
  qa:        { minX: 56, maxX: 78, minY: 58, maxY: 76 },
  ops:       { minX: 78, maxX: 96, minY: 52, maxY: 76 },
  cs:        { minX: 38, maxX: 62, minY: 76, maxY: 92 },
}

export interface AgentDef {
  id: AgentId
  name: string
  kr: string
  color: string
  icon: ElementType
  zone: { x: number; y: number }
  desc: string
  idleMsg: string
  workMsg: string
}

export const centerOf = (b: WalkBounds) => ({
  x: (b.minX + b.maxX) / 2,
  y: (b.minY + b.maxY) / 2,
})

export const clampInto = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export const AGENTS: AgentDef[] = [
  { id: "ceo",       name: "CEO",  kr: "대표",      color: "#f59e0b", icon: Crown,     zone: centerOf(WALK_BOUNDS.ceo),
    desc: "최종 의사결정 / 승인",    idleMsg: "보고를 기다리는 중...",    workMsg: "전략을 검토 중..." },
  { id: "cpo",       name: "CPO",  kr: "제품 총괄", color: "#a855f7", icon: Boxes,     zone: centerOf(WALK_BOUNDS.cpo),
    desc: "제품 방향 / 우선순위",    idleMsg: "아이디어를 구상 중...",    workMsg: "제품 로드맵 업데이트 중..." },
  { id: "cto",       name: "CTO",  kr: "기술 총괄", color: "#3b82f6", icon: GitBranch, zone: centerOf(WALK_BOUNDS.cto),
    desc: "GitHub 코드 분석",       idleMsg: "GitHub를 모니터링 중...", workMsg: "코드 분석 중..." },
  { id: "pm",        name: "PM",   kr: "기획",      color: "#10b981", icon: Users,     zone: centerOf(WALK_BOUNDS.pm),
    desc: "기획서 / MVP / 요구사항", idleMsg: "기획안을 구상 중...",      workMsg: "요구사항 정리 중..." },
  { id: "dev",       name: "Dev",  kr: "개발자",    color: "#06b6d4", icon: Code2,     zone: centerOf(WALK_BOUNDS.dev),
    desc: "구현 / 코드 작성",       idleMsg: "코드를 검토 중...",        workMsg: "기능 구현 중..." },
  { id: "data",      name: "Data", kr: "데이터",    color: "#f97316", icon: BarChart3, zone: centerOf(WALK_BOUNDS.data),
    desc: "지표 / 전환율 / 리포트", idleMsg: "대기 중...",               workMsg: "데이터 분석 중..." },
  { id: "qa",        name: "QA",   kr: "테스트",    color: "#ef4444", icon: Bug,       zone: centerOf(WALK_BOUNDS.qa),
    desc: "버그 / 테스트 케이스",   idleMsg: "버그를 모니터링 중...",    workMsg: "테스트 케이스 작성 중..." },
  { id: "marketing", name: "MKT",  kr: "마케팅",    color: "#ec4899", icon: Megaphone, zone: centerOf(WALK_BOUNDS.marketing),
    desc: "콘텐츠 / 브랜딩",       idleMsg: "콘텐츠를 구상 중...",      workMsg: "콘텐츠 초안 작성 중..." },
  { id: "cs",        name: "CS",   kr: "고객 대응", color: "#6366f1", icon: Headphones, zone: centerOf(WALK_BOUNDS.cs),
    desc: "FAQ / 일본어 응대",      idleMsg: "고객 대응 준비 중...",     workMsg: "응대 문구 작성 중..." },
  { id: "ops",       name: "Ops",  kr: "자동화",    color: "#84cc16", icon: Settings2, zone: centerOf(WALK_BOUNDS.ops),
    desc: "운영 플로우 / 자동화",   idleMsg: "시스템을 모니터링 중...", workMsg: "자동화 플로우 설계 중..." },
]

export function getFallbackRooms() {
  return (Object.keys(WALK_BOUNDS) as AgentId[]).map((id) => {
    const b = WALK_BOUNDS[id]
    const a = AGENTS.find(x => x.id === id)!
    return {
      label: a.kr,
      x: b.minX,
      y: b.minY,
      w: b.maxX - b.minX,
      h: b.maxY - b.minY,
      color: a.color,
    }
  })
}
