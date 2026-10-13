<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { MagicStick, List } from '@element-plus/icons-vue'
import { api } from '@/api'
import { callLLM } from '@/config/ai.config'
import { renderMarkdown } from '@/utils/markdown'
import {
  EXCEPTION_SEVERITY_TEXT,
  EXCEPTION_TYPE_TEXT,
  type ExceptionRecord,
  type ExceptionSeverity,
  type ExceptionType,
  type Shipment
} from '@/types'

const exceptions = ref<ExceptionRecord[]>([])
const shipments = ref<Shipment[]>([])
const loading = ref(false)
const aiInsight = ref('')
const aiError = ref('')

const openCount = computed(() => exceptions.value.filter((e) => e.status === 'open').length)
const aiInsightHtml = computed(() => renderMarkdown(aiInsight.value))

const severityTagType: Record<ExceptionSeverity, string> = {
  high: 'danger',
  medium: 'warning',
  low: 'info'
}

const statusText: Record<string, string> = {
  open: '待处理',
  processing: '处理中',
  closed: '已闭环'
}

onMounted(async () => {
  const [e, s] = await Promise.all([api.getExceptions(), api.getShipments()])
  exceptions.value = e
  shipments.value = s
})

function shipmentById(id: string) {
  return shipments.value.find((s) => s.id === id)
}

// AI-1 异常自动归因
async function generateInsight() {
  loading.value = true
  aiError.value = ''
  try {
    const data = exceptions.value.map((e) => {
      const s = shipmentById(e.shipmentId)
      return {
        运单号: e.shipmentId,
        异常类型: EXCEPTION_TYPE_TEXT[e.type],
        严重度: EXCEPTION_SEVERITY_TEXT[e.severity],
        责任方: e.responsible,
        线路: s?.lane ?? '-',
        货主: s?.shipper ?? '-',
        发生时间: e.occurredAt,
        状态: statusText[e.status],
        已知根因: e.rootCause ?? '待分析'
      }
    })
    const system = '你是物流运营分析专家，擅长从异常数据中识别根因模式并给出可执行的改进建议。'
    const user =
      `以下是本周的异常运单数据（JSON 数组）：\n${JSON.stringify(data, null, 2)}\n\n` +
      `请分析：\n1. 异常总量与类型分布\n2. 按承运商/线路归因，找出主要问题环节\n3. 识别最主要的根因模式\n4. 给出 3 条可执行的改进建议\n\n` +
      `要求：用中文输出 Markdown 格式，使用 ## 小标题、**加粗** 和 - 要点，控制在 400 字以内。`
    aiInsight.value = await callLLM(system, user)
  } catch (err) {
    aiError.value = err instanceof Error ? err.message : 'AI 调用失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <!-- AI 洞察 -->
    <div class="panel ai-panel">
      <div class="panel-header">
        <div class="panel-title">
          <el-icon class="pt-icon"><MagicStick /></el-icon>
          AI 异常洞察
        </div>
        <el-button size="small" type="primary" :loading="loading" @click="generateInsight">
          生成归因分析
        </el-button>
      </div>

      <el-alert v-if="aiError" :title="aiError" type="warning" :closable="false" show-icon />
      <p v-if="aiError" class="hint">
        提示：点击右上角「AI 设置」填入 DeepSeek 或通义千问的 API Key 后即可生成。
      </p>
      <div v-else-if="aiInsight" class="ai-body" v-html="aiInsightHtml"></div>
      <p v-else class="ai-placeholder">点击「生成归因分析」，AI 将自动总结本周异常根因与改进建议。</p>
    </div>

    <!-- 统计条 -->
    <div class="stat-bar">
      <el-tag size="large" type="danger">待处理：{{ openCount }}</el-tag>
      <el-tag size="large" type="info">异常总数：{{ exceptions.length }}</el-tag>
    </div>

    <!-- 异常列表 -->
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">
          <el-icon class="pt-icon"><List /></el-icon>
          异常管理队列
        </div>
      </div>
      <el-table :data="exceptions" style="width: 100%" size="small">
        <el-table-column prop="shipmentId" label="运单号" width="160" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ EXCEPTION_TYPE_TEXT[row.type as ExceptionType] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="严重度" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="severityTagType[row.severity as ExceptionSeverity]">
              {{ EXCEPTION_SEVERITY_TEXT[row.severity as ExceptionSeverity] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="responsible" label="责任方" width="170" />
        <el-table-column prop="occurredAt" label="发生时间" width="170" />
        <el-table-column prop="rootCause" label="根因" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">{{ statusText[row.status] }}</template>
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
.ai-panel {
  border-left: 3px solid var(--primary);
}
.ai-placeholder {
  color: var(--text-sub);
}
.hint {
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-sub);
  line-height: 1.6;
}
.stat-bar {
  display: flex;
  gap: 12px;
}

/* AI 内容渲染 */
.ai-body {
  line-height: 1.7;
  color: var(--text-main);
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
.ai-body :deep(.md-quote) {
  border-left: 3px solid var(--primary);
  padding-left: 10px;
  color: var(--text-sub);
  margin: 8px 0;
}
.ai-body :deep(.md-code) {
  background: var(--bg-secondary);
  padding: 1px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Courier New', monospace;
}
.ai-body :deep(strong) {
  font-weight: 600;
}
</style>
