// Vercel Serverless Function：AI 请求代理
// 作用：把前端对本模型的请求转发到 DeepSeek/通义，API Key 仅存于服务端环境变量，
//       永不暴露给浏览器。同时内置简易限流，防止演示站点被恶意刷额度。
//
// 部署：在 Vercel 项目 Settings → Environment Variables 配置：
//   AI_PROVIDER      deepseek | qwen   （默认 deepseek）
//   AI_API_KEY       你的真实 Key       （必填，切勿加 VITE_ 前缀）
//   AI_BASE_URL      可选，覆盖默认端点
//   AI_MODEL         可选，覆盖默认模型
//
// 前端只需调用 POST /api/chat，无需持有任何 Key。

export const config = { runtime: 'edge' }

// ---------- 简易内存限流（按 IP + 分钟窗口） ----------
// 注意：Serverless 实例重启后计数会重置，但这足以挡住普通爬虫与滥用。
// 如需强一致的限流，可接入 Upstash Redis 等外部存储。
const WINDOW_MS = 60 * 1000 // 1 分钟窗口
const MAX_REQ_PER_WINDOW = 6 // 每 IP 每分钟最多 6 次
const hits = new Map()

function rateLimit(ip) {
  const now = Date.now()
  const rec = hits.get(ip)
  if (!rec || now - rec.start > WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 })
    return { ok: true }
  }
  rec.count += 1
  if (rec.count > MAX_REQ_PER_WINDOW) {
    const retryAfter = Math.ceil((rec.start + WINDOW_MS - now) / 1000)
    return { ok: false, retryAfter }
  }
  return { ok: true }
}

// 控制内存不无限增长
function sweep() {
  const now = Date.now()
  for (const [ip, rec] of hits) {
    if (now - rec.start > WINDOW_MS * 5) hits.delete(ip)
  }
}

// ---------- Provider 预设 ----------
const PRESETS = {
  deepseek: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus'
  }
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405)
  }

  // 取客户端 IP（Vercel 会注入 x-forwarded-for）
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'

  sweep()
  const rl = rateLimit(ip)
  if (!rl.ok) {
    return json(
      { error: `请求过于频繁，请 ${rl.retryAfter} 秒后再试（演示站点限流 ${MAX_REQ_PER_WINDOW} 次/分钟）` },
      429,
      { 'Retry-After': String(rl.retryAfter) }
    )
  }

  // 读取服务端配置
  const provider = (process.env.AI_PROVIDER || 'deepseek').toLowerCase()
  const preset = PRESETS[provider] || PRESETS.deepseek
  const apiKey = process.env.AI_API_KEY || ''
  const baseUrl = process.env.AI_BASE_URL || preset.baseUrl
  const model = process.env.AI_MODEL || preset.model

  if (!apiKey) {
    return json(
      { error: '演示站点尚未配置 AI 服务，请在页面右上角「AI 设置」填入你自己的 API Key 后使用' },
      503
    )
  }

  // 解析请求体
  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: '请求体不是合法 JSON' }, 400)
  }

  const messages = body?.messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: '缺少 messages 字段' }, 400)
  }

  // 防御：限制单次请求规模，避免被当作免费算力
  const totalChars = messages.reduce(
    (n, m) => n + (typeof m?.content === 'string' ? m.content.length : 0),
    0
  )
  if (totalChars > 12000) {
    return json({ error: '请求内容过长（上限约 12000 字符）' }, 413)
  }

  // 转发到上游
  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: typeof body.temperature === 'number' ? body.temperature : 0.3,
        max_tokens: Math.min(body.max_tokens || 1024, 2048)
      })
    })

    const text = await upstream.text()
    if (!upstream.ok) {
      // 不把上游原始错误里的敏感信息透出
      let detail = ''
      try {
        detail = JSON.parse(text)?.error?.message || ''
      } catch {
        /* ignore */
      }
      return json(
        { error: `AI 服务返回错误（HTTP ${upstream.status}）${detail ? '：' + detail : ''}` },
        upstream.status === 401 ? 502 : upstream.status
      )
    }

    const data = JSON.parse(text)
    const content = data?.choices?.[0]?.message?.content ?? ''
    return json({ content })
  } catch (e) {
    return json({ error: `代理请求失败：${e?.message || '未知错误'}` }, 502)
  }
}

function json(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders
    }
  })
}
