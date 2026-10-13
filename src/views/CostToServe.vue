<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Money, Coin, Tickets, PieChart, Histogram } from '@element-plus/icons-vue'
import { api } from '@/api'
import StatCard from '@/components/StatCard.vue'
import type { Lane } from '@/types'

const lanes = ref<Lane[]>([])

onMounted(async () => {
  lanes.value = await api.getLanes()
})

const totalCost = computed(() => lanes.value.reduce((s, l) => s + l.avgCost * l.volume, 0))
const avgCost = computed(() =>
  lanes.value.length ? Math.round(lanes.value.reduce((s, l) => s + l.avgCost, 0) / lanes.value.length) : 0
)
const totalVolume = computed(() => lanes.value.reduce((s, l) => s + l.volume, 0))

const costStructure = [
  { name: '运输', value: 52 },
  { name: '仓储', value: 18 },
  { name: '装卸', value: 12 },
  { name: '包装', value: 8 },
  { name: '赔付', value: 10 }
]
</script>

<template>
  <div class="page">
    <div class="kpi-row">
      <StatCard label="线路总成本" :value="(totalCost / 10000).toFixed(1)" unit="万元" color="#38bdf8" :icon="Money" />
      <StatCard label="平均单均成本" :value="avgCost" unit="元" color="#fbbf24" :icon="Coin" />
      <StatCard label="总运量" :value="totalVolume" unit="票" color="#34d399" :icon="Tickets" />
    </div>

    <div class="chart-row">
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">
            <el-icon class="pt-icon"><PieChart /></el-icon>
            成本结构占比
          </div>
        </div>
        <el-table :data="costStructure" size="small">
          <el-table-column prop="name" label="成本项" width="120" />
          <el-table-column label="占比">
            <template #default="{ row }">
              <div class="bar-wrap">
                <div class="bar" :style="{ width: row.value * 2 + '%' }"></div>
                <span class="bar-text">{{ row.value }}%</span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">
            <el-icon class="pt-icon"><Histogram /></el-icon>
            线路成本排行
            <span class="pt-sub">按单均成本降序</span>
          </div>
        </div>
        <el-table :data="[...lanes].sort((a, b) => b.avgCost - a.avgCost)" size="small">
          <el-table-column prop="name" label="线路" />
          <el-table-column prop="avgCost" label="单均成本(元)" width="130" sortable />
          <el-table-column prop="volume" label="运量" width="90" />
        </el-table>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">
          <el-icon class="pt-icon"><Histogram /></el-icon>
          线路成本明细
        </div>
      </div>
      <el-table :data="lanes" style="width: 100%" size="small">
        <el-table-column prop="name" label="线路" width="160" />
        <el-table-column prop="avgCost" label="平均成本(元)" width="130" />
        <el-table-column prop="volume" label="运量(票)" width="110" />
        <el-table-column prop="standardHours" label="标准时效(小时)" width="140" />
        <el-table-column prop="avgActualHours" label="实际时效(小时)" width="140" />
      </el-table>
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
.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.bar-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bar {
  height: 10px;
  background: linear-gradient(90deg, var(--primary), var(--primary-deep));
  border-radius: 5px;
  box-shadow: 0 0 8px var(--primary-glow);
}
.bar-text {
  font-size: 12px;
  color: var(--text-sub);
}

/* ---------- 响应式 ---------- */
@media (max-width: 1024px) {
  .chart-row {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .kpi-row {
    grid-template-columns: 1fr;
  }
}
</style>
