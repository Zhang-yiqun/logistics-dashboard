// ============ AI 对话式分析 ============
// 把系统数据精简为上下文摘要，喂给大模型，支持自然语言问答。

import { callLLMChat } from '@/config/ai.config'
import { billings, carbons, carriers, dispatches, exceptions, lanes, shipments } from '@/mock'
import { EXCEPTION_TYPE_TEXT, SHIPMENT_STATUS_TEXT } from '@/types'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// 建议问题（首次打开时展示）
export const SUGGESTED_QUESTIONS = [
  '本周哪条线路最亏钱？',
  '哪个承运商准时率下滑最明显？',
  '运费账单有多少可以追回？',
  '哪辆车空载、可以怎么配货？'
]

function buildContext(): string {
  const statusCount: Record<string, number> = {}
  shipments.forEach((s) => {
    statusCount[s.status] = (statusCount[s.status] ?? 0) + 1
  })

  const typeCount: Record<string, number> = {}
  exceptions.forEach((e) => {
    typeCount[e.type] = (typeCount[e.type] ?? 0) + 1
  })

  const badBillings = billings.filter((b) => b.status === 'overcharge' || b.status === 'duplicate')
  const recoverable = badBillings.reduce((sum, b) => sum + b.diff, 0)

  const activeVehicles = dispatches.filter((d) => d.status !== 'empty')
  const emptyVehicles = dispatches.filter((d) => d.status === 'empty')
  const avgUtil =
    activeVehicles.length > 0
      ? activeVehicles.reduce((sum, d) => sum + (d.load / d.capacity) * 100, 0) / activeVehicles.length
      : 0

  const totalCo2 = carbons.reduce((sum, c) => sum + c.co2, 0)

  return [
    '=== 运单概况 ===',
    `总运单 ${shipments.length} 单，状态：${Object.entries(statusCount)
      .map(([k, v]) => `${SHIPMENT_STATUS_TEXT[k as keyof typeof SHIPMENT_STATUS_TEXT]}:${v}`)
      .join('、')}`,
    `总运费 ${(shipments.reduce((s, x) => s + x.freight + x.accessorial, 0) / 10000).toFixed(1)} 万元`,
    '',
    '=== 承运商绩效 ===',
    ...carriers.map((c) => `${c.name}：准点率${c.onTimeRate}% 异常率${c.exceptionRate}% 赔付率${c.claimRate}% 单均成本¥${c.avgCostPerShipment}`),
    '',
    '=== 异常概况 ===',
    `异常 ${exceptions.length} 起，类型：${Object.entries(typeCount)
      .map(([k, v]) => `${EXCEPTION_TYPE_TEXT[k as keyof typeof EXCEPTION_TYPE_TEXT]}:${v}`)
      .join('、')}`,
    '',
    '=== 线路时效 ===',
    ...lanes.map(
      (l) =>
        `${l.name}：标准${l.standardHours}h 实际${l.avgActualHours}h 超时${Math.round(((l.avgActualHours - l.standardHours) / l.standardHours) * 100)}% 单均成本¥${l.avgCost}`
    ),
    '',
    '=== 运费对账 ===',
    `账单 ${billings.length} 笔，多收/重复 ${badBillings.length} 笔，可追回 ¥${recoverable}`,
    '',
    '=== 调度配载 ===',
    `车辆 ${dispatches.length} 辆，空载 ${emptyVehicles.length} 辆，平均利用率 ${avgUtil.toFixed(0)}%`,
    '',
    '=== 碳排放 ===',
    `总碳排放 ${(totalCo2 / 1000).toFixed(1)} 吨`
  ].join('\n')
}

export async function chatWithData(
  question: string,
  history: ChatMessage[]
): Promise<string> {
  const context = buildContext()
  const system =
    `你是物流运输控制塔的 AI 分析助手。以下是当前系统的实时数据摘要：\n\n${context}\n\n` +
    `请根据以上数据，用中文简洁、专业地回答用户关于物流运营、绩效、成本、异常、调度、碳排放等的问题。` +
    `回答必须基于数据，不要编造数据中不存在的内容。使用 Markdown 格式（- 要点、**加粗** 关键结论），控制在 300 字内。`

  const recent = history.slice(-6).map((m) => ({ role: m.role, content: m.content }))
  return callLLMChat([
    { role: 'system', content: system },
    ...recent,
    { role: 'user', content: question }
  ])
}
