<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { ChatDotRound, Close } from '@element-plus/icons-vue'
import { chatWithData, SUGGESTED_QUESTIONS, type ChatMessage } from '@/ai/chat'
import { renderMarkdown } from '@/utils/markdown'

const open = ref(false)
const messages = ref<ChatMessage[]>([])
const input = ref('')
const loading = ref(false)
const error = ref('')
const listEl = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
  if (open.value) scrollToBottom()
}

async function send(text?: string) {
  const q = (text ?? input.value).trim()
  if (!q || loading.value) return
  input.value = ''
  error.value = ''
  messages.value.push({ role: 'user', content: q })
  loading.value = true
  scrollToBottom()
  try {
    const answer = await chatWithData(q, messages.value)
    messages.value.push({ role: 'assistant', content: answer })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'AI 调用失败，请稍后重试'
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight
  })
}
</script>

<template>
  <!-- 浮动按钮 -->
  <button v-if="!open" class="fab" @click="toggle">
    <el-icon :size="22"><ChatDotRound /></el-icon>
  </button>

  <!-- 聊天面板 -->
  <div v-if="open" class="panel">
    <div class="panel-head">
      <div class="head-title">
        <el-icon class="head-icon"><ChatDotRound /></el-icon>
        AI 物流助手
      </div>
      <el-icon class="close" :size="18" @click="toggle"><Close /></el-icon>
    </div>

    <div ref="listEl" class="list">
      <div v-if="messages.length === 0" class="empty">
        <div class="empty-title">问我任何物流运营问题</div>
        <div class="suggests">
          <button v-for="s in SUGGESTED_QUESTIONS" :key="s" class="suggest" @click="send(s)">
            {{ s }}
          </button>
        </div>
      </div>

      <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">
        <div class="bubble" v-html="m.role === 'assistant' ? renderMarkdown(m.content) : m.content"></div>
      </div>

      <div v-if="loading" class="msg assistant">
        <div class="bubble typing">正在分析数据…</div>
      </div>

      <div v-if="error" class="error">{{ error }}</div>
    </div>

    <div class="input-bar">
      <el-input
        v-model="input"
        placeholder="输入问题，如：本周哪条线路最亏钱？"
        @keyup.enter="send()"
      />
      <el-button type="primary" :loading="loading" @click="send()">发送</el-button>
    </div>
  </div>
</template>

<style scoped>
.fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1px solid var(--border-strong);
  background: linear-gradient(135deg, var(--primary), var(--primary-deep));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 0 24px var(--primary-glow);
  z-index: 1000;
  transition: var(--transition);
}
.fab:hover {
  transform: scale(1.08);
  box-shadow: 0 0 32px var(--primary-glow);
}

.panel {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 380px;
  height: 560px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 48px);
  background: var(--panel-bg);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--panel-bg-light);
}
.head-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.head-icon {
  color: var(--primary);
}
.close {
  cursor: pointer;
  color: var(--text-sub);
}
.close:hover {
  color: var(--text-main);
}

.list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.empty-title {
  color: var(--text-sub);
  font-size: 13px;
  margin-bottom: 12px;
  text-align: center;
}
.suggests {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.suggest {
  text-align: left;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--panel-bg-light);
  color: var(--text-main);
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition);
}
.suggest:hover {
  border-color: var(--primary);
  background: rgba(56, 189, 248, 0.08);
}

.msg {
  margin-bottom: 12px;
  display: flex;
}
.msg.user {
  justify-content: flex-end;
}
.msg.assistant {
  justify-content: flex-start;
}
.bubble {
  max-width: 85%;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
}
.msg.user .bubble {
  background: linear-gradient(135deg, var(--primary), var(--primary-deep));
  color: #fff;
  border-bottom-right-radius: 4px;
}
.msg.assistant .bubble {
  background: var(--panel-bg-light);
  border: 1px solid var(--border);
  color: var(--text-main);
  border-bottom-left-radius: 4px;
}
.typing {
  color: var(--text-sub);
}
.error {
  color: var(--up);
  font-size: 12px;
  text-align: center;
  margin: 8px 0;
}

/* markdown 渲染 */
.bubble :deep(.md-h) {
  font-size: 14px;
  margin: 8px 0 4px;
}
.bubble :deep(.md-p) {
  margin: 4px 0;
}
.bubble :deep(.md-list) {
  margin: 4px 0;
  padding-left: 18px;
}
.bubble :deep(.md-list li) {
  margin: 2px 0;
}
.bubble :deep(strong) {
  font-weight: 600;
}

.input-bar {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
}
</style>
