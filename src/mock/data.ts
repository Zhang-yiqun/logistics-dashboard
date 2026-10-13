import type {
  BillingRecord,
  CarbonRecord,
  Carrier,
  DailyKPI,
  DispatchTask,
  ExceptionRecord,
  Lane,
  Shipment
} from '@/types'

// ============ Mock 数据 ============
// 未来接入真实数据源时，只需替换 src/api/index.ts，本文件不再使用

export const carriers: Carrier[] = [
  { id: 'c1', name: '顺达物流', onTimeRate: 92.3, exceptionRate: 3.1, claimRate: 0.4, avgCostPerShipment: 1280, contractRate: 1200, shipmentsThisMonth: 340 },
  { id: 'c2', name: '安捷快运', onTimeRate: 88.6, exceptionRate: 5.8, claimRate: 1.2, avgCostPerShipment: 1105, contractRate: 1050, shipmentsThisMonth: 286 },
  { id: 'c3', name: '华通物流', onTimeRate: 85.2, exceptionRate: 7.4, claimRate: 2.1, avgCostPerShipment: 980, contractRate: 920, shipmentsThisMonth: 402 },
  { id: 'c4', name: '飞腾速运', onTimeRate: 90.1, exceptionRate: 4.2, claimRate: 0.8, avgCostPerShipment: 1350, contractRate: 1280, shipmentsThisMonth: 198 },
  { id: 'c5', name: '鑫达运输', onTimeRate: 79.8, exceptionRate: 9.6, claimRate: 3.4, avgCostPerShipment: 850, contractRate: 800, shipmentsThisMonth: 512 }
]

export const lanes: Lane[] = [
  { id: 'l1', name: '广州 → 上海', carrierIds: ['c1', 'c3'], standardHours: 24, avgActualHours: 26.5, avgCost: 1450, volume: 128 },
  { id: 'l2', name: '深圳 → 北京', carrierIds: ['c4', 'c5'], standardHours: 30, avgActualHours: 35.8, avgCost: 1880, volume: 96 },
  { id: 'l3', name: '杭州 → 成都', carrierIds: ['c2', 'c3'], standardHours: 28, avgActualHours: 33.2, avgCost: 1620, volume: 74 },
  { id: 'l4', name: '上海 → 武汉', carrierIds: ['c1', 'c5'], standardHours: 18, avgActualHours: 22.4, avgCost: 980, volume: 156 },
  { id: 'l5', name: '苏州 → 重庆', carrierIds: ['c2', 'c4'], standardHours: 32, avgActualHours: 41.6, avgCost: 2100, volume: 42 },
  { id: 'l6', name: '郑州 → 西安', carrierIds: ['c3', 'c5'], standardHours: 16, avgActualHours: 19.1, avgCost: 760, volume: 88 }
]

const now = '2026-10-13'

export const shipments: Shipment[] = [
  { id: 'WB20261012001', shipper: '恒发贸易', carrierId: 'c1', lane: '广州 → 上海', origin: '广州', destination: '上海', status: 'in_transit', planPickupAt: `${now} 08:30`, actualPickupAt: `${now} 08:45`, planDeliverAt: '2026-10-14 08:30', weight: 1250, freight: 1380, accessorial: 80, etaMinutesLate: 30 },
  { id: 'WB20261012002', shipper: '晨光电子', carrierId: 'c4', lane: '深圳 → 北京', origin: '深圳', destination: '北京', status: 'delayed', planPickupAt: `${now} 09:00`, actualPickupAt: `${now} 09:20`, planDeliverAt: '2026-10-14 15:00', weight: 860, freight: 1950, accessorial: 150, etaMinutesLate: 240 },
  { id: 'WB20261012003', shipper: '南洋食品', carrierId: 'c2', lane: '杭州 → 成都', origin: '杭州', destination: '成都', status: 'in_transit', planPickupAt: `${now} 10:15`, actualPickupAt: `${now} 10:30`, planDeliverAt: '2026-10-14 18:00', weight: 2100, temperature: 4, freight: 1720, accessorial: 220, etaMinutesLate: 90 },
  { id: 'WB20261012004', shipper: '宏远机械', carrierId: 'c3', lane: '上海 → 武汉', origin: '上海', destination: '武汉', status: 'delivered', planPickupAt: '2026-10-11 08:00', actualPickupAt: '2026-10-11 08:10', planDeliverAt: '2026-10-12 02:00', actualDeliverAt: '2026-10-12 01:20', weight: 3200, freight: 1020, accessorial: 60, etaMinutesLate: 0 },
  { id: 'WB20261012005', shipper: '蓝海家居', carrierId: 'c5', lane: '苏州 → 重庆', origin: '苏州', destination: '重庆', status: 'exception', planPickupAt: `${now} 07:45`, actualPickupAt: `${now} 08:00`, planDeliverAt: '2026-10-14 20:00', weight: 1450, freight: 2250, accessorial: 180, etaMinutesLate: 600 },
  { id: 'WB20261012006', shipper: '中联医药', carrierId: 'c1', lane: '广州 → 上海', origin: '广州', destination: '上海', status: 'in_transit', planPickupAt: `${now} 11:00`, actualPickupAt: `${now} 11:15`, planDeliverAt: '2026-10-14 11:00', weight: 680, temperature: 4, freight: 1420, accessorial: 260, etaMinutesLate: 45 },
  { id: 'WB20261012007', shipper: '永盛服饰', carrierId: 'c3', lane: '郑州 → 西安', origin: '郑州', destination: '西安', status: 'pending', planPickupAt: `${now} 14:00`, planDeliverAt: '2026-10-14 06:00', weight: 540, freight: 780, accessorial: 40, etaMinutesLate: 0 },
  { id: 'WB20261012008', shipper: '金谷粮油', carrierId: 'c2', lane: '杭州 → 成都', origin: '杭州', destination: '成都', status: 'delayed', planPickupAt: `${now} 08:20`, actualPickupAt: `${now} 08:50`, planDeliverAt: '2026-10-14 18:00', weight: 2800, freight: 1680, accessorial: 90, etaMinutesLate: 180 },
  { id: 'WB20261012009', shipper: '新锐五金', carrierId: 'c5', lane: '深圳 → 北京', origin: '深圳', destination: '北京', status: 'in_transit', planPickupAt: `${now} 09:30`, actualPickupAt: `${now} 09:40`, planDeliverAt: '2026-10-14 15:00', weight: 1900, freight: 1820, accessorial: 110, etaMinutesLate: 75 },
  { id: 'WB20261012010', shipper: '优品电商', carrierId: 'c4', lane: '上海 → 武汉', origin: '上海', destination: '武汉', status: 'delivered', planPickupAt: '2026-10-11 13:00', actualPickupAt: '2026-10-11 13:10', planDeliverAt: '2026-10-12 07:00', actualDeliverAt: '2026-10-12 06:30', weight: 720, freight: 940, accessorial: 50, etaMinutesLate: 0 },
  { id: 'WB20261012011', shipper: '东升建材', carrierId: 'c3', lane: '苏州 → 重庆', origin: '苏州', destination: '重庆', status: 'exception', planPickupAt: `${now} 06:50`, actualPickupAt: `${now} 07:05`, planDeliverAt: '2026-10-14 20:00', weight: 4100, freight: 2380, accessorial: 200, etaMinutesLate: 720 },
  { id: 'WB20261012012', shipper: '华南电子', carrierId: 'c1', lane: '广州 → 上海', origin: '广州', destination: '上海', status: 'in_transit', planPickupAt: `${now} 12:20`, actualPickupAt: `${now} 12:35`, planDeliverAt: '2026-10-14 12:20', weight: 980, freight: 1360, accessorial: 70, etaMinutesLate: 20 },
  { id: 'WB20261012013', shipper: '绿洲生鲜', carrierId: 'c2', lane: '杭州 → 成都', origin: '杭州', destination: '成都', status: 'delayed', planPickupAt: `${now} 05:30`, actualPickupAt: `${now} 05:45`, planDeliverAt: '2026-10-13 17:30', weight: 1600, temperature: 2, freight: 1890, accessorial: 320, etaMinutesLate: 360 },
  { id: 'WB20261012014', shipper: '瑞丰化工', carrierId: 'c5', lane: '郑州 → 西安', origin: '郑州', destination: '西安', status: 'pending', planPickupAt: `${now} 16:00`, planDeliverAt: '2026-10-14 08:00', weight: 3300, freight: 820, accessorial: 130, etaMinutesLate: 0 },
  { id: 'WB20261012015', shipper: '海纳百货', carrierId: 'c4', lane: '深圳 → 北京', origin: '深圳', destination: '北京', status: 'in_transit', planPickupAt: `${now} 10:40`, actualPickupAt: `${now} 10:55`, planDeliverAt: '2026-10-14 15:00', weight: 1150, freight: 1910, accessorial: 100, etaMinutesLate: 55 },
  { id: 'WB20261012016', shipper: '天成汽配', carrierId: 'c1', lane: '上海 → 武汉', origin: '上海', destination: '武汉', status: 'delivered', planPickupAt: '2026-10-11 15:00', actualPickupAt: '2026-10-11 15:20', planDeliverAt: '2026-10-12 09:00', actualDeliverAt: '2026-10-12 08:40', weight: 2600, freight: 960, accessorial: 55, etaMinutesLate: 0 },
  { id: 'WB20261012017', shipper: '美雅化妆品', carrierId: 'c2', lane: '广州 → 上海', origin: '广州', destination: '上海', status: 'in_transit', planPickupAt: `${now} 13:10`, actualPickupAt: `${now} 13:25`, planDeliverAt: '2026-10-14 13:10', weight: 430, freight: 1390, accessorial: 85, etaMinutesLate: 40 },
  { id: 'WB20261012018', shipper: '联合包装', carrierId: 'c3', lane: '深圳 → 北京', origin: '深圳', destination: '北京', status: 'delayed', planPickupAt: `${now} 07:00`, actualPickupAt: `${now} 07:30`, planDeliverAt: '2026-10-14 15:00', weight: 1750, freight: 1860, accessorial: 120, etaMinutesLate: 300 },
  { id: 'WB20261012019', shipper: '康泰器械', carrierId: 'c5', lane: '杭州 → 成都', origin: '杭州', destination: '成都', status: 'exception', planPickupAt: `${now} 08:50`, actualPickupAt: `${now} 09:10`, planDeliverAt: '2026-10-14 18:00', weight: 940, temperature: 4, freight: 1810, accessorial: 280, etaMinutesLate: 540 },
  { id: 'WB20261012020', shipper: '博文办公', carrierId: 'c4', lane: '郑州 → 西安', origin: '郑州', destination: '西安', status: 'pending', planPickupAt: `${now} 17:00`, planDeliverAt: '2026-10-14 09:00', weight: 620, freight: 750, accessorial: 35, etaMinutesLate: 0 }
]

export const exceptions: ExceptionRecord[] = [
  { id: 'e1', shipmentId: 'WB20261012002', type: 'delay', occurredAt: `${now} 06:20`, status: 'processing', responsible: '承运商-安捷快运', severity: 'high', rootCause: '华东段高速拥堵，中转滞留 4 小时' },
  { id: 'e2', shipmentId: 'WB20261012005', type: 'damage', occurredAt: `${now} 04:10`, status: 'open', responsible: '承运商-鑫达运输', severity: 'high', rootCause: '装卸环节包装破损，已拍照取证' },
  { id: 'e3', shipmentId: 'WB20261012008', type: 'delay', occurredAt: `${now} 05:50`, status: 'processing', responsible: '仓库-杭州仓', severity: 'medium', rootCause: '出库扫码延迟，装车晚点 3 小时' },
  { id: 'e4', shipmentId: 'WB20261012011', type: 'deviation', occurredAt: `${now} 03:30`, status: 'open', responsible: '承运商-华通物流', severity: 'high', rootCause: '车辆偏离既定路线，触发电子围栏预警' },
  { id: 'e5', shipmentId: 'WB20261012013', type: 'temperature', occurredAt: `${now} 02:15`, status: 'processing', responsible: '承运商-安捷快运', severity: 'high', rootCause: '冷链车厢温度超限 6℃，已通知司机检查制冷机' },
  { id: 'e6', shipmentId: 'WB20261012018', type: 'timeout', occurredAt: `${now} 01:40`, status: 'open', responsible: '承运商-华通物流', severity: 'medium', rootCause: '中途停靠超时 2.5 小时，未按节点上报' },
  { id: 'e7', shipmentId: 'WB20261012019', type: 'temperature', occurredAt: `${now} 00:55`, status: 'processing', responsible: '承运商-鑫达运输', severity: 'high', rootCause: '温控记录断点 40 分钟，需补传数据' },
  { id: 'e8', shipmentId: 'WB20261012003', type: 'delay', occurredAt: `${now} 07:00`, status: 'closed', responsible: '天气-不可抗力', severity: 'low', rootCause: '川西路段大雾限行，已改道' },
  { id: 'e9', shipmentId: 'WB20261012017', type: 'pod_missing', occurredAt: `${now} 05:00`, status: 'open', responsible: '承运商-安捷快运', severity: 'low', rootCause: '电子回单未上传，待司机补传' },
  { id: 'e10', shipmentId: 'WB20261012009', type: 'delay', occurredAt: `${now} 08:10`, status: 'closed', responsible: '承运商-鑫达运输', severity: 'medium', rootCause: '装车等待超时，已协调加派车辆' }
]

export const dailyKpis: DailyKPI[] = [
  { date: '10-07', totalShipments: 82, onTimeCount: 74, delayedCount: 5, exceptionCount: 3, totalFreight: 98600, avgCost: 1202, topProblemCarrier: '鑫达运输' },
  { date: '10-08', totalShipments: 91, onTimeCount: 83, delayedCount: 6, exceptionCount: 2, totalFreight: 110400, avgCost: 1213, topProblemCarrier: '华通物流' },
  { date: '10-09', totalShipments: 88, onTimeCount: 79, delayedCount: 6, exceptionCount: 3, totalFreight: 106200, avgCost: 1207, topProblemCarrier: '鑫达运输' },
  { date: '10-10', totalShipments: 95, onTimeCount: 87, delayedCount: 5, exceptionCount: 3, totalFreight: 115800, avgCost: 1219, topProblemCarrier: '华通物流' },
  { date: '10-11', totalShipments: 104, onTimeCount: 94, delayedCount: 7, exceptionCount: 3, totalFreight: 128600, avgCost: 1237, topProblemCarrier: '鑫达运输' },
  { date: '10-12', totalShipments: 112, onTimeCount: 99, delayedCount: 8, exceptionCount: 5, totalFreight: 139200, avgCost: 1243, topProblemCarrier: '鑫达运输' },
  { date: '10-13', totalShipments: 78, onTimeCount: 68, delayedCount: 6, exceptionCount: 4, totalFreight: 94600, avgCost: 1213, topProblemCarrier: '安捷快运' }
]

// ============ 运费对账 ============
export const billings: BillingRecord[] = [
  { id: 'b1', shipmentId: 'WB20261012001', carrierId: 'c1', contractRate: 1200, billedAmount: 1460, accessorial: 80, diff: 180, status: 'overcharge', billedAt: '2026-10-12' },
  { id: 'b2', shipmentId: 'WB20261012002', carrierId: 'c4', contractRate: 1280, billedAmount: 2100, accessorial: 150, diff: 670, status: 'overcharge', billedAt: '2026-10-12' },
  { id: 'b3', shipmentId: 'WB20261012004', carrierId: 'c3', contractRate: 920, billedAmount: 1080, accessorial: 60, diff: 100, status: 'matched', billedAt: '2026-10-12' },
  { id: 'b4', shipmentId: 'WB20261012005', carrierId: 'c5', contractRate: 800, billedAmount: 2430, accessorial: 180, diff: 1450, status: 'duplicate', billedAt: '2026-10-12' },
  { id: 'b5', shipmentId: 'WB20261012008', carrierId: 'c2', contractRate: 1050, billedAmount: 1770, accessorial: 90, diff: 630, status: 'overcharge', billedAt: '2026-10-12' },
  { id: 'b6', shipmentId: 'WB20261012010', carrierId: 'c4', contractRate: 1280, billedAmount: 1430, accessorial: 50, diff: 100, status: 'matched', billedAt: '2026-10-12' },
  { id: 'b7', shipmentId: 'WB20261012013', carrierId: 'c2', contractRate: 1050, billedAmount: 2210, accessorial: 320, diff: 840, status: 'overcharge', billedAt: '2026-10-12' },
  { id: 'b8', shipmentId: 'WB20261012016', carrierId: 'c1', contractRate: 1200, billedAmount: 1275, accessorial: 55, diff: 20, status: 'matched', billedAt: '2026-10-12' },
  { id: 'b9', shipmentId: 'WB20261012019', carrierId: 'c5', contractRate: 800, billedAmount: 2090, accessorial: 280, diff: 1010, status: 'duplicate', billedAt: '2026-10-12' },
  { id: 'b10', shipmentId: 'WB20261012020', carrierId: 'c4', contractRate: 1280, billedAmount: 0, accessorial: 0, diff: 0, status: 'pending', billedAt: '2026-10-13' }
]

// ============ 智能调度配载 ============
export const dispatches: DispatchTask[] = [
  { id: 'd1', vehicleId: '粤A·8K321', vehicleType: '厢式 9.6m', capacity: 18, load: 15.2, route: '广州 → 上海', status: 'dispatched', shipmentIds: ['WB20261012001', 'WB20261012006'] },
  { id: 'd2', vehicleId: '粤B·3M775', vehicleType: '厢式 9.6m', capacity: 18, load: 12.6, route: '深圳 → 北京', status: 'loading', shipmentIds: ['WB20261012002', 'WB20261012009'] },
  { id: 'd3', vehicleId: '浙A·6H402', vehicleType: '冷藏 7.6m', capacity: 12, load: 9.8, route: '杭州 → 成都', status: 'dispatched', shipmentIds: ['WB20261012003', 'WB20261012013'] },
  { id: 'd4', vehicleId: '沪B·2G901', vehicleType: '厢式 7.6m', capacity: 12, load: 8.4, route: '上海 → 武汉', status: 'loading', shipmentIds: ['WB20261012004'] },
  { id: 'd5', vehicleId: '苏E·5N188', vehicleType: '高栏 13m', capacity: 32, load: 18.6, route: '苏州 → 重庆', status: 'waiting', shipmentIds: ['WB20261012005', 'WB20261012011'] },
  { id: 'd6', vehicleId: '豫A·9P566', vehicleType: '厢式 7.6m', capacity: 12, load: 7.1, route: '郑州 → 西安', status: 'waiting', shipmentIds: ['WB20261012007', 'WB20261012014'] },
  { id: 'd7', vehicleId: '粤A·7D234', vehicleType: '厢式 9.6m', capacity: 18, load: 0, route: '待派', status: 'empty', shipmentIds: [] },
  { id: 'd8', vehicleId: '京A·1F890', vehicleType: '冷藏 9.6m', capacity: 18, load: 0, route: '待派', status: 'empty', shipmentIds: [] }
]

// ============ 碳排放 ============
export const carbons: CarbonRecord[] = [
  { id: 'c1', lane: '广州 → 上海', mode: 'road', distance: 1450, weight: 1250, fuel: 380, co2: 980 },
  { id: 'c2', lane: '深圳 → 北京', mode: 'road', distance: 2150, weight: 860, fuel: 460, co2: 1186 },
  { id: 'c3', lane: '杭州 → 成都', mode: 'road', distance: 1900, weight: 2100, fuel: 520, co2: 1340 },
  { id: 'c4', lane: '上海 → 武汉', mode: 'road', distance: 820, weight: 3200, fuel: 240, co2: 620 },
  { id: 'c5', lane: '苏州 → 重庆', mode: 'rail', distance: 1650, weight: 1450, fuel: 0, co2: 380 },
  { id: 'c6', lane: '郑州 → 西安', mode: 'rail', distance: 480, weight: 3300, fuel: 0, co2: 150 },
  { id: 'c7', lane: '上海 → 武汉', mode: 'water', distance: 1050, weight: 2600, fuel: 0, co2: 210 },
  { id: 'c8', lane: '深圳 → 北京', mode: 'water', distance: 2300, weight: 1900, fuel: 0, co2: 460 }
]
