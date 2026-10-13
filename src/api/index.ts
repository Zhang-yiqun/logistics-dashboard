// ============ 数据访问层 ============
// 当前返回 mock 数据；未来接入真实数据源时，只需替换本文件的实现，
// 保持函数签名不变，上层组件无需改动。

import { billings, carbons, carriers, dailyKpis, dispatches, exceptions, lanes, shipments } from '@/mock'
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

function delay<T>(data: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}

export const api = {
  getShipments(): Promise<Shipment[]> {
    return delay(shipments)
  },
  getCarriers(): Promise<Carrier[]> {
    return delay(carriers)
  },
  getLanes(): Promise<Lane[]> {
    return delay(lanes)
  },
  getExceptions(): Promise<ExceptionRecord[]> {
    return delay(exceptions)
  },
  getDailyKpis(): Promise<DailyKPI[]> {
    return delay(dailyKpis)
  },
  getBillings(): Promise<BillingRecord[]> {
    return delay(billings)
  },
  getDispatches(): Promise<DispatchTask[]> {
    return delay(dispatches)
  },
  getCarbons(): Promise<CarbonRecord[]> {
    return delay(carbons)
  }
}
