<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Timer } from '@element-plus/icons-vue'
import { api } from '@/api'
import type { Lane } from '@/types'

const lanes = ref<Lane[]>([])

onMounted(async () => {
  lanes.value = await api.getLanes()
})

function delayRate(l: Lane): number {
  return Math.round(((l.avgActualHours - l.standardHours) / l.standardHours) * 100)
}
</script>

<template>
  <div class="page">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">
          <el-icon class="pt-icon"><Timer /></el-icon>
          线路时效达标分析
          <span class="pt-sub">超时幅度 =(实际时效 - 标准时效)/ 标准时效</span>
        </div>
      </div>
      <el-table :data="lanes" style="width: 100%" size="small">
        <el-table-column prop="name" label="线路" width="160" />
        <el-table-column prop="standardHours" label="标准时效(小时)" width="140" />
        <el-table-column prop="avgActualHours" label="实际平均时效(小时)" width="160" />
        <el-table-column label="超时幅度" width="120">
          <template #default="{ row }">
            <span :style="{ color: delayRate(row) > 20 ? 'var(--up)' : 'var(--down)', fontWeight: 600 }">
              +{{ delayRate(row) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column label="达标情况" width="110">
          <template #default="{ row }">
            <el-tag :type="delayRate(row) > 20 ? 'danger' : 'success'" size="small">
              {{ delayRate(row) > 20 ? '超时严重' : '基本达标' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="avgCost" label="平均成本(元)" width="130" />
        <el-table-column prop="volume" label="运量(票)" />
      </el-table>
    </div>
    <div class="note">红色代表该线路是延误热点，建议优先排查承运商与线路原因。</div>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.note {
  font-size: 12px;
  color: var(--text-dim);
}
</style>
