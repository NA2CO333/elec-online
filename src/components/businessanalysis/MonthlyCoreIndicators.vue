<template>
  <div class="monthly-indicators-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 数据展示区域 -->
    <div v-else-if="!noData" class="indicators-content">
      <!-- 顶部：日期范围选择器 -->
      <div class="filter-section">
        <h3 class="section-title">月度核心指标概览</h3>
        <div v-if="hasRenderingError" class="error-message">
          <el-alert
            title="图表渲染异常"
            type="warning"
            description="系统检测到图表渲染异常，部分内容可能无法正常显示，请刷新页面或联系管理员。"
            show-icon
            :closable="false"
          />
        </div>
        <div class="date-selector">
          <div class="preset-ranges">
            <el-radio-group v-model="dateRangeType" @change="handleDateRangeTypeChange">
              <el-radio-button label="currentMonth">本月</el-radio-button>
              <el-radio-button label="lastMonth">上月</el-radio-button>
              <el-radio-button label="currentQuarter">本季度</el-radio-button>
              <el-radio-button label="currentYear">本年</el-radio-button>
              <el-radio-button label="custom">自定义</el-radio-button>
            </el-radio-group>
          </div>

          <div class="custom-date-range" v-if="dateRangeType === 'custom'">
            <div class="month-pickers">
              <el-date-picker
                v-model="startMonth"
                type="month"
                placeholder="开始月份"
                format="YYYY年MM月"
                value-format="YYYY-MM"
                :disabled-date="disableFutureMonths"
                @change="handleDateRangeChange"
              />
              <span class="separator">至</span>
              <el-date-picker
                v-model="endMonth"
                type="month"
                placeholder="结束月份"
                format="YYYY年MM月"
                value-format="YYYY-MM"
                :disabled-date="(date) => disableInvalidEndMonths(date)"
                @change="handleDateRangeChange"
              />
            </div>
            <div class="quick-selects">
              <el-button size="small" @click="setCustomRange('last6Months')">近6个月</el-button>
              <el-button size="small" @click="setCustomRange('lastYear')">去年同期</el-button>
              <el-button size="small" @click="clearDateRange">清除</el-button>
            </div>
          </div>
          
          <div class="current-date-range">
            <span>当前数据范围: {{ displayDateRange }}</span>
          </div>
        </div>
      </div>
      
      <!-- 核心指标KPI卡 -->
      <div class="kpi-cards-section">
        <h4 class="section-subtitle">核心指标</h4>
        <div class="kpi-cards-container">
          <!-- KPI卡1：总利润指标 -->
          <div class="kpi-card">
            <div class="kpi-title">总利润</div>
            <div class="kpi-value">{{ formatCurrency(kpiData.totalProfit) }}</div>
            <div class="kpi-unit">元</div>
            <div class="kpi-changes">
              <div class="kpi-change month-on-month" v-if="kpiData.totalProfitMoM !== null">
                <span class="change-label">环比</span>
                <span class="change-value" :class="getChangeClass(kpiData.totalProfitMoM)">
                  <el-icon v-if="kpiData.totalProfitMoM > 0"><ArrowUp /></el-icon>
                  <el-icon v-else-if="kpiData.totalProfitMoM < 0"><ArrowDown /></el-icon>
                  {{ formatPercentage(kpiData.totalProfitMoM) }}
                </span>
              </div>
              <div class="kpi-change year-on-year" v-if="kpiData.totalProfitYoY !== null">
                <span class="change-label">同比</span>
                <span class="change-value" :class="getChangeClass(kpiData.totalProfitYoY)">
                  <el-icon v-if="kpiData.totalProfitYoY > 0"><ArrowUp /></el-icon>
                  <el-icon v-else-if="kpiData.totalProfitYoY < 0"><ArrowDown /></el-icon>
                  {{ formatPercentage(kpiData.totalProfitYoY) }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- KPI卡2：度电利润 -->
          <div class="kpi-card">
            <div class="kpi-title">度电利润</div>
            <div class="kpi-value">{{ formatNumber(kpiData.profitPerKwh, 4) }}</div>
            <div class="kpi-unit">元/千瓦时</div>
            <div class="kpi-tooltip">
              <el-tooltip placement="bottom">
                <template #content>
                  <div>
                    <p>总利润: {{ formatCurrency(kpiData.totalProfit) }}元</p>
                    <p>总售电量: {{ formatNumber(kpiData.totalSales) }}千瓦时</p>
                  </div>
                </template>
                <el-icon class="tooltip-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </div>
          
          <!-- KPI卡3：日前-实时博弈总收益 -->
          <div class="kpi-card">
            <div class="kpi-title">日前-实时博弈总收益</div>
            <div class="kpi-value">{{ formatCurrency(kpiData.gameProfit) }}</div>
            <div class="kpi-unit">元</div>
          </div>
          
          <!-- KPI卡4：现货操作总收益 -->
          <div class="kpi-card">
            <div class="kpi-title">现货操作总收益</div>
            <div class="kpi-value">{{ formatCurrency(kpiData.spotOperationProfit) }}</div>
            <div class="kpi-unit">元</div>
          </div>
          
          <!-- KPI卡5：现货套利实现比例 -->
          <div class="kpi-card">
            <div class="kpi-title">现货套利实现比例</div>
            <div class="kpi-gauge">
              <div class="gauge-container" ref="arbitrageGaugeRef"></div>
              <div class="gauge-value">{{ formatPercentage(kpiData.arbitrageRatio) }}</div>
            </div>
            <div class="kpi-tooltip">
              <el-tooltip placement="bottom">
                <template #content>
                  <div>
                    <p>实际套利收益: {{ formatCurrency(kpiData.actualArbitrage) }}元</p>
                    <p>理论套利上限: {{ formatCurrency(kpiData.theoreticalArbitrageLimit) }}元</p>
                  </div>
                </template>
                <el-icon class="tooltip-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 这里将添加图表和表格 -->
      
      <!-- 现货价格规律图表 -->
      <div class="charts-container">
        <div class="chart-section">
          <h4 class="section-subtitle">日前均价 (月度汇总)</h4>
          <div ref="dayAheadPriceChartRef" class="chart-container"></div>
        </div>
        
        <div class="chart-section">
          <h4 class="section-subtitle">峰平谷均价 (月度汇总)</h4>
          <div ref="peakValleyPriceChartRef" class="chart-container"></div>
        </div>
      </div>
      
      <!-- 同比电量增长率图表 -->
      <div class="growth-chart-section">
        <div class="chart-header">
          <h4 class="section-subtitle">同比电量增长率</h4>
          <div class="growth-options">
            <el-radio-group v-model="growthWindowType" @change="handleGrowthWindowChange" size="small">
              <el-radio-button label="yearToDate">今年以来</el-radio-button>
              <el-radio-button label="last28days">近28天</el-radio-button>
              <el-radio-button label="last14days">近14天</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <div ref="growthRateChartRef" class="chart-container"></div>
      </div>
      
      <!-- 预测电量vs实际电量表格 -->
      <div class="comparison-table-section">
        <h4 class="section-subtitle">月度电量对比</h4>
        <el-table
          :data="monthlyComparisonData"
          style="width: 100%"
          border
          stripe
          :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
        >
          <el-table-column prop="month" label="月份" width="100" />
          <el-table-column prop="demandVolume" label="月需求分解量" :formatter="formatTableNumber" />
          <el-table-column prop="forecastVolume" label="日前预测量" :formatter="formatTableNumber" />
          <el-table-column prop="actualVolume" label="实际量" :formatter="formatTableNumber" />
          <el-table-column prop="deviationPercentage" label="预测偏差">
            <template #default="scope">
              <span :class="getDeviationClass(scope.row.deviationPercentage)">
                {{ formatPercentage(scope.row.deviationPercentage) }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 空数据状态 -->
    <el-empty v-if="!loading && noData" description="暂无数据" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { ArrowUp, ArrowDown, QuestionFilled } from '@element-plus/icons-vue'

// 状态变量
const loading = ref(true)
const noData = ref(false)

// 日期范围选择相关
const dateRangeType = ref('currentMonth') // 默认为当前月
const startMonth = ref('')
const endMonth = ref('')
const today = new Date()

// 同比电量增长率滑动窗口类型
const growthWindowType = ref('yearToDate') // 默认为今年以来

// 图表引用
const arbitrageGaugeRef = ref(null)
const dayAheadPriceChartRef = ref(null)
const peakValleyPriceChartRef = ref(null)
const growthRateChartRef = ref(null)

// 图表实例
let arbitrageGaugeChart = null
let dayAheadPriceChart = null
let peakValleyPriceChart = null
let growthRateChart = null

// 图表渲染错误标志
const hasRenderingError = ref(false)

// KPI数据模型
const kpiData = reactive({
  totalProfit: 0,
  totalProfitMoM: null, // 环比
  totalProfitYoY: null, // 同比
  profitPerKwh: 0,
  totalSales: 0,
  gameProfit: 0,
  spotOperationProfit: 0,
  arbitrageRatio: 0,
  actualArbitrage: 0,
  theoreticalArbitrageLimit: 0
})

// 月度电量对比数据
const monthlyComparisonData = ref([])

// 计算当前月份和年份
const currentYear = today.getFullYear()
const currentMonth = today.getMonth() + 1
const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear

// 计算当前显示的日期范围
const displayDateRange = computed(() => {
  if (dateRangeType.value === 'currentMonth') {
    return `${currentYear}年${currentMonth}月`
  } else if (dateRangeType.value === 'lastMonth') {
    return `${lastMonthYear}年${lastMonth}月`
  } else if (dateRangeType.value === 'currentQuarter') {
    const quarterStartMonth = Math.floor((currentMonth - 1) / 3) * 3 + 1
    return `${currentYear}年${quarterStartMonth}月 至 ${currentYear}年${currentMonth}月`
  } else if (dateRangeType.value === 'currentYear') {
    return `${currentYear}年1月 至 ${currentYear}年${currentMonth}月`
  } else if (dateRangeType.value === 'custom' && startMonth.value && endMonth.value) {
    const startDate = new Date(startMonth.value)
    const endDate = new Date(endMonth.value)
    return `${startDate.getFullYear()}年${startDate.getMonth() + 1}月 至 ${endDate.getFullYear()}年${endDate.getMonth() + 1}月`
  }
  
  // 默认返回当前月
  return `${currentYear}年${currentMonth}月`
})

// 禁用未来月份
const disableFutureMonths = (date) => {
  return date > today
}

// 禁用无效的结束月份(不能早于开始月份)
const disableInvalidEndMonths = (date) => {
  if (date > today) {
    return true
  }
  if (startMonth.value) {
    return new Date(date) < new Date(startMonth.value)
  }
  return false
}

// 日期范围类型变更处理函数
const handleDateRangeTypeChange = (value) => {
  if (value !== 'custom') {
    // 如果选择了预设范围，则清空自定义日期范围
    startMonth.value = ''
    endMonth.value = ''
    loadDataByDateRange(getEffectiveMonthRange())
  }
}

// 日期范围变更处理函数
const handleDateRangeChange = () => {
  if (startMonth.value && endMonth.value) {
    loadDataByDateRange([startMonth.value, endMonth.value])
  }
}

// 设置自定义范围
const setCustomRange = (rangeType) => {
  const now = new Date()
  
  if (rangeType === 'last6Months') {
    // 近6个月
    const endDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const startDate = new Date(endDate)
    startDate.setMonth(startDate.getMonth() - 5)
    
    endMonth.value = formatYearMonth(endDate)
    startMonth.value = formatYearMonth(startDate)
  } else if (rangeType === 'lastYear') {
    // 去年同期
    const endDate = new Date(now.getFullYear() - 1, now.getMonth(), 1)
    const startDate = new Date(endDate)
    startDate.setMonth(startDate.getMonth() - 2) // 去年同期的3个月
    
    endMonth.value = formatYearMonth(endDate)
    startMonth.value = formatYearMonth(startDate)
  }
  
  dateRangeType.value = 'custom'
  loadDataByDateRange([startMonth.value, endMonth.value])
}

// 格式化年月为YYYY-MM格式
const formatYearMonth = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

// 清除日期范围
const clearDateRange = () => {
  startMonth.value = ''
  endMonth.value = ''
  dateRangeType.value = 'currentMonth'
  loadDataByDateRange(getEffectiveMonthRange())
}

// 获取有效的月份范围
const getEffectiveMonthRange = () => {
  const now = new Date()
  let startDate, endDate
  
  if (dateRangeType.value === 'currentMonth') {
    // 本月
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    endDate = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (dateRangeType.value === 'lastMonth') {
    // 上月
    endDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  } else if (dateRangeType.value === 'currentQuarter') {
    // 本季度
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
    startDate = new Date(now.getFullYear(), quarterStartMonth, 1)
    endDate = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (dateRangeType.value === 'currentYear') {
    // 本年
    startDate = new Date(now.getFullYear(), 0, 1)
    endDate = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (dateRangeType.value === 'custom' && startMonth.value && endMonth.value) {
    // 自定义
    startDate = new Date(startMonth.value)
    endDate = new Date(endMonth.value)
  } else {
    // 默认为当前月
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    endDate = startDate
  }
  
  return [formatYearMonth(startDate), formatYearMonth(endDate)]
}

// 根据月份范围加载数据
const loadDataByDateRange = (monthRange) => {
  loading.value = true
  
  // 模拟API请求延迟
  setTimeout(() => {
    // 生成所选月份范围的模拟数据
    generateMockData(monthRange)
    
    loading.value = false
    
    nextTick(() => {
      // 初始化所有图表
      initCharts()
    })
  }, 800)
}

// 生成模拟数据
const generateMockData = (monthRange) => {
  console.log('生成月度数据：', monthRange)
  
  // 模拟KPI数据
  kpiData.totalProfit = Math.floor(500000 + Math.random() * 500000)
  kpiData.totalProfitMoM = -0.05 + Math.random() * 0.15 // -5%到10%之间
  kpiData.totalProfitYoY = -0.1 + Math.random() * 0.3 // -10%到20%之间
  kpiData.totalSales = Math.floor(1000000 + Math.random() * 1000000)
  kpiData.profitPerKwh = kpiData.totalProfit / kpiData.totalSales
  kpiData.gameProfit = Math.floor(kpiData.totalProfit * (0.2 + Math.random() * 0.1))
  kpiData.spotOperationProfit = Math.floor(kpiData.totalProfit * (0.15 + Math.random() * 0.1))
  kpiData.theoreticalArbitrageLimit = Math.floor(300000 + Math.random() * 200000)
  kpiData.actualArbitrage = Math.floor(kpiData.theoreticalArbitrageLimit * (0.4 + Math.random() * 0.4))
  kpiData.arbitrageRatio = kpiData.actualArbitrage / kpiData.theoreticalArbitrageLimit
  
  // 生成月度电量对比数据
  generateMonthlyComparisonData(monthRange)

  // 判断是否有数据
  if (kpiData.totalProfit > 0) {
    noData.value = false
  } else {
    noData.value = true
  }
}

// 生成月度电量对比数据
const generateMonthlyComparisonData = (monthRange) => {
  const [startDateStr, endDateStr] = monthRange
  const startDate = new Date(startDateStr)
  const endDate = new Date(endDateStr)
  
  // 清空现有数据
  monthlyComparisonData.value = []
  
  // 计算月份差
  const monthDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1
  
  for (let i = 0; i < monthDiff; i++) {
    const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1)
    const month = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
    
    // 基础电量
    const baseVolume = 80000 + Math.random() * 40000
    
    // 每个月电量波动因子
    const monthFactor = 0.85 + (monthDate.getMonth() % 12) * 0.025 // 夏季和冬季电量更高
    
    // 生成模拟数据
    const demandVolume = Math.floor(baseVolume * monthFactor)
    const forecastVolume = Math.floor(demandVolume * (0.95 + Math.random() * 0.1))
    const actualVolume = Math.floor(forecastVolume * (0.9 + Math.random() * 0.2))
    const deviationPercentage = (actualVolume - forecastVolume) / forecastVolume
    
    monthlyComparisonData.value.push({
      month,
      demandVolume,
      forecastVolume,
      actualVolume,
      deviationPercentage
    })
  }
  
  // 添加合计行
  const totalDemandVolume = monthlyComparisonData.value.reduce((sum, item) => sum + item.demandVolume, 0)
  const totalForecastVolume = monthlyComparisonData.value.reduce((sum, item) => sum + item.forecastVolume, 0)
  const totalActualVolume = monthlyComparisonData.value.reduce((sum, item) => sum + item.actualVolume, 0)
  const totalDeviationPercentage = (totalActualVolume - totalForecastVolume) / totalForecastVolume
  
  monthlyComparisonData.value.push({
    month: '合计',
    demandVolume: totalDemandVolume,
    forecastVolume: totalForecastVolume,
    actualVolume: totalActualVolume,
    deviationPercentage: totalDeviationPercentage
  })
}

// 同比电量增长率滑动窗口变更处理函数
const handleGrowthWindowChange = (value) => {
  // 重新初始化增长率图表
  nextTick(() => {
    initGrowthRateChart()
  })
}

// 初始化所有图表
const initCharts = () => {
  try {
    initArbitrageGauge()
    initDayAheadPriceChart()
    initPeakValleyPriceChart()
    initGrowthRateChart()
  } catch (error) {
    console.error('初始化图表时出错:', error)
    hasRenderingError.value = true
  }
}

// 初始化现货套利仪表盘
const initArbitrageGauge = () => {
  if (!arbitrageGaugeRef.value) {
    console.error('图表容器元素不存在: arbitrageGaugeRef')
    return
  }
  
  try {
    if (arbitrageGaugeChart) {
      arbitrageGaugeChart.dispose()
    }
    
    arbitrageGaugeChart = echarts.init(arbitrageGaugeRef.value)
    
    const option = {
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          radius: '100%',
          splitNumber: 10,
          axisLine: {
            lineStyle: {
              width: 6,
              color: [
                [0.3, '#f56c6c'],
                [0.7, '#e6a23c'],
                [1, '#67c23a']
              ]
            }
          },
          pointer: {
            icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
            length: '12%',
            width: 8,
            offsetCenter: [0, '-60%'],
            itemStyle: {
              color: 'auto'
            }
          },
          axisTick: {
            length: 12,
            lineStyle: {
              color: 'auto',
              width: 1
            }
          },
          splitLine: {
            length: 20,
            lineStyle: {
              color: 'auto',
              width: 2
            }
          },
          axisLabel: {
            fontSize: 10,
            distance: -30,
            formatter: function(value) {
              return value + '%'
            }
          },
          detail: {
            show: false
          },
          data: [
            {
              value: kpiData.arbitrageRatio * 100,
              name: ''
            }
          ]
        }
      ]
    }
    
    arbitrageGaugeChart.setOption(option)
  } catch (error) {
    console.error('初始化仪表盘图表失败:', error)
  }
}

// 初始化日前均价图表
const initDayAheadPriceChart = () => {
  if (!dayAheadPriceChartRef.value) {
    console.error('图表容器元素不存在: dayAheadPriceChartRef')
    return
  }
  
  try {
    if (dayAheadPriceChart) {
      dayAheadPriceChart.dispose()
    }
    
    dayAheadPriceChart = echarts.init(dayAheadPriceChartRef.value)
    
    // 生成24小时时点
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
    
    // 获取当前选择的日期范围
    const [startMonthStr, endMonthStr] = getEffectiveMonthRange()
    const startDate = new Date(startMonthStr)
    const endDate = new Date(endMonthStr)
    
    // 生成月份列表
    const monthsList = []
    let currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      monthsList.push(`${year}-${String(month).padStart(2, '0')}`)
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
    
    // 确保至少有一个月份显示
    if (monthsList.length === 0) {
      const today = new Date()
      monthsList.push(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`)
    }
    
    // 每个月份的均价折线数据
    const seriesData = monthsList.map(month => {
      // 基础价格 (元/千瓦时)
      const basePrice = 0.3 + Math.random() * 0.2
      
      // 生成24小时数据
      return {
        name: month,
        data: hours.map((_, hourIndex) => {
          // 模拟日内波动: 凌晨低谷，早晚高峰
          let hourFactor = 1.0
          if (hourIndex < 6) {
            hourFactor = 0.8 // 凌晨低谷
          } else if (hourIndex >= 8 && hourIndex <= 11) {
            hourFactor = 1.2 // 上午高峰
          } else if (hourIndex >= 17 && hourIndex <= 21) {
            hourFactor = 1.3 // 晚高峰
          }
          
          return basePrice * hourFactor * (0.95 + Math.random() * 0.1)
        })
      }
    })
    
    const series = seriesData.map(item => {
      return {
        name: item.name,
        type: 'line',
        data: item.data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        emphasis: {
          focus: 'series'
        }
      }
    })
    
    const option = {
      title: {
        text: '按月日前均价',
        left: 'center',
        top: 0,
        textStyle: {
          fontSize: 14,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          let result = params[0].axisValue + '<br/>'
          params.forEach(param => {
            result += `${param.marker} ${param.seriesName}: ${param.value.toFixed(4)} 元/千瓦时<br/>`
          })
          return result
        }
      },
      legend: {
        data: monthsList,
        bottom: 0,
        type: 'scroll',
        pageButtonPosition: 'end'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: hours,
        axisLabel: {
          rotate: 45,
          interval: 1
        }
      },
      yAxis: {
        type: 'value',
        name: '均价(元/千瓦时)',
        min: function(value) {
          return Math.floor(value.min * 10) / 10;
        },
        axisLabel: {
          formatter: '{value}'
        }
      },
      series: series
    }
    
    dayAheadPriceChart.setOption(option)
  } catch (error) {
    console.error('初始化日前均价图表失败:', error)
  }
}

// 初始化峰平谷均价图表
const initPeakValleyPriceChart = () => {
  if (!peakValleyPriceChartRef.value) {
    console.error('图表容器元素不存在: peakValleyPriceChartRef')
    return
  }
  
  try {
    if (peakValleyPriceChart) {
      peakValleyPriceChart.dispose()
    }
    
    peakValleyPriceChart = echarts.init(peakValleyPriceChartRef.value)
    
    // 生成过去12个月
    const now = new Date()
    const months = []
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
      months.push(month)
    }
    
    // 生成峰平谷价格数据
    const basePrice = 0.35
    const peakData = months.map(() => basePrice * (1.3 + Math.random() * 0.2))
    const flatData = months.map(() => basePrice * (1.0 + Math.random() * 0.15))
    const valleyData = months.map(() => basePrice * (0.7 + Math.random() * 0.1))
    
    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          let result = params[0].axisValue + '<br/>'
          params.forEach(param => {
            result += `${param.marker} ${param.seriesName}: ${param.value.toFixed(4)} 元/千瓦时<br/>`
          })
          return result
        }
      },
      legend: {
        data: ['峰段均价', '平段均价', '谷段均价'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: '均价(元/千瓦时)',
        axisLabel: {
          formatter: '{value}'
        }
      },
      series: [
        {
          name: '峰段均价',
          type: 'line',
          data: peakData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: {
            color: '#f56c6c'
          },
          emphasis: {
            focus: 'series'
          }
        },
        {
          name: '平段均价',
          type: 'line',
          data: flatData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: {
            color: '#409EFF'
          },
          emphasis: {
            focus: 'series'
          }
        },
        {
          name: '谷段均价',
          type: 'line',
          data: valleyData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: {
            color: '#67c23a'
          },
          emphasis: {
            focus: 'series'
          }
        }
      ]
    }
    
    peakValleyPriceChart.setOption(option)
  } catch (error) {
    console.error('初始化峰平谷均价图表失败:', error)
  }
}

// 初始化同比电量增长率图表
const initGrowthRateChart = () => {
  if (!growthRateChartRef.value) {
    console.error('图表容器元素不存在: growthRateChartRef')
    return
  }
  
  try {
    if (growthRateChart) {
      growthRateChart.dispose()
    }
    
    growthRateChart = echarts.init(growthRateChartRef.value)
    
    // 生成过去12个月
    const now = new Date()
    const months = []
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
      months.push(month)
    }
    
    // 生成用户和统调区域增长率数据
    const userGrowthData = months.map(() => -10 + Math.random() * 25) // -10%到15%
    const gridGrowthData = months.map(() => -5 + Math.random() * 15) // -5%到10%
    
    // 根据滑动窗口类型调整数据
    let userAdjustedData = [...userGrowthData]
    let gridAdjustedData = [...gridGrowthData]
    
    if (growthWindowType.value === 'last28days') {
      // 近28天数据可能波动更大
      userAdjustedData = userAdjustedData.map(value => value * (0.8 + Math.random() * 0.4))
      gridAdjustedData = gridAdjustedData.map(value => value * (0.8 + Math.random() * 0.4))
    } else if (growthWindowType.value === 'last14days') {
      // 近14天数据波动更剧烈
      userAdjustedData = userAdjustedData.map(value => value * (0.7 + Math.random() * 0.6))
      gridAdjustedData = gridAdjustedData.map(value => value * (0.7 + Math.random() * 0.6))
    }
    
    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          let result = params[0].axisValue + '<br/>'
          params.forEach(param => {
            const value = param.value
            const sign = value >= 0 ? '+' : ''
            result += `${param.marker} ${param.seriesName}: ${sign}${value.toFixed(2)}%<br/>`
          })
          return result
        }
      },
      legend: {
        data: ['用户增长率', '统调增长率'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: '增长率(%)',
        axisLabel: {
          formatter: '{value}%'
        },
        axisLine: {
          show: true
        },
        splitLine: {
          show: true
        }
      },
      series: [
        {
          name: '用户增长率',
          type: 'line',
          data: userAdjustedData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 3
          },
          itemStyle: {
            color: '#409EFF'
          },
          emphasis: {
            focus: 'series'
          },
          markLine: {
            symbol: ['none', 'none'],
            label: { show: false },
            lineStyle: { color: '#999', type: 'dashed' },
            data: [{ yAxis: 0 }] // 在y轴0位置添加一条水平线
          }
        },
        {
          name: '统调增长率',
          type: 'line',
          data: gridAdjustedData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 3
          },
          itemStyle: {
            color: '#67c23a'
          },
          emphasis: {
            focus: 'series'
          }
        }
      ]
    }
    
    growthRateChart.setOption(option)
  } catch (error) {
    console.error('初始化同比电量增长率图表失败:', error)
  }
}

// 工具方法：获取变化率的样式类
const getChangeClass = (value) => {
  if (value > 0) return 'change-positive'
  if (value < 0) return 'change-negative'
  return ''
}

// 工具方法：获取偏差的样式类
const getDeviationClass = (value) => {
  if (value > 0.05) return 'deviation-high'
  if (value < -0.05) return 'deviation-low'
  return 'deviation-normal'
}

// 表格数字格式化
const formatTableNumber = (row, column, cellValue) => {
  if (column.property === 'month') return cellValue
  return cellValue.toLocaleString()
}

// 格式化为货币
const formatCurrency = (value) => {
  if (value >= 10000) {
    return (value / 10000).toFixed(2) + '万'
  }
  return value.toLocaleString()
}

// 格式化为百分比
const formatPercentage = (value) => {
  const percentage = value * 100
  const sign = percentage > 0 ? '+' : ''
  return `${sign}${percentage.toFixed(1)}%`
}

// 格式化数字
const formatNumber = (value, digits = 2) => {
  return value.toFixed(digits)
}

// 在组件挂载后初始化图表
onMounted(() => {
  try {
    // 初始化状态
    loading.value = true
    
    // 加载数据
    setTimeout(() => {
      generateMockData(getEffectiveMonthRange())
      loading.value = false
      
      // 等待DOM更新后初始化图表
      nextTick(() => {
        try {
          initCharts()
        } catch (error) {
          console.error('初始化图表时出错:', error)
          hasRenderingError.value = true
        }
      })
    }, 1000) // 模拟API请求延迟
    
    window.addEventListener('resize', handleResize)
  } catch (error) {
    console.error('组件挂载时出错:', error)
    loading.value = false
    hasRenderingError.value = true
  }
})

// 窗口大小改变时重新绘制图表
const handleResize = () => {
  if (arbitrageGaugeChart) {
    arbitrageGaugeChart.resize()
  }
  if (dayAheadPriceChart) {
    dayAheadPriceChart.resize()
  }
  if (peakValleyPriceChart) {
    peakValleyPriceChart.resize()
  }
  if (growthRateChart) {
    growthRateChart.resize()
  }
}

// 在组件卸载前销毁图表实例
onBeforeUnmount(() => {
  if (arbitrageGaugeChart) {
    arbitrageGaugeChart.dispose()
    arbitrageGaugeChart = null
  }
  
  if (dayAheadPriceChart) {
    dayAheadPriceChart.dispose()
    dayAheadPriceChart = null
  }
  
  if (peakValleyPriceChart) {
    peakValleyPriceChart.dispose()
    peakValleyPriceChart = null
  }
  
  if (growthRateChart) {
    growthRateChart.dispose()
    growthRateChart = null
  }
  
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.monthly-indicators-container {
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

.error-message {
  margin: 10px 0 15px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 16px;
}

.section-subtitle {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.date-selector {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preset-ranges {
  margin-bottom: 8px;
}

.custom-date-range {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.month-pickers {
  display: flex;
  align-items: center;
  gap: 12px;
}

.separator {
  color: #606266;
  font-size: 14px;
}

.quick-selects {
  display: flex;
  gap: 8px;
}

.current-date-range {
  font-size: 14px;
  color: #606266;
  background-color: #f0f9eb;
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid #67c23a;
}

/* KPI卡片样式 */
.kpi-cards-section {
  background-color: #fff;
  padding: 16px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.kpi-cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.kpi-card {
  position: relative;
  padding: 20px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #ebeef5;
  text-align: center;
  height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.kpi-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.kpi-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
  line-height: 1.2;
}

.kpi-unit {
  font-size: 12px;
  color: #909399;
  margin-bottom: 10px;
}

.kpi-changes {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 5px;
}

.kpi-change {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.change-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.change-value {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.change-positive {
  color: #67c23a;
}

.change-negative {
  color: #f56c6c;
}

.kpi-tooltip {
  position: absolute;
  top: 10px;
  right: 10px;
}

.tooltip-icon {
  color: #909399;
  cursor: pointer;
  font-size: 16px;
}

.kpi-gauge {
  position: relative;
  height: 100px;
  margin-top: 10px;
}

.gauge-container {
  width: 100%;
  height: 100%;
}

.gauge-value {
  position: absolute;
  top: 55%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

:deep(.el-icon) {
  color: inherit;
  font-size: inherit;
}

/* 图表容器样式 */
.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.chart-section {
  background-color: #fff;
  padding: 16px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.chart-container {
  height: 320px;
  width: 100%;
}

.growth-chart-section {
  background-color: #fff;
  padding: 16px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.growth-options {
  display: flex;
  align-items: center;
}

/* 表格样式 */
.comparison-table-section {
  background-color: #fff;
  padding: 16px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.deviation-high {
  color: #67c23a;
  font-weight: bold;
}

.deviation-low {
  color: #f56c6c;
  font-weight: bold;
}

.deviation-normal {
  color: #e6a23c;
}

@media screen and (max-width: 768px) {
  .month-pickers {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .quick-selects {
    flex-wrap: wrap;
  }
  
  .kpi-cards-container {
    grid-template-columns: 1fr;
  }
  
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 250px;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .growth-options {
    width: 100%;
    overflow-x: auto;
  }
}
</style>
