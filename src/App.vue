<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  Odometer,
  WarningFilled,
  Van,
  Coin,
  Connection,
  Location,
  Guide,
  Money,
  WindPower
} from '@element-plus/icons-vue'
import AISettingsDialog from '@/components/AISettingsDialog.vue'
import AiChatPanel from '@/components/AiChatPanel.vue'
import { hasAIConfigured } from '@/config/ai.config'

const route = useRoute()
const settingsVisible = ref(false)

const menus = [
  { path: '/dashboard', label: '总览驾驶舱', icon: Odometer },
  { path: '/exceptions', label: '异常管理', icon: WarningFilled },
  { path: '/carriers', label: '承运商绩效', icon: Van },
  { path: '/cost', label: '成本到服务', icon: Coin },
  { path: '/lanes', label: '线路时效', icon: Connection },
  { path: '/dispatch', label: '智能调度', icon: Guide },
  { path: '/billing', label: '运费对账', icon: Money },
  { path: '/carbon', label: '碳排放', icon: WindPower }
]

const currentTitle = computed(() => (route.meta.title as string) ?? '物流控制塔')
const aiOn = computed(() => hasAIConfigured())
</script>

<template>
  <el-container class="layout">
    <el-aside width="232px" class="aside">
      <div class="logo">
        <div class="logo-icon">
          <el-icon :size="20"><Location /></el-icon>
        </div>
        <div class="logo-text">
          <div class="logo-title">物流控制塔</div>
          <div class="logo-sub">Transport Control Tower</div>
        </div>
      </div>

      <el-menu :default-active="route.path" router class="menu">
        <el-menu-item v-for="m in menus" :key="m.path" :index="m.path">
          <el-icon class="menu-icon"><component :is="m.icon" /></el-icon>
          <span>{{ m.label }}</span>
        </el-menu-item>
      </el-menu>

      <div class="aside-footer">
        <span class="status-line"><span class="status-dot"></span>系统运行中</span>
        <span class="version">MVP v1.0</span>
      </div>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span class="header-title">{{ currentTitle }}</span>
        </div>
        <div class="header-right">
          <span class="ai-status" :class="{ on: aiOn }">
            <span class="dot"></span>{{ aiOn ? 'AI 已配置' : 'AI 未配置' }}
          </span>
          <el-button size="small" type="primary" plain @click="settingsVisible = true">
            AI 设置
          </el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>

  <AISettingsDialog v-model="settingsVisible" />
  <AiChatPanel />
</template>

<style scoped>
.layout {
  height: 100%;
}

/* ---------- 侧边栏 ---------- */
.aside {
  background: linear-gradient(180deg, var(--bg-secondary), var(--bg));
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 18px;
  border-bottom: 1px solid var(--border);
}
.logo-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid var(--border-strong);
  box-shadow: 0 0 16px var(--primary-glow);
}
.logo-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-main);
}
.logo-sub {
  font-size: 11px;
  color: var(--text-dim);
  margin-top: 2px;
}

/* ---------- 菜单 ---------- */
.menu {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border-right: none;
  padding: 12px 10px;
  background: transparent;
  --el-menu-bg-color: transparent;
  --el-menu-text-color: var(--text-sub);
  --el-menu-active-color: var(--text-main);
  --el-menu-hover-bg-color: rgba(56, 189, 248, 0.08);
}
.menu :deep(.el-menu-item) {
  border-radius: var(--radius-md);
  margin: 4px 0;
  height: 44px;
  position: relative;
  transition: var(--transition);
}
.menu :deep(.el-menu-item:hover) {
  background: rgba(56, 189, 248, 0.08);
  color: var(--text-main);
}
.menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.16), rgba(56, 189, 248, 0.03));
  color: var(--text-main);
  font-weight: 600;
}
.menu :deep(.el-menu-item.is-active)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  border-radius: 3px;
  background: var(--primary);
  box-shadow: 0 0 10px var(--primary-glow);
}
.menu-icon {
  margin-right: 10px;
  font-size: 17px;
}

/* ---------- 侧边栏底部 ---------- */
.aside-footer {
  padding: 16px 18px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-dim);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.status-line {
  display: flex;
  align-items: center;
  gap: 8px;
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--down);
  box-shadow: 0 0 8px var(--down);
}

/* ---------- 顶栏 ---------- */
.header {
  background: var(--panel-bg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  height: 60px;
  padding: 0 24px;
}
.header-title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.3px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}
.ai-status {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: var(--text-dim);
}
.ai-status .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-dim);
}
.ai-status.on {
  color: var(--down);
}
.ai-status.on .dot {
  background: var(--down);
  box-shadow: 0 0 8px var(--down);
}

.main {
  padding: 24px;
  overflow-y: auto;
}
</style>
