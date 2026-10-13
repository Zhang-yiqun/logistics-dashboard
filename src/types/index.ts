// ============ 数据模型（5 个核心实体） ============
// 与《物流履约异常看板 MVP 规格书》第 4 节保持一致

export type ShipmentStatus =
  | 'pending' // 待取件
  | 'in_transit' // 在途
  | 'delivered' // 已签收
  | 'delayed' // 延迟
  | 'exception' // 异常

export interface Shipment {
  id: string // 运单号
  shipper: string // 货主
  carrierId: string // 承运商 id
  lane: string // 线路，如 "广州 → 上海"
  origin: string // 出发地
  destination: string // 目的地
  status: ShipmentStatus
  planPickupAt: string // 计划取件时间
  actualPickupAt?: string
  planDeliverAt: string // 计划送达时间
  actualDeliverAt?: string
  weight?: number // 重量(kg)
  volume?: number // 体积(m³)
  temperature?: number // 温控(℃)
  freight: number // 运费(元)
  accessorial: number // 附加费(元)
  etaMinutesLate: number // 预计晚点分钟数
}

export interface Carrier {
  id: string
  name: string
  onTimeRate: number // 准点率 %
  exceptionRate: number // 异常率 %
  claimRate: number // 赔付率 %
  avgCostPerShipment: number // 单均成本(元)
  contractRate: number // 合同费率(元/票)
  shipmentsThisMonth: number
}

export interface Lane {
  id: string
  name: string // "广州 → 上海"
  carrierIds: string[]
  standardHours: number // 标准时效(小时)
  avgActualHours: number // 实际平均时效
  avgCost: number // 平均成本
  volume: number // 运量
}

export type ExceptionType =
  | 'delay' // 延迟
  | 'deviation' // 偏航
  | 'timeout' // 超时
  | 'damage' // 破损
  | 'pod_missing' // 回单缺失
  | 'temperature' // 温控异常

export type ExceptionStatus = 'open' | 'processing' | 'closed'
export type ExceptionSeverity = 'high' | 'medium' | 'low'

export interface ExceptionRecord {
  id: string
  shipmentId: string
  type: ExceptionType
  occurredAt: string
  status: ExceptionStatus
  responsible: string // 责任方
  rootCause?: string // AI 归因结果
  severity: ExceptionSeverity
}

export interface DailyKPI {
  date: string
  totalShipments: number
  onTimeCount: number
  delayedCount: number
  exceptionCount: number
  totalFreight: number
  avgCost: number
  topProblemCarrier: string
}

// 类型字典（用于中文展示）
export const SHIPMENT_STATUS_TEXT: Record<ShipmentStatus, string> = {
  pending: '待取件',
  in_transit: '在途',
  delivered: '已签收',
  delayed: '延迟',
  exception: '异常'
}

export const EXCEPTION_TYPE_TEXT: Record<ExceptionType, string> = {
  delay: '延迟',
  deviation: '偏航',
  timeout: '超时',
  damage: '破损',
  pod_missing: '回单缺失',
  temperature: '温控异常'
}

export const EXCEPTION_SEVERITY_TEXT: Record<ExceptionSeverity, string> = {
  high: '高',
  medium: '中',
  low: '低'
}

// ============ 运费对账（BMS）============
export type BillingStatus = 'matched' | 'overcharge' | 'duplicate' | 'pending'

export interface BillingRecord {
  id: string
  shipmentId: string
  carrierId: string
  contractRate: number // 合同费率(元)
  billedAmount: number // 账单金额(元)
  accessorial: number // 附加费(元)
  diff: number // 差异(元) = billed - contract - accessorial
  status: BillingStatus
  billedAt: string
}

export const BILLING_STATUS_TEXT: Record<BillingStatus, string> = {
  matched: '一致',
  overcharge: '多收',
  duplicate: '重复计费',
  pending: '待核对'
}

// ============ 智能调度配载 ============
export type DispatchStatus = 'loading' | 'dispatched' | 'waiting' | 'empty'

export interface DispatchTask {
  id: string
  vehicleId: string
  vehicleType: string // 车型
  capacity: number // 载重(吨)
  load: number // 已配载(吨)
  route: string
  status: DispatchStatus
  shipmentIds: string[]
}

export const DISPATCH_STATUS_TEXT: Record<DispatchStatus, string> = {
  loading: '装货中',
  dispatched: '已发车',
  waiting: '待派',
  empty: '空载'
}

// ============ 碳排放（ESG）============
export type TransportMode = 'road' | 'rail' | 'water'

export interface CarbonRecord {
  id: string
  lane: string
  mode: TransportMode
  distance: number // 距离(km)
  weight: number // 货重(吨)
  fuel: number // 油耗(L)
  co2: number // 碳排放(kg)
}

export const MODE_TEXT: Record<TransportMode, string> = {
  road: '公路',
  rail: '铁路',
  water: '水路'
}
