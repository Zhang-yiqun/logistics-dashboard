// ============ AI 业务功能层 ============
// 集中管理 AI-2 / AI-3 / AI-4 的 prompt 与调用，页面只负责触发和渲染。
// AI-1（异常归因）在 Exceptions.vue 内联实现。

import { callLLM } from '@/config/ai.config'
import {
  SHIPMENT_STATUS_TEXT,
  type BillingRecord,
  type Carrier,
  type DailyKPI,
  type DispatchTask,
  type Lane,
  type Shipment
} from '@/types'

// AI-2 经营日报 / 周报自动生成
export async function generateDailyReport(
  dailyKpis: DailyKPI[],
  todayShipments: Shipment[]
): Promise<string> {
  const today = dailyKpis[dailyKpis.length - 1]
  const yesterday = dailyKpis[dailyKpis.length - 2]
  const system = '你是物流企业运营负责人，擅长用简洁专业的中文撰写经营日报。'
  const user =
    `今日物流运营核心数据：\n${JSON.stringify(today, null, 2)}\n\n` +
    `昨日数据（用于环比）：\n${JSON.stringify(yesterday, null, 2)}\n\n` +
    `近 7 天趋势：\n${JSON.stringify(dailyKpis, null, 2)}\n\n` +
    `请生成一份经营日报，包含：\n` +
    `1. 今日核心数字概览\n2. 与昨日的环比变化及原因推断\n3. 需要重点关注的 3 个风险点\n4. 明日行动建议\n\n` +
    `用中文 Markdown 输出（## 小标题、**加粗**、- 要点），控制在 350 字内。`
  return callLLM(system, user)
}

// AI-3 承运商绩效自动点评
export async function reviewCarrier(carrier: Carrier): Promise<string> {
  const system = '你是物流供应商管理专家，擅长评估承运商绩效并给出决策建议。'
  const user =
    `承运商「${carrier.name}」本月绩效数据：\n${JSON.stringify(carrier, null, 2)}\n\n` +
    `请点评其绩效、指出主要问题、给出是否续约/加量的建议。\n` +
    `用中文 Markdown 输出（**加粗** 关键结论、- 要点），控制在 150 字内。`
  return callLLM(system, user)
}

// AI-4 延迟风险预测
export async function predictDelayRisk(
  inTransitShipments: Shipment[],
  lanes: Lane[]
): Promise<string> {
  const system = '你是物流运输风险分析专家，擅长识别在途运单的延迟风险。'
  const user =
    `在途运单信息：\n${JSON.stringify(
      inTransitShipments.map((s) => ({
        运单号: s.id,
        线路: s.lane,
        状态: SHIPMENT_STATUS_TEXT[s.status],
        计划送达: s.planDeliverAt,
        预计晚点分钟: s.etaMinutesLate
      })),
      null,
      2
    )}\n\n` +
    `线路历史时效数据：\n${JSON.stringify(
      lanes.map((l) => ({
        线路: l.name,
        标准时效小时: l.standardHours,
        实际平均时效: l.avgActualHours
      })),
      null,
      2
    )}\n\n` +
    `请判断未来 3 天哪些运单有较高延迟风险，输出：运单号、风险等级、原因、建议动作。\n` +
    `用中文 Markdown 输出（## 小标题、- 列表），控制在 350 字内。`
  return callLLM(system, user)
}

// AI-5 运费账单审计
export async function auditBilling(
  billings: BillingRecord[],
  carriers: Carrier[]
): Promise<string> {
  const system = '你是物流财务审计专家，擅长从运费账单中识别异常费用。'
  const user =
    `以下是运费账单数据（JSON 数组）：\n${JSON.stringify(billings, null, 2)}\n\n` +
    `承运商合同费率参考：\n${JSON.stringify(
      carriers.map((c) => ({ 承运商: c.name, 合同费率: c.contractRate, 单均成本: c.avgCostPerShipment })),
      null,
      2
    )}\n\n` +
    `请审计这些账单，找出：\n` +
    `1. 多收 / 超额计费的账单\n2. 重复计费\n3. 异常附加费\n4. 可追回金额估算\n\n` +
    `用中文 Markdown 输出（## 小标题、- 要点），控制在 300 字内。`
  return callLLM(system, user)
}

// AI-6 智能配载建议
export async function suggestDispatch(
  dispatches: DispatchTask[],
  pendingShipments: Shipment[]
): Promise<string> {
  const system = '你是物流调度专家，擅长车辆配载与线路优化。'
  const user =
    `以下是车辆调度状态（JSON 数组）：\n${JSON.stringify(dispatches, null, 2)}\n\n` +
    `待派运单（JSON 数组）：\n${JSON.stringify(
      pendingShipments.map((s) => ({ 运单号: s.id, 线路: s.lane, 货主: s.shipper, 重量: s.weight, 计划送达: s.planDeliverAt })),
      null,
      2
    )}\n\n` +
    `请给出配载建议：\n1. 哪些运单可以合并配载\n2. 空载车辆如何利用\n3. 线路优化建议\n\n` +
    `用中文 Markdown 输出（## 小标题、- 要点），控制在 300 字内。`
  return callLLM(system, user)
}
