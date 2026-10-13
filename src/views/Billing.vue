<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Coin, WarningFilled, MagicStick, List } from '@element-plus/icons-vue'
import { api } from '@/api'
import { auditBilling } from '@/ai/insights'
import { renderMarkdown } from '@/utils/markdown'
import StatCard from '@/components/StatCard.vue'
import { BILLING_STATUS_TEXT, type BillingRecord, type BillingStatus, type Carrier } from '@/types'

const billings = ref<BillingRecord[]>([])
const carriers = ref<Carrier[]>([])
const loading = ref(false)
const aiResult = ref('')
const aiError = ref('')
const aiHtml = computed(() => renderMarkdown(aiResult.value))

const badCount = computed(
  () => billings.value.filter((b) => b.status === 'overcharge' || b.status === 'duplicate').length
)
const recoverable = computed(() =>
  billings.value
    .filter((b) => b.status === 'overcharge' || b.status === 'duplicate')
    .reduce((s, b) => s + b.diff, 0)
)

const carrierMap = computed(() => {
  const map: Record<string, string> = {}
  carriers.value.forEach((c) => (map[c.id] = c.name))
  return map
})

const statusTagType: Record<BillingStatus, string> = {
  matched: 'success',
  overcharge: 'danger',
  duplicate: 'warning',
  pending: 'info'
}

onMounted(async () => {
  const [b, c] = await Promise.all([api.getBillings(), api.getCarriers()])
  billings.value = b
  carriers.value = c
})

async function runAudit() {
  loading.value = true
  aiError.value = ''
  aiResult.value = ''
  try {
    aiResult.value = await auditBilling(billings.value, carriers.value)
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
      <StatCard label="账单总数" :value="billings.length" unit="笔" color="#38bdf8" :icon="List" />
      <StatCard label="多收 / 重复计费" :value="badCount" unit="笔" color="#f87171" :icon="WarningFilled" />
      <StatCard label="可追回金额" :value="(recoverable / 10000).toFixed(2)" unit="万元" color="#fbbf24" :icon="Coin" />
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">
          <el-icon class="pt-icon"><MagicStick /></el-icon>
          AI 发票审计
        </div>
        <el-button size="small" type="primary" :loading="loading" @click="runAudit">开始审计</el-button>
      </div>
      <el-alert v-if="aiError" :title="aiError" type="warning" :closable="false" show-icon />
      <div v-else-if="aiResult" class="ai-body" v-html="aiHtml"></div>
      <p v-else class="placeholder">点击「开始审计」，AI 将识别多收、重复计费与异常附加费，并估算可追回金额。</p>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">
          <el-icon class="pt-icon"><List /></el-icon>
          账单明细
        </div>
      </div>
      <el-table :data="billings" style="width: 100%" size="small">
        <el-table-column prop="shipmentId" label="运单号" width="160" />
        <el-table-column label="承运商" width="120">
          <template #default="{ row }">{{ carrierMap[row.carrierId] ?? row.carrierId }}</template>
        </el-table-column>
        <el-table-column prop="contractRate" label="合同费率(元)" width="120" />
        <el-table-column prop="billedAmount" label="账单金额(元)" width="120" />
        <el-table-column prop="accessorial" label="附加费(元)" width="110" />
        <el-table-column label="差异(元)" width="110">
          <template #default="{ row }">
            <span :style="{ color: row.diff > 0 ? 'var(--up)' : 'var(--text-main)', fontWeight: 600 }">
              {{ row.diff > 0 ? '+' : '' }}{{ row.diff }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="对账状态" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTagType[row.status as BillingStatus]">
              {{ BILLING_STATUS_TEXT[row.status as BillingStatus] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="billedAt" label="账单日期" />
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
