<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  aiSettings,
  clearAISettings,
  PROVIDER_PRESETS,
  saveAISettings,
  type AISettings
} from '@/config/ai.config'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const form = reactive<AISettings>({ ...aiSettings.value })
const showKey = ref(false)

// 打开面板时同步当前配置
watch(visible, (v) => {
  if (v) {
    Object.assign(form, { ...aiSettings.value })
  }
})

function onProviderChange() {
  const preset = PROVIDER_PRESETS[form.provider]
  form.baseUrl = preset.baseUrl
  form.model = preset.model
}

function save() {
  if (!form.apiKey.trim()) {
    ElMessage.warning('请先填入 API Key')
    return
  }
  saveAISettings({ ...form })
  ElMessage.success('已保存，AI 功能即刻生效')
  visible.value = false
}

function clear() {
  clearAISettings()
  Object.assign(form, { ...aiSettings.value })
  ElMessage.info('已清除页面配置，回退到环境变量（若有）')
}
</script>

<template>
  <el-dialog v-model="visible" title="AI 模型配置" width="520px">
    <el-form label-width="90px">
      <el-form-item label="模型服务">
        <el-radio-group v-model="form.provider" @change="onProviderChange">
          <el-radio value="deepseek">DeepSeek</el-radio>
          <el-radio value="qwen">通义千问</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="API Key">
        <el-input
          v-model="form.apiKey"
          :type="showKey ? 'text' : 'password'"
          placeholder="填入你的 API Key"
          clearable
        >
          <template #append>
            <el-button @click="showKey = !showKey">{{ showKey ? '隐藏' : '显示' }}</el-button>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="接口地址">
        <el-input v-model="form.baseUrl" placeholder="API Base URL" />
      </el-form-item>

      <el-form-item label="模型名称">
        <el-input v-model="form.model" placeholder="模型 ID" />
      </el-form-item>
    </el-form>

    <div class="tips">
      <p>Key 仅保存在你本机浏览器（localStorage），不会上传。切换模型服务会自动填充默认地址与模型名。</p>
      <p>
        获取 Key：
        <a href="https://platform.deepseek.com" target="_blank" rel="noreferrer">DeepSeek 开放平台</a>
        ·
        <a href="https://dashscope.aliyun.com" target="_blank" rel="noreferrer">阿里云百炼</a>
      </p>
    </div>

    <template #footer>
      <el-button @click="clear">清除配置</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.tips {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-sub);
  line-height: 1.7;
}
.tips p {
  margin: 4px 0;
}
.tips a {
  color: var(--primary);
}
</style>
