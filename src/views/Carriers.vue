<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { DataAnalysis, MagicStick, Grid } from '@element-plus/icons-vue'
import { api } from '@/api'
import { reviewCarrier } from '@/ai/insights'
import { renderMarkdown } from '@/utils/markdown'
import type { Carrier } from '@/types'

const carriers = ref<Carrier[]>([])
const selected = ref<Carrier | null>(null)
const aiComment = ref('')
const loading = ref(false)
const aiError = ref('')

const aiCommentHtml = computed(() => renderMarkdown(aiComment.value))

onMounted(async () => {
  carriers.value = await api.getCarriers()
})

function isGood(v: number, type: 'onTime' | 'exception' | 'claim') {
  if (type === 'onTime') return v >= 88
  return v <= 6
}

// AI-3 承运商绩效自动点评
async function selectCarrier(c: Carrier) {
  selected.value = c
  aiComment.value = ''
  aiError.value = ''
  loading.value = true
  try {
    aiComment.value = await reviewCarrier(c)
  } catch (err) {
    aiError.value = err instanceof Error ? err.message : 'AI 调用失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <!-- 评分卡 -->
    <div class="card-grid">
      <div
        v-for="c in carriers"
        :key="c.id"
        class="carrier-card"
        :class="{ active: selected?.id === c.id }"
        @click="selectCarrier(c)"
      >
        <div class="carrier-name">{{ c.name }}</div>
        <div class="metric">
          <span class="k">准点率</span>
          <span class="v" :class="isGood(c.onTimeRate, 'onTime') ? 'good' : 'bad'">{{ c.onTimeRate }}%</span>
        </div>
        <div class="metric">
          <span class="k">异常率</span>
          <span class="v" :class="isGood(c.exceptionRate, 'exception') ? 'good' : 'bad'">{{ c.exceptionRate }}%</span>
        </div>
        <div class="metric">
          <span class="k">赔付率</span>
          <span class="v" :class="isGood(c.claimRate, 'claim') ? 'good' : 'bad'">{{ c.claimRate }}%</span>
        </div>
        <div class="metric">
          <span class="k">单均成本</span>
          <span class="v normal">¥{{ c.avgCostPerShipment }}</span>
        </div>
      </div>
    </div>

    <!-- AI 点评 -->
    <div v-if="selected" class="panel ai-panel">
      <div class="panel-header">
        <div class="panel-title">
          <el-icon class="pt-icon"><MagicStick /></el-icon>
          AI 绩效点评 · {{ selected.name }}
        </div>
      </div>
      <div v-if="loading" class="loading" v-loading="true"></div>
      <el-alert v-else-if="aiError" :title="aiError" type="warning" :closable="false" show-icon />
      <div v-else-if="aiComment" class="comment" v-html="aiCommentHtml"></div>
    </div>

    <!-- 明细表 -->
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">
          <el-icon class="pt-icon"><Grid /></el-icon>
          承运商明细
        </div>
      </div>
      <el-table :data="carriers" style="width: 100%" size="small">
        <el-table-column prop="name" label="承运商" width="140" />
        <el-table-column prop="onTimeRate" label="准点率(%)" width="110" />
        <el-table-column prop="exceptionRate" label="异常率(%)" width="110" />
        <el-table-column prop="claimRate" label="赔付率(%)" width="110" />
        <el-table-column prop="avgCostPerShipment" label="单均成本(元)" width="120" />
        <el-table-column prop="contractRate" label="合同费率(元/票)" width="130" />
        <el-table-column prop="shipmentsThisMonth" label="本月运单量" />
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
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 14px;
}
.carrier-card {
  background: linear-gradient(135deg, var(--panel-bg-light), var(--panel-bg));
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 18px;
  cursor: pointer;
  box-shadow: var(--shadow-card);
  transition: var(--transition);
}
.carrier-card:hover {
  transform: translateY(-3px);
  border-color: var(--border-strong);
  box-shadow: var(--shadow-card-hover);
}
.carrier-card.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 1px var(--primary), 0 8px 26px rgba(56, 189, 248, 0.25);
}
.carrier-name {
  font-weight: 700;
  margin-bottom: 12px;
}
.metric {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
}
.metric .k {
  color: var(--text-sub);
}
.good {
  color: var(--down);
  font-weight: 600;
}
.bad {
  color: var(--up);
  font-weight: 600;
}
.normal {
  color: var(--text-main);
  font-weight: 600;
}
.ai-panel {
  border-left: 3px solid var(--primary);
}
.loading {
  height: 40px;
}
.comment {
  line-height: 1.7;
}
.comment :deep(.md-h) {
  font-size: 15px;
  margin: 10px 0 6px;
}
.comment :deep(.md-p) {
  margin: 6px 0;
}
.comment :deep(.md-list) {
  margin: 6px 0;
  padding-left: 20px;
}
.comment :deep(.md-list li) {
  margin: 3px 0;
}
.comment :deep(strong) {
  font-weight: 600;
}
</style>
