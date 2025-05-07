<template>
  <div class="price-deviation-container">
    <!-- 1. 顶部区域：全局筛选器 -->
    <div class="global-filter-section">
      <!-- 2.1 日期范围选择器 -->
      <div class="filter-item date-range-selector">
        <div class="filter-label">日期范围</div>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :shortcuts="dateRangeShortcuts"
          value-format="YYYY-MM-DD"
          @change="handleDateRangeChange"
          size="default"
        />
      </div>
      
      <!-- 2.2 维度选择器 -->
      <div class="filter-row">
        <div class="filter-item dimension-selector">
          <h4 class="dimension-main-title">维度选择</h4>
          
          <div class="dimension-groups-container">
            <!-- 时间维度 -->
            <div class="dimension-group time-dimensions">
              <div class="dimension-title">时间维度</div>
              <el-checkbox-group v-model="selectedTimeDimensions">
                <el-checkbox label="dayType">日类型（工作日/周末）</el-checkbox>
                <el-checkbox label="timeSegment">尖峰/高峰/平段/低谷时段</el-checkbox>
              </el-checkbox-group>
            </div>
            
            <!-- 气象维度 -->
            <div class="dimension-group weather-dimensions">
              <div class="dimension-title">气象维度</div>
              <el-checkbox-group v-model="selectedWeatherDimensions">
                <el-checkbox label="temperature">温度</el-checkbox>
                <el-checkbox label="precipitation">降水</el-checkbox>
                <el-checkbox label="humidity">湿度</el-checkbox>
                <el-checkbox label="radiation">辐照</el-checkbox>
                <el-checkbox label="windSpeed">风速</el-checkbox>
              </el-checkbox-group>
            </div>
            
            <!-- 负荷维度 -->
            <div class="dimension-group load-dimensions">
              <div class="dimension-title">负荷维度</div>
              <el-checkbox-group v-model="selectedLoadDimensions">
                <el-checkbox label="dispatchLoad">统调负荷</el-checkbox>
                <el-checkbox label="classB">B类负荷</el-checkbox>
                <el-checkbox label="westLoad">西电负荷</el-checkbox>
              </el-checkbox-group>
            </div>
            
            <!-- 其他业务相关维度 -->
            <div class="dimension-group other-dimensions">
              <div class="dimension-title">其他业务相关维度</div>
              <el-checkbox-group v-model="selectedOtherDimensions">
                <el-checkbox label="specialEvents">特殊事件</el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 2.3 核心价格对比指标 -->
      <div class="filter-row">
        <div class="filter-item price-metric-selector">
          <div class="filter-label">核心价格对比指标</div>
          <el-checkbox-group v-model="selectedPriceMetrics">
            <el-checkbox label="priceDiff">价差（实时价格 - 日前价格）</el-checkbox>
            <el-checkbox label="priceDevRate">价差偏差率（（实时价格 / 日前价格）- 1）</el-checkbox>
          </el-checkbox-group>
        </div>
      </div>
      
      <!-- 2.4 应用/重置按钮 -->
      <div class="filter-actions">
        <el-button type="primary" @click="applyFilters">应用</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="analysis-content">
      <!-- 左侧主分析区 (约占2/3宽度) -->
      <div class="main-analysis-area">
        <!-- 3.1 价格时间序列折线箱型图 -->
        <div class="analysis-card">
          <div class="card-header">
            <h3>价格时间序列分析</h3>
            <div class="card-tools">
              <el-tooltip content="设置阈值">
                <el-button size="small" circle @click="showThresholdDialog">
                  <el-icon><Setting /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="下载数据">
                <el-button size="small" circle>
                  <el-icon><Download /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="查看详情">
                <el-button size="small" circle>
                  <el-icon><View /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </div>
          <div class="chart-container">
            <div ref="priceTimeSeriesChartRef" class="chart"></div>
          </div>
        </div>
        
        <!-- 3.2 价差透视表 (按维度筛选) -->
        <div class="analysis-card">
          <div class="card-header">
            <h3>价差透视表</h3>
            <div class="card-tools">
              <el-dropdown>
                <el-button size="small">
                  聚合方式
                  <el-icon><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="changeAggregation('avg')">平均值</el-dropdown-item>
                    <el-dropdown-item @click="changeAggregation('avgAbs')">平均绝对值</el-dropdown-item>
                    <el-dropdown-item @click="changeAggregation('max')">最大值</el-dropdown-item>
                    <el-dropdown-item @click="changeAggregation('min')">最小值</el-dropdown-item>
                    <el-dropdown-item @click="changeAggregation('std')">标准差</el-dropdown-item>
                    <el-dropdown-item @click="changeAggregation('overThreshold')">超阈值计数</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-tooltip content="导出表格">
                <el-button size="small" circle>
                  <el-icon><Download /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </div>
          <div class="table-container">
            <el-table
              :data="pivotTableData"
              style="width: 100%"
              height="350"
              border
              :cell-class-name="getCellClass"
              @cell-click="handleCellClick"
            >
              <el-table-column fixed prop="dimension" label="维度/时段" width="150" />
              <el-table-column
                v-for="(hour, index) in 24"
                :key="index"
                :prop="'h' + (index+1)"
                :label="(index+1) + '时'"
                width="80"
              />
              <el-table-column prop="average" label="平均" width="80" />
            </el-table>
          </div>
        </div>
        
        <!-- 3.3 散点图 -->
        <div class="analysis-card">
          <div class="card-header">
            <h3>关联分析散点图</h3>
            <div class="card-tools">
              <el-dropdown>
                <el-button size="small">
                  X轴维度
                  <el-icon><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="setScatterXAxis('dayAheadPrice')">日前价格</el-dropdown-item>
                    <el-dropdown-item @click="setScatterXAxis('dispatchLoad')">统调负荷</el-dropdown-item>
                    <el-dropdown-item @click="setScatterXAxis('temperature')">温度</el-dropdown-item>
                    <el-dropdown-item @click="setScatterXAxis('windSpeed')">风速</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-dropdown>
                <el-button size="small">
                  点颜色编码
                  <el-icon><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="setScatterColorBy('dayType')">日类型</el-dropdown-item>
                    <el-dropdown-item @click="setScatterColorBy('timeSegment')">时间段</el-dropdown-item>
                    <el-dropdown-item @click="setScatterColorBy('specialEvent')">特殊事件</el-dropdown-item>
                    <el-dropdown-item @click="setScatterColorBy('none')">无</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-tooltip content="下载数据">
                <el-button size="small" circle>
                  <el-icon><Download /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </div>
          <div class="chart-container">
            <div ref="scatterChartRef" class="chart"></div>
          </div>
        </div>
      </div>
      
      <!-- 右侧辅助分析区 (约占1/3宽度) -->
      <div class="secondary-analysis-area">
        <!-- 4.1 顶部：关键指标汇总 (KPI卡片) -->
        <div class="analysis-card">
          <div class="card-header">
            <h3>关键指标汇总</h3>
          </div>
          <div class="kpi-container">
            <div class="kpi-card">
              <div class="kpi-title">平均日前价格</div>
              <div class="kpi-value">{{ averageMetrics.dayAheadPrice.toFixed(2) }} ¥/MWh</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">平均实时价格</div>
              <div class="kpi-value">{{ averageMetrics.realTimePrice.toFixed(2) }} ¥/MWh</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">平均价差</div>
              <div class="kpi-value" :class="averageMetrics.priceDiff > 0 ? 'positive-value' : (averageMetrics.priceDiff < 0 ? 'negative-value' : '')">
                {{ averageMetrics.priceDiff.toFixed(2) }} ¥/MWh
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">平均绝对价差</div>
              <div class="kpi-value">{{ averageMetrics.absPriceDiff.toFixed(2) }} ¥/MWh</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">价差标准差</div>
              <div class="kpi-value">{{ averageMetrics.priceDiffStd.toFixed(2) }} ¥/MWh</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">超正向阈值次数</div>
              <div class="kpi-value positive-value">{{ averageMetrics.positiveThresholdCount }}次</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">超负向阈值次数</div>
              <div class="kpi-value negative-value">{{ averageMetrics.negativeThresholdCount }}次</div>
            </div>
          </div>
        </div>
        
        <!-- 4.2 中部：价差分布图 -->
        <div class="analysis-card">
          <div class="card-header">
            <h3>价差分布图</h3>
            <div class="card-tools">
              <el-radio-group v-model="distributionChartType" size="small">
                <el-radio-button label="histogram">直方图</el-radio-button>
                <el-radio-button label="density">密度图</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          <div class="chart-container">
            <div ref="distributionChartRef" class="chart"></div>
          </div>
        </div>
        
        <!-- 4.3 底部：Top N极端价差时段列表 -->
        <div class="analysis-card">
          <div class="card-header">
            <h3>Top N极端价差时段</h3>
            <div class="card-tools">
              <el-select v-model="topNCount" placeholder="选择数量" size="small">
                <el-option label="Top 5" :value="5" />
                <el-option label="Top 10" :value="10" />
                <el-option label="Top 20" :value="20" />
              </el-select>
            </div>
          </div>
          <div class="table-container">
            <el-table :data="topNData" style="width: 100%" height="280" border>
              <el-table-column prop="date" label="日期" width="100" />
              <el-table-column prop="hour" label="时点" width="80" />
              <el-table-column prop="priceDiff" label="价差(¥/MWh)" width="120">
                <template #default="scope">
                  <span :class="scope.row.priceDiff > 0 ? 'positive-value' : 'negative-value'">
                    {{ scope.row.priceDiff.toFixed(2) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="priceDevRate" label="价差率(%)" width="100">
                <template #default="scope">
                  <span :class="scope.row.priceDevRate > 0 ? 'positive-value' : 'negative-value'">
                    {{ (scope.row.priceDevRate * 100).toFixed(2) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="possibleReason" label="可能原因" />
            </el-table>
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
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { ArrowDown, Download, View, Setting } from '@element-plus/icons-vue'

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
const priceTimeSeriesChartRef = ref<HTMLElement | null>(null)
const scatterChartRef = ref<HTMLElement | null>(null)
let priceTimeSeriesChart: echarts.ECharts | null = null
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
  {
    dimension: '工作日',
    h1: 45.2,
    h2: 37.8,
    h3: 29.1,
    h4: 22.5,
    h5: 18.7,
    h6: 25.3,
    h7: 31.6,
    h8: 42.9,
    h9: 56.4,
    h10: 68.7,
    h11: 72.3,
    h12: 78.5,
    h13: 75.2,
    h14: 73.8,
    h15: 71.4,
    h16: 69.3,
    h17: 65.7,
    h18: 78.9,
    h19: 85.3,
    h20: 76.4,
    h21: 67.2,
    h22: 58.6,
    h23: 52.1,
    h24: 49.5,
    average: 57.6
  },
  {
    dimension: '周末',
    h1: 38.5,
    h2: 32.7,
    h3: 26.4,
    h4: 19.8,
    h5: 15.2,
    h6: 18.6,
    h7: 25.9,
    h8: 35.4,
    h9: 48.7,
    h10: 57.3,
    h11: 62.8,
    h12: 68.2,
    h13: 65.7,
    h14: 63.4,
    h15: 61.2,
    h16: 59.5,
    h17: 57.8,
    h18: 68.4,
    h19: 75.2,
    h20: 65.8,
    h21: 56.7,
    h22: 48.9,
    h23: 45.2,
    h24: 41.8,
    average: 50.1
  },
  {
    dimension: '尖峰',
    h1: 0,
    h2: 0,
    h3: 0,
    h4: 0,
    h5: 0,
    h6: 0,
    h7: 0,
    h8: 0,
    h9: 0,
    h10: 0,
    h11: 0,
    h12: 0,
    h13: 0,
    h14: 0,
    h15: 0,
    h16: 0,
    h17: 0,
    h18: 78.9,
    h19: 85.3,
    h20: 76.4,
    h21: 67.2,
    h22: 0,
    h23: 0,
    h24: 0,
    average: 77.0
  },
  {
    dimension: '高峰',
    h1: 0,
    h2: 0,
    h3: 0,
    h4: 0,
    h5: 0,
    h6: 0,
    h7: 0,
    h8: 42.9,
    h9: 56.4,
    h10: 68.7,
    h11: 72.3,
    h12: 78.5,
    h13: 75.2,
    h14: 73.8,
    h15: 71.4,
    h16: 69.3,
    h17: 65.7,
    h18: 0,
    h19: 0,
    h20: 0,
    h21: 0,
    h22: 58.6,
    h23: 0,
    h24: 0,
    average: 66.6
  },
  {
    dimension: '平段',
    h1: 0,
    h2: 0,
    h3: 0,
    h4: 0,
    h5: 0,
    h6: 25.3,
    h7: 31.6,
    h8: 0,
    h9: 0,
    h10: 0,
    h11: 0,
    h12: 0,
    h13: 0,
    h14: 0,
    h15: 0,
    h16: 0,
    h17: 0,
    h18: 0,
    h19: 0,
    h20: 0,
    h21: 0,
    h22: 0,
    h23: 52.1,
    h24: 49.5,
    average: 39.6
  },
  {
    dimension: '低谷',
    h1: 45.2,
    h2: 37.8,
    h3: 29.1,
    h4: 22.5,
    h5: 18.7,
    h6: 0,
    h7: 0,
    h8: 0,
    h9: 0,
    h10: 0,
    h11: 0,
    h12: 0,
    h13: 0,
    h14: 0,
    h15: 0,
    h16: 0,
    h17: 0,
    h18: 0,
    h19: 0,
    h20: 0,
    h21: 0,
    h22: 0,
    h23: 0,
    h24: 0,
    average: 30.7
  }
])

// 增加KPI指标数据
const averageMetrics = reactive({
  dayAheadPrice: 350.75, // 平均日前价格
  realTimePrice: 372.45, // 平均实时价格
  priceDiff: 21.70, // 平均价差
  absPriceDiff: 45.32, // 平均绝对价差
  priceDiffStd: 38.67, // 价差标准差
  positiveThresholdCount: 15, // 超正向阈值次数
  negativeThresholdCount: 8 // 超负向阈值次数
})

// 价差分布图设置
const distributionChartRef = ref<HTMLElement | null>(null)
let distributionChart: echarts.ECharts | null = null
const distributionChartType = ref('histogram') // 'histogram' 或 'density'

// Top N极端价差设置
const topNCount = ref(10)
const topNData = ref([
  { date: '2023-06-15', hour: 19, priceDiff: 120.45, priceDevRate: 0.35, possibleReason: '高峰时段负荷突增' },
  { date: '2023-06-14', hour: 14, priceDiff: 98.32, priceDevRate: 0.28, possibleReason: '输电故障' },
  { date: '2023-06-16', hour: 11, priceDiff: 85.67, priceDevRate: 0.22, possibleReason: '高温天气' },
  { date: '2023-06-13', hour: 20, priceDiff: 76.54, priceDevRate: 0.19, possibleReason: '高峰时段负荷突增' },
  { date: '2023-06-12', hour: 15, priceDiff: 65.78, priceDevRate: 0.17, possibleReason: '高温天气' },
  { date: '2023-06-17', hour: 2, priceDiff: -82.45, priceDevRate: -0.25, possibleReason: '低谷时段风力发电增加' },
  { date: '2023-06-18', hour: 3, priceDiff: -75.32, priceDevRate: -0.23, possibleReason: '低谷时段风力发电增加' },
  { date: '2023-06-15', hour: 4, priceDiff: -68.91, priceDevRate: -0.20, possibleReason: '低谷时段负荷低估' },
  { date: '2023-06-16', hour: 1, priceDiff: -62.38, priceDevRate: -0.18, possibleReason: '低谷时段负荷低估' },
  { date: '2023-06-14', hour: 5, priceDiff: -56.72, priceDevRate: -0.16, possibleReason: '凌晨气温下降' }
])

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
  updatePriceTimeSeriesChart()
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
    initCharts()
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
function initCharts() {
  initPriceTimeSeriesChart()
  initScatterChart()
  initDistributionChart()
}

function initPriceTimeSeriesChart() {
  // 初始化价格时间序列折线箱型图
  if (priceTimeSeriesChartRef.value) {
    priceTimeSeriesChart = echarts.init(priceTimeSeriesChartRef.value)
    updatePriceTimeSeriesChart()
  }
}

function updatePriceTimeSeriesChart() {
  // 更新价格时间序列折线箱型图
  if (!priceTimeSeriesChart) return
  
  // 生成日期数组
  const dates = []
  const startDate = dayjs(dateRange.value[0])
  const endDate = dayjs(dateRange.value[1])
  const dayCount = endDate.diff(startDate, 'day') + 1
  
  for (let i = 0; i < dayCount; i++) {
    dates.push(startDate.add(i, 'day').format('MM-DD'))
  }
  
  // 模拟价差数据
  const priceDiffData = Array.from({ length: dayCount }, () => Math.floor(Math.random() * 100) - 40)
  const priceDevRateData = Array.from({ length: dayCount }, () => (Math.random() * 0.4) - 0.15)
  
  // 模拟箱型图数据
  const boxplotData = dates.map(() => {
    // 生成5个数据点：最小值、下四分位、中位数、上四分位、最大值
    const values = Array.from({ length: 5 }, () => Math.floor(Math.random() * 100) - 40).sort((a, b) => a - b)
    return values
  })
  
  // 特殊事件数据
  const specialEvents = [
    { date: dates[2], name: '电网故障', value: priceDiffData[2] + 5 },
    { date: dates[5], name: '机组检修', value: priceDiffData[5] + 5 }
  ]
  
  const option = {
    title: {
      text: '日前vs实时价格偏差分析',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: function(params: any) {
        let result = params[0].axisValue + '<br/>'
        params.forEach((param: any) => {
          if (param.seriesName === '价差') {
            result += param.marker + param.seriesName + ': ' + param.value + ' ¥/MWh<br/>'
          } else if (param.seriesName === '价差率') {
            result += param.marker + param.seriesName + ': ' + (param.value * 100).toFixed(2) + '%<br/>'
          } else if (param.seriesName === '价差分布') {
            result += param.marker + param.seriesName + ': [' + 
              param.value[1] + ', ' + param.value[2] + ', ' + 
              param.value[3] + ', ' + param.value[4] + '] ¥/MWh<br/>'
          } else if (param.seriesName === '特殊事件') {
            result += param.marker + param.seriesName + ': ' + param.data.name + '<br/>'
          }
        })
        return result
      }
    },
    legend: {
      data: ['价差', '价差率', '价差分布', '特殊事件'],
      left: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: [
      {
        type: 'value',
        name: '价差(¥/MWh)',
        position: 'left',
        axisLine: {
          show: true,
          lineStyle: {
            color: '#5470C6'
          }
        },
        axisLabel: {
          formatter: '{value} ¥/MWh'
        }
      },
      {
        type: 'value',
        name: '价差率(%)',
        position: 'right',
        axisLine: {
          show: true,
          lineStyle: {
            color: '#91CC75'
          }
        },
        axisLabel: {
          formatter: '{value}%'
        },
        min: -20,
        max: 40
      }
    ],
    series: [
      {
        name: '价差',
        type: 'line',
        data: priceDiffData,
        yAxisIndex: 0,
        markLine: {
          data: [
            {
              name: '价差上限',
              yAxis: thresholdForm.upperPriceDiff,
              lineStyle: { color: '#FF4500', type: 'dashed' },
              label: { show: true, position: 'end' }
            },
            {
              name: '价差下限',
              yAxis: thresholdForm.lowerPriceDiff,
              lineStyle: { color: '#4169E1', type: 'dashed' },
              label: { show: true, position: 'end' }
            }
          ]
        }
      },
      {
        name: '价差率',
        type: 'line',
        yAxisIndex: 1,
        data: priceDevRateData,
        lineStyle: {
          color: '#91CC75'
        },
        itemStyle: {
          color: '#91CC75'
        },
        markLine: {
          data: [
            {
              name: '价差率上限',
              yAxis: thresholdForm.upperPriceDevRate / 100,
              lineStyle: { color: '#FF4500', type: 'dashed' },
              label: { show: true, formatter: '{c}%', position: 'end' }
            },
            {
              name: '价差率下限',
              yAxis: thresholdForm.lowerPriceDevRate / 100,
              lineStyle: { color: '#4169E1', type: 'dashed' },
              label: { show: true, formatter: '{c}%', position: 'end' }
            }
          ]
        }
      },
      {
        name: '价差分布',
        type: 'boxplot',
        data: boxplotData,
        yAxisIndex: 0,
        itemStyle: {
          color: '#73c0de'
        }
      },
      {
        name: '特殊事件',
        type: 'scatter',
        data: specialEvents.map(event => ({
          value: [event.date, event.value],
          name: event.name
        })),
        yAxisIndex: 0,
        symbolSize: 15,
        itemStyle: {
          color: '#FF0000'
        },
        label: {
          show: true,
          formatter: function(param: any) {
            return '⚠'
          },
          position: 'inside',
          color: '#ffffff'
        }
      }
    ]
  }
  
  priceTimeSeriesChart.setOption(option)
}

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

// 初始化价差分布图
function initDistributionChart() {
  if (distributionChartRef.value) {
    distributionChart = echarts.init(distributionChartRef.value)
    updateDistributionChart()
  }
}

// 更新价差分布图
function updateDistributionChart() {
  if (!distributionChart) return
  
  // 生成模拟数据
  const data = Array.from({ length: 100 }, () => Math.floor(Math.random() * 120) - 60) // -60 to 60
  
  // 直方图数据
  const histogramData = (() => {
    // 将数据分为20个区间
    const binWidth = 10
    const bins: number[] = Array(12).fill(0)
    const binLabels = []
    
    for (let i = 0; i < bins.length; i++) {
      const min = -60 + i * binWidth
      const max = min + binWidth
      binLabels.push(`${min}~${max}`)
    }
    
    // 计算每个区间的频数
    data.forEach(value => {
      const binIndex = Math.floor((value + 60) / binWidth)
      if (binIndex >= 0 && binIndex < bins.length) {
        bins[binIndex]++
      }
    })
    
    return {
      bins,
      binLabels
    }
  })()
  
  // 密度图数据
  const densityData = (() => {
    // 密度估计
    const densityPoints = []
    for (let x = -70; x <= 70; x += 2) {
      let density = 0
      data.forEach(value => {
        // 使用高斯核函数进行密度估计
        const distance = x - value
        density += Math.exp(-(distance * distance) / (2 * 15 * 15)) / (Math.sqrt(2 * Math.PI) * 15)
      })
      densityPoints.push([x, density * 100]) // 放大密度值以便可视化
    }
    return densityPoints
  })()
  
  let option
  if (distributionChartType.value === 'histogram') {
    option = {
      title: {
        text: '价差分布直方图',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}次'
      },
      xAxis: {
        type: 'category',
        data: histogramData.binLabels,
        name: '价差区间(¥/MWh)',
        nameLocation: 'middle',
        nameGap: 30
      },
      yAxis: {
        type: 'value',
        name: '频数',
        nameLocation: 'middle',
        nameGap: 30
      },
      series: [
        {
          data: histogramData.bins,
          type: 'bar',
          itemStyle: {
            color: function(params: any) {
              const value = parseFloat(params.name.split('~')[0])
              if (value > 30) return '#f56c6c'
              if (value > 0) return '#fac858'
              if (value > -30) return '#67c23a'
              return '#409eff'
            }
          }
        }
      ]
    }
  } else {
    option = {
      title: {
        text: '价差分布密度图',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params: any) {
          return `价差: ${params[0].data[0]} ¥/MWh<br>密度: ${params[0].data[1].toFixed(4)}`
        }
      },
      xAxis: {
        type: 'value',
        name: '价差(¥/MWh)',
        nameLocation: 'middle',
        nameGap: 30
      },
      yAxis: {
        type: 'value',
        name: '密度值',
        nameLocation: 'middle',
        nameGap: 30
      },
      series: [
        {
          data: densityData,
          type: 'line',
          smooth: true,
          lineStyle: {
            width: 2
          },
          areaStyle: {
            opacity: 0.5,
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(80, 141, 255, 0.8)' },
                { offset: 1, color: 'rgba(80, 141, 255, 0.1)' }
              ]
            }
          }
        }
      ],
      // 标记价差阈值线
      visualMap: {
        show: false,
        pieces: [
          { gt: thresholdForm.upperPriceDiff, color: '#f56c6c' },
          { gt: 0, lte: thresholdForm.upperPriceDiff, color: '#fac858' },
          { gt: thresholdForm.lowerPriceDiff, lte: 0, color: '#67c23a' },
          { lte: thresholdForm.lowerPriceDiff, color: '#409eff' }
        ],
        dimension: 0,
        seriesIndex: 0
      }
    }
  }
  
  distributionChart.setOption(option)
}

// 监听分布图类型变化
watch(distributionChartType, () => {
  updateDistributionChart()
})

// 监听TopN数量变化
watch(topNCount, () => {
  // 可以在这里加载对应数量的数据
  console.log('加载Top', topNCount.value, '极端价差时段')
})

// 窗口大小变化时重绘图表
function handleResize() {
  priceTimeSeriesChart?.resize()
  scatterChart?.resize()
  distributionChart?.resize()
}

// 生命周期钩子
onMounted(() => {
  // 初始化加载数据
  loadData()
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('resize', handleResize)
  
  // 销毁图表实例
  priceTimeSeriesChart?.dispose()
  scatterChart?.dispose()
  distributionChart?.dispose()
})
</script>

<style scoped>
.price-deviation-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.global-filter-section {
  padding: 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.filter-row {
  display: flex;
  margin-top: 16px;
  gap: 24px;
}

.filter-item {
  margin-right: 24px;
}

.filter-label {
  font-weight: bold;
  margin-bottom: 8px;
  color: #303133;
}

.dimension-selector {
  flex: 1;
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

.load-dimensions .dimension-title {
  color: #67c23a;
}

.other-dimensions .dimension-title {
  color: #f56c6c;
}

.price-metric-selector {
  flex: 1;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #ffffff;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.analysis-content {
  display: flex;
  flex: 1;
  overflow: auto;
  padding: 16px;
  gap: 16px;
  height: calc(100vh - 300px);
}

.main-analysis-area {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0; /* 修复Flex子元素溢出问题 */
}

.secondary-analysis-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 300px;
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
  height: 350px;
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

/* KPI卡片样式 */
.kpi-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px;
}

.kpi-card {
  flex: 1;
  min-width: 120px;
  padding: 12px;
  border-radius: 4px;
  background-color: #f5f7fa;
  text-align: center;
}

.kpi-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.kpi-value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

/* 图表通用样式 */
.chart {
  width: 100%;
  height: 100%;
}
</style>
