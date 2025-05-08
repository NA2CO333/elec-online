<template>
  <div class="price-deviation-container">
    <!-- 内容区域 -->
    <div class="analysis-content">
      <!-- 左侧主分析区 (约占2/3宽度) -->
      <div class="main-analysis-area">
        <!-- 3.4 时点价差表 -->
        <div class="analysis-card">
          <div class="card-header">
            <h3>时点价差表</h3>
            <div class="card-tools">
              <!-- 日期范围选择器 -->
              <div class="date-range-selector">
                <el-date-picker
                  v-model="hourlyPriceDeviationDateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY/MM/DD"
                  value-format="YYYY-MM-DD"
                  :shortcuts="dateRangeShortcuts"
                  @change="loadHourlyPriceDeviationData"
                />
              </div>
              <el-tooltip content="导出表格">
                <el-button size="small" circle>
                  <el-icon><Download /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </div>
          <div class="table-container hourly-price-deviation-table">
            <el-table
              :data="[
                ...hourlyPriceDeviationData,
                { type: '价差均值', date: '', dayType: '', ...Object.fromEntries(statisticalData.average.map((v, i) => [`h${i}`, v])) },
                { type: '标准差', date: '', dayType: '', ...Object.fromEntries(statisticalData.stdDev.map((v, i) => [`h${i}`, v])) },
                { type: '概率', date: '', dayType: '', ...Object.fromEntries(statisticalData.probability.map((v, i) => [`h${i}`, v])) }
              ]"
              style="width: 100%"
              border
              height="650"
              :cell-class-name="getHourlyDeviationCellClass"
            >
              <el-table-column prop="date" label="日期" width="100" fixed align="center">
                <template #default="{ row }">
                  {{ row.type || row.date }}
                </template>
              </el-table-column>
              <el-table-column prop="dayType" label="日类型" width="90" fixed align="center">
                <template #default="{ row }">
                  <template v-if="row.type === '概率'">
                    <div class="probability-input">
                      <el-input
                        v-model="probabilityConditionInput"
                        placeholder=">0, < -5"
                        style="width: 100%;"
                        :input-style="{
                          color: '#000000',
                          backgroundColor: '#ffffff'
                        }"
                        @input="setProbabilityCondition"
                      />
                    </div>
                  </template>
                  <template v-else>
                    {{ row.dayType }}
                  </template>
                </template>
              </el-table-column>
              <el-table-column
                v-for="hour in 24"
                :key="hour - 1"
                :prop="`h${hour - 1}`"
                :label="`${hour - 1}时`"
                width="57"
                align="center"
              >
                <template #default="{ row }">
                  <template v-if="row.type === '概率'">
                    {{ row[`h${hour - 1}`] }}%
                  </template>
                  <template v-else>
                    {{ row[`h${hour - 1}`] }}
                  </template>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
        
        <!-- 4. 关联分析模块 -->
        <div class="correlation-analysis-section analysis-card">
          <div class="card-header">
            <h3>关联分析</h3>
          </div>
          <div class="dual-scatter-container">
            <!-- 左侧散点图 - 日前价 vs 关联变量 -->
            <div class="scatter-chart-box">
              <div class="chart-controls">
                <div class="control-group">
                  <span class="control-label">下拉菜单A:</span>
                  <el-select v-model="dayAheadPriceCorrelationVariable" placeholder="选择关联变量" size="small" style="width: 150px;">
                    <el-option label="气温" value="temperature" />
                    <el-option label="云量" value="cloudCover" />
                    <el-option label="风速" value="windSpeed" />
                    <el-option label="降水量" value="precipitation" />
                    <el-option label="辐照" value="radiation" />
                    <el-option label="统调负荷" value="dispatchLoad" />
                    <el-option label="B类负荷" value="classBLoad" />
                    <el-option label="西电负荷" value="westLoad" />
                  </el-select>
                </div>
              </div>
              <div class="chart-title">关联分析：日前价</div>
              <div class="chart-container" ref="dayAheadPriceScatterRef" style="height: 400px;"></div>
            </div>

            <!-- 右侧散点图 - 价差 vs 关联变量 -->
            <div class="scatter-chart-box">
              <div class="chart-controls">
                <div class="control-group">
                  <span class="control-label">下拉菜单A:</span>
                  <el-select v-model="priceDiffCorrelationVariable" placeholder="选择关联变量" size="small" style="width: 150px;">
                    <el-option label="气温" value="temperature" />
                    <el-option label="云量" value="cloudCover" />
                    <el-option label="风速" value="windSpeed" />
                    <el-option label="降水量" value="precipitation" />
                    <el-option label="辐照" value="radiation" />
                    <el-option label="统调负荷" value="dispatchLoad" />
                    <el-option label="B类负荷" value="classBLoad" />
                    <el-option label="西电负荷" value="westLoad" />
                  </el-select>
                </div>
              </div>
              <div class="chart-title">关联分析：价差</div>
              <div class="chart-container" ref="priceDiffScatterRef" style="height: 400px;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 阈值设置对话框 -->
    <el-dialog
      title="价差阈值设置"
      v-model="thresholdDialogVisible"
      width="40%"
    >
      <div class="threshold-form">
        <el-form :model="thresholdForm" label-width="150px">
          <el-form-item label="价差上限阈值(¥/MWh)">
            <el-input-number
              v-model="thresholdForm.upperPriceDiff"
              :step="10"
              :min="0"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="价差下限阈值(¥/MWh)">
            <el-input-number
              v-model="thresholdForm.lowerPriceDiff"
              :step="10"
              :max="0"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="价差率上限阈值(%)">
            <el-input-number
              v-model="thresholdForm.upperPriceDevRate"
              :step="5"
              :min="0"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="价差率下限阈值(%)">
            <el-input-number
              v-model="thresholdForm.lowerPriceDevRate"
              :step="5"
              :max="0"
              controls-position="right"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="thresholdDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="applyThresholds">应用</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { ArrowDown, Download, View, Setting } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 日期计算帮助函数
function getDaysAgo(days: number) {
  return dayjs().subtract(days, 'day').format('YYYY-MM-DD')
}

// 日期范围设置
const dateRange = ref<string[]>([getDaysAgo(7), getDaysAgo(1)])

// 日期快捷选项
const dateRangeShortcuts = [
  {
    text: '今日',
    value: () => {
      const today = dayjs().format('YYYY-MM-DD')
      return [today, today]
    }
  },
  {
    text: '昨日',
    value: () => {
      const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
      return [yesterday, yesterday]
    }
  },
  {
    text: '近7日',
    value: () => {
      return [getDaysAgo(7), getDaysAgo(1)]
    }
  },
  {
    text: '近30日',
    value: () => {
      return [getDaysAgo(30), getDaysAgo(1)]
    }
  },
  {
    text: '本月',
    value: () => {
      const start = dayjs().startOf('month').format('YYYY-MM-DD')
      const end = dayjs().format('YYYY-MM-DD')
      return [start, end]
    }
  },
  {
    text: '上月',
    value: () => {
      const start = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD')
      const end = dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')
      return [start, end]
    }
  },
  {
    text: '本季度',
    value: () => {
      const start = dayjs().startOf('quarter' as any).format('YYYY-MM-DD')
      const end = dayjs().format('YYYY-MM-DD')
      return [start, end]
    }
  },
  {
    text: '上季度',
    value: () => {
      const start = dayjs().subtract(1, 'quarter' as any).startOf('quarter' as any).format('YYYY-MM-DD')
      const end = dayjs().subtract(1, 'quarter' as any).endOf('quarter' as any).format('YYYY-MM-DD')
      return [start, end]
    }
  },
  {
    text: '本年',
    value: () => {
      const start = dayjs().startOf('year').format('YYYY-MM-DD')
      const end = dayjs().format('YYYY-MM-DD')
      return [start, end]
    }
  },
  {
    text: '去年',
    value: () => {
      const start = dayjs().subtract(1, 'year').startOf('year').format('YYYY-MM-DD')
      const end = dayjs().subtract(1, 'year').endOf('year').format('YYYY-MM-DD')
      return [start, end]
    }
  }
]

// 维度选择
const selectedTimeDimensions = ref<string[]>(['dayType', 'timeSegment'])
const selectedWeatherDimensions = ref<string[]>(['temperature', 'precipitation', 'humidity', 'radiation', 'windSpeed'])
const selectedLoadDimensions = ref<string[]>(['dispatchLoad', 'classB', 'westLoad'])
const selectedOtherDimensions = ref<string[]>(['specialEvents'])

// 核心价格对比指标
const selectedPriceMetrics = ref<string[]>(['priceDiff', 'priceDevRate'])

// 图表引用
const scatterChartRef = ref<HTMLElement | null>(null)
let scatterChart: echarts.ECharts | null = null

// 阈值设置
const thresholdDialogVisible = ref(false)
const thresholdForm = reactive({
  upperPriceDiff: 50, // 默认价差上限 50 ¥/MWh
  lowerPriceDiff: -30, // 默认价差下限 -30 ¥/MWh
  upperPriceDevRate: 20, // 默认价差率上限 20%
  lowerPriceDevRate: -15 // 默认价差率下限 -15%
})

// 散点图设置
const scatterXAxis = ref('dayAheadPrice') // 默认X轴为日前价格
const scatterColorBy = ref('dayType') // 默认按日类型着色

// 表格设置
const currentAggregation = ref('avg') // 默认聚合方式为平均
// 透视表数据(模拟数据)
const pivotTableData = ref([
  // ... 移除所有透视表数据 ...
])

// 时点价差表类型定义
interface HourlyPriceDeviation {
  date: string
  dayType: string
  [key: string]: string | number // 用于存储0-23小时的价差数据
}

interface StatisticalData {
  average: number[]
  stdDev: number[]
  probability: number[]
}

// 时点价差表数据
const hourlyPriceDeviationDateRange = ref<[string, string]>([getDaysAgo(30), getDaysAgo(1)])
const hourlyPriceDeviationData = ref<HourlyPriceDeviation[]>([])
const statisticalData = reactive<StatisticalData>({
  average: Array(24).fill(0),
  stdDev: Array(24).fill(0),
  probability: Array(24).fill(0)
})
const probabilityCondition = ref('')
const probabilityConditionInput = ref('')

// 关联分析散点图
const dayAheadPriceScatterRef = ref<HTMLElement | null>(null)
const priceDiffScatterRef = ref<HTMLElement | null>(null)
let dayAheadPriceScatterChart: echarts.ECharts | null = null
let priceDiffScatterChart: echarts.ECharts | null = null

const dayAheadPriceCorrelationVariable = ref('temperature') // 默认关联气温
const priceDiffCorrelationVariable = ref('temperature') // 默认关联气温

// 日类型映射
const dayTypeMap: Record<string, string> = {
  'WORKDAY': '工',
  'SATURDAY': '六',
  'SUNDAY': '日',
  'MONDAY': '一',
  'ADJUSTED_WORKDAY': '调',
  'HOLIDAY': '节'
}

// 方法定义
function handleDateRangeChange() {
  // 日期范围变化时加载新数据
  console.log('日期范围变化:', dateRange.value)
}

function applyFilters() {
  // 根据筛选条件加载数据
  loadData()
}

function resetFilters() {
  // 重置为默认值
  dateRange.value = [getDaysAgo(7), getDaysAgo(1)]
  selectedTimeDimensions.value = ['dayType', 'timeSegment']
  selectedWeatherDimensions.value = ['temperature', 'precipitation', 'humidity', 'radiation', 'windSpeed']
  selectedLoadDimensions.value = ['dispatchLoad', 'classB', 'westLoad']
  selectedOtherDimensions.value = ['specialEvents']
  selectedPriceMetrics.value = ['priceDiff', 'priceDevRate']
  
  // 重新加载数据
  loadData()
}

// 阈值设置方法
function showThresholdDialog() {
  thresholdDialogVisible.value = true
}

function applyThresholds() {
  thresholdDialogVisible.value = false
  // 更新图表阈值线
  updateScatterChart()
}

// 透视表方法
function changeAggregation(type: string) {
  currentAggregation.value = type
  console.log('改变聚合方式:', type)
  // 根据选择的聚合方式重新加载透视表数据
  loadPivotTableData()
}

function getCellClass({ row, column }: { row: any; column: any }) {
  // 根据单元格值设置不同的颜色类
  if (column.property.startsWith('h') || column.property === 'average') {
    const value = row[column.property]
    if (value > thresholdForm.upperPriceDiff) return 'cell-high-positive'
    if (value < thresholdForm.lowerPriceDiff) return 'cell-high-negative'
    if (value > 10) return 'cell-low-positive'
    if (value < -10) return 'cell-low-negative'
  }
  return ''
}

function handleCellClick(row: any, column: any) {
  // 单元格点击事件，可用于钻取功能
  if (column.property.startsWith('h')) {
    const hour = parseInt(column.property.substring(1))
    console.log(`钻取到 ${row.dimension} 的第 ${hour} 小时数据`)
    // 这里可以实现钻取逻辑
  }
}

// 散点图方法
function setScatterXAxis(dimension: string) {
  scatterXAxis.value = dimension
  console.log('设置散点图X轴:', dimension)
  updateScatterChart()
}

function setScatterColorBy(dimension: string) {
  scatterColorBy.value = dimension
  console.log('设置散点图颜色编码:', dimension)
  updateScatterChart()
}

// 数据加载函数
function loadData() {
  // 模拟数据加载逻辑，后续会与真实接口对接
  console.log('加载数据，日期范围:', dateRange.value)
  console.log('选中的维度:', {
    时间: selectedTimeDimensions.value,
    气象: selectedWeatherDimensions.value,
    负荷: selectedLoadDimensions.value,
    其他: selectedOtherDimensions.value
  })
  
  // 初始化图表
  nextTick(() => {
    initScatterChart()
  })
  
  // 加载透视表数据
  loadPivotTableData()
}

function loadPivotTableData() {
  // 模拟加载透视表数据
  console.log('加载透视表数据，聚合方式:', currentAggregation.value)
  // 这里可以根据选择的聚合方式生成不同的透视表数据
  // 目前使用静态演示数据
}

// 图表初始化
function initScatterChart() {
  // 初始化散点图
  if (scatterChartRef.value) {
    scatterChart = echarts.init(scatterChartRef.value)
    updateScatterChart()
  }
}

function updateScatterChart() {
  // 更新散点图
  if (!scatterChart) return
  
  // 生成模拟数据
  const data = Array.from({ length: 100 }, () => {
    // X轴数据：日前价、负荷或温度
    let xValue
    switch(scatterXAxis.value) {
      case 'dayAheadPrice':
        xValue = Math.floor(Math.random() * 500) + 200 // 200-700 ¥/MWh
        break
      case 'dispatchLoad':
        xValue = Math.floor(Math.random() * 10000) + 20000 // 20000-30000 MWh
        break
      case 'temperature':
        xValue = Math.floor(Math.random() * 30) + 5 // 5-35 °C
        break
      case 'windSpeed':
        xValue = Math.random() * 10 // 0-10 m/s
        break
      default:
        xValue = Math.floor(Math.random() * 500) + 200
    }
    
    // 价差Y轴数据
    const yValue = Math.floor(Math.random() * 120) - 60 // -60 to 60 ¥/MWh
    
    // 分类数据
    const dayType = Math.random() > 0.3 ? '工作日' : '周末'
    const timeSegment = ['尖峰', '高峰', '平段', '低谷'][Math.floor(Math.random() * 4)]
    const hasSpecialEvent = Math.random() > 0.9 // 10%的概率有特殊事件
    
    return {
      xValue,
      yValue,
      dayType,
      timeSegment,
      hasSpecialEvent
    }
  })
  
  // 配置X轴名称
  let xAxisName
  switch(scatterXAxis.value) {
    case 'dayAheadPrice':
      xAxisName = '日前价格(¥/MWh)'
      break
    case 'dispatchLoad':
      xAxisName = '统调负荷(MWh)'
      break
    case 'temperature':
      xAxisName = '温度(°C)'
      break
    case 'windSpeed':
      xAxisName = '风速(m/s)'
      break
    default:
      xAxisName = '日前价格(¥/MWh)'
  }
  
  // 配置颜色映射
  let visualMap
  if (scatterColorBy.value === 'none') {
    visualMap = {
      show: false,
      min: -60,
      max: 60,
      inRange: {
        color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
      }
    }
  } else {
    visualMap = {
      show: true,
      dimension: scatterColorBy.value === 'dayType' ? 2 : (scatterColorBy.value === 'timeSegment' ? 3 : 4),
      type: 'piecewise',
      categories: scatterColorBy.value === 'dayType' ? 
        ['工作日', '周末'] : 
        (scatterColorBy.value === 'timeSegment' ? ['尖峰', '高峰', '平段', '低谷'] : ['有特殊事件', '无特殊事件']),
      inRange: {
        color: scatterColorBy.value === 'dayType' ? 
          ['#91CC75', '#5470C6'] : 
          (scatterColorBy.value === 'timeSegment' ? ['#EE6666', '#FAC858', '#73C0DE', '#3BA272'] : ['#FF0000', '#5470C6'])
      }
    }
  }
  
  const option = {
    title: {
      text: '价差关联分析',
      left: 'center'
    },
    tooltip: {
      formatter: function(param: any) {
        const data = param.data
        let result = xAxisName + ': ' + data[0] + '<br/>'
        result += '价差: ' + data[1] + ' ¥/MWh<br/>'
        result += '日类型: ' + data[2] + '<br/>'
        result += '时段: ' + data[3] + '<br/>'
        result += '特殊事件: ' + (data[4] ? '有' : '无')
        return result
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'value',
        name: xAxisName,
        nameLocation: 'end'
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '价差(¥/MWh)',
        nameLocation: 'end'
      }
    ],
    visualMap: visualMap,
    series: [
      {
        name: '价差分析',
        type: 'scatter',
        symbolSize: 8,
        data: data.map(item => [
          item.xValue, 
          item.yValue, 
          item.dayType, 
          item.timeSegment, 
          item.hasSpecialEvent
        ])
      }
    ]
  }
  
  scatterChart.setOption(option)
}

// 窗口大小变化时重绘图表
function handleResize() {
  scatterChart?.resize()
}

// 生命周期钩子
onMounted(() => {
  // 初始化加载数据
  loadData()
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize)

  nextTick(() => {
      updateDayAheadPriceScatter();
      updatePriceDiffScatter();
  });
})

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('resize', handleResize)
  
  // 销毁图表实例
  scatterChart?.dispose()

  window.removeEventListener('resize', handleCorrelationChartsResize)
  dayAheadPriceScatterChart?.dispose()
  priceDiffScatterChart?.dispose()
})

// 时点价差表方法
function loadHourlyPriceDeviationData() {
  // 模拟数据生成
  const [startDate, endDate] = hourlyPriceDeviationDateRange.value
  const days = dayjs(endDate).diff(dayjs(startDate), 'day') + 1
  
  const data: HourlyPriceDeviation[] = []
  for (let i = 0; i < days; i++) {
    const currentDate = dayjs(startDate).add(i, 'day')
    const dayType = ['WORKDAY', 'SATURDAY', 'SUNDAY', 'HOLIDAY'][Math.floor(Math.random() * 4)]
    
    const hourlyData: HourlyPriceDeviation = {
      date: currentDate.format('YYYY/MM/DD'),
      dayType: dayTypeMap[dayType]
    }
    
    // 生成24小时的价差数据
    for (let hour = 0; hour < 24; hour++) {
      hourlyData[`h${hour}`] = Math.round(Math.random() * 200 - 100) // 使用Math.round确保生成整数
    }
    
    data.push(hourlyData)
  }
  
  hourlyPriceDeviationData.value = data
  calculateStatistics()
}

// 计算统计数据
function calculateStatistics() {
  const data = hourlyPriceDeviationData.value
  
  // 计算每个小时的均值
  statisticalData.average = Array(24).fill(0).map((_, hour) => {
    const values = data.map(row => {
      const realTimePrice = Number(row[`h${hour}`])
      const dayAheadPrice = 0 // 这里需要从数据中获取日前价格
      return realTimePrice - dayAheadPrice
    })
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  })
  
  // 计算每个小时的标准差
  statisticalData.stdDev = Array(24).fill(0).map((_, hour) => {
    const values = data.map(row => {
      const realTimePrice = Number(row[`h${hour}`])
      const dayAheadPrice = 0 // 这里需要从数据中获取日前价格
      return realTimePrice - dayAheadPrice
    })
    const mean = statisticalData.average[hour]
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (values.length - 1)
    return Math.round(Math.sqrt(variance))
  })
  
  // 计算概率（如果有条件）
  if (probabilityCondition.value) {
    calculateProbability()
  }
}

// 计算满足条件的概率
function calculateProbability() {
  const condition = probabilityCondition.value.trim()
  const operator = condition.match(/[><=!]+/)?.[0]
  const value = Math.round(Number(condition.match(/-?\d+(\.\d+)?/)?.[0]))
  
  if (!operator || isNaN(value)) return
  
  const data = hourlyPriceDeviationData.value
  statisticalData.probability = Array(24).fill(0).map((_, hour) => {
    const values = data.map(row => {
      const realTimePrice = Number(row[`h${hour}`])
      const dayAheadPrice = 0 // 这里需要从数据中获取日前价格
      return realTimePrice - dayAheadPrice
    })
    const satisfiedCount = values.filter(v => {
      switch (operator) {
        case '>': return v > value
        case '<': return v < value
        case '>=': return v >= value
        case '<=': return v <= value
        case '==': return v === value
        case '!=': return v !== value
        default: return false
      }
    }).length
    return Math.round((satisfiedCount / values.length) * 100)
  })
}

// 设置概率计算条件
function setProbabilityCondition() {
  const input = probabilityConditionInput.value.trim()
  if (!input.match(/^[><=!]+\s*-?\d+(\.\d+)?$/)) {
    return
  }
  probabilityCondition.value = input
  calculateProbability()
}

// 获取单元格样式类名
function getHourlyDeviationCellClass({ row, column }: { row: any, column: any }) {
  if (column.property.startsWith('h') && !row.type) {
    const value = Number(row[column.property])
    if (value > 200) return 'cell-positive-5'
    if (value > 100) return 'cell-positive-4'
    if (value > 50) return 'cell-positive-3'
    if (value > 20) return 'cell-positive-2'
    if (value > 5) return 'cell-positive-1'
    if (value < -200) return 'cell-negative-5'
    if (value < -100) return 'cell-negative-4'
    if (value < -50) return 'cell-negative-3'
    if (value < -20) return 'cell-negative-2'
    if (value < -5) return 'cell-negative-1'
  }
  return ''
}

// 监听日期范围变化
watch(hourlyPriceDeviationDateRange, () => {
  loadHourlyPriceDeviationData()
}, { immediate: true })

// 模拟关联分析数据
function generateCorrelationData(yAxisType: 'dayAheadPrice' | 'priceDiff', correlationVariable: string) {
  const data = []
  const dayTypes = ['工', '六', '日', '一', '节', '调']; // 示例数据，补充"一"
  for (let i = 0; i < 50; i++) {
    let xValue
    // 根据关联变量类型生成模拟数据
    if (['temperature', 'cloudCover', 'windSpeed', 'precipitation', 'radiation'].includes(correlationVariable)) {
      xValue = Math.random() * 30 + 5 // 气象数据模拟
    } else {
      xValue = Math.random() * 50000 + 10000 // 负荷数据模拟
    }
    
    const yValue = yAxisType === 'dayAheadPrice' ? Math.random() * 500 + 100 : Math.random() * 200 - 100 // 日前价或价差模拟
    const dayType = dayTypes[Math.floor(Math.random() * dayTypes.length)]
    const date = dayjs().subtract(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD')
    data.push([xValue, yValue, dayType, date]);
  }
  return data
}

function getXAxisName(variable: string): string {
    switch(variable) {
        case 'temperature': return '气温 (°C)';
        case 'cloudCover': return '云量 (%)';
        case 'windSpeed': return '风速 (m/s)';
        case 'precipitation': return '降水量 (mm)';
        case 'radiation': return '辐照 (W/m²)';
        case 'dispatchLoad': return '统调负荷 (MW)';
        case 'classBLoad': return 'B类负荷 (MW)';
        case 'westLoad': return '西电负荷 (MW)';
        default: return '关联变量';
    }
}

function initOrUpdateScatterChart(
  chartInstance: echarts.ECharts | null,
  chartRef: HTMLElement | null,
  data: any[],
  title: string,
  xAxisName: string,
  yAxisName: string
): echarts.ECharts | null {
  if (!chartRef) return chartInstance;
  let currentChart = chartInstance;
  if (!currentChart) {
    currentChart = echarts.init(chartRef);
  }

  const option = {
    title: {
      text: title,
      left: 'center',
      show: false // 主标题已在HTML中定义
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const val = params.value;
        return `${params.marker}<br/>
                日期: ${val[3]}<br/>
                日类型: ${val[2]}<br/>
                ${xAxisName}: ${val[0].toFixed(2)}<br/>
                ${yAxisName}: ${val[1].toFixed(2)} 元/MWh`;
      }
    },
    grid: {
        top: '10%',    // 顶部留白，可根据标题和图例调整
        left: '12%',   // 左侧留白，为Y轴名称和刻度留出空间
        right: '5%',   // 右侧留白
        bottom: '18%', // 底部留白，为X轴名称、刻度和图例留出空间
        containLabel: true // 防止标签溢出
    },
    xAxis: {
      name: xAxisName,
      type: 'value',
      nameLocation: 'middle',
      nameGap: 25
    },
    yAxis: {
      name: yAxisName + ' (元/MWh)',
      type: 'value',
      nameLocation: 'middle',
      nameGap: 40 // 适当调整Y轴名称与轴线的距离
    },
    visualMap: {
        type: 'piecewise',
        orient: 'horizontal',
        left: 'center',
        bottom: 10, // visualMap 放置在底部
        pieces: [
            { value: '一', label: '一', color: '#fc8452' },
            { value: '六', label: '六', color: '#91cc75' },
            { value: '工', label: '工', color: '#5470c6' },
            { value: '日', label: '日', color: '#fac858' },
            { value: '节', label: '节', color: '#ee6666' },
            { value: '调', label: '调', color: '#73c0de' },
        ],
        seriesIndex: 0,
        dimension: 2 // 数据格式为 [x, y, dayType, date]
    },
    series: [{
      name: title,
      type: 'scatter',
      data: data,
      symbolSize: 8,
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut',
      animationDelay: (idx: number) => idx * 10
    }]
  };
  currentChart.setOption(option);
  // 显式调用resize确保图表根据容器尺寸更新
  currentChart.resize(); 
  return currentChart;
}

function updateDayAheadPriceScatter() {
  const data = generateCorrelationData('dayAheadPrice', dayAheadPriceCorrelationVariable.value);
  const xAxisName = getXAxisName(dayAheadPriceCorrelationVariable.value);
  dayAheadPriceScatterChart = initOrUpdateScatterChart(
    dayAheadPriceScatterChart,
    dayAheadPriceScatterRef.value,
    data,
    '关联分析：日前价',
    xAxisName,
    '日前价'
  );
}

function updatePriceDiffScatter() {
  const data = generateCorrelationData('priceDiff', priceDiffCorrelationVariable.value);
  const xAxisName = getXAxisName(priceDiffCorrelationVariable.value);
  priceDiffScatterChart = initOrUpdateScatterChart(
    priceDiffScatterChart,
    priceDiffScatterRef.value,
    data,
    '关联分析：价差',
    xAxisName,
    '价差'
  );
}

watch(dayAheadPriceCorrelationVariable, updateDayAheadPriceScatter);
watch(priceDiffCorrelationVariable, updatePriceDiffScatter);

function handleCorrelationChartsResize() {
    dayAheadPriceScatterChart?.resize();
    priceDiffScatterChart?.resize();
}
</script>

<style scoped>
.price-deviation-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.analysis-content {
  display: flex;
  flex: 1;
  overflow: auto;
  padding: 16px;
  gap: 16px;
  height: calc(100vh - 50px);
}

.main-analysis-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0; /* 修复Flex子元素溢出问题 */
}

.analysis-card {
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.card-tools {
  display: flex;
  gap: 8px;
}

.chart-container {
  height: 300px;
  padding: 16px;
}

.table-container {
  padding: 0 16px 16px;
  height: 650px;
}

.cell-high-positive {
  color: #f56c6c;
  font-weight: bold;
}

.cell-low-positive {
  color: #e6a23c;
}

.cell-high-negative {
  color: #409eff;
  font-weight: bold;
}

.cell-low-negative {
  color: #67c23a;
}

.positive-value {
  color: #f56c6c;
}

.negative-value {
  color: #409eff;
}

/* 图表通用样式 */
.chart {
  width: 100%;
  height: 100%;
}

/* 时点价差表样式 */
.hourly-price-deviation-table {
  .el-table {
    margin-bottom: 8px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .probability-input {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 8px;
    
    .el-input {
      flex: 1;
    }
    
    .el-button {
      white-space: nowrap;
    }
  }
}

.date-range-selector {
  margin-right: 16px;
  
  .el-date-editor {
    width: 240px;
  }
}

/* 价格偏差颜色样式 */
:deep(.el-table .cell-positive-1) {
  background-color: #ffcdd2 !important;
  color: #000000 !important;
}

:deep(.el-table .cell-positive-2) {
  background-color: #ef9a9a !important;
  color: #000000 !important;
}

:deep(.el-table .cell-positive-3) {
  background-color: #e57373 !important;
  color: #000000 !important;
}

:deep(.el-table .cell-positive-4) {
  background-color: #ef5350 !important;
  color: #000000 !important;
}

:deep(.el-table .cell-positive-5) {
  background-color: #d32f2f !important;
  color: #000000 !important;
}

:deep(.el-table .cell-negative-1) {
  background-color: #c8e6c9 !important;
  color: #000000 !important;
}

:deep(.el-table .cell-negative-2) {
  background-color: #a5d6a7 !important;
  color: #000000 !important;
}

:deep(.el-table .cell-negative-3) {
  background-color: #81c784 !important;
  color: #000000 !important;
}

:deep(.el-table .cell-negative-4) {
  background-color: #66bb6a !important;
  color: #000000 !important;
}

:deep(.el-table .cell-negative-5) {
  background-color: #2e7d32 !important;
  color: #000000 !important;
}

/* 统计信息行样式 */
:deep(.el-table__row:nth-last-child(-n+3)) {
  background-color: #f5f7fa !important;
}

.probability-input {
  display: flex;
  align-items: center;
  gap: 4px;
  
  :deep(.el-input) {
    .el-input__wrapper {
      background-color: #ffffff !important;
    }
    
    .el-input__inner {
      height: 24px;
      line-height: 24px;
      padding: 0 8px;
      color: #000000 !important;
      background-color: #ffffff !important;
    }
    
    .el-input__inner::placeholder {
      color: #909399;
    }
  }
}

/* 确保统计行的边框样式正确 */
:deep(.el-table__row:last-child td) {
  border-bottom: 1px solid #ebeef5;
}

/* 关联分析模块样式 */
.correlation-analysis-section {
  /* margin-top: 16px; */ /* 已在 analysis-card 中处理间距 */
}

.dual-scatter-container {
  display: flex;
  gap: 16px;
  padding: 16px; /* 添加内边距 */
}

.scatter-chart-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #e4e7ed; /* 添加边框 */
  border-radius: 4px; /* 添加圆角 */
  padding: 16px; /* 添加内边距 */
}

.chart-controls {
  display: flex;
  /* justify-content: space-between; */ /* 改为左对齐 */
  justify-content: flex-start;
  align-items: center;
  /* padding: 8px; */ /* 已由 scatter-chart-box 控制 */
  margin-bottom: 16px; /* 增加与图表标题的间距 */
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-label {
  font-size: 14px; /* 调整字号 */
  color: #606266; /* 调整颜色 */
}

.chart-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133; /* 调整颜色 */
  margin-bottom: 8px;
  text-align: center; /* 居中标题 */
}

.chart-explanation p {
    margin: 4px 0; /* 调整段落间距 */
}

.chart-explanation strong {
    color: #303133;
}
</style>
