<template>
  <div class="price-variation-container">
    
    <!-- 内容区域 -->
    <div class="analysis-content">
      <!-- 左侧主分析区域 (约占2/3宽度) -->
      <div class="main-analysis-area">
        <!-- 周期之间日前价分时曲线对比折线图 -->
        <div class="analysis-card">
          <div class="card-header">
            <h3>周期之间日前价分时曲线对比</h3>
            <div class="card-tools">
              <el-tooltip content="下载数据">
                <el-button size="small" circle @click="exportHourlyPriceData">
                  <el-icon><Download /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="查看详情">
                <el-button size="small" circle @click="showHourlyPriceDetails">
                  <el-icon><View /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </div>
          
          <!-- 图表控制选项 -->
          <div class="chart-controls">
            <div class="chart-control-group">
              <span class="control-label">显示对比组：</span>
              <el-checkbox-group v-model="visibleCompareGroups" @change="updateHourlyPriceChart">
                <el-checkbox 
                  v-for="(group, index) in compareGroups" 
                  :key="index" 
                  :label="index" 
                  :disabled="!group.enabled"
                >
                  对比组 {{ index + 1 }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
            
            <div class="chart-control-group">
              <span class="control-label">数据类型：</span>
              <el-radio-group v-model="periodVisibility" @change="updateHourlyPriceChart">
                <el-radio label="both">全部</el-radio>
                <el-radio label="current">仅现在周期</el-radio>
                <el-radio label="previous">仅从前周期</el-radio>
              </el-radio-group>
            </div>
          </div>
          
          <div class="chart-container">
            <div id="hourlyPriceChart" class="chart"></div>
          </div>
        </div>
        
        <!-- 日前价时序箱线图 -->
        <div class="analysis-card">
          <div class="card-header">
            <h3>日前价时序箱线图</h3>
            <div class="card-tools">
              <el-tooltip content="下载数据">
                <el-button size="small" circle @click="exportBoxplotData">
                  <el-icon><Download /></el-icon>
                </el-button>
              </el-tooltip>
              <el-dropdown trigger="click">
                <el-button size="small">
                  时间粒度
                  <el-icon><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="changeBoxplotTimeGranularity('hour')">小时</el-dropdown-item>
                    <el-dropdown-item @click="changeBoxplotTimeGranularity('day')">日</el-dropdown-item>
                    <el-dropdown-item @click="changeBoxplotTimeGranularity('week')">周</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          
          <div class="chart-container">
            <div id="boxplotChart" class="chart"></div>
          </div>
        </div>
      </div>
      
      <!-- 右侧辅助分析区域 (约占1/3宽度) -->
      <div class="secondary-analysis-area">
        <!-- 关键指标汇总 (KPI卡片) -->
        <div class="analysis-card">
          <div class="card-header">
            <h3>关键指标汇总</h3>
          </div>
          <div class="kpi-cards-container">
            <!-- 平均日前价 -->
            <div class="kpi-card">
              <div class="kpi-title">平均日前价 (¥/MWh)</div>
              <div class="kpi-content">
                <div class="kpi-values">
                  <div class="kpi-current">
                    <div class="value-label">现在周期</div>
                    <div class="value">{{ kpiData.avgPrice.current.toFixed(2) }}</div>
                  </div>
                  <div class="kpi-previous">
                    <div class="value-label">从前周期</div>
                    <div class="value">{{ kpiData.avgPrice.previous.toFixed(2) }}</div>
                  </div>
                </div>
                <div class="kpi-change" :class="getChangeClass(kpiData.avgPrice.change)">
                  {{ formatChange(kpiData.avgPrice.change) }}
                </div>
              </div>
            </div>
            
            <!-- 日前价标准差 -->
            <div class="kpi-card">
              <div class="kpi-title">日前价标准差 (¥/MWh)</div>
              <div class="kpi-content">
                <div class="kpi-values">
                  <div class="kpi-current">
                    <div class="value-label">现在周期</div>
                    <div class="value">{{ kpiData.priceStdDev.current.toFixed(2) }}</div>
                  </div>
                  <div class="kpi-previous">
                    <div class="value-label">从前周期</div>
                    <div class="value">{{ kpiData.priceStdDev.previous.toFixed(2) }}</div>
                  </div>
                </div>
                <div class="kpi-change" :class="getChangeClass(kpiData.priceStdDev.change)">
                  {{ formatChange(kpiData.priceStdDev.change) }}
                </div>
              </div>
            </div>
            
            <!-- 高峰时段平均日前价 -->
            <div class="kpi-card">
              <div class="kpi-title">高峰时段平均日前价 (¥/MWh)</div>
              <div class="kpi-content">
                <div class="kpi-values">
                  <div class="kpi-current">
                    <div class="value-label">现在周期</div>
                    <div class="value">{{ kpiData.peakPrice.current.toFixed(2) }}</div>
                  </div>
                  <div class="kpi-previous">
                    <div class="value-label">从前周期</div>
                    <div class="value">{{ kpiData.peakPrice.previous.toFixed(2) }}</div>
                  </div>
                </div>
                <div class="kpi-change" :class="getChangeClass(kpiData.peakPrice.change)">
                  {{ formatChange(kpiData.peakPrice.change) }}
                </div>
              </div>
            </div>
            
            <!-- 低谷时段平均日前价 -->
            <div class="kpi-card">
              <div class="kpi-title">低谷时段平均日前价 (¥/MWh)</div>
              <div class="kpi-content">
                <div class="kpi-values">
                  <div class="kpi-current">
                    <div class="value-label">现在周期</div>
                    <div class="value">{{ kpiData.valleyPrice.current.toFixed(2) }}</div>
                  </div>
                  <div class="kpi-previous">
                    <div class="value-label">从前周期</div>
                    <div class="value">{{ kpiData.valleyPrice.previous.toFixed(2) }}</div>
                  </div>
                </div>
                <div class="kpi-change" :class="getChangeClass(kpiData.valleyPrice.change)">
                  {{ formatChange(kpiData.valleyPrice.change) }}
                </div>
              </div>
            </div>
            
            <!-- 价格跳变次数 -->
            <div class="kpi-card" v-if="selectedComparisonMetrics.includes('priceJump')">
              <div class="kpi-title">价格跳变次数 (阈值: {{ priceJumpThreshold }}¥/MWh)</div>
              <div class="kpi-content">
                <div class="kpi-values">
                  <div class="kpi-current">
                    <div class="value-label">现在周期</div>
                    <div class="value">{{ kpiData.priceJumpCount.current }}</div>
                  </div>
                  <div class="kpi-previous">
                    <div class="value-label">从前周期</div>
                    <div class="value">{{ kpiData.priceJumpCount.previous }}</div>
                  </div>
                </div>
                <div class="kpi-change" :class="getChangeClass(kpiData.priceJumpCount.change, true)">
                  {{ formatChange(kpiData.priceJumpCount.change) }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 日前价分布对比图 -->
        <div class="analysis-card">
          <div class="card-header">
            <h3>日前价分布对比</h3>
            <div class="card-tools">
              <el-radio-group v-model="distributionType" size="small" @change="updateDistributionChart">
                <el-radio-button label="histogram">直方图</el-radio-button>
                <el-radio-button label="density">密度图</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          
          <div class="chart-container">
            <div id="distributionChart" class="chart"></div>
          </div>
        </div>
        
        <!-- 散点图 -->
        <div class="analysis-card">
          <div class="card-header">
            <h3>散点图分析</h3>
          </div>
          
          <!-- 散点图控制面板 -->
          <div class="scatter-control-panel">
            <div class="scatter-control-section">
              <div class="control-section-title">坐标轴设置</div>
              <div class="control-item">
                <div class="control-item-label">X轴指标：</div>
              <el-select 
                v-model="scatterXAxis" 
                size="small" 
                @change="updateScatterChart"
                  style="width: 160px;"
              >
                <el-option label="时点 (0-23h)" value="hour" />
                <el-option 
                  v-for="dimension in selectedWeatherDimensions" 
                  :key="dimension" 
                  :label="getDimensionLabel(dimension)" 
                  :value="dimension" 
                />
                <el-option 
                  v-for="dimension in selectedLoadDimensions" 
                  :key="dimension" 
                  :label="getDimensionLabel(dimension)" 
                  :value="dimension" 
                />
              </el-select>
              </div>
              <div class="control-item">
                <div class="control-item-label">Y轴指标：</div>
                <el-select 
                  v-model="scatterYAxis" 
                  size="small" 
                  @change="updateScatterChart"
                  style="width: 160px;"
                >
                  <el-option label="日前价 (¥/MWh)" value="price" />
                  <el-option label="百分比变化 (%)" value="priceChange" v-if="showPriceChangeOption" />
                </el-select>
              </div>
            </div>
            
            <div class="scatter-control-section">
              <div class="control-section-title">显示设置</div>
              <div class="control-item">
                <div class="control-item-label">显示方式：</div>
                <el-radio-group v-model="scatterDisplayMode" size="small" @change="updateScatterChart">
                  <el-radio-button label="normal">常规</el-radio-button>
                  <el-radio-button label="bubble">气泡图</el-radio-button>
                </el-radio-group>
              </div>
              <div class="control-item">
                <div class="control-item-label">点大小：</div>
                <el-slider 
                  v-model="symbolSizeValue" 
                  :min="4" 
                  :max="20" 
                  :step="1"
                  @change="updateScatterChart"
                  style="width: 160px;"
                ></el-slider>
              </div>
              <div class="control-item">
                <el-checkbox v-model="showRegressionLine" @change="updateScatterChart">显示趋势线</el-checkbox>
              </div>
            </div>
            
            <div class="scatter-control-section">
              <el-button type="primary" size="small" @click="updateScatterChart" style="width: 100%;">刷新图表</el-button>
            </div>
          </div>
          
          <div class="chart-container">
            <div id="scatterChart" class="chart"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { ArrowDown, Download, View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 日期计算帮助函数
function getDaysAgo(days: number) {
  return dayjs().subtract(days, 'day').format('YYYY-MM-DD')
}

// 默认日期范围设置 (N-4到N-10 和 N-11到N-17)
const defaultCurrentPeriod = [getDaysAgo(10), getDaysAgo(4)]
const defaultPreviousPeriod = [getDaysAgo(17), getDaysAgo(11)]

// 对比组设置
const compareGroups = reactive([
  {
    enabled: true,
    currentPeriod: defaultCurrentPeriod,
    previousPeriod: defaultPreviousPeriod,
    quickCompare: '', // 存储选择的快捷对比选项
    // 添加数据属性
    data: {
      current: [] as any[],
      previous: [] as any[]
    }
  },
  {
    enabled: false,
    currentPeriod: defaultCurrentPeriod,
    previousPeriod: defaultPreviousPeriod,
    quickCompare: '',
    // 添加数据属性
    data: {
      current: [] as any[],
      previous: [] as any[]
    }
  },
  {
    enabled: false,
    currentPeriod: defaultCurrentPeriod,
    previousPeriod: defaultPreviousPeriod,
    quickCompare: '',
    // 添加数据属性
    data: {
      current: [] as any[],
      previous: [] as any[]
    }
  },
  {
    enabled: false,
    currentPeriod: defaultCurrentPeriod,
    previousPeriod: defaultPreviousPeriod,
    quickCompare: '',
    // 添加数据属性
    data: {
      current: [] as any[],
      previous: [] as any[]
    }
  }
])

// 日期快捷选项 - 现在周期
const currentPeriodShortcuts = [
  {
    text: '今日',
    value: () => {
      const today = new Date()
      return [today, today]
    }
  },
  {
    text: '昨日',
    value: () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return [yesterday, yesterday]
    }
  },
  {
    text: '近7日',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 6)
      return [start, end]
    }
  },
  {
    text: '近30日',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 29)
      return [start, end]
    }
  },
  {
    text: '本月',
    value: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date()
      return [start, end]
    }
  },
  {
    text: '上月',
    value: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return [start, end]
    }
  }
]

// 日期快捷选项 - 从前周期
const previousPeriodShortcuts = [
  {
    text: '与上周对比',
    value: () => {
      // 这里会根据现在周期动态计算，具体实现在 setQuickCompare 函数中
      return []
    }
  },
  {
    text: '与上月对比',
    value: () => {
      // 这里会根据现在周期动态计算，具体实现在 setQuickCompare 函数中
      return []
    }
  },
  {
    text: '与去年同期对比',
    value: () => {
      // 这里会根据现在周期动态计算，具体实现在 setQuickCompare 函数中
      return []
    }
  }
]

// 维度选择
const selectedTimeDimensions = ref<string[]>(['dayType', 'timeSegment'])
const selectedWeatherDimensions = ref<string[]>(['temperature', 'precipitation', 'humidity', 'radiation', 'windSpeed'])
const selectedLoadDimensions = ref<string[]>(['dispatchLoad', 'typeB_Load', 'westLoad'])
const selectedOtherDimensions = ref<string[]>(['specialEvents'])

// 核心对比指标
const selectedComparisonMetrics = ref<string[]>(['avgPrice', 'priceStdDev'])
const priceJumpThreshold = ref(50) // 默认价格跳变阈值为50¥/MWh

// 图表实例引用
const hourlyPriceChart = ref<echarts.ECharts | null>(null)
const boxplotChart = ref<echarts.ECharts | null>(null)
const distributionChart = ref<echarts.ECharts | null>(null)
const scatterChart = ref<echarts.ECharts | null>(null)

// 特殊事件数据
const specialEvents = reactive({
  group0: {
    current: [
      { time: 10, description: '系统检修' },
      { time: 16, description: '峰值负荷' }
    ],
    previous: [
      { time: 9, description: '系统检修' },
      { time: 17, description: '峰值负荷' }
    ]
  },
  group1: {
    current: [
      { time: 12, description: '重大活动' }
    ],
    previous: [
      { time: 13, description: '重大活动' }
    ]
  },
  group2: {
    current: [],
    previous: [
      { time: 14, description: '设备故障' }
    ]
  },
  group3: {
    current: [
      { time: 15, description: '极端天气' }
    ],
    previous: []
  }
})

// 时间粒度和周期可见性
const timeGranularity = ref('hour')
const periodVisibility = ref<'both' | 'current' | 'previous'>('both')
const distributionType = ref('histogram')
const scatterXAxis = ref('hour')
const scatterYAxis = ref('price')
const scatterDisplayMode = ref('normal')
const showRegressionLine = ref(true)
const symbolSizeValue = ref(8)
const showPriceChangeOption = ref(false)

// 维度筛选
// const selectedDayTypes = ref<string[]>(['workday', 'weekend', 'holiday'])
// const selectedTimeSegments = ref<string[]>(['peak', 'high', 'normal', 'valley'])

// KPI数据
const kpiData = reactive({
  avgPrice: {
    current: 324.56,
    previous: 298.72,
    change: 8.65
  },
  priceStdDev: {
    current: 42.18,
    previous: 39.45,
    change: 6.92
  },
  peakPrice: {
    current: 378.92,
    previous: 352.38,
    change: 7.53
  },
  valleyPrice: {
    current: 261.45,
    previous: 241.20,
    change: 8.39
  },
  priceJumpCount: {
    current: 12,
    previous: 9,
    change: 33.33
  }
})

// 格式化变化率
function formatChange(change: number): string {
  return change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`
}

// 获取变化率样式类
function getChangeClass(change: number, inverse: boolean = false): string {
  if (change > 0) {
    return inverse ? 'change-negative' : 'change-positive'
  } else if (change < 0) {
    return inverse ? 'change-positive' : 'change-negative'
  }
  return 'change-neutral'
}

// 获取维度显示名称
function getDimensionLabel(dimension: string): string {
  const dimensionLabels: Record<string, string> = {
    temperature: '温度 (°C)',
    humidity: '湿度 (%)',
    windSpeed: '风速 (m/s)',
    dispatchLoad: '实际负荷 (MW)',
    precipitation: '降水',
    radiation: '辐照',
    // ... existing code ...
  };
  return dimensionLabels[dimension] || dimension;
}

// 可见对比组配置
const visibleCompareGroups = ref<number[]>([0])

// 生成模拟数据
function generateHourlyPriceData(basePrice: number, volatility: number) {
  const result = []
  const hours = Array.from({ length: 24 }, (_, i) => i)
  
  for (const hour of hours) {
    // 模拟日内价格曲线：清晨低谷，上午上升，中午平稳，傍晚峰值，夜间下降
    let hourFactor = 1.0
    
    if (hour < 6) {
      // 清晨低谷 (0-5点)
      hourFactor = 0.8 - (6 - hour) * 0.03
    } else if (hour < 12) {
      // 上午上升 (6-11点)
      hourFactor = 0.8 + (hour - 6) * 0.05
    } else if (hour < 16) {
      // 中午平稳略高 (12-15点)
      hourFactor = 1.1
    } else if (hour < 20) {
      // 傍晚峰值 (16-19点)
      hourFactor = 1.2 + (hour - 16) * 0.05
    } else {
      // 夜间下降 (20-23点)
      hourFactor = 1.2 - (hour - 20) * 0.10
    }
    
    // 添加一些随机波动
    const randomFactor = 1 + (Math.random() * 2 - 1) * volatility
    
    const price = basePrice * hourFactor * randomFactor
    
    result.push({
      hour,
      price: parseFloat(price.toFixed(2))
    })
  }
  
  return result
}

// 生成箱线图数据
function generateBoxplotData(basePriceRange: [number, number], volatility: number, dataPoints: number) {
  const result = []
  
  for (let i = 0; i < dataPoints; i++) {
    const basePrice = basePriceRange[0] + Math.random() * (basePriceRange[1] - basePriceRange[0])
    
    // 生成一组数据点，用于箱线图
    const data = []
    for (let j = 0; j < 30; j++) {
      const randomFactor = 1 + (Math.random() * 2 - 1) * volatility
      data.push(parseFloat((basePrice * randomFactor).toFixed(2)))
    }
    
    // 按升序排序数据，以便计算箱线图所需的五个统计值
    data.sort((a, b) => a - b)
    
    // 计算箱线图统计值
    const min = data[0]
    const q1 = data[Math.floor(data.length * 0.25)]
    const median = data[Math.floor(data.length * 0.5)]
    const q3 = data[Math.floor(data.length * 0.75)]
    const max = data[data.length - 1]
    
    result.push({
      date: dayjs().subtract(dataPoints - i, 'day').format('MM-DD'),
      boxData: [min, q1, median, q3, max],
      rawData: data
    })
  }
  
  return result
}

// 初始化加载对比组
function initVisibleCompareGroups() {
  // 初始化为启用的对比组索引
  visibleCompareGroups.value = compareGroups
    .map((group, index) => ({ group, index }))
    .filter(item => item.group.enabled)
    .map(item => item.index)
}

// 图表相关方法
function exportHourlyPriceData() {
  console.log('导出分时曲线数据')
  ElMessage.success('日前价分时曲线数据导出成功')
}

function showHourlyPriceDetails() {
  console.log('显示分时曲线详情')
  ElMessage.info('功能开发中')
}

function updateHourlyPriceChart() {
  if (!hourlyPriceChart.value) {
    initHourlyPriceChart()
    return
  }
  
  // 准备数据和系列
  const series: any[] = []
  const markPointData: any[] = []
  const timeHours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  
  // 设置不同对比组的颜色
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C']
  
  // 根据选择的可见对比组和周期可见性准备数据
  visibleCompareGroups.value.forEach((groupIndex, idx) => {
    const group = compareGroups[groupIndex]
    if (!group.enabled) return
    
    const groupColor = colors[idx % colors.length]
    
    // 添加现在周期曲线
    if (periodVisibility.value === 'both' || periodVisibility.value === 'current') {
      series.push({
        name: `对比组${groupIndex + 1} - 现在周期`,
        type: 'line',
        smooth: true,
        emphasis: {
          focus: 'series'
        },
        itemStyle: {
          color: groupColor
        },
        lineStyle: {
          width: 3
        },
        // 添加区域填充
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: groupColor // 起始颜色
              },
              {
                offset: 1,
                color: 'rgba(255, 255, 255, 0.1)' // 结束颜色
              }
            ]
          },
          opacity: 0.2
        },
        data: group.data.current.map(item => item.price)
      })
      
      // 如果选择了特殊事件，添加标记点
      if (selectedOtherDimensions.value.includes('specialEvents')) {
        const events = (specialEvents as any)[`group${groupIndex}`]?.current || []
        events.forEach((event: { time: number; description: string }) => {
          markPointData.push({
            name: `对比组${groupIndex + 1} - 现在周期: ${event.description}`,
            coord: [event.time, group.data.current[event.time].price],
            value: event.description,
            itemStyle: {
              color: groupColor
            }
          })
        })
      }
    }
    
    // 添加从前周期曲线
    if (periodVisibility.value === 'both' || periodVisibility.value === 'previous') {
      series.push({
        name: `对比组${groupIndex + 1} - 从前周期`,
        type: 'line',
        smooth: true,
        lineStyle: {
          type: 'dashed',
          width: 2,
          color: groupColor
        },
        itemStyle: {
          color: groupColor
        },
        emphasis: {
          focus: 'series'
        },
        data: group.data.previous.map(item => item.price)
      })
      
      // 如果选择了特殊事件，添加标记点
      if (selectedOtherDimensions.value.includes('specialEvents')) {
        const events = (specialEvents as any)[`group${groupIndex}`]?.previous || []
        events.forEach((event: { time: number; description: string }) => {
          markPointData.push({
            name: `对比组${groupIndex + 1} - 从前周期: ${event.description}`,
            coord: [event.time, group.data.previous[event.time].price],
            value: event.description,
            itemStyle: {
              color: groupColor
            }
          })
        })
      }
    }
  })
  
  // 计算价格变化幅度最大的时段
  let maxDiffHour = 0
  let maxDiffValue = 0
  
  if (visibleCompareGroups.value.length > 0 && periodVisibility.value === 'both') {
    const groupIndex = visibleCompareGroups.value[0]
    const group = compareGroups[groupIndex]
    if (group.enabled) {
      // 计算现在周期和从前周期每个时点的差值
      for (let i = 0; i < 24; i++) {
        const currentPrice = group.data.current[i].price
        const previousPrice = group.data.previous[i].price
        const diff = Math.abs(currentPrice - previousPrice)
        
        if (diff > maxDiffValue) {
          maxDiffValue = diff
          maxDiffHour = i
        }
      }
    }
  }
  
  // 添加价格差异最大点标记
  if (maxDiffValue > 0) {
    const groupIndex = visibleCompareGroups.value[0]
    markPointData.push({
      name: '价格差异最大点',
      coord: [maxDiffHour, compareGroups[groupIndex].data.current[maxDiffHour].price],
      value: `差异: ${maxDiffValue.toFixed(2)}`,
      symbolSize: 70,
      itemStyle: {
        color: '#F56C6C'
      }
    })
  }
  
  // 更新图表选项
  const option = {
    title: {
      text: '周期之间日前价分时曲线对比',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      formatter: function(params: any) {
        let result = `<div style="font-weight:bold;margin-bottom:5px;">${params[0].axisValue}</div>`
        params.forEach((item: any) => {
          // 判断是否为特殊事件标记点
          const isEvent = item.componentSubType === 'effectScatter'
          
          if (!isEvent) {
            result += `
              <div style="display:flex;justify-content:space-between;align-items:center;margin:5px 0;">
                <div>
                  <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:${item.color};margin-right:5px;"></span>
                  <span>${item.seriesName}:</span>
                </div>
                <span style="margin-left:20px;font-weight:bold;">${item.value} ¥/MWh</span>
              </div>
            `
          }
        })
        
        // 如果是第一个对比组，显示价格差异
        if (params.length >= 2) {
          const current = params.find((p: any) => p.seriesName.includes('现在周期'))
          const previous = params.find((p: any) => p.seriesName.includes('从前周期'))
          
          if (current && previous && current.seriesName.split(' - ')[0] === previous.seriesName.split(' - ')[0]) {
            const diff = current.value - previous.value
            const percentage = ((diff / previous.value) * 100).toFixed(2)
            const color = diff >= 0 ? '#67C23A' : '#F56C6C'
            
            result += `
              <div style="margin-top:10px;padding-top:5px;border-top:1px dashed #ccc;">
                <div>价格变化:</div>
                <div style="font-weight:bold;color:${color};">
                  ${diff >= 0 ? '+' : ''}${diff.toFixed(2)} ¥/MWh (${diff >= 0 ? '+' : ''}${percentage}%)
                </div>
              </div>
            `
          }
        }
        
        return result
      }
    },
    legend: {
      data: series.map(item => item.name),
      top: 30,
      type: 'scroll',
      orient: 'horizontal'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    toolbox: {
      feature: {
        saveAsImage: { title: '保存为图片' },
        dataZoom: { title: '区域缩放' },
        restore: { title: '还原' },
        dataView: { readOnly: false, title: '数据视图' }
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: timeHours,
      axisLabel: {
        formatter: '{value}',
        rotate: 45
      },
      name: '时点 (小时)',
      nameLocation: 'middle',
      nameGap: 35
    },
    yAxis: {
      type: 'value',
      name: '价格 (¥/MWh)',
      axisLabel: {
        formatter: '{value}'
      }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100
      }
    ],
    series: series.map(s => {
      if (markPointData.length > 0) {
        return {
          ...s,
          markPoint: {
            symbol: 'pin',
            symbolSize: 40,
            data: markPointData.filter(point => 
              point.name.startsWith(s.name) || point.name === '价格差异最大点'
            )
          }
        }
      }
      return s
    })
  }
  
  hourlyPriceChart.value.setOption(option)
}

function exportBoxplotData() {
  console.log('导出箱线图数据')
  ElMessage.success('日前价箱线图数据导出成功')
}

function changeBoxplotTimeGranularity(granularity: string) {
  timeGranularity.value = granularity
  console.log('更改箱线图时间粒度为:', granularity)
  // 刷新箱线图
  initBoxplotChart()
}

// 生成分布图数据
function generateDistributionData(data: any[], bins: number = 20) {
  // 提取所有价格值
  const prices = data.map(item => item.price)
  
  // 找出价格范围
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  
  // 计算每个bin的宽度
  const binWidth = (maxPrice - minPrice) / bins
  
  // 初始化bins
  const histogramData = Array(bins).fill(0).map((_, i) => ({
    binStart: minPrice + i * binWidth,
    binEnd: minPrice + (i + 1) * binWidth,
    count: 0,
    density: 0
  }))
  
  // 统计每个bin中的价格数量
  prices.forEach(price => {
    const binIndex = Math.min(Math.floor((price - minPrice) / binWidth), bins - 1)
    histogramData[binIndex].count++
  })
  
  // 计算密度 (概率密度)
  const totalCount = prices.length
  histogramData.forEach(bin => {
    bin.density = bin.count / (totalCount * binWidth)
  })
  
  return {
    histogramData,
    minPrice,
    maxPrice,
    binWidth
  }
}

// 更新分布图
function updateDistributionChart() {
  const chartDom = document.getElementById('distributionChart')
  if (!chartDom || !distributionChart.value) return
  
  // 准备数据
  let currentData: any[] = []
  let previousData: any[] = []
  
  // 获取第一个可见且启用的对比组数据
  for (const groupIndex of visibleCompareGroups.value) {
    const group = compareGroups[groupIndex]
    if (group.enabled) {
      currentData = group.data.current
      previousData = group.data.previous
      break
    }
  }
  
  if (currentData.length === 0 || previousData.length === 0) {
    console.log('分布图无数据可用')
    return
  }
  
  // 生成直方图和密度图数据
  const currentDistribution = generateDistributionData(currentData, 20)
  const previousDistribution = generateDistributionData(previousData, 20)
  
  // 确定X轴范围 (取两个周期的最小值和最大值)
  const minPrice = Math.min(currentDistribution.minPrice, previousDistribution.minPrice)
  const maxPrice = Math.max(currentDistribution.maxPrice, previousDistribution.maxPrice)
  
  // 准备系列数据
  const series = []
  
  if (distributionType.value === 'histogram') {
    // 直方图
    series.push({
      name: '现在周期',
      type: 'bar',
      barWidth: '99%',
      barGap: '-100%',
      data: currentDistribution.histogramData.map(bin => bin.count),
      itemStyle: {
        color: '#409EFF',
        opacity: 0.7
      },
      z: 10
    })
    
    series.push({
      name: '从前周期',
      type: 'bar',
      barWidth: '99%',
      data: previousDistribution.histogramData.map(bin => bin.count),
      itemStyle: {
        color: '#E6A23C',
        opacity: 0.7
      },
      z: 9
    })
  } else {
    // 密度图
    series.push({
      name: '现在周期',
      type: 'line',
      smooth: true,
      data: currentDistribution.histogramData.map((bin, index) => [
        (bin.binStart + bin.binEnd) / 2,
        bin.density
      ]),
      lineStyle: {
        width: 3,
        color: '#409EFF'
      },
      areaStyle: {
        color: '#409EFF',
        opacity: 0.3
      },
      z: 10
    })
    
    series.push({
      name: '从前周期',
      type: 'line',
      smooth: true,
      data: previousDistribution.histogramData.map((bin, index) => [
        (bin.binStart + bin.binEnd) / 2,
        bin.density
      ]),
      lineStyle: {
        width: 3,
        color: '#E6A23C'
      },
      areaStyle: {
        color: '#E6A23C',
        opacity: 0.3
      },
      z: 9
    })
  }
  
  // 配置选项
  const option = {
    title: {
      text: '日前价分布对比',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params: any) {
        if (distributionType.value === 'histogram') {
          const binIndex = params[0].dataIndex
          const currentBin = currentDistribution.histogramData[binIndex]
          
          return `
            <div style="font-weight:bold;margin-bottom:5px;">价格区间: ${currentBin.binStart.toFixed(0)}-${currentBin.binEnd.toFixed(0)} ¥/MWh</div>
            <div style="display:flex;align-items:center;margin:5px 0;">
              <span style="display:inline-block;width:10px;height:10px;background-color:#409EFF;margin-right:5px;"></span>
              <span>现在周期: ${params[0].value} 次</span>
            </div>
            <div style="display:flex;align-items:center;margin:5px 0;">
              <span style="display:inline-block;width:10px;height:10px;background-color:#E6A23C;margin-right:5px;"></span>
              <span>从前周期: ${params[1].value} 次</span>
            </div>
          `
        } else {
          return `
            <div style="font-weight:bold;margin-bottom:5px;">价格: ${params[0].data[0].toFixed(0)} ¥/MWh</div>
            <div style="display:flex;align-items:center;margin:5px 0;">
              <span style="display:inline-block;width:10px;height:10px;background-color:#409EFF;margin-right:5px;"></span>
              <span>现在周期密度: ${params[0].data[1].toFixed(4)}</span>
            </div>
            <div style="display:flex;align-items:center;margin:5px 0;">
              <span style="display:inline-block;width:10px;height:10px;background-color:#E6A23C;margin-right:5px;"></span>
              <span>从前周期密度: ${params[1].data[1].toFixed(4)}</span>
            </div>
          `
        }
      }
    },
    legend: {
      data: ['现在周期', '从前周期'],
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      name: '价格 (¥/MWh)',
      type: distributionType.value === 'histogram' ? 'category' : 'value',
      data: distributionType.value === 'histogram' 
        ? currentDistribution.histogramData.map(bin => `${bin.binStart.toFixed(0)}-${bin.binEnd.toFixed(0)}`)
        : undefined,
      min: distributionType.value === 'density' ? minPrice : undefined,
      max: distributionType.value === 'density' ? maxPrice : undefined,
      axisLabel: {
        rotate: 45,
        formatter: distributionType.value === 'histogram' 
          ? function(value: string) {
              const parts = value.split('-')
              return parts[0]
            } 
          : '{value}'
      }
    },
    yAxis: {
      name: distributionType.value === 'histogram' ? '频次' : '密度',
      type: 'value'
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100
      }
    ],
    series: series
  }
  
  distributionChart.value.setOption(option, true)
}

// 初始化分布图
function initDistributionChart() {
  const chartDom = document.getElementById('distributionChart')
  if (!chartDom) return
  
  // 销毁旧实例
  if (distributionChart.value) {
    distributionChart.value.dispose()
  }
  
  // 初始化图表
  distributionChart.value = echarts.init(chartDom)
  
  // 更新图表数据
  updateDistributionChart()
}

// 生成散点图数据
function generateScatterData(data: any[], xAxis: string, yAxis: string = 'price', isPrevious: boolean = false, maxPoints: number = 200) {
  // 如果数据点太多，进行抽样
  let sampledData = data
  if (data.length > maxPoints) {
    const samplingInterval = Math.floor(data.length / maxPoints)
    sampledData = data.filter((_, index) => index % samplingInterval === 0)
  }
  
  // 准备结果
  const result = [];
  
  // 根据X轴和Y轴选择准备数据
  for (let i = 0; i < sampledData.length; i++) {
    const item = sampledData[i]
    // 处理X值
    let xValue: number;
    
    if (xAxis === 'hour') {
      // X轴是小时
      xValue = item.hour
    } else if (selectedWeatherDimensions.value.includes(xAxis)) {
      // X轴是气象数据
      switch (xAxis) {
        case 'temperature':
          // 温度范围 0-40°C，与小时相关
          xValue = 20 + 15 * Math.sin(Math.PI * item.hour / 12) + (Math.random() * 5 - 2.5)
          break
        case 'humidity':
          // 湿度范围 20-90%，傍晚较高，上午较低
          xValue = 55 + 25 * Math.sin(Math.PI * (item.hour - 3) / 12) + (Math.random() * 10 - 5)
          break
        case 'precipitation':
          // 降水量，大部分时间为0，随机时段有降水
          xValue = item.hour > 12 && item.hour < 16 ? Math.random() * 10 : Math.random() * 2
          break
        case 'radiation':
          // 辐照强度，白天高晚上低
          if (item.hour >= 6 && item.hour <= 18) {
            xValue = 500 * Math.sin(Math.PI * (item.hour - 6) / 12) + (Math.random() * 100 - 50)
          } else {
            xValue = Math.random() * 50
          }
          break
        case 'windSpeed':
          // 风速 0-15m/s，较随机
          xValue = 5 + Math.random() * 10
          break
        default:
          xValue = Math.random() * 100
      }
    } else if (selectedLoadDimensions.value.includes(xAxis)) {
      // X轴是负荷数据
      switch (xAxis) {
        case 'dispatchLoad':
          // 统调负荷，白天高晚上低
          if (item.hour >= 7 && item.hour <= 21) {
            xValue = 80000 + 30000 * Math.sin(Math.PI * (item.hour - 6) / 14) + (Math.random() * 10000 - 5000)
          } else {
            xValue = 60000 + Math.random() * 15000
          }
          break
        case 'typeB_Load':
          // B类负荷，工作时间高
          if (item.hour >= 9 && item.hour <= 17) {
            xValue = 30000 + 10000 * Math.sin(Math.PI * (item.hour - 9) / 8) + (Math.random() * 5000 - 2500)
          } else {
            xValue = 20000 + Math.random() * 8000
          }
          break
        case 'westLoad':
          // 西电负荷，昼夜变化小
          xValue = 40000 + 8000 * Math.sin(Math.PI * item.hour / 24) + (Math.random() * 4000 - 2000)
          break
        default:
          xValue = Math.random() * 100000
      }
    } else {
      // 默认使用小时作为X轴
      xValue = item.hour
    }
    
    // 处理Y值
    let yValue: number;
    
    if (yAxis === 'price') {
      // Y轴是价格
      yValue = item.price
    } else if (yAxis === 'priceChange') {
      // Y轴是价格变化率（与前一周期对比）
      // 这里需要从外部传入对比数据
      const previousPrice = isPrevious ? 0 : (data[i]?.price || 0);
      const currentPrice = item.price;
      yValue = previousPrice !== 0 ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;
    } else {
      // 默认使用价格
      yValue = item.price
    }
    
    // 创建数据点对象
    const dataPoint: any = {
      x: xValue,
      y: yValue
    };
    
    // 对于气泡图模式，添加大小属性
    if (scatterDisplayMode.value === 'bubble') {
      // 气泡大小与小时相关（晚上更大）
      dataPoint.size = Math.max(20, 20 + 5 * (item.hour > 12 ? (item.hour - 12) : 0));
    }
    
    result.push(dataPoint);
  }
  
  return result
}

// 更新散点图
function updateScatterChart() {
  if (!scatterChart.value) return
  
  let currentData: any[] = []
  let previousData: any[] = []
  
  // 获取第一个可见且启用的对比组数据
  for (const groupIndex of visibleCompareGroups.value) {
    const group = compareGroups[groupIndex]
    if (group.enabled) {
      currentData = group.data.current
      previousData = group.data.previous
      break
    }
  }
  
  if (currentData.length === 0 || previousData.length === 0) {
    console.log('散点图无数据可用')
    return
  }
  
  // 准备当前和以前时期的数据
  const currentScatterData = generateScatterData(currentData, scatterXAxis.value, scatterYAxis.value, false)
  const previousScatterData = generateScatterData(previousData, scatterXAxis.value, scatterYAxis.value, true)
  
  // 获取X轴和Y轴的标签
  const xAxisLabel = getDimensionLabel(scatterXAxis.value)
  const yAxisLabel = getDimensionLabel(scatterYAxis.value)
  
  // 准备系列数据
  const series = [
    {
      name: '现在周期',
      type: 'scatter',
      symbolSize: (data: any) => {
        if (scatterDisplayMode.value === 'bubble') {
          // 气泡大小映射 (实际负荷)
          const loadValue = data[2] || symbolSizeValue.value
          return Math.max(4, Math.min(20, loadValue / 100 * symbolSizeValue.value))
        } 
        return symbolSizeValue.value
      },
      data: currentScatterData.map((item: any) => {
        let result = [item.x, item.y]
        if (scatterDisplayMode.value === 'bubble' && item.size) {
          result.push(item.size)
        }
        return result
      }),
      itemStyle: {
        color: '#409EFF'
      }
    },
    {
      name: '从前周期',
      type: 'scatter',
      symbolSize: (data: any) => {
        if (scatterDisplayMode.value === 'bubble') {
          // 气泡大小映射 (实际负荷)
          const loadValue = data[2] || symbolSizeValue.value
          return Math.max(4, Math.min(20, loadValue / 100 * symbolSizeValue.value))
        } 
        return symbolSizeValue.value
      },
      data: previousScatterData.map((item: any) => {
        let result = [item.x, item.y]
        if (scatterDisplayMode.value === 'bubble' && item.size) {
          result.push(item.size)
        }
        return result
      }),
      itemStyle: {
        color: '#E6A23C'
      }
    }
  ]
  
  // 如果选择显示趋势线，添加线性回归线
  if (showRegressionLine.value) {
    // 当前周期趋势线
    if (currentScatterData.length > 2) {
      const currentRegressionLine = calculateRegressionLine(currentScatterData.map((item: any) => [item.x, item.y]))
      
      if (currentRegressionLine) {
        const currentLineSeries: any = {
          name: '现在周期趋势线',
          type: 'line',
          data: currentRegressionLine.points,
          symbolSize: () => 0,
          smooth: true,
          lineStyle: {
            color: '#409EFF',
            width: 2,
            type: 'solid'
          }
        };
        series.push(currentLineSeries);
      }
    }
    
    // 从前周期趋势线
    if (previousScatterData.length > 2) {
      const previousRegressionLine = calculateRegressionLine(previousScatterData.map((item: any) => [item.x, item.y]))
      
      if (previousRegressionLine) {
        const previousLineSeries: any = {
          name: '从前周期趋势线',
          type: 'line',
          data: previousRegressionLine.points,
          symbolSize: () => 0,
          smooth: true,
          lineStyle: {
            color: '#E6A23C',
            width: 2,
            type: 'solid'
          }
        };
        series.push(previousLineSeries);
      }
    }
  }
  
  // 配置选项
  const option = {
    title: {
      text: '散点图分析',
      left: 'center'
    },
    legend: {
      data: ['现在周期', '从前周期', '现在周期趋势线', '从前周期趋势线'],
      top: 30,
      selected: {
        '现在周期趋势线': showRegressionLine.value,
        '从前周期趋势线': showRegressionLine.value
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: function(params: any) {
        if (params.seriesType === 'line') {
          return params.seriesName
        }
        
        let content = `<div style="font-weight:bold;margin-bottom:5px;">${params.seriesName}</div>`
        
        // 根据不同的X轴和Y轴显示不同的提示信息
        if (scatterXAxis.value === 'hour') {
          content += `<div>${xAxisLabel}: ${Math.floor(params.value[0])}:00</div>`
        } else {
          content += `<div>${xAxisLabel}: ${params.value[0].toFixed(2)}</div>`
        }
        
        if (scatterYAxis.value === 'price') {
          content += `<div>${yAxisLabel}: ${params.value[1].toFixed(2)} ¥/MWh</div>`
        } else if (scatterYAxis.value === 'priceChange') {
          content += `<div>${yAxisLabel}: ${params.value[1] >= 0 ? '+' : ''}${params.value[1].toFixed(2)}%</div>`
        }
        
        // 如果是气泡图，显示气泡大小信息
        if (scatterDisplayMode.value === 'bubble' && params.value[2]) {
          content += `<div>气泡大小: ${params.value[2]}</div>`
        }
        
        return content
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    toolbox: {
      feature: {
        saveAsImage: { title: '保存为图片' },
        dataZoom: { title: '区域缩放' },
        restore: { title: '还原' }
      }
    },
    xAxis: {
      type: 'value',
      name: xAxisLabel,
      nameLocation: 'middle',
      nameGap: 45,
      axisLine: {
        lineStyle: {
          color: '#999'
        }
      },
      axisTick: {
        alignWithLabel: true
      },
      axisLabel: {
        formatter: function(value: number) {
          if (scatterXAxis.value === 'hour') {
            return Math.floor(value) + ':00'
          } else {
            return value.toFixed(0)
          }
        },
        margin: 14,
        rotate: 15
      }
    },
    yAxis: {
      type: 'value',
      name: yAxisLabel,
      scale: true,
      axisLine: {
        lineStyle: {
          color: '#999'
        }
      },
      axisLabel: {
        formatter: function(value: number) {
          if (scatterYAxis.value === 'priceChange') {
            return value.toFixed(0) + '%'
          }
          return value.toFixed(0)
        }
      }
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        start: 0,
        end: 100
      },
      {
        xAxisIndex: 0,
        start: 0,
        end: 100
      },
      {
        type: 'inside',
        yAxisIndex: 0,
        start: 0,
        end: 100
      },
      {
        yAxisIndex: 0,
        start: 0,
        end: 100
      }
    ],
    series: series
  }
  
  scatterChart.value.setOption(option, true)
}

// 计算线性回归
function calculateRegressionLine(data: number[][]) {
  if (!data || data.length < 2) return null
  
  const n = data.length
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0
  
  // 计算必要的统计值
  for (let i = 0; i < n; i++) {
    const x = data[i][0]
    const y = data[i][1]
    
    sumX += x
    sumY += y
    sumXY += x * y
    sumXX += x * x
  }
  
  // 计算斜率和截距
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  // 确定回归线的起点和终点
  const xValues = data.map(point => point[0])
  const minX = Math.min(...xValues)
  const maxX = Math.max(...xValues)
  
  // 生成线的点
  const points = []
  const numPoints = 100 // 更平滑的线
  
  for (let i = 0; i <= numPoints; i++) {
    const x = minX + (maxX - minX) * (i / numPoints)
    const y = slope * x + intercept
    points.push([x, y])
  }
  
  // 计算R方值（相关系数的平方）
  let sumYY = 0
  let meanY = sumY / n
  for (let i = 0; i < n; i++) {
    sumYY += Math.pow(data[i][1] - meanY, 2)
  }
  
  const SSR = n * Math.pow(slope, 2) * (sumXX - Math.pow(sumX, 2) / n)
  const r2 = SSR / sumYY
  
  return {
    slope,
    intercept,
    r2,
    points
  }
}

// 初始化散点图
function initScatterChart() {
  const chartDom = document.getElementById('scatterChart')
  if (!chartDom) return
  
  // 销毁旧实例
  if (scatterChart.value) {
    scatterChart.value.dispose()
  }
  
  // 初始化图表
  scatterChart.value = echarts.init(chartDom)
  
  // 更新图表数据
  updateScatterChart()
}

// 方法定义
function handleCurrentPeriodChange(index: number) {
  // 清除该组的快捷对比选择
  compareGroups[index].quickCompare = ''
}

function handlePreviousPeriodChange(index: number) {
  // 清除该组的快捷对比选择
  compareGroups[index].quickCompare = ''
}

function setQuickCompare(index: number, type: string) {
  const group = compareGroups[index]
  group.quickCompare = type
  
  // 当前周期的开始和结束日期
  const currentStart = dayjs(group.currentPeriod[0])
  const currentEnd = dayjs(group.currentPeriod[1])
  const dayDiff = currentEnd.diff(currentStart, 'day')
  
  let previousStart = currentStart
  let previousEnd = currentEnd
  
  switch(type) {
    case 'lastWeek':
      // 上周同一时间段
      previousStart = currentStart.subtract(7, 'day')
      previousEnd = currentEnd.subtract(7, 'day')
      break
    
    case 'lastMonth':
      // 上月同一时间段
      previousStart = currentStart.subtract(1, 'month')
      previousEnd = currentEnd.subtract(1, 'month')
      break
    
    case 'lastYear':
      // 去年同期
      previousStart = currentStart.subtract(1, 'year')
      previousEnd = currentEnd.subtract(1, 'year')
      break
  }
  
  group.previousPeriod = [
    previousStart.format('YYYY-MM-DD'),
    previousEnd.format('YYYY-MM-DD')
  ]
}

function applyFilters() {
  // 应用筛选条件
  console.log('应用筛选条件')
  
  // 重新加载数据
  loadData()
  
  // 更新可见对比组
  initVisibleCompareGroups()
}

function resetFilters() {
  // 重置所有筛选条件到默认值
  compareGroups.forEach((group, index) => {
    group.enabled = index === 0 // 只启用第一个对比组
    group.currentPeriod = defaultCurrentPeriod
    group.previousPeriod = defaultPreviousPeriod
    group.quickCompare = ''
  })
  
  selectedTimeDimensions.value = ['dayType', 'timeSegment']
  selectedWeatherDimensions.value = ['temperature', 'precipitation', 'humidity', 'radiation', 'windSpeed']
  selectedLoadDimensions.value = ['dispatchLoad', 'typeB_Load', 'westLoad']
  selectedOtherDimensions.value = ['specialEvents']
  selectedComparisonMetrics.value = ['avgPrice', 'priceStdDev']
  priceJumpThreshold.value = 50
  
  // 重新加载数据
  loadData()
}

// 获取活跃的对比组
const activeCompareGroups = computed(() => {
  return compareGroups.filter(group => group.enabled)
})

// 加载数据函数
function loadData() {
  console.log('加载日前价数据')
  
  // 生成模拟数据
  compareGroups.forEach((group, index) => {
    if (!group.enabled) return
    
    // 现在周期 - 基础价格稍高，波动小
    group.data.current = generateHourlyPriceData(320 + index * 15, 0.1)
    
    // 从前周期 - 基础价格稍低，波动大
    group.data.previous = generateHourlyPriceData(290 + index * 10, 0.15)
  })
  
  // 初始化图表
  nextTick(() => {
    initCharts()
  })
}

// 初始化图表方法
function initCharts() {
  initHourlyPriceChart()
  initBoxplotChart()
  initDistributionChart()
  initScatterChart()
  
  // 监听窗口大小变化，调整图表大小
  window.addEventListener('resize', handleResize)
}

// 处理窗口大小变化
function handleResize() {
  hourlyPriceChart.value?.resize()
  boxplotChart.value?.resize()
  distributionChart.value?.resize()
  scatterChart.value?.resize()
}

// 初始化小时价格折线图
function initHourlyPriceChart() {
  // 获取DOM元素
  const chartDom = document.getElementById('hourlyPriceChart')
  if (!chartDom) return
  
  // 销毁旧实例
  if (hourlyPriceChart.value) {
    hourlyPriceChart.value.dispose()
  }
  
  // 初始化图表
  hourlyPriceChart.value = echarts.init(chartDom)
  
  // 更新图表数据
  updateHourlyPriceChart()
}

// 初始化箱线图
function initBoxplotChart() {
  // 获取DOM元素
  const chartDom = document.getElementById('boxplotChart')
  if (!chartDom) return
  
  // 销毁旧实例
  if (boxplotChart.value) {
    boxplotChart.value.dispose()
  }
  
  // 初始化图表
  boxplotChart.value = echarts.init(chartDom)
  
  // 准备数据
  let boxplotData
  let xAxisData
  let outliers: any[] = []
  
  // 根据时间粒度生成不同的数据
  switch (timeGranularity.value) {
    case 'hour':
      // 24小时箱线图
      const hourlyData = Array.from({ length: 24 }, (_, i) => {
        const boxData = generateBoxplotData([280, 350], 0.15, 1)[0]
        
        // 生成少量异常值
        if (Math.random() > 0.7) {
          const highOutlier = boxData.boxData[4] + Math.random() * 100
          outliers.push({
            value: highOutlier,
            xAxis: i,
            yAxis: highOutlier
          })
        }
        
        if (Math.random() > 0.8) {
          const lowOutlier = boxData.boxData[0] - Math.random() * 80
          outliers.push({
            value: lowOutlier,
            xAxis: i,
            yAxis: lowOutlier
          })
        }
        
        return boxData.boxData
      })
      boxplotData = hourlyData
      xAxisData = Array.from({ length: 24 }, (_, i) => `${i}:00`)
      break
    case 'day':
      // 7天箱线图
      const dailyData = generateBoxplotData([280, 350], 0.15, 7)
      boxplotData = dailyData.map(item => item.boxData)
      xAxisData = dailyData.map(item => item.date)
      
      // 生成少量异常值
      dailyData.forEach((item, index) => {
        if (Math.random() > 0.6) {
          const highOutlier = item.boxData[4] + Math.random() * 100
          outliers.push({
            value: highOutlier,
            xAxis: index,
            yAxis: highOutlier
          })
        }
      })
      break
    case 'week':
      // 4周箱线图
      const weeklyData = generateBoxplotData([280, 350], 0.15, 4)
      boxplotData = weeklyData.map(item => item.boxData)
      xAxisData = ['第1周', '第2周', '第3周', '第4周']
      
      // 第3周有异常值
      const highOutlier = weeklyData[2].boxData[4] + Math.random() * 80
      outliers.push({
        value: highOutlier,
        xAxis: 2,
        yAxis: highOutlier
      })
      break
    default:
      boxplotData = generateBoxplotData([280, 350], 0.15, 24).map(item => item.boxData)
      xAxisData = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  }
  
  // 设置图表选项
  const option = {
    title: {
      text: '日前价时序箱线图',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function (params: any) {
        if (params.seriesName === '异常值') {
          return `
            <div style="font-weight:bold;margin-bottom:5px;">${params.name}</div>
            <div>异常值: ${params.value.toFixed(2)} ¥/MWh</div>
          `
        }
        
        const data = params.data
        return `
          <div style="font-weight:bold;margin-bottom:5px;">${params.name}</div>
          <div>最大值: ${data[4].toFixed(2)} ¥/MWh</div>
          <div>上四分位: ${data[3].toFixed(2)} ¥/MWh</div>
          <div>中位数: ${data[2].toFixed(2)} ¥/MWh</div>
          <div>下四分位: ${data[1].toFixed(2)} ¥/MWh</div>
          <div>最小值: ${data[0].toFixed(2)} ¥/MWh</div>
        `
      }
    },
    legend: {
      data: ['日前价', '异常值'],
      top: 40
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    toolbox: {
      feature: {
        saveAsImage: { title: '保存为图片' },
        dataZoom: { title: '区域缩放' },
        restore: { title: '还原' }
      }
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLabel: {
        rotate: 45
      },
      name: timeGranularity.value === 'hour' ? '时点 (小时)' : 
            timeGranularity.value === 'day' ? '日期' : '周',
      nameLocation: 'middle',
      nameGap: 35
    },
    yAxis: {
      type: 'value',
      name: '价格 (¥/MWh)',
      axisLabel: {
        formatter: '{value}'
      }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100
      }
    ],
    series: [
      {
        name: '日前价',
        type: 'boxplot',
        data: boxplotData,
        itemStyle: {
          color: '#409EFF',
          borderColor: '#409EFF'
        },
        tooltip: {
          formatter: function (param: any) {
            return [
              '日前价: ' + param.name,
              '最大值: ' + param.data[4].toFixed(2),
              '上四分位: ' + param.data[3].toFixed(2),
              '中位数: ' + param.data[2].toFixed(2),
              '下四分位: ' + param.data[1].toFixed(2),
              '最小值: ' + param.data[0].toFixed(2)
            ].join('<br/>')
          }
        }
      },
      {
        name: '异常值',
        type: 'scatter',
        data: outliers,
        itemStyle: {
          color: '#F56C6C'
        }
      }
    ]
  }
  
  boxplotChart.value.setOption(option)
}

// 计算KPI数据
function calculateKPIs(currentData: any[], previousData: any[]): void {
  // 如果数据不存在，使用默认值
  if (!currentData?.length || !previousData?.length) {
    return
  }

  // 提取价格数据
  const currentPrices = currentData.map(item => item.price)
  const previousPrices = previousData.map(item => item.price)

  // 计算平均价格
  const currentAvg = calculateAverage(currentPrices)
  const previousAvg = calculateAverage(previousPrices)
  const avgPriceChange = calculatePercentageChange(previousAvg, currentAvg)

  // 计算标准差
  const currentStdDev = calculateStdDev(currentPrices)
  const previousStdDev = calculateStdDev(previousPrices)
  const stdDevChange = calculatePercentageChange(previousStdDev, currentStdDev)

  // 计算峰值和谷值
  const currentPeak = Math.max(...currentPrices)
  const previousPeak = Math.max(...previousPrices)
  const peakChange = calculatePercentageChange(previousPeak, currentPeak)

  const currentValley = Math.min(...currentPrices)
  const previousValley = Math.min(...previousPrices)
  const valleyChange = calculatePercentageChange(previousValley, currentValley)

  // 计算价格跳变次数
  const currentJumps = countPriceJumps(currentPrices, priceJumpThreshold.value)
  const previousJumps = countPriceJumps(previousPrices, priceJumpThreshold.value)
  const jumpChange = calculatePercentageChange(previousJumps, currentJumps)

  // 更新KPI数据
  kpiData.avgPrice = {
    current: parseFloat(currentAvg.toFixed(2)),
    previous: parseFloat(previousAvg.toFixed(2)),
    change: parseFloat(avgPriceChange.toFixed(2))
  }

  kpiData.priceStdDev = {
    current: parseFloat(currentStdDev.toFixed(2)),
    previous: parseFloat(previousStdDev.toFixed(2)),
    change: parseFloat(stdDevChange.toFixed(2))
  }

  kpiData.peakPrice = {
    current: parseFloat(currentPeak.toFixed(2)),
    previous: parseFloat(previousPeak.toFixed(2)),
    change: parseFloat(peakChange.toFixed(2))
  }

  kpiData.valleyPrice = {
    current: parseFloat(currentValley.toFixed(2)),
    previous: parseFloat(previousValley.toFixed(2)),
    change: parseFloat(valleyChange.toFixed(2))
  }

  kpiData.priceJumpCount = {
    current: currentJumps,
    previous: previousJumps,
    change: parseFloat(jumpChange.toFixed(2))
  }
}

// 计算平均值
function calculateAverage(values: number[]): number {
  if (!values.length) return 0
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

// 计算标准差
function calculateStdDev(values: number[]): number {
  if (!values.length) return 0
  const avg = calculateAverage(values)
  const squaredDiffs = values.map(value => Math.pow(value - avg, 2))
  const variance = calculateAverage(squaredDiffs)
  return Math.sqrt(variance)
}

// 计算百分比变化
function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100
}

// 计算价格跳变次数
function countPriceJumps(prices: number[], threshold: number): number {
  if (prices.length < 2) return 0
  
  let jumps = 0
  for (let i = 1; i < prices.length; i++) {
    const change = Math.abs(prices[i] - prices[i - 1])
    if (change >= threshold) {
      jumps++
    }
  }
  
  return jumps
}

// 更新KPI数据
function updateKPIData() {
  let currentData: any[] = []
  let previousData: any[] = []
  
  // 获取第一个可见且启用的对比组数据
  for (const groupIndex of visibleCompareGroups.value) {
    const group = compareGroups[groupIndex]
    if (group.enabled) {
      currentData = group.data.current
      previousData = group.data.previous
      break
    }
  }
  
  if (currentData.length === 0 || previousData.length === 0) {
    console.log('KPI数据不可用')
    return
  }
  
  // 计算KPI数据
  calculateKPIs(currentData, previousData)
}

// 生命周期钩子
onMounted(() => {
  // 加载数据
  loadData()
  
  // 初始化可见对比组
  initVisibleCompareGroups()
  
  // 更新KPI数据
  updateKPIData()
})

onUnmounted(() => {
  // 移除窗口大小变化监听
  window.removeEventListener('resize', handleResize)
  
  // 销毁图表实例
  hourlyPriceChart.value?.dispose()
  boxplotChart.value?.dispose()
  distributionChart.value?.dispose()
  scatterChart.value?.dispose()
})

// 监听价格跳变阈值变化
watch(priceJumpThreshold, () => {
  if (selectedComparisonMetrics.value.includes('priceJump')) {
    updateKPIData()
  }
})

// 监听可见对比组变化
watch(visibleCompareGroups, () => {
  updateKPIData()
}, { deep: true })

// 监听对比组数据变化
watch(() => [
  ...compareGroups.map((group) => group.data.current),
  ...compareGroups.map((group) => group.data.previous)
], () => {
  // 当任何对比组的数据变化时更新KPI数据
  updateKPIData()
}, { deep: true })

// 方法定义

// 应用维度筛选
// function applyDimensionFilter() {
//   console.log('应用维度筛选:')
//   console.log('- 日类型:', selectedDayTypes.value)
//   console.log('- 时段类型:', selectedTimeSegments.value)
//   
//   // 刷新所有图表
//   loadData()
// }

// 处理时间粒度变化
// function handleTimeGranularityChange() {
//   console.log('时间粒度变更为:', timeGranularity.value)
//   // 应用到所有图表
//   changeBoxplotTimeGranularity(timeGranularity.value)
// }
</script>

<style scoped>
.price-variation-container {
  padding: 20px;
}

/* 内容区域样式 */
.analysis-content {
  display: flex;
  gap: 20px;
}

/* 全局筛选器样式 */
.global-filter-section {
  padding: 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

/* 对比组网格布局 */
.compare-groups-grid {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 16px;
  transition: all 0.3s ease;
}

.compare-group-row {
  display: flex;
  width: 100%;
  gap: 16px;
  transition: all 0.3s ease;
}

.compare-group {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  background-color: #ffffff;
  flex: 1;
  min-width: 0; /* 防止内容溢出 */
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.compare-group:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.compare-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.group-title {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
}

.compare-periods {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.period-selector {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.period-label {
  min-width: 70px;
  color: #606266;
  font-weight: 500;
}

.period-selector .el-date-editor {
  width: 100% !important;
  max-width: 100%;
}

.period-selector :deep(.el-input__wrapper) {
  width: 100%;
}

.quick-compare-options {
  margin-top: 8px;
}

.quick-compare-options .el-button-group {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}

.quick-compare-options .el-button {
  flex: 1;
  min-width: 90px;
  margin-right: 0;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 8px;
  padding-right: 8px;
}

/* 响应式调整 */
@media screen and (max-width: 1280px) {
  .compare-group-row {
    flex-direction: column;
  }
}

/* 小屏幕下更进一步调整 */
@media screen and (max-width: 768px) {
  .period-selector {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .period-label {
    margin-bottom: 4px;
  }
  
  .quick-compare-options .el-button-group {
    flex-direction: column;
  }
  
  .quick-compare-options .el-button {
    width: 100%;
  }
}

/* 筛选行样式 */
.filter-row {
  display: flex;
  margin-top: 16px;
  gap: 24px;
}

.filter-item {
  margin-right: 24px;
}

.dimension-selector {
  flex: 3;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #ffffff;
}

.dimension-main-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #303133;
}

.dimension-groups-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.dimension-group {
  flex: 1;
  min-width: 200px;
  padding: 12px;
  border-radius: 4px;
  background-color: #f5f7fa;
}

.dimension-title {
  font-weight: bold;
  margin-bottom: 12px;
  color: #409eff;
  font-size: 14px;
}

.time-dimensions .dimension-title {
  color: #409eff;
}

.weather-dimensions .dimension-title {
  color: #e6a23c;
}

.other-dimensions .dimension-title {
  color: #f56c6c;
}

.load-dimensions .dimension-title {
  color: #67c23a;
}

.comparison-selector {
  flex: 1;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #ffffff;
}

.price-jump-threshold {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #ebeef5;
}

.threshold-label {
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

/* 内容区域样式 */
.analysis-content {
  display: flex;
  gap: 20px;
}

.main-analysis-area {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.secondary-analysis-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.analysis-card {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.card-tools {
  display: flex;
  gap: 10px;
}

.chart-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.chart-control-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.chart-container {
  width: 100%;
  height: 450px;
}

.chart {
  width: 100%;
  height: 100%;
}

/* KPI卡片样式 */
.kpi-cards-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.kpi-card {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.kpi-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
  text-align: center;
}

.kpi-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.kpi-values {
  display: flex;
  width: 100%;
  justify-content: space-around;
}

.kpi-current, .kpi-previous {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.value-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.kpi-change {
  font-size: 16px;
  font-weight: bold;
}

.change-positive {
  color: #67C23A;
}

.change-negative {
  color: #F56C6C;
}

.change-neutral {
  color: #909399;
}

/* 维度筛选器样式 */
.dimension-filter-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.dimension-filter-section {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-title {
  font-weight: bold;
  font-size: 14px;
  color: #303133;
  margin-bottom: 5px;
}

/* 响应式调整 */
@media (max-width: 1280px) {
  .compare-group-row {
    flex-direction: column;
  }
  
  .analysis-content {
    flex-direction: column;
  }
  
  .dimension-groups-container {
    grid-template-columns: 1fr;
  }
  
  .kpi-cards-container {
    grid-template-columns: 1fr;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.control-item {
  margin-bottom: 15px;
}

.control-label {
  display: inline-block;
  width: 80px;
  font-size: 14px;
  color: #606266;
}

/* 散点图控制面板样式 */
.scatter-control-panel {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 15px;
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
}

.scatter-control-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #e0e0e0;
}

.scatter-control-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.control-section-title {
  font-weight: bold;
  font-size: 14px;
  color: #303133;
  margin-bottom: 5px;
}

.control-item-label {
  display: inline-block;
  width: 80px;
  font-size: 14px;
  color: #606266;
}

/* 隐藏不需要的chart-controls */
.chart-controls {
  display: none;
}
</style>