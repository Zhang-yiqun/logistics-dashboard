<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import chinaGeo from '@/assets/china.json'
import {
  Document,
  Position,
  AlarmClock,
  Warning,
  Money,
  Location,
  PieChart,
  TrendCharts,
  WarningFilled,
  MagicStick,
  Aim
} from '@element-plus/icons-vue'
import { api } from '@/api'
import { useECharts } from '@/composables/useECharts'
import StatCard from '@/components/StatCard.vue'
import { generateDailyReport, predictDelayRisk } from '@/ai/insights'
import { renderMarkdown } from '@/utils/markdown'
import {
  EXCEPTION_TYPE_TEXT,
  SHIPMENT_STATUS_TEXT,
  type DailyKPI,
  type ExceptionRecord,
  type ExceptionType,
  type Shipment
} from '@/types'

// 注册合规中国地图（数据源：阿里云 DataV GeoAtlas）
// 注：南海诸岛/九段线附岛作为后续合规增强项（TODO）
echarts.registerMap('china', chinaGeo as any)

const cityCoords: Record<string, [number, number]> = {
  北京: [116.407, 39.904],
  上海: [121.474, 31.23],
  广州: [113.264, 23.129],
  深圳: [114.058, 22.543],
  杭州: [120.155, 30.274],
  成都: [104.066, 30.573],
  武汉: [114.305, 30.593],
  重庆: [106.551, 29.563],
  西安: [108.94, 34.341],
  郑州: [113.625, 34.746],
  苏州: [120.585, 31.299]
}

const shipments = ref<Shipment[]>([])
const exceptions = ref<ExceptionRecord[]>([])
const dailyKpis = ref<DailyKPI[]>([])

const trendEl = ref<HTMLElement | null>(null)
const pieEl = ref<HTMLElement | null>(null)
const mapEl = ref<HTMLElement | null>(null)
const { setOption: setTrend } = useECharts(trendEl)
const { setOption: setPie } = useECharts(pieEl)
const { setOption: setMap } = useECharts(mapEl)

const kpis = computed(() => {
  const list = shipments.value
  return {
    total: list.length,
    inTransit: list.filter((s) => s.status === 'in_transit').length,
    delayed: list.filter((s) => s.status === 'delayed').length,
    exception: list.filter((s) => s.status === 'exception').length,
    totalFreight: list.reduce((sum, s) => sum + s.freight + s.accessorial, 0)
  }
})

const topExceptions = computed(() =>
  [...exceptions.value]
    .filter((e) => e.status !== 'closed')
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 } as const
      return order[a.severity] - order[b.severity]
    })
    .slice(0, 5)
)

function shipmentById(id: string) {
  return shipments.value.find((s) => s.id === id)
}

// ===== AI-2 经营日报 / AI-4 风险扫描 =====
const reportVisible = ref(false)
const riskVisible = ref(false)
const reportLoading = ref(false)
const riskLoading = ref(false)
const reportText = ref('')
const riskText = ref('')
const reportError = ref('')
const riskError = ref('')
const reportHtml = computed(() => renderMarkdown(reportText.value))
const riskHtml = computed(() => renderMarkdown(riskText.value))

async function generateReport() {
  reportVisible.value = true
  reportLoading.value = true
  reportError.value = ''
  reportText.value = ''
  try {
    reportText.value = await generateDailyReport(dailyKpis.value, shipments.value)
  } catch (err) {
    reportError.value = err instanceof Error ? err.message : 'AI 调用失败，请稍后重试'
  } finally {
    reportLoading.value = false
  }
}

async function scanRisk() {
  riskVisible.value = true
  riskLoading.value = true
  riskError.value = ''
  riskText.value = ''
  try {
    const inTransit = shipments.value.filter((s) => s.status === 'in_transit')
    const lanes = await api.getLanes()
    riskText.value = await predictDelayRisk(inTransit, lanes)
  } catch (err) {
    riskError.value = err instanceof Error ? err.message : 'AI 调用失败，请稍后重试'
  } finally {
    riskLoading.value = false
  }
}

onMounted(async () => {
  const [s, e, d] = await Promise.all([
    api.getShipments(),
    api.getExceptions(),
    api.getDailyKpis()
  ])
  shipments.value = s
  exceptions.value = e
  dailyKpis.value = d
  renderTrend()
  renderPie()
  renderMap()
})

const AXIS_COLOR = '#7f97b5'
const SPLIT_COLOR = '#1d3a5c'
const TIP_BG = '#13263f'

function renderTrend() {
  const dates = dailyKpis.value.map((d) => d.date)
  const volumes = dailyKpis.value.map((d) => d.totalShipments)
  const onTimeRates = dailyKpis.value.map((d) =>
    Math.round((d.onTimeCount / d.totalShipments) * 100)
  )
  setTrend({
    tooltip: { trigger: 'axis', backgroundColor: TIP_BG, borderColor: SPLIT_COLOR, textStyle: { color: '#e8f1fc' } },
    legend: { data: ['运单量', '准点率'], textStyle: { color: AXIS_COLOR } },
    grid: { left: 40, right: 40, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: SPLIT_COLOR } }, axisLabel: { color: AXIS_COLOR } },
    yAxis: [
      { type: 'value', name: '运单量', nameTextStyle: { color: AXIS_COLOR }, axisLabel: { color: AXIS_COLOR }, splitLine: { lineStyle: { color: SPLIT_COLOR } } },
      { type: 'value', name: '准点率(%)', max: 100, nameTextStyle: { color: AXIS_COLOR }, axisLabel: { color: AXIS_COLOR }, splitLine: { lineStyle: { color: SPLIT_COLOR } } }
    ],
    series: [
      { name: '运单量', type: 'bar', data: volumes, itemStyle: { color: '#38bdf8' }, barWidth: 18 },
      { name: '准点率', type: 'line', yAxisIndex: 1, data: onTimeRates, itemStyle: { color: '#34d399' }, smooth: true }
    ]
  })
}

function renderPie() {
  const typeCount: Partial<Record<ExceptionType, number>> = {}
  exceptions.value.forEach((e) => {
    typeCount[e.type] = (typeCount[e.type] ?? 0) + 1
  })
  const data = Object.entries(typeCount).map(([k, v]) => ({
    name: EXCEPTION_TYPE_TEXT[k as ExceptionType],
    value: v
  }))
  setPie({
    tooltip: { trigger: 'item', backgroundColor: TIP_BG, borderColor: SPLIT_COLOR, textStyle: { color: '#e8f1fc' } },
    legend: { bottom: 0, textStyle: { color: AXIS_COLOR } },
    series: [{ type: 'pie', radius: ['40%', '68%'], data, label: { formatter: '{b}: {c}', color: AXIS_COLOR } }]
  })
}

function renderMap() {
  const nodeCount: Record<string, number> = {}
  const flowSet = new Set<string>()
  const flows: { coords: [number, number][] }[] = []

  shipments.value.forEach((s) => {
    nodeCount[s.origin] = (nodeCount[s.origin] ?? 0) + 1
    nodeCount[s.destination] = (nodeCount[s.destination] ?? 0) + 1
    const from = cityCoords[s.origin]
    const to = cityCoords[s.destination]
    if (!from || !to) return
    const key = `${s.origin}->${s.destination}`
    if (!flowSet.has(key)) {
      flowSet.add(key)
      flows.push({ coords: [from, to] })
    }
  })

  const nodes = Object.entries(nodeCount)
    .filter(([name]) => cityCoords[name])
    .map(([name, count]) => ({
      name,
      value: [...cityCoords[name], count] as [number, number, number]
    }))

  setMap({
    tooltip: {
      trigger: 'item',
      backgroundColor: TIP_BG,
      borderColor: SPLIT_COLOR,
      textStyle: { color: '#e8f1fc' },
      formatter: (p: any) => {
        if (p.seriesType === 'effectScatter') {
          return `${p.name}<br/>参与运单：${p.value[2]} 票`
        }
        return ''
      }
    },
    geo: {
      map: 'china',
      roam: true,
      zoom: 1.2,
      itemStyle: { areaColor: '#13263f', borderColor: '#2a4a6e', borderWidth: 0.6 },
      emphasis: { label: { show: true, color: '#e8f1fc' }, itemStyle: { areaColor: '#1d3a5c' } }
    },
    series: [
      {
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: nodes,
        symbolSize: (val: number[]) => Math.max(8, Math.min(24, val[2] * 4)),
        label: { show: true, position: 'right', formatter: '{b}', fontSize: 11, color: '#e8f1fc' },
        itemStyle: { color: '#38bdf8', shadowBlur: 10, shadowColor: 'rgba(56,189,248,0.6)' },
        rippleEffect: { brushType: 'stroke', scale: 3 },
        zlevel: 2
      },
      {
        type: 'lines',
        coordinateSystem: 'geo',
        data: flows,
        effect: { show: true, period: 5, trailLength: 0.25, symbol: 'arrow', symbolSize: 5 },
        lineStyle: { color: '#38bdf8', width: 1.5, opacity: 0.55, curveness: 0.2 },
        zlevel: 1
      }
    ]
  })
}
</script>

<template>
  <div class="page">
    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" :icon="MagicStick" :loading="reportLoading" @click="generateReport">
        生成经营日报
      </el-button>
      <el-button type="warning" :icon="Aim" :loading="riskLoading" @click="scanRisk">
        扫描延迟风险
      </el-button>
    </div>

    <!-- KPI 卡片 -->
    <div class="kpi-row">
      <StatCard label="今日运单总量" :value="kpis.total" unit="单" color="#38bdf8" :delta="5.2" :icon="Document" />
      <StatCard label="在途" :value="kpis.inTransit" unit="单" color="#38bdf8" :delta="3.1" :icon="Position" />
      <StatCard label="延迟" :value="kpis.delayed" unit="单" color="#f87171" :delta="-2.4" :icon="AlarmClock" />
      <StatCard label="异常" :value="kpis.exception" unit="单" color="#fbbf24" :delta="-1.1" :icon="Warning" />
      <StatCard label="总运费" :value="(kpis.totalFreight / 10000).toFixed(1)" unit="万元" color="#34d399" :delta="6.8" :icon="Money" />
    </div>

    <!-- 地图 + 异常分布 -->
    <div class="map-row">
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">
            <el-icon class="pt-icon"><Location /></el-icon>
            全国在途轨迹
            <span class="pt-sub">节点大小代表运单量 · 箭头为运输流向</span>
          </div>
        </div>
        <div ref="mapEl" class="chart map"></div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">
            <el-icon class="pt-icon"><PieChart /></el-icon>
            异常类型分布
          </div>
        </div>
        <div ref="pieEl" class="chart"></div>
      </div>
    </div>

    <!-- 趋势 -->
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">
          <el-icon class="pt-icon"><TrendCharts /></el-icon>
          近 7 天运单量与准点率
        </div>
      </div>
      <div ref="trendEl" class="chart trend"></div>
    </div>

    <!-- 异常速览 -->
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">
          <el-icon class="pt-icon"><WarningFilled /></el-icon>
          今日异常速览
          <span class="pt-sub">按严重度排序 Top 5</span>
        </div>
      </div>
      <el-table :data="topExceptions" style="width: 100%" size="small">
        <el-table-column label="运单号" width="160">
          <template #default="{ row }">{{ row.shipmentId }}</template>
        </el-table-column>
        <el-table-column label="异常类型" width="110">
          <template #default="{ row }">
            <el-tag size="small" type="danger">{{ EXCEPTION_TYPE_TEXT[row.type as ExceptionType] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="货主" width="120">
          <template #default="{ row }">{{ shipmentById(row.shipmentId)?.shipper ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="线路">
          <template #default="{ row }">{{ shipmentById(row.shipmentId)?.lane ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="责任方" width="160">
          <template #default="{ row }">{{ row.responsible }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'open' ? 'danger' : 'warning'">
              {{ row.status === 'open' ? '待处理' : '处理中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="根因">
          <template #default="{ row }">{{ row.rootCause ?? '-' }}</template>
        </el-table-column>
      </el-table>
    </div>

    <!-- AI-2 经营日报弹窗 -->
    <el-dialog v-model="reportVisible" title="AI 经营日报" width="640px">
      <div v-if="reportLoading" class="ai-loading">正在生成日报…</div>
      <el-alert v-else-if="reportError" :title="reportError" type="warning" :closable="false" show-icon />
      <div v-else-if="reportText" class="ai-body" v-html="reportHtml"></div>
    </el-dialog>

    <!-- AI-4 风险扫描弹窗 -->
    <el-dialog v-model="riskVisible" title="AI 延迟风险扫描" width="640px">
      <div v-if="riskLoading" class="ai-loading">正在扫描在途风险…</div>
      <el-alert v-else-if="riskError" :title="riskError" type="warning" :closable="false" show-icon />
      <div v-else-if="riskText" class="ai-body" v-html="riskHtml"></div>
    </el-dialog>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.toolbar {
  display: flex;
  gap: 12px;
}
.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}
.map-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 14px;
}
.chart {
  height: 300px;
}
.map {
  height: 480px;
}
.trend {
  height: 260px;
}

/* AI 弹窗 */
.ai-loading {
  padding: 20px;
  color: var(--text-sub);
}
.ai-body {
  line-height: 1.7;
  color: var(--text-main);
  max-height: 60vh;
  overflow-y: auto;
}
.ai-body :deep(.md-h) {
  font-size: 15px;
  margin: 10px 0 6px;
}
.ai-body :deep(.md-p) {
  margin: 6px 0;
}
.ai-body :deep(.md-list) {
  margin: 6px 0;
  padding-left: 20px;
}
.ai-body :deep(.md-list li) {
  margin: 3px 0;
}
.ai-body :deep(strong) {
  font-weight: 600;
}

/* ---------- 响应式 ---------- */
@media (max-width: 1280px) {
  .kpi-row {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 1024px) {
  .map-row {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .kpi-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
