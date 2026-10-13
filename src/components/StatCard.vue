<script setup lang="ts">
import type { Component } from 'vue'
import { CaretTop, CaretBottom } from '@element-plus/icons-vue'

defineProps<{
  label: string
  value: string | number
  unit?: string
  delta?: number // 环比百分比，正负号决定颜色
  color?: string
  icon?: Component
}>()
</script>

<template>
  <div class="stat-card" :style="{ '--accent': color ?? '#38bdf8' }">
    <div class="sc-icon">
      <el-icon :size="20"><component :is="icon" /></el-icon>
    </div>
    <div class="sc-body">
      <div class="sc-label">{{ label }}</div>
      <div class="sc-value">
        {{ value }}<span v-if="unit" class="sc-unit">{{ unit }}</span>
      </div>
      <div v-if="delta !== undefined" class="sc-delta" :class="delta >= 0 ? 'up' : 'down'">
        <el-icon :size="12"><component :is="delta >= 0 ? CaretTop : CaretBottom" /></el-icon>
        环比 {{ Math.abs(delta) }}%
      </div>
      <div v-else class="sc-delta placeholder">&nbsp;</div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, var(--panel-bg-light), var(--panel-bg));
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 18px 20px;
  min-width: 0;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: var(--transition);
}
.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--accent), transparent);
  opacity: 0.7;
}
.stat-card:hover {
  transform: translateY(-3px);
  border-color: var(--border-strong);
  box-shadow: var(--shadow-card-hover);
}
.sc-icon {
  width: 46px;
  height: 46px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid var(--border);
  flex-shrink: 0;
}
.sc-body {
  min-width: 0;
}
.sc-label {
  font-size: 12px;
  color: var(--text-sub);
}
.sc-value {
  font-size: 26px;
  font-weight: 700;
  margin-top: 4px;
  color: var(--text-main);
  text-shadow: 0 0 16px var(--primary-glow);
  font-variant-numeric: tabular-nums;
}
.sc-unit {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-sub);
  margin-left: 4px;
}
.sc-delta {
  font-size: 12px;
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 3px;
}
.sc-delta.up {
  color: var(--up);
}
.sc-delta.down {
  color: var(--down);
}
.placeholder {
  visibility: hidden;
}
</style>
