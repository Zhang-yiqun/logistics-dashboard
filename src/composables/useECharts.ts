import * as echarts from 'echarts'
import { onMounted, onUnmounted, ref, type Ref } from 'vue'

/**
 * ECharts 初始化与销毁的通用封装
 * @param elRef 图表容器的 DOM ref
 */
export function useECharts(elRef: Ref<HTMLElement | null>) {
  const chart = ref<echarts.ECharts | null>(null)

  function setOption(option: echarts.EChartsOption) {
    if (!chart.value && elRef.value) {
      chart.value = echarts.init(elRef.value)
    }
    chart.value?.setOption(option)
  }

  function resize() {
    chart.value?.resize()
  }

  onMounted(() => {
    window.addEventListener('resize', resize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', resize)
    chart.value?.dispose()
    chart.value = null
  })

  return { chart, setOption, resize }
}
