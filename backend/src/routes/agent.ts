import { Router } from "express"
import type { Request, Response } from "express"

const router = Router()

// 각 Agent의 정적 응답 (추후 AI API 연동 예정)
const agentResponses: Record<string, string> = {
  ceo:       "대표 권한으로 전체 Agent 보고를 취합합니다. 최종 승인 또는 보류 결정을 내려주세요.",
  cpo:       "현재 우선순위는 1) CTO GitHub 분석, 2) QA 테스트 케이스 작성, 3) Agent UI MVP 완성입니다.",
  cto:       "GitHub API 연결 후 Repository 구조, 최근 Commit, 변경 파일, 위험 코드를 분석합니다.",
  pm:        "MVP 범위는 Agent 카드, 채팅창, CTO GitHub 분석 버튼, 보고서 출력 영역까지로 추천합니다.",
  dev:       "프론트는 React + shadcn/ui, 백엔드는 Node.js + Express 구조로 설계하는 것이 좋습니다.",
  qa:        "테스트 항목: Agent 선택, 메시지 전송, CTO 실행, 응답 출력, 모바일 UI 깨짐 여부입니다.",
  data:      "초기 지표는 Agent 실행 횟수, 성공률, 응답 시간, 사용자 승인율로 잡으면 됩니다.",
  marketing: "콘텐츠 방향은 '혼자 운영하는 AI 회사', '10명의 AI 직원', 'GitHub 자동 코드 리뷰'가 좋습니다.",
  cs:        "고객 대응 Agent는 일본어 LINE 문구, FAQ 정리, 클레임 답변 초안을 담당합니다.",
  ops:       "자동화는 매일 아침 GitHub 변경사항 분석 → CTO 보고서 → QA 체크리스트 생성 흐름이 좋습니다.",
}

// POST /api/agent/:id/message
router.post("/:id/message", (req: Request, res: Response) => {
  const id = req.params["id"] as string
  const { message } = req.body as { message: string }

  if (!message) {
    res.status(400).json({ error: "message is required" })
    return
  }

  const reply = agentResponses[id]
  if (!reply) {
    res.status(404).json({ error: `Agent '${id}' not found` })
    return
  }

  res.json({
    agent: id,
    userMessage: message,
    reply,
    timestamp: new Date().toISOString(),
  })
})

// GET /api/agent/list
router.get("/list", (_req: Request, res: Response) => {
  res.json(Object.keys(agentResponses).map((id: string) => ({ id })))
})

export default router
