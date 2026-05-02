/**
 * PM 전용 "오늘의 AI 스냅샷" — 날짜(Asia/Seoul)마다 고정 인덱스로 변주.
 * 향후 API/DB로 교체 가능.
 */

export interface PmDailyBrief {
  /** 서울 기준 YYYY-MM-DD */
  dateKey: string
  headline: string
  bullets: string[]
}

const VARIANTS: Omit<PmDailyBrief, "dateKey">[] = [
  {
    headline: "에이전트·오케스트레이션",
    bullets: [
      "멀티 에이전트 패턴: 감독자가 하위 전문 에이전트에 작업을 나누는 구조가 제품화 단계로 이동 중.",
      "장기 작업은 상태 저장·idempotent 재시도가 필수 — 단발 프롬프트만으론 운영 리스크 큼.",
    ],
  },
  {
    headline: "도구 연동·프로토콜",
    bullets: [
      "MCP(Model Context Protocol): IDE·에이전트가 외부 데이터·도구와 표준 방식으로 붙는 흐름 주목.",
      "자체 MCP 서버 설계 시 권한 범위·감사 로그를 처음부터 넣는 팀이 유리.",
    ],
  },
  {
    headline: "모델·비용",
    bullets: [
      "라우팅: 단순 질의는 소형 모델, 코드·추론은 상위 모델로 나누는 계층화가 비용 절감에 효과적.",
      "스트리밍+중단 처리 UX가 길어진 응답에서 이탈률에 직접 영향 — 동일 품질이면 체감 속도 우선.",
    ],
  },
  {
    headline: "프롬프트·품질",
    bullets: [
      "구조화 출력(JSON schema) + 검증 레이어로 후처리 비용을 줄이는 패턴이 일반화.",
      "평가는 단일 정답보다 루브릭·A/B·‘실패 케이스 집합’ 누적이 실무에 잘 맞음.",
    ],
  },
  {
    headline: "UI·제품",
    bullets: [
      "챗 외에 ‘작업 타임라인·승인 단계’ 시각화가 B2B 에이전트 제품의 차별 포인트로 자주 등장.",
      "인간 개입 지점(HITL)을 어디에 둘지 UX 카피와 함께 설계하는 팀이 클레임을 덜 봄.",
    ],
  },
  {
    headline: "보안·컴플라이언스",
    bullets: [
      "에이전트가 쓰는 토큰·키: 최소 권한·짧은 TTL·시크릿 스캔 CI를 기본선으로 잡는 추세.",
      "고객 데이터가 모델 학습에 쓰이지 않는지 — 계약·설정 화면에 명시하는 것이 신뢰에 중요.",
    ],
  },
]

function seoulDateKey(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" })
}

function variantIndexForDateKey(dateKey: string): number {
  let h = 0
  for (let i = 0; i < dateKey.length; i++) {
    h = Math.imul(31, h) + dateKey.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h) % VARIANTS.length
}

export function getPmDailyBrief(now: Date = new Date()): PmDailyBrief {
  const dateKey = seoulDateKey(now)
  const v = VARIANTS[variantIndexForDateKey(dateKey)]!
  return { dateKey, ...v }
}
