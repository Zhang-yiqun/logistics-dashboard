// ============ AI 大模型配置 ============
// 工作模式（自动检测）：
//   1) 代理模式：部署环境提供了 /api/chat（Vercel Serverless Function），
//      Key 存服务端，前端无需持有任何 Key，打开即用。优先使用。
//   2) 自带 Key 模式：用户在页面「AI 设置」里填入自己的 Key（存 localStorage）。
//      本地开发 / 未部署代理时的兜底方案。
// 用户在页面填了 Key 时，仍以用户配置为准（方便买家用自己的额度）。

import { ref } from 'vue'

export interface AISettings {
  provider: 'deepseek' | 'qwen'
  apiKey: string
  baseUrl: string
  model: string
}

const STORAGE_KEY = 'logistics_ai_settings'
const PROXY_ENDPOINT = '/api/chat'

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

// ============ 代理可用性探测 ============
// 部署环境存在 /api/chat 时返回 true。探测结果缓存，避免重复请求。
export const proxyAvailable = ref(false)

let proxyProbed = false
export async function probeProxy(): Promise<boolean> {
  if (proxyProbed) return proxyAvailable.value
  proxyProbed = true
  try {
    const res = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }) // 空 messages 会得到 400，但足以证明端点存在
    })
    // 只要不是 404（HTML 页面/未部署），就认为代理可用
    proxyAvailable.value = res.status !== 404 && res.status !== 405
  } catch {
    proxyAvailable.value = false
  }
  return proxyAvailable.value
}

/** AI 是否可用：用户填了 Key，或部署环境提供了代理 */
export function isAIReady(): boolean {
  return !!aiSettings.value.apiKey || proxyAvailable.value
}

/** 走代理调用（Key 在服务端） */
async function callViaProxy(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  temperature = 0.3
): Promise<string> {
  const res = await fetch(PROXY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, temperature })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error || `AI 调用失败：HTTP ${res.status}`)
  }
  return data?.content ?? ''
}

/**
 * 调用大模型生成文本（OpenAI 兼容接口）
 * 优先使用用户自填 Key；未填时回退到部署环境的代理函数。
 */
export async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const cfg = aiSettings.value
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt }
  ]

  if (!cfg.apiKey) {
    if (proxyAvailable.value || (await probeProxy())) {
      return callViaProxy(messages)
    }
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

/**
 * 多轮对话调用（支持完整 messages 数组）
 * 优先使用用户自填 Key；未填时回退到部署环境的代理函数。
 */
export async function callLLMChat(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const cfg = aiSettings.value

  if (!cfg.apiKey) {
    if (proxyAvailable.value || (await probeProxy())) {
      return callViaProxy(messages)
    }
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
