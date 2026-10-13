// 极简 Markdown 渲染（够用即可，不引入第三方依赖）
// 支持：# 标题、**加粗**、`行内代码`、- 无序列表、1. 有序列表、> 引用

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inline(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
}

export function renderMarkdown(md: string): string {
  const lines = md.split('\n')
  let html = ''
  let inList = false
  let listType: 'ul' | 'ol' = 'ul'

  const closeList = () => {
    if (inList) {
      html += `</${listType}>`
      inList = false
    }
  }

  for (const raw of lines) {
    const line = escapeHtml(raw.trimEnd())
    const trimmed = line.trim()

    if (!trimmed) {
      closeList()
      continue
    }

    // 标题
    const h = trimmed.match(/^(#{1,3})\s+(.*)$/)
    if (h) {
      closeList()
      const level = h[1].length
      html += `<h${level} class="md-h">${inline(h[2])}</h${level}>`
      continue
    }

    // 引用
    if (trimmed.startsWith('&gt; ')) {
      closeList()
      html += `<blockquote class="md-quote">${inline(trimmed.slice(5))}</blockquote>`
      continue
    }

    // 无序列表
    if (/^[-*]\s+/.test(trimmed)) {
      if (!inList || listType !== 'ul') {
        closeList()
        html += '<ul class="md-list">'
        inList = true
        listType = 'ul'
      }
      html += `<li>${inline(trimmed.replace(/^[-*]\s+/, ''))}</li>`
      continue
    }

    // 有序列表
    if (/^\d+[.)]\s+/.test(trimmed)) {
      if (!inList || listType !== 'ol') {
        closeList()
        html += '<ol class="md-list">'
        inList = true
        listType = 'ol'
      }
      html += `<li>${inline(trimmed.replace(/^\d+[.)]\s+/, ''))}</li>`
      continue
    }

    // 普通段落
    closeList()
    html += `<p class="md-p">${inline(trimmed)}</p>`
  }

  closeList()
  return html
}
