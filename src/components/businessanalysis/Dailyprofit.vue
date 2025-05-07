<template>
  <div class="profit-indicators-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 数据展示区域 -->
    <div v-else-if="!noData" class="indicators-content">
      <!-- 顶部：日期范围选择器 -->
      <div class="filter-section">
        <h3 class="section-title">每日盈利与价格趋势</h3>
        <div class="date-selector">
          <div class="preset-ranges">
            <el-radio-group v-model="dateRangeType" @change="handleDateRangeTypeChange">
              <el-radio-button label="recent14">近14天</el-radio-button>
              <el-radio-button label="recent30">近30天</el-radio-button>
              <el-radio-button label="currentMonth">本月</el-radio-button>
              <el-radio-button label="lastMonth">上月</el-radio-button>
              <el-radio-button label="currentQuarter">本季度</el-radio-button>
              <el-radio-button label="custom">自定义</el-radio-button>
            </el-radio-group>
          </div>

          <div class="custom-date-range" v-if="dateRangeType === 'custom'">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              :disabled-date="disableFutureDates"
              @change="handleDateRangeChange"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
            <el-button size="small" @click="clearDateRange">清除</el-button>
          </div>
          
          <div class="current-date-range">
            <span>当前数据范围: {{ displayDateRange }}</span>
          </div>
        </div>
      </div>
      
      <!-- 折线图与柱状图组合1: 每日利润与关键收益趋势 -->
      <div class="chart-section">
        <h4 class="chart-title">每日利润与关键收益趋势</h4>
        <div ref="profitTrendsChartRef" class="chart-container"></div>
      </div>

      <!-- 折线图2: 每日价格趋势对比 -->
      <div class="chart-section">
        <h4 class="chart-title">每日价格趋势对比</h4>
        <div ref="priceTrendsChartRef" class="chart-container"></div>
      </div>

      <!-- 组合双轴图3: 每日现货套利表现 -->
      <div class="chart-section">
        <h4 class="chart-title">每日现货套利表现</h4>
        <div ref="spotArbitrageChartRef" class="chart-container"></div>
      </div>

      <!-- 多线时间序列组合双轴图4: 每日电量趋势和偏差倾向 -->
      <div class="chart-section">
        <h4 class="chart-title">每日电量趋势和偏差倾向</h4>
        <div ref="volumeTrendsChartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 空数据状态 -->
    <el-empty v-if="!loading && noData" description="暂无数据" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import * as echarts from 'echarts'

// 状态变量
const loading = ref(true)
const noData = ref(false)

// 日期范围选择相关
const dateRangeType = ref('recent14') // 默认为近14天
const dateRange = ref([])
const today = new Date()

// 计算当前显示的日期范围
const displayDateRange = computed(() => {
  if (dateRangeType.value === 'recent14') {
    const endDate = formatDate(today)
    const startDate = formatDate(getDateBefore(today, 13))
    return `${startDate} 至 ${endDate}`
  } else if (dateRangeType.value === 'recent30') {
    const endDate = formatDate(today)
    const startDate = formatDate(getDateBefore(today, 29))
    return `${startDate} 至 ${endDate}`
  } else if (dateRangeType.value === 'currentMonth') {
    const start = getStartOfMonth(today)
    const end = today
    return `${formatDate(start)} 至 ${formatDate(end)}`
  } else if (dateRangeType.value === 'lastMonth') {
    const lastMonth = getDateBefore(getStartOfMonth(today), 1)
    const start = getStartOfMonth(lastMonth)
    const end = getEndOfMonth(lastMonth)
    return `${formatDate(start)} 至 ${formatDate(end)}`
  } else if (dateRangeType.value === 'currentQuarter') {
    const start = getStartOfQuarter(today)
    const end = today
    return `${formatDate(start)} 至 ${formatDate(end)}`
  } else if (dateRangeType.value === 'custom' && dateRange.value && dateRange.value.length === 2) {
    return `${dateRange.value[0]} 至 ${dateRange.value[1]}`
  }
  
  // 默认返回近14天
  const endDate = formatDate(today)
  const startDate = formatDate(getDateBefore(today, 13))
  return `${startDate} 至 ${endDate}`
})

// 日期工具函数
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDateBefore(date, days) {
  const result = new Date(date)
  result.setDate(date.getDate() - days)
  return result
}

function getStartOfMonth(date) {
  const result = new Date(date.getFullYear(), date.getMonth(), 1)
  return result
}

function getEndOfMonth(date) {
  const result = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return result
}

function getStartOfQuarter(date) {
  const quarter = Math.floor(date.getMonth() / 3)
  const result = new Date(date.getFullYear(), quarter * 3, 1)
  return result
}

function getEndOfQuarter(date) {
  const quarter = Math.floor(date.getMonth() / 3)
  const result = new Date(date.getFullYear(), (quarter + 1) * 3, 0)
  return result
}

// 图表引用
const profitTrendsChartRef = ref(null)
const priceTrendsChartRef = ref(null)
const spotArbitrageChartRef = ref(null)
const volumeTrendsChartRef = ref(null)

// 图表实例
let profitTrendsChart = null
let priceTrendsChart = null
let spotArbitrageChart = null
let volumeTrendsChart = null

// 模拟数据模型
const chartData = reactive({
  profitTrends: [],
  priceTrends: [],
  spotArbitrage: [],
  volumeTrends: []
})

// 禁用未来日期
const disableFutureDates = (date) => {
  return date > today
}

// 日期范围类型变更处理函数
const handleDateRangeTypeChange = (value) => {
  if (value !== 'custom') {
    // 如果选择了预设范围，则清空自定义日期范围
    dateRange.value = []
    loadDataByDateRange(getEffectiveDateRange())
  }
}

// 日期范围变更处理函数
const handleDateRangeChange = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    loadDataByDateRange(dateRange.value)
  }
}

// 清除日期范围
const clearDateRange = () => {
  dateRange.value = []
  dateRangeType.value = 'recent14'
  loadDataByDateRange(getEffectiveDateRange())
}

// 获取有效的日期范围
const getEffectiveDateRange = () => {
  let startDate, endDate
  
  if (dateRangeType.value === 'recent14') {
    endDate = formatDate(today)
    startDate = formatDate(getDateBefore(today, 13))
  } else if (dateRangeType.value === 'recent30') {
    endDate = formatDate(today)
    startDate = formatDate(getDateBefore(today, 29))
  } else if (dateRangeType.value === 'currentMonth') {
    startDate = formatDate(getStartOfMonth(today))
    endDate = formatDate(today)
  } else if (dateRangeType.value === 'lastMonth') {
    const lastMonth = getDateBefore(getStartOfMonth(today), 1)
    startDate = formatDate(getStartOfMonth(lastMonth))
    endDate = formatDate(getEndOfMonth(lastMonth))
  } else if (dateRangeType.value === 'currentQuarter') {
    startDate = formatDate(getStartOfQuarter(today))
    endDate = formatDate(today)
  } else if (dateRangeType.value === 'custom' && dateRange.value && dateRange.value.length === 2) {
    startDate = dateRange.value[0]
    endDate = dateRange.value[1]
  } else {
    // 默认近14天
    endDate = formatDate(today)
    startDate = formatDate(getDateBefore(today, 13))
  }
  
  return [startDate, endDate]
}

// 根据日期范围加载数据
const loadDataByDateRange = (dateRange) => {
  loading.value = true
  
  // 模拟API请求延迟
  setTimeout(() => {
    // 生成所选日期范围的模拟数据
    generateMockData(dateRange)
    
    if (
      chartData.profitTrends.length === 0 || 
      chartData.priceTrends.length === 0 || 
      chartData.spotArbitrage.length === 0 || 
      chartData.volumeTrends.length === 0
    ) {
      noData.value = true
    } else {
      noData.value = false
    }
    
    loading.value = false
    
    nextTick(() => {
      initAllCharts()
    })
  }, 800)
}

// 生成模拟数据
const generateMockData = (dateRange) => {
  // 清空旧数据
  chartData.profitTrends = []
  chartData.priceTrends = []
  chartData.spotArbitrage = []
  chartData.volumeTrends = []

  const [startDateStr, endDateStr] = dateRange
  const startDate = new Date(startDateStr)
  const endDate = new Date(endDateStr)
  
  // 计算日期范围内的天数
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  
  // 生成日期范围内的每一天
  for (let i = 0; i < diffDays; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    const dateString = formatDate(currentDate)
    
    // 图表1：每日利润与关键收益趋势数据
    const baseProfit = Math.floor(5000 + Math.random() * 2000) // 基础利润，范围大约5000-7000
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6
    
    // 假定周末和工作日的利润有所不同
    const dailyProfitFactor = isWeekend ? 0.7 : 1.0
    
    // 添加一些随机波动
    const randomFactor = 0.8 + Math.random() * 0.4 // 0.8-1.2的随机因子
    
    // 计算最终的日利润
    const dailyProfit = Math.floor(baseProfit * dailyProfitFactor * randomFactor)
    
    // 假定博弈收益约占总利润的20-40%
    const gameProfit = Math.floor(dailyProfit * (0.2 + Math.random() * 0.2))
    
    // 假定现货操作收益约占总利润的10-30%
    const spotOperationProfit = Math.floor(dailyProfit * (0.1 + Math.random() * 0.2))
    
    // 现货电量比例，范围通常在5-25%之间
    const spotVolumeRatio = Math.floor(5 + Math.random() * 20)
    
    chartData.profitTrends.push({
      date: dateString,
      dailyProfit,
      gameProfit,
      spotOperationProfit,
      spotVolumeRatio
    })

    // 图表2：每日价格趋势对比数据
    // 基础批发价格，元/千瓦时，范围大概在0.35-0.55之间
    const baseWholesalePrice = 0.35 + Math.random() * 0.2
    
    // 零售价通常高于批发价约20-40%
    const retailPrice = baseWholesalePrice * (1.2 + Math.random() * 0.2)
    
    // 日前价格偏离批发价 +/-10%
    const dayAheadPrice = baseWholesalePrice * (0.9 + Math.random() * 0.2)
    
    // 实时价格偏离日前价 +/-15%
    const realTimePrice = dayAheadPrice * (0.85 + Math.random() * 0.3)
    
    chartData.priceTrends.push({
      date: dateString,
      wholesalePrice: parseFloat(baseWholesalePrice.toFixed(4)),
      retailPrice: parseFloat(retailPrice.toFixed(4)),
      dayAheadPrice: parseFloat(dayAheadPrice.toFixed(4)),
      realTimePrice: parseFloat(realTimePrice.toFixed(4))
    })

    // 图表3：每日现货套利表现数据
    // 套利上限（元），范围在3000-10000之间
    const arbitrageLimit = Math.floor(3000 + Math.random() * 7000)
    
    // 套利比例，范围在-5%到25%之间
    const arbitrageRatio = -5 + Math.random() * 30
    
    chartData.spotArbitrage.push({
      date: dateString,
      arbitrageLimit,
      arbitrageRatio: parseFloat(arbitrageRatio.toFixed(2))
    })

    // 图表4：每日电量趋势和偏差倾向数据
    // 实际电量(兆瓦时)，范围在100-300兆瓦时之间
    const baseVolume = 100 + Math.random() * 200
    
    // 预测偏差(兆瓦时)，范围在-30到30兆瓦时之间
    // 正值表示实际量大于预测量，负值表示实际量小于预测量
    const forecastDeviation = -30 + Math.random() * 60
    
    // 按预测收益(元)，与偏差大小和方向相关
    // 假定偏差每1兆瓦时影响收益约100元
    const forecastProfit = Math.abs(forecastDeviation) * 100 * (forecastDeviation > 0 ? 1 : -0.8)
    
    chartData.volumeTrends.push({
      date: dateString,
      actualVolume: parseFloat(baseVolume.toFixed(2)),
      forecastDeviation: parseFloat(forecastDeviation.toFixed(2)),
      forecastProfit: Math.floor(forecastProfit)
    })
  }
}

// 初始化所有图表
const initAllCharts = () => {
  initProfitTrendsChart()
  initPriceTrendsChart()
  initSpotArbitrageChart()
  initVolumeTrendsChart()
}

// 初始化每日利润与关键收益趋势图表
const initProfitTrendsChart = () => {
  if (!profitTrendsChartRef.value) return
  
  if (profitTrendsChart) {
    profitTrendsChart.dispose()
  }
  
  profitTrendsChart = echarts.init(profitTrendsChartRef.value)
  
  const dates = chartData.profitTrends.map(item => item.date)
  const dailyProfits = chartData.profitTrends.map(item => item.dailyProfit)
  const gameProfits = chartData.profitTrends.map(item => item.gameProfit)
  const spotOperationProfits = chartData.profitTrends.map(item => item.spotOperationProfit)
  const spotVolumeRatios = chartData.profitTrends.map(item => item.spotVolumeRatio)
  
  const option = {
    title: {
      text: '每日利润与关键收益趋势',
      left: 'center',
      top: '10px'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      },
      formatter: function(params) {
        let result = params[0].axisValue + '<br/>';
        params.forEach(param => {
          // 使用不同的单位格式化不同的指标
          if (param.seriesName === '现货电量比例') {
            result += `${param.marker} ${param.seriesName}: ${param.value}%<br/>`;
          } else {
            result += `${param.marker} ${param.seriesName}: ${param.value.toLocaleString()} 元<br/>`;
          }
        });
        return result;
      }
    },
    legend: {
      data: ['日利润', '博弈收益', '现货操作收益', '现货电量比例'],
      bottom: '0%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: dates,
        axisPointer: {
          type: 'shadow'
        },
        axisLabel: {
          rotate: 45,
          formatter: function (value) {
            // 优化日期显示，仅显示月和日
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '金额(元)',
        min: 0,
        axisLabel: {
          formatter: '{value} 元'
        }
      },
      {
        type: 'value',
        name: '比例(%)',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%'
        }
      }
    ],
    series: [
      {
        name: '日利润',
        type: 'line',
        yAxisIndex: 0,
        data: dailyProfits,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#5470c6'
        },
        symbol: 'circle',
        symbolSize: 8,
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: '博弈收益',
        type: 'line',
        yAxisIndex: 0,
        data: gameProfits,
        smooth: true,
        lineStyle: {
          width: 2,
          color: '#91cc75'
        },
        symbol: 'circle',
        symbolSize: 6,
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: '现货操作收益',
        type: 'line',
        yAxisIndex: 0,
        data: spotOperationProfits,
        smooth: true,
        lineStyle: {
          width: 2,
          color: '#ee6666'
        },
        symbol: 'circle',
        symbolSize: 6,
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: '现货电量比例',
        type: 'bar',
        yAxisIndex: 1,
        data: spotVolumeRatios,
        barWidth: '40%',
        itemStyle: {
          color: 'rgba(73, 177, 245, 0.6)'
        },
        emphasis: {
          focus: 'series'
        }
      }
    ]
  }
  
  profitTrendsChart.setOption(option)
}

// 初始化每日价格趋势对比图表
const initPriceTrendsChart = () => {
  if (!priceTrendsChartRef.value) return
  
  if (priceTrendsChart) {
    priceTrendsChart.dispose()
  }
  
  priceTrendsChart = echarts.init(priceTrendsChartRef.value)
  
  const dates = chartData.priceTrends.map(item => item.date)
  const wholesalePrices = chartData.priceTrends.map(item => item.wholesalePrice)
  const retailPrices = chartData.priceTrends.map(item => item.retailPrice)
  const dayAheadPrices = chartData.priceTrends.map(item => item.dayAheadPrice)
  const realTimePrices = chartData.priceTrends.map(item => item.realTimePrice)
  
  const option = {
    title: {
      text: '每日价格趋势对比',
      left: 'center',
      top: '10px'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      },
      formatter: function(params) {
        let result = params[0].axisValue + '<br/>';
        params.forEach(param => {
          result += `${param.marker} ${param.seriesName}: ${param.value} 元/千瓦时<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: ['批发均价', '零售均价', '日前均价', '实时均价'],
      bottom: '0%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisPointer: {
        type: 'shadow'
      },
      axisLabel: {
        rotate: 45,
        formatter: function (value) {
          // 优化日期显示，仅显示月和日
          const date = new Date(value);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '价格(元/千瓦时)',
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: [
      {
        name: '批发均价',
        type: 'line',
        data: wholesalePrices,
        smooth: true,
        lineStyle: {
          width: 2,
          color: '#5470c6'
        },
        symbol: 'circle',
        symbolSize: 6,
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: '零售均价',
        type: 'line',
        data: retailPrices,
        smooth: true,
        lineStyle: {
          width: 2,
          color: '#91cc75'
        },
        symbol: 'circle',
        symbolSize: 6,
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: '日前均价',
        type: 'line',
        data: dayAheadPrices,
        smooth: true,
        lineStyle: {
          width: 2,
          color: '#fac858'
        },
        symbol: 'circle',
        symbolSize: 6,
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: '实时均价',
        type: 'line',
        data: realTimePrices,
        smooth: true,
        lineStyle: {
          width: 2,
          color: '#ee6666'
        },
        symbol: 'circle',
        symbolSize: 6,
        emphasis: {
          focus: 'series'
        }
      }
    ]
  }
  
  priceTrendsChart.setOption(option)
}

// 初始化每日现货套利表现图表
const initSpotArbitrageChart = () => {
  if (!spotArbitrageChartRef.value) return
  
  if (spotArbitrageChart) {
    spotArbitrageChart.dispose()
  }
  
  spotArbitrageChart = echarts.init(spotArbitrageChartRef.value)
  
  const dates = chartData.spotArbitrage.map(item => item.date)
  const arbitrageLimits = chartData.spotArbitrage.map(item => item.arbitrageLimit)
  const arbitrageRatios = chartData.spotArbitrage.map(item => item.arbitrageRatio)
  
  const option = {
    title: {
      text: '每日现货套利表现',
      left: 'center',
      top: '10px'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      },
      formatter: function(params) {
        let result = params[0].axisValue + '<br/>';
        params.forEach(param => {
          if (param.seriesName === '现货套利上限') {
            result += `${param.marker} ${param.seriesName}: ${param.value.toLocaleString()} 元<br/>`;
          } else {
            result += `${param.marker} ${param.seriesName}: ${param.value}%<br/>`;
          }
        });
        return result;
      }
    },
    legend: {
      data: ['现货套利上限', '现货套利比例'],
      bottom: '0%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisPointer: {
        type: 'shadow'
      },
      axisLabel: {
        rotate: 45,
        formatter: function (value) {
          // 优化日期显示，仅显示月和日
          const date = new Date(value);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '金额(元)',
        min: 0,
        axisLabel: {
          formatter: '{value} 元'
        }
      },
      {
        type: 'value',
        name: '比例(%)',
        min: -10,
        max: 30,
        interval: 5,
        axisLabel: {
          formatter: '{value}%'
        }
      }
    ],
    series: [
      {
        name: '现货套利上限',
        type: 'bar',
        yAxisIndex: 0,
        data: arbitrageLimits,
        barWidth: '40%',
        itemStyle: {
          color: 'rgba(73, 177, 245, 0.6)'
        },
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: '现货套利比例',
        type: 'line',
        yAxisIndex: 1,
        data: arbitrageRatios,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#ee6666'
        },
        symbol: 'circle',
        symbolSize: 8,
        emphasis: {
          focus: 'series'
        },
        markLine: {
          symbol: ['none', 'none'],
          label: { show: false },
          lineStyle: { color: '#999', type: 'dashed' },
          data: [{ yAxis: 0 }] // 在y轴0位置添加一条水平线，表示盈亏分界线
        }
      }
    ]
  }
  
  spotArbitrageChart.setOption(option)
}

// 初始化每日电量趋势和偏差倾向图表
const initVolumeTrendsChart = () => {
  if (!volumeTrendsChartRef.value) return
  
  if (volumeTrendsChart) {
    volumeTrendsChart.dispose()
  }
  
  volumeTrendsChart = echarts.init(volumeTrendsChartRef.value)
  
  const dates = chartData.volumeTrends.map(item => item.date)
  const actualVolumes = chartData.volumeTrends.map(item => item.actualVolume)
  const forecastDeviations = chartData.volumeTrends.map(item => item.forecastDeviation)
  const forecastProfits = chartData.volumeTrends.map(item => item.forecastProfit)
  
  const option = {
    title: {
      text: '每日电量趋势和偏差倾向',
      left: 'center',
      top: '10px'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      },
      formatter: function(params) {
        let result = params[0].axisValue + '<br/>';
        params.forEach(param => {
          if (param.seriesName === '实际量') {
            result += `${param.marker} ${param.seriesName}: ${param.value} 兆瓦时<br/>`;
          } else if (param.seriesName === '预测偏差') {
            const value = param.value;
            const sign = value > 0 ? '+' : '';
            result += `${param.marker} ${param.seriesName}: ${sign}${value} 兆瓦时<br/>`;
          } else {
            result += `${param.marker} ${param.seriesName}: ${param.value.toLocaleString()} 元<br/>`;
          }
        });
        return result;
      }
    },
    legend: {
      data: ['实际量', '预测偏差', '按预测收益'],
      bottom: '0%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisPointer: {
        type: 'shadow'
      },
      axisLabel: {
        rotate: 45,
        formatter: function (value) {
          // 优化日期显示，仅显示月和日
          const date = new Date(value);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '电量(兆瓦时)',
        axisLabel: {
          formatter: '{value} '
        }
      },
      {
        type: 'value',
        name: '金额(元)',
        axisLabel: {
          formatter: '{value} 元'
        }
      }
    ],
    series: [
      {
        name: '实际量',
        type: 'line',
        yAxisIndex: 0,
        data: actualVolumes,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#5470c6'
        },
        symbol: 'circle',
        symbolSize: 8,
        emphasis: {
          focus: 'series'
        },
        // 在折线上标记出偏差值
        markPoint: {
          symbol: 'pin',
          symbolSize: 40,
          label: {
            formatter: (params) => {
              const index = dates.findIndex(d => d === params.name);
              if (index !== -1) {
                const dev = forecastDeviations[index];
                return dev > 0 ? `+${dev}` : `${dev}`;
              }
              return '';
            },
            color: '#000000', // 将颜色修改为黑色
            fontWeight: 'bold'
          },
          data: actualVolumes.map((vol, idx) => ({
            name: dates[idx],
            coord: [dates[idx], vol],
            itemStyle: {
              color: forecastDeviations[idx] > 0 ? '#67c23a' : '#f56c6c'
            }
          }))
        }
      },
      {
        name: '预测偏差',
        type: 'line',
        yAxisIndex: 0,
        data: forecastDeviations,
        smooth: true,
        lineStyle: {
          width: 2,
          color: '#91cc75',
          type: 'dashed'
        },
        symbol: 'circle',
        symbolSize: 6,
        emphasis: {
          focus: 'series'
        },
        markLine: {
          symbol: ['none', 'none'],
          label: { show: false },
          lineStyle: { color: '#999', type: 'dashed' },
          data: [{ yAxis: 0 }] // 在y轴0位置添加一条水平线，表示偏差为0
        }
      },
      {
        name: '按预测收益',
        type: 'bar',
        yAxisIndex: 1,
        data: forecastProfits,
        barWidth: '40%',
        itemStyle: {
          // 根据收益正负值显示不同颜色
          color: (params) => {
            return params.value >= 0 ? 'rgba(103, 194, 58, 0.6)' : 'rgba(245, 108, 108, 0.6)';
          }
        },
        emphasis: {
          focus: 'series'
        }
      }
    ]
  }
  
  volumeTrendsChart.setOption(option)
}

// 窗口大小改变时重新绘制图表
const handleResize = () => {
  if (profitTrendsChart) {
    profitTrendsChart.resize()
  }
  if (priceTrendsChart) {
    priceTrendsChart.resize()
  }
  if (spotArbitrageChart) {
    spotArbitrageChart.resize()
  }
  if (volumeTrendsChart) {
    volumeTrendsChart.resize()
  }
}

// 生命周期钩子
onMounted(() => {
  // 加载默认日期范围的数据
  loadDataByDateRange(getEffectiveDateRange())
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  // 销毁图表实例
  if (profitTrendsChart) {
    profitTrendsChart.dispose()
    profitTrendsChart = null
  }
  if (priceTrendsChart) {
    priceTrendsChart.dispose()
    priceTrendsChart = null
  }
  if (spotArbitrageChart) {
    spotArbitrageChart.dispose()
    spotArbitrageChart = null
  }
  if (volumeTrendsChart) {
    volumeTrendsChart.dispose()
    volumeTrendsChart = null
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.profit-indicators-container {
  width: 100%;
  padding: 16px;
}

.loading-container {
  margin-top: 20px;
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.indicators-content {
  margin-top: 16px;
}

.filter-section {
  background-color: #fff;
  padding: 16px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 16px;
}

.date-selector {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.preset-ranges {
  margin-bottom: 12px;
}

.custom-date-range {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.current-date-range {
  font-size: 14px;
  color: #606266;
  background-color: #f0f9eb;
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid #67c23a;
}

.chart-section {
  background-color: #fff;
  padding: 16px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.chart-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.chart-container {
  height: 400px;
  width: 100%;
}

@media screen and (max-width: 768px) {
  .date-selector {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .chart-container {
    height: 300px;
  }
}
</style>
