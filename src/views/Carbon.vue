<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { WindPower, PieChart, Histogram } from '@element-plus/icons-vue'
import { api } from '@/api'
import { useECharts } from '@/composables/useECharts'
import StatCard from '@/components/StatCard.vue'
import { MODE_TEXT, type CarbonRecord } from '@/types'

const carbons = ref<CarbonRecord[]>([])
const barEl = ref<HTMLElement | null>(null)
const { setOption } = useECharts(barEl)

const totalCo2 = computed(() => carbons.value.reduce((s, c) => s + c.co2, 0))
const roadCo2 = computed(() =>
  carbons.value.filter((c) => c.mode === 'road').reduce((s, c) => s + c.co2, 0)
)
const greenCo2 = computed(() =>
  carbons.value.filter((c) => c.mode !== 'road').reduce((s, c) => s + c.co2, 0)
)
const roadRatio = computed(() =>
  totalCo2.value ? Math.round((roadCo2.value / totalCo2.value) * 100) : 0
)

onMounted(async () => {
  carbons.value = await api.getCarbons()
  renderBar()
})

function renderBar() {
  const lanes = [...new Set(carbons.value.map((c) => c.lane))]
  const data = lanes.map((lane) =>
    carbons.value.filter((c) => c.lane === lane).reduce((s, c) => s + c.co2, 0)
  )
  setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#13263f',
      borderColor: '#1d3a5c',
      textStyle: { color: '#e8f1fc' },
      formatter: '{b}<br/>碳排放：{c} kg'
    },
    grid: { left: 50, right: 30, top: 30, bottom: 40 },
    xAxis: {
      type: 'category',
      data: lanes,
      axisLine: { lineStyle: { color: '#1d3a5c' } },
      axisLabel: { color: '#7f97b5', interval: 0, rotate: 20 }
    },
    yAxis: {
      type: 'value',
      name: '碳排(kg)',
      nameTextStyle: { color: '#7f97b5' },
      axisLabel: { color: '#7f97b5' },
      splitLine: { lineStyle: { color: '#1d3a5c' } }
    },
    series: [
      {
        type: 'bar',
        data,
        barWidth: 26,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#34d399' },
              { offset: 1, color: '#0d9488' }
            ]
          }
        }
      }
    ]
  })
}
</script>

<template>
  <div class="page">
    <div class="kpi-row">
      <StatCard label="总碳排放" :value="(totalCo2 / 1000).toFixed(2)" unit="吨" color="#34d399" :icon="WindPower" />
      <StatCard label="公路碳排占比" :value="roadRatio" unit="%" color="#fbbf24" :icon="PieChart" />
      <StatCard label="绿色运输碳排" :value="(greenCo2 / 1000).toFixed(2)" unit="吨" color="#34d399" :icon="WindPower" />
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">
          <el-icon class="pt-icon"><Histogram /></el-icon>
          线路碳排放
          <span class="pt-sub">按线路汇总 CO₂ 排放量</span>
        </div>
      </div>
      <div ref="barEl" class="chart"></div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">
          <el-icon class="pt-icon"><PieChart /></el-icon>
          运输方式明细
        </div>
      </div>
      <el-table :data="carbons" style="width: 100%" size="small">
        <el-table-column prop="lane" label="线路" width="160" />
        <el-table-column label="运输方式" width="110">
          <template #default="{ row }">{{ MODE_TEXT[row.mode] }}</template>
        </el-table-column>
        <el-table-column prop="distance" label="距离(km)" width="110" />
        <el-table-column prop="weight" label="货重(吨)" width="110" />
        <el-table-column prop="co2" label="碳排放(kg)" width="120" />
        <el-table-column label="碳排强度">
          <template #default="{ row }">
            {{ (row.co2 / (row.distance * row.weight / 1000)).toFixed(2) }} kg/吨·千km
          </template>
        </el-table-column>
      </el-table>
      <div class="note">绿色运输（铁路/水路）碳排强度显著低于公路，建议大宗干线优先多式联运。</div>
    </div>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.kpi-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.chart {
  height: 320px;
}
.note {
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-dim);
}
@media (max-width: 640px) {
  .kpi-row {
    grid-template-columns: 1fr;
  }
}
</style>
