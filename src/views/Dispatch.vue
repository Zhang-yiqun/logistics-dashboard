<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Van, MagicStick, Odometer } from '@element-plus/icons-vue'
import { api } from '@/api'
import { suggestDispatch } from '@/ai/insights'
import { renderMarkdown } from '@/utils/markdown'
import StatCard from '@/components/StatCard.vue'
import { DISPATCH_STATUS_TEXT, type DispatchTask, type DispatchStatus, type Shipment } from '@/types'

const dispatches = ref<DispatchTask[]>([])
const shipments = ref<Shipment[]>([])
const loading = ref(false)
const aiResult = ref('')
const aiError = ref('')
const aiHtml = computed(() => renderMarkdown(aiResult.value))

const emptyCount = computed(() => dispatches.value.filter((d) => d.status === 'empty').length)
const avgUtilization = computed(() => {
  const active = dispatches.value.filter((d) => d.status !== 'empty')
  if (active.length === 0) return 0
  return Math.round(active.reduce((s, d) => s + (d.load / d.capacity) * 100, 0) / active.length)
})

const statusTagType: Record<DispatchStatus, string> = {
  loading: 'primary',
  dispatched: 'success',
  waiting: 'warning',
  empty: 'info'
}

onMounted(async () => {
  const [d, s] = await Promise.all([api.getDispatches(), api.getShipments()])
  dispatches.value = d
  shipments.value = s
})

async function runSuggest() {
  loading.value = true
  aiError.value = ''
  aiResult.value = ''
  try {
    const pending = shipments.value.filter((s) => s.status === 'pending')
    aiResult.value = await suggestDispatch(dispatches.value, pending)
  } catch (err) {
    aiError.value = err instanceof Error ? err.message : 'AI 调用失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="kpi-row">
      <StatCard label="车辆总数" :value="dispatches.length" unit="辆" color="#38bdf8" :icon="Van" />
      <StatCard label="平均装载率" :value="avgUtilization" unit="%" color="#34d399" :icon="Odometer" />
      <StatCard label="空载车辆" :value="emptyCount" unit="辆" color="#fbbf24" :icon="Van" />
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">
          <el-icon class="pt-icon"><MagicStick /></el-icon>
          AI 配载建议
        </div>
        <el-button size="small" type="primary" :loading="loading" @click="runSuggest">生成配载建议</el-button>
      </div>
      <el-alert v-if="aiError" :title="aiError" type="warning" :closable="false" show-icon />
      <div v-else-if="aiResult" class="ai-body" v-html="aiHtml"></div>
      <p v-else class="placeholder">点击「生成配载建议」，AI 将给出合并配载、空载利用与线路优化建议。</p>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">
          <el-icon class="pt-icon"><Van /></el-icon>
          车辆调度状态
        </div>
      </div>
      <el-table :data="dispatches" style="width: 100%" size="small">
        <el-table-column prop="vehicleId" label="车牌号" width="130" />
        <el-table-column prop="vehicleType" label="车型" width="120" />
        <el-table-column prop="route" label="线路" width="140" />
        <el-table-column label="装载率" width="180">
          <template #default="{ row }">
            <el-progress
              :percentage="Math.round((row.load / row.capacity) * 100)"
              :stroke-width="8"
              :color="Math.round((row.load / row.capacity) * 100) > 80 ? '#34d399' : '#38bdf8'"
            />
          </template>
        </el-table-column>
        <el-table-column label="载重" width="110">
          <template #default="{ row }">{{ row.load }} / {{ row.capacity }} 吨</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTagType[row.status as DispatchStatus]">
              {{ DISPATCH_STATUS_TEXT[row.status as DispatchStatus] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="配载运单">
          <template #default="{ row }">
            <span v-if="row.shipmentIds.length">{{ row.shipmentIds.join('、') }}</span>
            <span v-else class="dim">—</span>
          </template>
        </el-table-column>
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
.placeholder {
  color: var(--text-sub);
}
.dim {
  color: var(--text-dim);
}
.ai-body {
  line-height: 1.7;
}
.ai-body :deep(.md-h) {
  font-size: 15px;
  margin: 10px 0 6px;
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
@media (max-width: 640px) {
  .kpi-row {
    grid-template-columns: 1fr;
  }
}
</style>
