// ============ AI 大模型配置 ============
// 配置优先级：页面配置（localStorage）> 环境变量（.env）
// 用户可在页面「AI 设置」里直接填 Key，无需改代码/重新构建。

import { ref } from 'vue'

export interface AISettings {
  provider: 'deepseek' | 'qwen'
  apiKey: string
  baseUrl: string
  model: string
}

const STORAGE_KEY = 'logistics_ai_settings'

export const PROVIDER_PRESETS: Record<
  AISettings['provider'],
  { label: string; baseUrl: string; model: string }
> = {
  deepseek: { label: 'DeepSeek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  qwen: {
    label: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus'
  }
}

// 从环境变量读取默认值（兜底）
function getEnvDefaults(): AISettings {
  const provider = (import.meta.env.VITE_AI_PROVIDER as string) || 'deepseek'
  if (provider === 'qwen') {
    return {
      provider: 'qwen',
      apiKey: (import.meta.env.VITE_QWEN_API_KEY as string) || '',
      baseUrl: (import.meta.env.VITE_QWEN_BASE_URL as string) || PROVIDER_PRESETS.qwen.baseUrl,
      model: (import.meta.env.VITE_QWEN_MODEL as string) || PROVIDER_PRESETS.qwen.model
    }
  }
  return {
    provider: 'deepseek',
    apiKey: (import.meta.env.VITE_DEEPSEEK_API_KEY as string) || '',
    baseUrl: (import.meta.env.VITE_DEEPSEEK_BASE_URL as string) || PROVIDER_PRESETS.deepseek.baseUrl,
    model: (import.meta.env.VITE_DEEPSEEK_MODEL as string) || PROVIDER_PRESETS.deepseek.model
  }
}

// 从 localStorage 读取页面配置
function loadFromStorage(): AISettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return { ...getEnvDefaults(), ...parsed }
    }
    return null
  } catch {
    return null
  }
}

// 当前生效的配置（响应式，供设置面板绑定）
export const aiSettings = ref<AISettings>(loadFromStorage() ?? getEnvDefaults())

export function hasAIConfigured(): boolean {
  return !!aiSettings.value.apiKey
}

// 保存页面配置到 localStorage
export function saveAISettings(s: AISettings) {
  aiSettings.value = { ...s }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    /* 忽略存储失败（隐私模式等） */
  }
}

// 清除页面配置，回退到环境变量
export function clearAISettings() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  aiSettings.value = getEnvDefaults()
}

/**
 * 调用大模型生成文本（OpenAI 兼容接口）
 */
export async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const cfg = aiSettings.value
  if (!cfg.apiKey) {
    throw new Error('未配置 AI Key，请点击右上角「AI 设置」填入 DeepSeek 或通义千问的 API Key')
  }
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3
    })
  })
  if (!res.ok) {
    throw new Error(`AI 调用失败：HTTP ${res.status}`)
  }
  const json = await res.json()
  return json.choices?.[0]?.message?.content ?? ''
}

/**
 * 多轮对话调用（支持完整 messages 数组）
 */
export async function callLLMChat(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const cfg = aiSettings.value
  if (!cfg.apiKey) {
    throw new Error('未配置 AI Key，请点击右上角「AI 设置」填入 DeepSeek 或通义千问的 API Key')
  }
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature: 0.3
    })
  })
  if (!res.ok) {
    throw new Error(`AI 调用失败：HTTP ${res.status}`)
  }
  const json = await res.json()
  return json.choices?.[0]?.message?.content ?? ''
}
