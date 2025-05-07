<template>
  <div class="wholesale-review">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>批发交易复盘</span>
          <el-tooltip content="对标的日的批发侧交易进行复盘分析" placement="top">
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
      </template>
      
      <el-row :gutter="20">
        <!-- 左侧控制区域 -->
        <el-col :span="8">
          <el-card class="config-card">
            <template #header>
              <div class="config-header">分析配置</div>
            </template>
            
            <el-form :model="configForm" label-position="top">
              <el-form-item label="标的日期">
                <el-date-picker
                  v-model="configForm.targetDate"
                  type="date"
                  placeholder="选择日期"
                  format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
              
              <el-form-item label="分析维度">
                <el-radio-group v-model="configForm.dimension">
                  <el-radio label="longTerm">中长期较日前</el-radio>
                  <el-radio label="dayAhead">日前较实时</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <el-form-item label="中长期合约类型" v-if="configForm.dimension === 'longTerm'">
                <el-select v-model="configForm.contractType" placeholder="选择合约类型">
                  <el-option label="月度" value="monthly" />
                  <el-option label="多月" value="multiMonth" />
                  <el-option label="多日" value="multiDay" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="用户类型">
                <el-select v-model="configForm.userType" placeholder="选择用户类型">
                  <el-option label="所有用户" value="all" />
                  <el-option label="工业用户" value="industrial" />
                  <el-option label="商业用户" value="commercial" />
                  <el-option label="农业用户" value="agricultural" />
                </el-select>
              </el-form-item>
              
              <el-form-item>
                <div class="button-group">
                  <el-button type="primary" @click="startAnalysis">开始分析</el-button>
                  <el-button @click="resetConfig">重置</el-button>
                </div>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
        
        <!-- 右侧展示区域 -->
        <el-col :span="16">
          <div v-if="isLoading" class="loading-container">
            <el-skeleton :rows="6" animated />
          </div>
          <div v-else-if="hasAnalysisResults">
            <!-- 交易概览 -->
            <el-card class="review-card">
              <template #header>
                <div class="review-card-header">
                  <span>交易概览</span>
                </div>
              </template>
              
              <el-descriptions border direction="vertical" :column="3">
                <el-descriptions-item label="标的日">{{ formattedTargetDate }}</el-descriptions-item>
                <el-descriptions-item label="分析维度">{{ dimensionLabel }}</el-descriptions-item>
                <el-descriptions-item label="偏差率">
                  <el-tag :type="deviationTagType">{{ analysisResult.overview.deviationRate }}%</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="交易电量">{{ analysisResult.overview.tradedVolume }} MWh</el-descriptions-item>
                <el-descriptions-item label="实际电量">{{ analysisResult.overview.actualVolume }} MWh</el-descriptions-item>
                <el-descriptions-item label="电量偏差">
                  <span :class="deviationClass">{{ deviationAmount }} MWh</span>
                </el-descriptions-item>
                <el-descriptions-item label="交易均价">{{ analysisResult.overview.tradedPrice }} 元/MWh</el-descriptions-item>
                <el-descriptions-item label="实际均价">{{ analysisResult.overview.actualPrice }} 元/MWh</el-descriptions-item>
                <el-descriptions-item label="价格偏差">
                  <span :class="priceDeviationClass">{{ priceDeviationAmount }} 元/MWh</span>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
            
            <!-- 交易曲线 -->
            <el-card class="review-card">
              <template #header>
                <div class="review-card-header">
                  <span>交易曲线</span>
                  <el-radio-group v-model="curveType" size="small">
                    <el-radio-button label="volume">电量曲线</el-radio-button>
                    <el-radio-button label="price">电价曲线</el-radio-button>
                  </el-radio-group>
                </div>
              </template>
              
              <div class="chart-container">
                <div id="tradeCurveChart" class="chart-area"></div>
              </div>
            </el-card>
            
            <!-- 电费曲线 -->
            <el-card class="review-card">
              <template #header>
                <div class="review-card-header">
                  <span>电费曲线</span>
                </div>
              </template>
              
              <div class="chart-container">
                <div id="costCurveChart" class="chart-area"></div>
              </div>
            </el-card>
            
            <!-- 复盘建议 -->
            <el-card class="review-card">
              <template #header>
                <div class="review-card-header">
                  <span>复盘建议</span>
                </div>
              </template>
              
              <div class="suggestions-container">
                <div v-for="(suggestion, index) in analysisResult.suggestions" :key="index" class="suggestion-item">
                  <el-icon><InfoFilled /></el-icon>
                  <span>{{ suggestion }}</span>
                </div>
              </div>
            </el-card>
          </div>
          <div v-else class="empty-container">
            <el-empty description="请配置参数并开始分析" />
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { QuestionFilled, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

// 配置表单
const configForm = reactive({
  targetDate: new Date(),
  dimension: 'longTerm',
  contractType: 'monthly',
  userType: 'all'
})

// 控制状态
const isLoading = ref(false)
const hasAnalysisResults = ref(false)
const curveType = ref('volume')

// 分析结果数据
const analysisResult = reactive({
  overview: {
    deviationRate: 0,
    tradedVolume: 0,
    actualVolume: 0,
    tradedPrice: 0,
    actualPrice: 0
  },
  volumeData: {
    xAxis: [],
    traded: [],
    actual: []
  },
  priceData: {
    xAxis: [],
    traded: [],
    actual: []
  },
  costData: {
    xAxis: [],
    traded: [],
    actual: [],
    difference: []
  },
  suggestions: []
})

// 图表实例
let tradeCurveChart = null
let costCurveChart = null

// 格式化标的日期
const formattedTargetDate = computed(() => {
  if (!configForm.targetDate) return '未设置'
  const date = new Date(configForm.targetDate)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
})

// 分析维度标签
const dimensionLabel = computed(() => {
  const dimensionMap = {
    'longTerm': '中长期较日前',
    'dayAhead': '日前较实时'
  }
  return dimensionMap[configForm.dimension] || ''
})

// 偏差标签类型
const deviationTagType = computed(() => {
  const rate = analysisResult.overview.deviationRate
  if (Math.abs(rate) <= 3) return 'success'
  if (Math.abs(rate) <= 8) return 'warning'
  return 'danger'
})

// 电量偏差计算
const deviationAmount = computed(() => {
  return (analysisResult.overview.tradedVolume - analysisResult.overview.actualVolume).toFixed(2)
})

// 价格偏差计算
const priceDeviationAmount = computed(() => {
  return (analysisResult.overview.tradedPrice - analysisResult.overview.actualPrice).toFixed(2)
})

// 电量偏差样式
const deviationClass = computed(() => {
  const amount = Number(deviationAmount.value)
  return {
    'positive-value': amount > 0,
    'negative-value': amount < 0,
    'normal-value': amount === 0
  }
})

// 价格偏差样式
const priceDeviationClass = computed(() => {
  const amount = Number(priceDeviationAmount.value)
  return {
    'positive-value': amount > 0,
    'negative-value': amount < 0,
    'normal-value': amount === 0
  }
})

// 初始化交易曲线图表
const initTradeCurveChart = () => {
  if (!document.getElementById('tradeCurveChart')) return

  // 销毁已有实例
  if (tradeCurveChart) {
    tradeCurveChart.dispose()
  }

  // 创建图表实例
  tradeCurveChart = echarts.init(document.getElementById('tradeCurveChart'))
  
  // 根据当前选择的曲线类型更新图表
  updateTradeCurveChart()
}

// 更新交易曲线图表
const updateTradeCurveChart = () => {
  if (!tradeCurveChart) return
  
  const isVolume = curveType.value === 'volume'
  const data = isVolume ? analysisResult.volumeData : analysisResult.priceData
  const yAxisName = isVolume ? '电量 (MWh)' : '电价 (元/MWh)'
  const seriesNames = isVolume ? ['交易电量', '实际电量'] : ['交易电价', '实际电价']
  
  const option = {
    title: {
      text: isVolume ? '电量交易曲线' : '电价交易曲线',
      left: 'center',
      textStyle: {
        fontSize: 14
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: seriesNames,
      bottom: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.xAxis,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: yAxisName
    },
    series: [
      {
        name: seriesNames[0],
        type: 'line',
        data: data.traded,
        symbolSize: 6,
        itemStyle: {
          color: '#409EFF'
        },
        lineStyle: {
          width: 3
        }
      },
      {
        name: seriesNames[1],
        type: 'line',
        data: data.actual,
        symbolSize: 6,
        itemStyle: {
          color: '#67C23A'
        },
        lineStyle: {
          width: 3
        }
      }
    ]
  }
  
  tradeCurveChart.setOption(option)
}

// 初始化电费曲线图表
const initCostCurveChart = () => {
  if (!document.getElementById('costCurveChart')) return

  // 销毁已有实例
  if (costCurveChart) {
    costCurveChart.dispose()
  }

  // 创建图表实例
  costCurveChart = echarts.init(document.getElementById('costCurveChart'))
  
  const option = {
    title: {
      text: '电费曲线对比',
      left: 'center',
      textStyle: {
        fontSize: 14
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['计划电费', '实际电费', '电费差额'],
      bottom: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: analysisResult.costData.xAxis,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '电费 (万元)',
        position: 'left'
      },
      {
        type: 'value',
        name: '差额 (万元)',
        position: 'right'
      }
    ],
    series: [
      {
        name: '计划电费',
        type: 'line',
        data: analysisResult.costData.traded,
        symbolSize: 6,
        itemStyle: {
          color: '#409EFF'
        },
        lineStyle: {
          width: 3
        }
      },
      {
        name: '实际电费',
        type: 'line',
        data: analysisResult.costData.actual,
        symbolSize: 6,
        itemStyle: {
          color: '#67C23A'
        },
        lineStyle: {
          width: 3
        }
      },
      {
        name: '电费差额',
        type: 'bar',
        yAxisIndex: 1,
        data: analysisResult.costData.difference,
        itemStyle: {
          color: function(params) {
            return params.value >= 0 ? '#F56C6C' : '#E6A23C'
          }
        }
      }
    ]
  }
  
  costCurveChart.setOption(option)
}

// 生成模拟数据
const generateMockData = () => {
  // 生成24小时的时间点
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  
  // 生成电量数据
  const tradedVolume = hours.map(() => Math.floor(Math.random() * 300) + 400)
  const volumeDeviation = hours.map(() => (Math.random() * 100) - 50)
  const actualVolume = tradedVolume.map((val, idx) => val + volumeDeviation[idx])
  
  // 生成电价数据
  const tradedPrice = hours.map(() => Math.floor(Math.random() * 200) + 300)
  const priceDeviation = hours.map(() => (Math.random() * 40) - 20)
  const actualPrice = tradedPrice.map((val, idx) => val + priceDeviation[idx])
  
  // 生成电费数据
  const tradedCost = hours.map((_, idx) => (tradedVolume[idx] * tradedPrice[idx]) / 10000) // 万元
  const actualCost = hours.map((_, idx) => (actualVolume[idx] * actualPrice[idx]) / 10000)
  const costDifference = tradedCost.map((val, idx) => val - actualCost[idx])
  
  // 计算概览数据
  const avgTradedVolume = Math.round(tradedVolume.reduce((a, b) => a + b, 0) / tradedVolume.length)
  const avgActualVolume = Math.round(actualVolume.reduce((a, b) => a + b, 0) / actualVolume.length)
  const avgTradedPrice = Math.round(tradedPrice.reduce((a, b) => a + b, 0) / tradedPrice.length)
  const avgActualPrice = Math.round(actualPrice.reduce((a, b) => a + b, 0) / actualPrice.length)
  const deviationRate = Math.round(((avgTradedVolume - avgActualVolume) / avgActualVolume) * 100 * 100) / 100
  
  // 生成建议
  const suggestions = [
    '建议调整中长期合约电量，日前市场电量已连续三日高于中长期合约电量',
    '峰时段电价预测准确度较低，建议优化峰时段电价预测模型',
    '工业用户负荷预测存在系统性偏差，建议重新采集负荷基础数据',
    '电力现货价格波动较大，建议增加短期价格预警机制',
    '实时电量在14:00-16:00时段持续偏低，建议复核此时段负荷预测模型'
  ]
  
  // 根据分析维度和合约类型过滤建议
  const filteredSuggestions = suggestions.filter((_, idx) => idx < 3)
  
  return {
    overview: {
      deviationRate,
      tradedVolume: avgTradedVolume,
      actualVolume: avgActualVolume,
      tradedPrice: avgTradedPrice,
      actualPrice: avgActualPrice
    },
    volumeData: {
      xAxis: hours,
      traded: tradedVolume,
      actual: actualVolume
    },
    priceData: {
      xAxis: hours,
      traded: tradedPrice,
      actual: actualPrice
    },
    costData: {
      xAxis: hours,
      traded: tradedCost,
      actual: actualCost,
      difference: costDifference
    },
    suggestions: filteredSuggestions
  }
}

// 开始分析
const startAnalysis = () => {
  if (!configForm.targetDate) {
    ElMessage.warning('请选择标的日期')
    return
  }
  
  isLoading.value = true
  hasAnalysisResults.value = false
  
  // 模拟异步请求
  setTimeout(() => {
    const mockData = generateMockData()
    
    // 更新结果数据
    analysisResult.overview = mockData.overview
    analysisResult.volumeData = mockData.volumeData
    analysisResult.priceData = mockData.priceData
    analysisResult.costData = mockData.costData
    analysisResult.suggestions = mockData.suggestions
    
    isLoading.value = false
    hasAnalysisResults.value = true
    
    // 初始化图表
    setTimeout(() => {
      initTradeCurveChart()
      initCostCurveChart()
    }, 100)
    
    ElMessage.success('分析完成')
  }, 1500)
}

// 重置配置
const resetConfig = () => {
  configForm.targetDate = new Date()
  configForm.dimension = 'longTerm'
  configForm.contractType = 'monthly'
  configForm.userType = 'all'
  
  hasAnalysisResults.value = false
}

// 监听曲线类型变化
watch(curveType, () => {
  updateTradeCurveChart()
})

// 窗口大小变化时调整图表大小
const handleResize = () => {
  tradeCurveChart && tradeCurveChart.resize()
  costCurveChart && costCurveChart.resize()
}

// 生命周期钩子
onMounted(() => {
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // 移除窗口大小变化监听
  window.removeEventListener('resize', handleResize)
  
  // 销毁图表实例
  if (tradeCurveChart) {
    tradeCurveChart.dispose()
    tradeCurveChart = null
  }
  
  if (costCurveChart) {
    costCurveChart.dispose()
    costCurveChart = null
  }
})
</script>

<style scoped>
.wholesale-review {
  padding: 0 10px;
}

.main-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header span {
  font-weight: bold;
  font-size: 16px;
}

.config-card {
  height: 100%;
}

.config-header {
  font-weight: bold;
  font-size: 14px;
}

.button-group {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.review-card {
  margin-bottom: 20px;
}

.review-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  padding: 10px;
}

.chart-area {
  height: 300px;
  width: 100%;
}

.positive-value {
  color: #F56C6C;
  font-weight: bold;
}

.negative-value {
  color: #67C23A;
  font-weight: bold;
}

.normal-value {
  color: #909399;
}

.loading-container {
  padding: 20px;
}

.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.suggestions-container {
  padding: 10px;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.suggestion-item .el-icon {
  color: #E6A23C;
  font-size: 18px;
  margin-top: 2px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .chart-area {
    height: 250px;
  }
}
</style> 