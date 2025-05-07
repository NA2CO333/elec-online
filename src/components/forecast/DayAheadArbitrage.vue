<template>
  <div class="day-ahead-arbitrage">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>日前博弈套利</span>
          <el-tooltip content="结合量价曲线实现日前交易的电量申报辅助决策" placement="top">
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
      </template>
      
      <el-row :gutter="20">
        <!-- 左侧配置区域 -->
        <el-col :span="8">
          <el-card class="config-card">
            <template #header>
              <div class="config-header">参数设置</div>
            </template>
            
            <el-form :model="configForm" label-position="top">
              <el-form-item label="交易日期">
                <el-date-picker
                  v-model="configForm.tradeDate"
                  type="date"
                  placeholder="选择交易日期"
                  format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
              
              <el-form-item label="电力节点">
                <el-select v-model="configForm.powerNode" placeholder="选择电力节点">
                  <el-option label="节点A" value="nodeA" />
                  <el-option label="节点B" value="nodeB" />
                  <el-option label="节点C" value="nodeC" />
                  <el-option label="节点D" value="nodeD" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="交易时段">
                <el-select v-model="configForm.timeSlot" placeholder="选择交易时段">
                  <el-option label="全天" value="all" />
                  <el-option label="峰时段" value="peak" />
                  <el-option label="平时段" value="flat" />
                  <el-option label="谷时段" value="valley" />
                  <el-option label="自定义时段" value="custom" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="时段范围" v-if="configForm.timeSlot === 'custom'">
                <el-time-picker
                  v-model="configForm.timeRange"
                  is-range
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  format="HH:mm"
                  style="width: 100%"
                />
              </el-form-item>
              
              <el-form-item>
                <div class="button-group">
                  <el-button type="primary" @click="analyzeMarket">分析市场</el-button>
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
            <!-- 价格分析 -->
            <el-card class="analysis-card">
              <template #header>
                <div class="analysis-card-header">
                  <span>价格分析</span>
                  <el-tag>{{ formattedTradeDate }}</el-tag>
                </div>
              </template>
              
              <el-descriptions border direction="vertical" :column="3">
                <el-descriptions-item label="日前平均价">{{ analysisResult.priceInfo.dayAheadAvg }} 元/MWh</el-descriptions-item>
                <el-descriptions-item label="实时平均价">{{ analysisResult.priceInfo.realtimeAvg }} 元/MWh</el-descriptions-item>
                <el-descriptions-item label="平均价差">
                  <span :class="priceGapClass">{{ priceDifference }} 元/MWh</span>
                </el-descriptions-item>
              </el-descriptions>
              
              <div class="chart-container">
                <div id="priceComparisonChart" class="chart-area"></div>
              </div>
            </el-card>
            
            <!-- 量价曲线 -->
            <el-card class="analysis-card">
              <template #header>
                <div class="analysis-card-header">
                  <span>量价曲线</span>
                  <el-radio-group v-model="curveTimeSlot" size="small">
                    <el-radio-button label="peak">峰时段</el-radio-button>
                    <el-radio-button label="flat">平时段</el-radio-button>
                    <el-radio-button label="valley">谷时段</el-radio-button>
                  </el-radio-group>
                </div>
              </template>
              
              <div class="chart-container">
                <div id="volumePriceCurveChart" class="chart-area"></div>
              </div>
            </el-card>
            
            <!-- 套利策略建议 -->
            <el-card class="analysis-card">
              <template #header>
                <div class="analysis-card-header">
                  <span>套利策略建议</span>
                </div>
              </template>
              
              <div class="strategy-container">
                <div class="optimum-bid">
                  <div class="optimum-header">
                    <el-icon><PriceTag /></el-icon>
                    <span>最优申报策略</span>
                  </div>
                  <div class="optimum-content">
                    <div class="bid-value">
                      <span class="label">申报电量:</span>
                      <span class="value">{{ analysisResult.strategy.optimalVolume }} MWh</span>
                    </div>
                    <div class="bid-value">
                      <span class="label">申报价格:</span>
                      <span class="value">{{ analysisResult.strategy.optimalPrice }} 元/MWh</span>
                    </div>
                    <div class="bid-value">
                      <span class="label">预计收益:</span>
                      <span class="value profit">{{ analysisResult.strategy.estimatedProfit }} 元</span>
                    </div>
                  </div>
                </div>
                
                <div class="risk-analysis">
                  <div class="risk-header">
                    <el-icon><Warning /></el-icon>
                    <span>风险提示</span>
                  </div>
                  <div class="risk-content">
                    <div v-for="(risk, index) in analysisResult.strategy.riskFactors" :key="index" class="risk-item">
                      <el-icon><InfoFilled /></el-icon>
                      <span>{{ risk }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
          
          <div v-else class="empty-container">
            <el-empty description="请配置参数并进行市场分析" />
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { QuestionFilled, InfoFilled, PriceTag, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

// 配置表单
const configForm = reactive({
  tradeDate: new Date(),
  powerNode: 'nodeA',
  timeSlot: 'all',
  timeRange: null
})

// 控制状态
const isLoading = ref(false)
const hasAnalysisResults = ref(false)
const curveTimeSlot = ref('peak')

// 分析结果数据
const analysisResult = reactive({
  priceInfo: {
    dayAheadAvg: 0,
    realtimeAvg: 0,
    dayAheadPrices: [],
    realtimePrices: [],
    timeAxis: []
  },
  volumePriceCurve: {
    peak: {
      volumes: [],
      prices: []
    },
    flat: {
      volumes: [],
      prices: []
    },
    valley: {
      volumes: [],
      prices: []
    }
  },
  strategy: {
    optimalVolume: 0,
    optimalPrice: 0,
    estimatedProfit: 0,
    riskFactors: []
  }
})

// 图表实例
let priceComparisonChart = null
let volumePriceCurveChart = null

// 格式化交易日期
const formattedTradeDate = computed(() => {
  if (!configForm.tradeDate) return '未设置'
  const date = new Date(configForm.tradeDate)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
})

// 价格差异
const priceDifference = computed(() => {
  return (analysisResult.priceInfo.dayAheadAvg - analysisResult.priceInfo.realtimeAvg).toFixed(2)
})

// 价格差异样式
const priceGapClass = computed(() => {
  const diff = Number(priceDifference.value)
  return {
    'positive-value': diff > 0,
    'negative-value': diff < 0,
    'normal-value': diff === 0
  }
})

// 初始化价格比较图表
const initPriceComparisonChart = () => {
  if (!document.getElementById('priceComparisonChart')) return

  // 销毁已有实例
  if (priceComparisonChart) {
    priceComparisonChart.dispose()
  }

  // 创建图表实例
  priceComparisonChart = echarts.init(document.getElementById('priceComparisonChart'))
  
  const option = {
    title: {
      text: '日前与实时价格对比',
      left: 'center',
      textStyle: {
        fontSize: 14
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: function(params) {
        const dayAhead = params[0].value
        const realtime = params[1].value
        const diff = (dayAhead - realtime).toFixed(2)
        const diffColor = diff > 0 ? 'red' : (diff < 0 ? 'green' : 'gray')
        
        return `${params[0].axisValue}<br/>
                ${params[0].marker} ${params[0].seriesName}: ${dayAhead} 元/MWh<br/>
                ${params[1].marker} ${params[1].seriesName}: ${realtime} 元/MWh<br/>
                <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${diffColor};"></span> 
                价差: ${diff} 元/MWh`
      }
    },
    legend: {
      data: ['日前价格', '实时价格', '价格差异'],
      bottom: 10
    },
    grid: {
      left: '3%',
      right: '5%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: analysisResult.priceInfo.timeAxis,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '价格 (元/MWh)',
        position: 'left'
      },
      {
        type: 'value',
        name: '价差 (元/MWh)',
        position: 'right'
      }
    ],
    series: [
      {
        name: '日前价格',
        type: 'line',
        data: analysisResult.priceInfo.dayAheadPrices,
        symbolSize: 6,
        itemStyle: {
          color: '#409EFF'
        },
        lineStyle: {
          width: 3
        }
      },
      {
        name: '实时价格',
        type: 'line',
        data: analysisResult.priceInfo.realtimePrices,
        symbolSize: 6,
        itemStyle: {
          color: '#67C23A'
        },
        lineStyle: {
          width: 3
        }
      },
      {
        name: '价格差异',
        type: 'bar',
        yAxisIndex: 1,
        data: analysisResult.priceInfo.dayAheadPrices.map((price, idx) => 
          (price - analysisResult.priceInfo.realtimePrices[idx]).toFixed(2)
        ),
        itemStyle: {
          color: function(params) {
            return params.value >= 0 ? '#F56C6C' : '#67C23A'
          }
        }
      }
    ]
  }
  
  priceComparisonChart.setOption(option)
}

// 初始化量价曲线图表
const initVolumePriceCurveChart = () => {
  if (!document.getElementById('volumePriceCurveChart')) return

  // 销毁已有实例
  if (volumePriceCurveChart) {
    volumePriceCurveChart.dispose()
  }

  // 创建图表实例
  volumePriceCurveChart = echarts.init(document.getElementById('volumePriceCurveChart'))
  
  updateVolumePriceCurveChart()
}

// 更新量价曲线图表
const updateVolumePriceCurveChart = () => {
  if (!volumePriceCurveChart) return
  
  const curveData = analysisResult.volumePriceCurve[curveTimeSlot.value]
  const timeSlotNames = {
    'peak': '峰时段',
    'flat': '平时段',
    'valley': '谷时段'
  }
  
  // 创建回归线数据
  const regression = calculateRegression(curveData.volumes, curveData.prices)
  const regressionData = curveData.volumes.map(v => regression.slope * v + regression.intercept)
  
  // 找到最优申报点
  const optimalIdx = findOptimalBidIndex(curveData.volumes, curveData.prices)
  
  const option = {
    title: {
      text: `${timeSlotNames[curveTimeSlot.value]}量价曲线`,
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
      data: ['历史交易', '回归线', '最优申报点'],
      bottom: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '电量 (MWh)',
      axisLabel: {
        formatter: '{value}'
      }
    },
    yAxis: {
      type: 'value',
      name: '价格 (元/MWh)'
    },
    series: [
      {
        name: '历史交易',
        type: 'scatter',
        data: curveData.volumes.map((v, idx) => [v, curveData.prices[idx]]),
        symbolSize: 10,
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '回归线',
        type: 'line',
        data: curveData.volumes.map((v, idx) => [v, regressionData[idx]]),
        smooth: true,
        symbolSize: 0,
        lineStyle: {
          width: 2,
          type: 'dashed',
          color: '#67C23A'
        }
      },
      {
        name: '最优申报点',
        type: 'effectScatter',
        data: [[curveData.volumes[optimalIdx], curveData.prices[optimalIdx]]],
        symbolSize: 20,
        itemStyle: {
          color: '#F56C6C'
        },
        rippleEffect: {
          brushType: 'stroke'
        }
      }
    ]
  }
  
  volumePriceCurveChart.setOption(option)
}

// 计算简单线性回归
const calculateRegression = (xValues, yValues) => {
  if (xValues.length !== yValues.length || xValues.length === 0) {
    return { slope: 0, intercept: 0 }
  }
  
  const n = xValues.length
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0
  
  for (let i = 0; i < n; i++) {
    sumX += xValues[i]
    sumY += yValues[i]
    sumXY += xValues[i] * yValues[i]
    sumXX += xValues[i] * xValues[i]
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  return { slope, intercept }
}

// 找到最优申报点索引
const findOptimalBidIndex = (volumes, prices) => {
  // 这里简化处理，实际中会根据价格弹性和套利模型计算
  // 找到价格接近平均值但略低的点作为最优点
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
  let optimalIdx = 0
  let minDiff = Number.MAX_VALUE
  
  for (let i = 0; i < prices.length; i++) {
    if (prices[i] <= avgPrice) {
      const diff = Math.abs(prices[i] - avgPrice)
      if (diff < minDiff) {
        minDiff = diff
        optimalIdx = i
      }
    }
  }
  
  return optimalIdx
}

// 生成模拟数据
const generateMockData = () => {
  // 生成24小时时间点
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  
  // 生成日前和实时价格
  const dayAheadPrices = hours.map(() => Math.floor(Math.random() * 150) + 250)
  const priceDiff = hours.map(() => (Math.random() * 100) - 50)
  const realtimePrices = dayAheadPrices.map((price, idx) => price - priceDiff[idx])
  
  // 计算平均价格
  const dayAheadAvg = Math.round(dayAheadPrices.reduce((a, b) => a + b, 0) / dayAheadPrices.length)
  const realtimeAvg = Math.round(realtimePrices.reduce((a, b) => a + b, 0) / realtimePrices.length)
  
  // 生成不同时段的量价曲线数据
  const genVolumePrice = (baseVolume, basePrice, count) => {
    const volumes = Array.from({ length: count }, () => Math.floor(Math.random() * 100) + baseVolume)
    const prices = volumes.map(v => basePrice + (Math.random() * 30) - 15 - v * 0.1)
    return { volumes, prices }
  }
  
  const peakData = genVolumePrice(500, 350, 25)
  const flatData = genVolumePrice(300, 300, 20)
  const valleyData = genVolumePrice(200, 250, 15)
  
  // 找到每个时段的最优申报点
  const peakOptimalIdx = findOptimalBidIndex(peakData.volumes, peakData.prices)
  const optimalVolume = peakData.volumes[peakOptimalIdx]
  const optimalPrice = peakData.prices[peakOptimalIdx]
  const estimatedProfit = Math.round((dayAheadAvg - realtimeAvg) * optimalVolume)
  
  // 生成风险因素
  const riskFactors = [
    '实时市场价格波动可能导致预期收益变动',
    '节点拥塞可能导致节点价格差异增加',
    '用电负荷预测偏差可能影响市场出清价格',
    '建议关注天气变化对电力需求的影响'
  ]
  
  return {
    priceInfo: {
      dayAheadAvg,
      realtimeAvg,
      dayAheadPrices,
      realtimePrices,
      timeAxis: hours
    },
    volumePriceCurve: {
      peak: peakData,
      flat: flatData,
      valley: valleyData
    },
    strategy: {
      optimalVolume,
      optimalPrice: Math.round(optimalPrice),
      estimatedProfit,
      riskFactors: riskFactors.slice(0, 3)
    }
  }
}

// 分析市场
const analyzeMarket = () => {
  if (!configForm.tradeDate) {
    ElMessage.warning('请选择交易日期')
    return
  }
  
  if (!configForm.powerNode) {
    ElMessage.warning('请选择电力节点')
    return
  }
  
  isLoading.value = true
  hasAnalysisResults.value = false
  
  // 模拟异步请求
  setTimeout(() => {
    const mockData = generateMockData()
    
    // 更新结果数据
    analysisResult.priceInfo = mockData.priceInfo
    analysisResult.volumePriceCurve = mockData.volumePriceCurve
    analysisResult.strategy = mockData.strategy
    
    isLoading.value = false
    hasAnalysisResults.value = true
    
    // 初始化图表
    setTimeout(() => {
      initPriceComparisonChart()
      initVolumePriceCurveChart()
    }, 100)
    
    ElMessage.success('市场分析完成')
  }, 1500)
}

// 重置配置
const resetConfig = () => {
  configForm.tradeDate = new Date()
  configForm.powerNode = 'nodeA'
  configForm.timeSlot = 'all'
  configForm.timeRange = null
  
  hasAnalysisResults.value = false
}

// 监听曲线时段变化
watch(curveTimeSlot, () => {
  updateVolumePriceCurveChart()
})

// 窗口大小变化时调整图表大小
const handleResize = () => {
  priceComparisonChart && priceComparisonChart.resize()
  volumePriceCurveChart && volumePriceCurveChart.resize()
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
  if (priceComparisonChart) {
    priceComparisonChart.dispose()
    priceComparisonChart = null
  }
  
  if (volumePriceCurveChart) {
    volumePriceCurveChart.dispose()
    volumePriceCurveChart = null
  }
})
</script>

<style scoped>
.day-ahead-arbitrage {
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

.analysis-card {
  margin-bottom: 20px;
}

.analysis-card-header {
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

.strategy-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px;
}

.optimum-bid, .risk-analysis {
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  padding: 15px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.optimum-header, .risk-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  border-bottom: 1px solid #EBEEF5;
  padding-bottom: 10px;
}

.optimum-header span, .risk-header span {
  font-weight: bold;
  font-size: 15px;
}

.optimum-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bid-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
}

.bid-value .label {
  color: #606266;
}

.bid-value .value {
  font-weight: bold;
  color: #303133;
}

.bid-value .profit {
  color: #F56C6C;
}

.risk-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.risk-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 5px 0;
}

.risk-item .el-icon {
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

@media (max-width: 1200px) {
  .strategy-container {
    flex-direction: column;
  }
}
</style> 