<template>
  <div class="consumption-deviation-container">
    <div class="analysis-content">
      <!-- 2. 左侧主分析区 -->
      <div class="main-analysis-section">
        <!-- 2.1 电量/偏差时间序列折线图 -->
        <div class="section-title">用电量趋势分析</div>
        <div class="dual-axis-chart-container">
          <!-- 添加折线图上方的选择器组件 -->
          <div class="chart-controls">
            <!-- 日期范围选择器 -->
            <div class="control-item">
              <span class="control-label">日期范围：</span>
            <el-date-picker
                v-model="chartDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
                :shortcuts="chartDateShortcuts"
              value-format="YYYY-MM-DD"
                @change="handleChartDateRangeChange"
              size="default"
                style="width: 260px;"
            />
          </div>

            <!-- 预测模型选择器 -->
            <div class="control-item">
              <span class="control-label">预测模型：</span>
            <el-select 
                v-model="chartPredictionModel" 
                placeholder="请选择模型"
              size="default"
                style="width: 150px;"
                @change="handleModelChange"
            >
              <el-option
                  v-for="model in chartPredictionModels"
                :key="model.value"
                :label="model.label"
                :value="model.value"
              />
            </el-select>
        </div>

            <!-- 维度选择器按钮 -->
            <div class="control-item">
            <el-button 
              type="primary" 
              size="default"
                @click="showDimensionSelector = true"
              plain
            >
                维度选择
            </el-button>
        </div>
      </div>

          <div class="chart-container" ref="dualAxisChartRef"></div>
        </div>
      </div>

      <!-- 3. 右侧辅助分析与信息区 -->
      <div class="auxiliary-analysis-section">
        <!-- 3.1 顶部：关键指标汇总 -->
        <div class="section-title">关键指标汇总</div>
        <div class="kpi-cards">
          <div class="kpi-card" :class="getKpiStatusClass(parseFloat(kpiData.averageDeviationRate), 5, 10)">
            <div class="kpi-title">平均绝对电量偏差率</div>
            <div class="kpi-value">{{ kpiData.averageDeviationRate }}%</div>
            <div class="kpi-sub-info">
              <span v-if="parseFloat(kpiData.averageDeviationRate) <= 5">状态良好</span>
              <span v-else-if="parseFloat(kpiData.averageDeviationRate) <= 10">需要关注</span>
              <span v-else>偏差过大</span>
            </div>
          </div>
          <div class="kpi-card" :class="getKpiStatusClass(parseFloat(kpiData.yearOnYearRate), 0, -5)">
            <div class="kpi-title">同比增长率</div>
            <div class="kpi-value">{{ kpiData.yearOnYearRate }}%</div>
            <div class="kpi-sub-info">
              <span v-if="parseFloat(kpiData.yearOnYearRate) > 0" class="trend-up">
                <i class="el-icon-top"></i>同比增长
              </span>
              <span v-else-if="parseFloat(kpiData.yearOnYearRate) < 0" class="trend-down">
                <i class="el-icon-bottom"></i>同比下降
              </span>
              <span v-else>持平</span>
            </div>
          </div>
          <div class="kpi-card" :class="getKpiStatusClass(parseFloat(kpiData.deviationStd), 3, 6)">
            <div class="kpi-title">偏差标准差</div>
            <div class="kpi-value">{{ kpiData.deviationStd }}</div>
            <div class="kpi-sub-info">
              <span v-if="parseFloat(kpiData.deviationStd) <= 3">波动较小</span>
              <span v-else-if="parseFloat(kpiData.deviationStd) <= 6">波动中等</span>
              <span v-else>波动较大</span>
            </div>
          </div>
          <div class="kpi-card" :class="getKpiStatusClass(kpiData.thresholdExceedCount, 3, 6)">
            <div class="kpi-title">超阈值次数</div>
            <div class="kpi-value">{{ kpiData.thresholdExceedCount }}</div>
            <div class="kpi-sub-info">
              阈值: ±{{ deviationThreshold }}%
              <span v-if="kpiData.thresholdExceedCount <= 3" class="status-text">状态良好</span>
              <span v-else-if="kpiData.thresholdExceedCount <= 6" class="status-text">需要关注</span>
              <span v-else class="status-text">超标严重</span>
            </div>
          </div>
        </div>

        <!-- 3.2 日类型系数表 -->
        <div class="section-title">日类型系数表</div>
        <div class="day-type-coefficient-table">
          <el-table :data="dayTypeData" border style="width: 100%">
            <el-table-column prop="dayType" label="日类型" align="center" />
            <el-table-column prop="average" label="均值" align="center">
              <template #default="scope">
                {{ formatNumber(scope.row.average) }}
              </template>
            </el-table-column>
            <el-table-column prop="coefficient" label="系数" align="center">
              <template #default="scope">
                {{ formatNumber(scope.row.coefficient, 3) }}
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 3.3 中部：关联图表 -->
        <div class="related-charts">
          <!-- 散点图已移除 -->
          </div>
          
        <!-- 维度钻取模块已移除 -->
              </div>
            </div>

    <!-- 4. 气象关联分析模块 (独立容器) -->
    <div class="weather-correlation-section">
      <div class="section-title">气象关联分析</div>
      <div class="dual-scatter-container">
        <!-- 双散点图区域 -->
        <div class="scatter-charts-wrapper">
          <!-- 左侧散点图 - 用户电量 vs 气象 -->
          <div class="scatter-chart-box">
            <!-- 左侧图表独立控件 -->
            <div class="chart-controls">
              <div class="control-group">
                <span class="control-label">Y轴变量：</span>
                <el-select v-model="consumptionWeatherVariable" placeholder="选择气象关联变量" size="default" style="width: 130px; color: #333;">
                  <el-option label="气温 (°C)" value="temperature" />
                  <el-option label="云量 (%)" value="cloudCover" />
                  <el-option label="风速 (m/s)" value="windSpeed" />
                  <el-option label="降水量 (mm)" value="precipitation" />
                  <el-option label="辐照 (W/m²)" value="radiation" />
              </el-select>
              </div>
              <div class="control-group">
                <span class="control-label">分组方式：</span>
                <el-select 
                  v-model="consumptionGroupingMethod" 
                  size="default" 
                  style="width: 130px; color: #333;"
                  placeholder="全部"
                >
                  <el-option label="全部" value="" />
                <el-option label="行业" value="industry" />
                  <el-option label="地区" value="region" />
              </el-select>
            </div>
          </div>
            <div class="chart-title">用户电量 vs 气象关联</div>
            <div class="chart-container" ref="consumptionScatterRef"></div>
        </div>

          <!-- 右侧散点图 - 偏差率 vs 气象 -->
          <div class="scatter-chart-box">
            <!-- 右侧图表独立控件 -->
            <div class="chart-controls">
              <div class="control-group">
                <span class="control-label">Y轴变量：</span>
                <el-select v-model="deviationWeatherVariable" placeholder="选择气象关联变量" size="default" style="width: 130px; color: #333;">
                  <el-option label="气温 (°C)" value="temperature" />
                  <el-option label="云量 (%)" value="cloudCover" />
                  <el-option label="风速 (m/s)" value="windSpeed" />
                  <el-option label="降水量 (mm)" value="precipitation" />
                  <el-option label="辐照 (W/m²)" value="radiation" />
                </el-select>
              </div>
              <div class="control-group">
                <span class="control-label">分组方式：</span>
                <el-select 
                  v-model="deviationGroupingMethod" 
                  size="default" 
                  style="width: 130px; color: #333;"
                  placeholder="全部"
                >
                  <el-option label="全部" value="" />
                  <el-option label="行业" value="industry" />
                  <el-option label="地区" value="region" />
                </el-select>
          </div>
              </div>
            <div class="chart-title">偏差率 vs 气象关联</div>
            <div class="chart-container" ref="deviationScatterRef"></div>
            </div>
        </div>
      </div>
    </div>

    <!-- 新增用户组对话框 -->
    <el-dialog
      title="新增用户组"
      v-model="userGroupDialogVisible"
      width="50%"
      destroy-on-close
    >
      <div class="user-group-form">
        <el-form :model="userGroupForm" label-width="80px">
          <!-- 搜索公司的输入框 -->
          <el-form-item label="搜索公司">
            <el-input 
              v-model="companySearchKeyword" 
              placeholder="请输入公司名称进行搜索" 
              clearable 
              @input="searchCompanies"
              size="default"
              class="company-search-input"
            />
          </el-form-item>
          
          <!-- 搜索结果列表 -->
          <el-form-item v-if="searchResults.length > 0" label="搜索结果">
            <div class="search-results-container">
              <div 
                v-for="company in searchResults" 
                :key="company.id" 
                class="search-result-item"
                @click="addCompanyToSelectedList(company)"
              >
                <span>{{ company.name }}</span>
                <el-button type="primary" size="small" circle>
                  <el-icon><Plus /></el-icon>
                </el-button>
              </div>
            </div>
          </el-form-item>
          
          <!-- 待添加用户组列表 -->
          <el-form-item label="待添加用户组">
            <div class="selected-companies-container">
              <div v-if="userGroupForm.selectedCompanies.length === 0" class="empty-tip">
                暂无选择的公司，请在上方搜索并添加
              </div>
              <div 
                v-for="(company, index) in userGroupForm.selectedCompanies" 
                :key="company.id" 
                class="selected-company-item"
              >
                <span>{{ company.name }}</span>
                <el-button 
                  type="danger" 
                  size="small" 
                  circle
                  @click="removeCompanyFromSelectedList(index)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelAddUserGroup">取消</el-button>
          <el-button type="primary" @click="confirmAddUserGroup">确认新增</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 维度选择器弹出对话框 -->
    <el-dialog
      title="维度选择"
      v-model="showDimensionSelector"
      width="60%"
      :close-on-click-modal="false"
    >
      <div class="dimension-selector-dialog">
        <div class="dimension-groups">
          <!-- 时段分组 -->
          <div class="dimension-group">
            <div class="dimension-group-title">
              <el-checkbox v-model="timeSegmentAll" @change="handleTimeSegmentAllChange">
                时段
              </el-checkbox>
            </div>
            <div class="dimension-options">
              <el-checkbox-group v-model="selectedTimeSegments" @change="handleTimeSegmentsChange">
                <el-checkbox label="peak">尖峰</el-checkbox>
                <el-checkbox label="high">高峰</el-checkbox>
                <el-checkbox label="normal">平段</el-checkbox>
                <el-checkbox label="low">低谷</el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
          
          <!-- 用户维度分组 -->
          <div class="dimension-group">
            <div class="dimension-group-title">
              <el-checkbox v-model="userDimensionAll" @change="handleUserDimensionAllChange">
                用户维度
              </el-checkbox>
            </div>
            
            <!-- 用户分级 -->
            <div class="dimension-subgroup">
              <div class="dimension-subgroup-title">
                <el-checkbox v-model="userLevelAll" @change="handleUserLevelAllChange">
                  用户分级
                </el-checkbox>
              </div>
              <div class="dimension-options">
                <el-checkbox-group v-model="selectedUserLevels" @change="handleUserLevelsChange">
                  <el-checkbox label="large">大型用户</el-checkbox>
                  <el-checkbox label="medium">中型用户</el-checkbox>
                  <el-checkbox label="small">小型用户</el-checkbox>
                  <el-checkbox label="micro">微型用户</el-checkbox>
                </el-checkbox-group>
              </div>
            </div>
            
            <!-- 电压类型 -->
            <div class="dimension-subgroup">
              <div class="dimension-subgroup-title">
                <el-checkbox v-model="voltageTypeAll" @change="handleVoltageTypeAllChange">
                  电压类型
                </el-checkbox>
              </div>
              <div class="dimension-options">
                <el-checkbox-group v-model="selectedVoltageTypes" @change="handleVoltageTypesChange">
                  <el-checkbox label="1-10kv">1-10kv</el-checkbox>
                  <el-checkbox label="20kv">20kv</el-checkbox>
                  <el-checkbox label="35-110kv">35-110kv</el-checkbox>
                  <el-checkbox label="220kv">220kv</el-checkbox>
                </el-checkbox-group>
              </div>
            </div>
            
            <!-- 行业 -->
            <div class="dimension-subgroup">
              <div class="dimension-subgroup-title">
                <el-checkbox v-model="industryAll" @change="handleIndustryAllChange">
                  行业
                </el-checkbox>
              </div>
              <div class="dimension-options">
                <el-checkbox-group v-model="selectedIndustries" @change="handleIndustriesChange">
                  <el-checkbox label="hotel">住宿业</el-checkbox>
                  <el-checkbox label="manufacturing">制造业</el-checkbox>
                  <el-checkbox label="retail">零售业</el-checkbox>
                  <el-checkbox label="education">教育</el-checkbox>
                  <el-checkbox label="health">医疗健康</el-checkbox>
                </el-checkbox-group>
              </div>
            </div>
            
            <!-- 地区 -->
            <div class="dimension-subgroup">
              <div class="dimension-subgroup-title">
                <el-checkbox v-model="regionAll" @change="handleRegionAllChange">
                  地区
                </el-checkbox>
              </div>
              <div class="dimension-options">
                <el-checkbox-group v-model="selectedRegions" @change="handleRegionsChange">
                  <el-checkbox label="shenzhen">深圳</el-checkbox>
                  <el-checkbox label="guangzhou">广州</el-checkbox>
                  <el-checkbox label="dongguan">东莞</el-checkbox>
                  <el-checkbox label="foshan">佛山</el-checkbox>
                </el-checkbox-group>
              </div>
            </div>
            
            <!-- 自定义用户组 -->
            <div v-if="customUserGroups.length > 0" class="dimension-subgroup">
              <div class="dimension-subgroup-title">
                <el-checkbox v-model="customUserGroupsAll" @change="handleCustomUserGroupsAllChange">
                  自定义用户组
                </el-checkbox>
              </div>
              <div class="dimension-options">
                <el-checkbox-group v-model="selectedCustomUserGroups" @change="handleCustomUserGroupsChange">
                  <el-checkbox 
                    v-for="group in customUserGroups" 
                    :key="group.id" 
                    :label="group.id.toString()"
                  >
                    {{ group.name }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </div>
            
            <!-- 新增用户组按钮 -->
            <div class="add-user-group-btn">
              <el-button type="primary" size="small" @click="showAddUserGroupDialog">
                新增用户组
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDimensionSelector = false">取消</el-button>
          <el-button type="primary" @click="applyDimensionFilters">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { ArrowDown as ElIconArrowDown, Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

dayjs.extend(isSameOrBefore)

// 添加高级筛选控制状态
const showAdvancedFilters = ref(false)

// 日期快捷选项
const dateShortcuts = [
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

// 图表引用
const dualAxisChartRef = ref<HTMLElement | null>(null)
// 双散点图引用
const consumptionScatterRef = ref<HTMLElement | null>(null)
const deviationScatterRef = ref<HTMLElement | null>(null)

// 图表实例
let dualAxisChart: echarts.ECharts | null = null
// 双散点图实例
let consumptionScatterChart: echarts.ECharts | null = null
let deviationScatterChart: echarts.ECharts | null = null

// 折线图的日期范围选择器
const chartDateRange = ref<[Date, Date]>([
  dayjs().subtract(27, 'day').toDate(),
  dayjs().toDate()
])

// 折线图日期快捷选项
const chartDateShortcuts = [
  {
    text: '近7天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 6)
      return [start, end]
    }
  },
  {
    text: '近14天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 13)
      return [start, end]
    }
  },
  {
    text: '近28天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 27)
      return [start, end]
    }
  },
  {
    text: '近90天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 89)
      return [start, end]
    }
  }
]

// 折线图预测模型选择器
const chartPredictionModels = ref([
  { label: '默认模型1', value: 'default' },
  { label: '模型A', value: 'modelA' },
  { label: '模型B', value: 'modelB' },
  { label: '模型C', value: 'modelC' }
])
const chartPredictionModel = ref('default')

// 维度选择器控制
const showDimensionSelector = ref(false)

// 维度选择器数据
// 时段
const timeSegmentAll = ref(true)
const selectedTimeSegments = ref(['peak', 'high', 'normal', 'low'])

// 用户维度
const userDimensionAll = ref(true)

// 用户分级
const userLevelAll = ref(true)
const selectedUserLevels = ref(['large', 'medium', 'small', 'micro'])

// 电压类型
const voltageTypeAll = ref(true)
const selectedVoltageTypes = ref(['1-10kv', '20kv', '35-110kv', '220kv'])

// 行业
const industryAll = ref(true)
const selectedIndustries = ref(['hotel', 'manufacturing', 'retail', 'education', 'health'])

// 地区
const regionAll = ref(true)
const selectedRegions = ref(['shenzhen', 'guangzhou', 'dongguan', 'foshan'])

// 用户组对话框
const userGroupDialogVisible = ref(false)
const userGroupForm = reactive({
  name: '',
  selectedCompanies: [] as Array<{ id: number, name: string }>
})
const companySearchKeyword = ref('')
const searchResults = ref<Array<{ id: number, name: string }>>([])
const userOptions = ref<Array<{ id: number, name: string }>>([])
const userSearchLoading = ref(false)

// 时间序列图控制参数
const timeGranularity = ref('day')
const showAbsoluteDeviation = ref(false)
const deviationThreshold = ref(10)

// 特殊事件数据模拟
const specialEvents = ref([
  {
    id: 1,
    name: '设备检修',
    startTime: dayjs().subtract(5, 'day').format('YYYY-MM-DD'),
    endTime: dayjs().subtract(4, 'day').format('YYYY-MM-DD'),
    description: '主变压器年度例行检修，期间供电能力受限'
  },
  {
    id: 2,
    name: '计量点变更',
    startTime: dayjs().subtract(3, 'day').format('YYYY-MM-DD'),
    endTime: dayjs().subtract(3, 'day').format('YYYY-MM-DD'),
    description: '电量计量点位置调整，可能影响电量数据精度'
  },
  {
    id: 3,
    name: '节假日',
    startTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    endTime: dayjs().format('YYYY-MM-DD'),
    description: '周末用电负荷较工作日有明显变化'
  }
])

// 判断是否需要显示特殊事件
const showSpecialEvents = computed(() => {
  return false
})

// 双散点图控制参数
const consumptionWeatherVariable = ref('temperature')
const consumptionGroupingMethod = ref('') // 空字符串对应"按日总览"
const deviationWeatherVariable = ref('temperature')
const deviationGroupingMethod = ref('') // 空字符串对应"按日总览"

// KPI 数据
const kpiData = reactive({
  averageDeviationRate: '0.00',
  yearOnYearRate: '5.32', // 新增同比增长率指标，默认值为正增长
  deviationStd: '0.00',
  thresholdExceedCount: 0
})

// 模拟数据 - 行业类别
const industries = [
  { value: 'industry1', label: '工业制造', color: '#5470c6' },
  { value: 'industry2', label: '商业服务', color: '#91cc75' },
  { value: 'industry3', label: '公共事业', color: '#fac858' },
  { value: 'industry4', label: '农业灌溉', color: '#ee6666' },
  { value: 'industry5', label: '其他', color: '#73c0de' }
]

// 模拟数据 - 地区类别
const regions = [
  { value: 'region1', label: '华东', color: '#5470c6' },
  { value: 'region2', label: '华北', color: '#91cc75' },
  { value: 'region3', label: '华南', color: '#fac858' },
  { value: 'region4', label: '西部', color: '#ee6666' },
  { value: 'region5', label: '东北', color: '#73c0de' }
]

// 定义类型
interface CategoryItem {
  value: string
  label: string
  color: string
}

interface ScatterDataItem {
  category: string
  categoryLabel: string
  color: string
  consumption: string
  deviation: string
  weatherValue: string
  weatherType: string
  date: string
  dayType: string
}

interface WeatherConfig {
  label: string
  unit: string
}

// 日类型系数表数据
const dayTypeData = ref([
  { dayType: '工', average: 750, coefficient: 1 },
  { dayType: '六', average: 742.5, coefficient: 0.99 },
  { dayType: '日', average: 600, coefficient: 0.8 },
  { dayType: '一', average: 712.5, coefficient: 0.95 },
  { dayType: '节', average: 450, coefficient: 0.6 },
  { dayType: '调', average: 600, coefficient: 0.8 }
])

// 格式化数字的函数
function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals)
}

// 计算日类型系数的函数
function calculateDayTypeCoefficients(data: any[]) {
  // 按日类型分组并计算均值
  const groupedData = data.reduce((acc, curr) => {
    if (!acc[curr.dayType]) {
      acc[curr.dayType] = {
        sum: 0,
        count: 0
      }
    }
    acc[curr.dayType].sum += curr.value
    acc[curr.dayType].count++
    return acc
  }, {})

  // 计算每个日类型的均值
  const averages = Object.entries(groupedData).reduce((acc, [type, data]: [string, any]) => {
    acc[type] = data.sum / data.count
    return acc
  }, {} as { [key: string]: number })

  // 获取"工"类型的均值作为基准
  const baseAverage = averages['工'] || 1

  // 更新日类型数据
  dayTypeData.value = dayTypeData.value.map(item => ({
    ...item,
    average: averages[item.dayType] || 0,
    coefficient: ((averages[item.dayType] || 0) / baseAverage)
  }))
}

// 监听日期范围变化
watch(chartDateRange, () => {
  // 这里应该调用后端API获取新的数据
  // 暂时使用模拟数据
  const mockData = generateMockData()
  calculateDayTypeCoefficients(mockData)
}, { immediate: true })

// 生成模拟数据的函数
function generateMockData() {
  const data = []
  const startDate = dayjs(chartDateRange.value[0])
  const endDate = dayjs(chartDateRange.value[1])
  let currentDate = startDate

  while (currentDate.isSameOrBefore(endDate)) {
    const dayOfWeek = currentDate.day()
    let dayType = '工'

    // 根据星期几确定日类型
    if (dayOfWeek === 0) dayType = '日'
    else if (dayOfWeek === 1) dayType = '一'
    else if (dayOfWeek === 6) dayType = '六'

    // 随机添加一些节假日和调休日
    if (Math.random() < 0.1) {
      dayType = Math.random() < 0.5 ? '节' : '调'
    }

    data.push({
      date: currentDate.format('YYYY-MM-DD'),
      dayType,
      value: 500 + Math.random() * 500 // 生成500-1000之间的随机值
    })

    currentDate = currentDate.add(1, 'day')
  }

  return data
}

// 方法定义
function handleDateRangeChange() {
  // 处理日期变更
  console.log('日期范围变更:', chartDateRange.value)
}

function applyFilters() {
  // 应用筛选条件
  console.log('应用筛选条件')
  loadData()
}

function resetFilters() {
  // 重置所有筛选条件到默认值
  chartDateRange.value = [dayjs().subtract(27, 'day').toDate(), dayjs().toDate()]
  chartPredictionModel.value = 'default'
  selectedTimeSegments.value = ['peak', 'high', 'normal', 'low']
  selectedUserLevels.value = ['large', 'medium', 'small', 'micro']
  selectedVoltageTypes.value = ['1-10kv', '20kv', '35-110kv', '220kv']
  selectedIndustries.value = ['hotel', 'manufacturing', 'retail', 'education', 'health']
  selectedRegions.value = ['shenzhen', 'guangzhou', 'dongguan', 'foshan']
  
  // 重新加载数据
  loadData()
}

function showAddUserGroupDialog() {
  userGroupDialogVisible.value = true
  userGroupForm.selectedCompanies = []
  companySearchKeyword.value = ''
  searchResults.value = []
}

function searchCompanies() {
  if (!companySearchKeyword.value || companySearchKeyword.value.length < 2) {
    searchResults.value = []
    return
  }
  
  // 模拟搜索延迟
    userSearchLoading.value = true
    setTimeout(() => {
    // 模拟API搜索结果
    searchResults.value = Array.from({ length: 5 }).map((_, index) => ({
        id: index + 1,
      name: `${companySearchKeyword.value}公司${index + 1}`
      }))
      userSearchLoading.value = false
  }, 300)
}

function addCompanyToSelectedList(company: { id: number, name: string }) {
  // 检查是否已经在选择列表中
  const existingIndex = userGroupForm.selectedCompanies.findIndex(c => c.id === company.id)
  if (existingIndex === -1) {
    userGroupForm.selectedCompanies.push({ ...company })
  }
}

function removeCompanyFromSelectedList(index: number) {
  userGroupForm.selectedCompanies.splice(index, 1)
}

function cancelAddUserGroup() {
  userGroupDialogVisible.value = false
}

function confirmAddUserGroup() {
  if (userGroupForm.selectedCompanies.length === 0) {
    ElMessage.warning('请至少选择一个公司')
    return
  }
  
  // 模拟API请求延迟
  userSearchLoading.value = true
  setTimeout(() => {
    // 这里应该向后端API发送请求创建用户组
    console.log('创建用户组:', {
      companies: userGroupForm.selectedCompanies
    })
    
    // 生成一个随机组名
    const groupName = `用户组${customUserGroups.value.length + 1}`
    
    // 添加到自定义用户组列表
    customUserGroups.value.push({
      id: Date.now(), // 使用时间戳作为临时ID
      name: groupName,
      companies: [...userGroupForm.selectedCompanies]
    })
    
    userSearchLoading.value = false
    userGroupDialogVisible.value = false
    
    // 提示创建成功
    ElMessage.success(`用户组创建成功`)
  }, 500)
}

// 自定义用户组列表
const customUserGroups = ref<Array<{
  id: number,
  name: string,
  companies: Array<{ id: number, name: string }>
}>>([])

// 加载数据函数
function loadData() {
  // 加载所有相关数据并初始化图表
  loadDualAxisData()
  loadScatterChartData()
  updateKPIData()
}

// 各类图表数据加载函数
function loadDualAxisData() {
  // 使用选择的日期范围
  const startDate = dayjs(chartDateRange.value[0])
  const endDate = dayjs(chartDateRange.value[1])
  const dates: string[] = []
  const predictedValues: number[] = []
  const actualValues: number[] = []
  const lastYearValues: number[] = []
  const dispatchValues: string[] = []

  // 显示加载状态
  if (dualAxisChart) {
    dualAxisChart.showLoading({
      text: '加载中...',
      maskColor: 'rgba(255, 255, 255, 0.8)'
    })
  }

  // 打印当前选择的维度信息
  console.log('加载图表数据，使用以下筛选条件：')
  console.log('日期范围:', dayjs(chartDateRange.value[0]).format('YYYY-MM-DD'), '至', dayjs(chartDateRange.value[1]).format('YYYY-MM-DD'))
  console.log('预测模型:', chartPredictionModel.value)
  
  // 模拟API请求延迟
  setTimeout(() => {
    // 生成日期序列
    let currentDate = startDate
    while (currentDate.isSameOrBefore(endDate)) {
      dates.push(currentDate.format('YYYY/M/D'))
      
      // 根据选择的预测模型生成不同的模拟数据
      let baseValue = 6000 + Math.random() * 2000
      let variationFactor = 1.0
      
      // 根据预测模型调整变化因子
      switch (chartPredictionModel.value) {
        case 'modelA':
          variationFactor = 1.1
          break
        case 'modelB':
          variationFactor = 0.9
          break
        case 'modelC':
          variationFactor = 1.05
          break
        default: // 默认模型
          variationFactor = 1.0
      }
      
      // 根据日期和维度过滤生成合适的数据值
      // 这里是模拟实现，实际应用中应该从后端API获取真实数据
      const dayOfWeek = currentDate.day()
      
      // 工作日和周末的数据有差异
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        baseValue *= 0.8 // 周末用电量降低
      }
      
      // 生成最终数据
      const finalBaseValue = baseValue * variationFactor
      predictedValues.push(Math.round(finalBaseValue))
      actualValues.push(Math.round(finalBaseValue * (1 + (Math.random() * 0.2 - 0.1)))) // ±10%偏差
      lastYearValues.push(Math.round(finalBaseValue * 0.9 * (1 + (Math.random() * 0.1 - 0.05)))) // 去年同期约90%
      dispatchValues.push((finalBaseValue / 4000).toFixed(2)) // TWh值
      
      currentDate = currentDate.add(1, 'day')
    }

    // 隐藏加载状态
    if (dualAxisChart) {
      dualAxisChart.hideLoading()
    }

    // 初始化双轴图表
    initDualAxisChart({
      dates,
      predictedValues,
      actualValues,
      lastYearValues,
      dispatchValues
    })
  }, 500) // 模拟500ms延迟
}

function updateKPIData() {
  // 模拟更新KPI数据
  kpiData.averageDeviationRate = (Math.random() * 10).toFixed(2)
  kpiData.yearOnYearRate = ((Math.random() * 20) - 10).toFixed(2) // 同比增长率，范围在-10%到+10%之间
  kpiData.deviationStd = (Math.random() * 5).toFixed(2)
  kpiData.thresholdExceedCount = Math.floor(Math.random() * 10)
}

// 图表初始化函数
function initDualAxisChart(data: any) {
  if (dualAxisChartRef.value) {
    if (!dualAxisChart) {
      dualAxisChart = echarts.init(dualAxisChartRef.value)
    }
    
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: function(params: any) {
          let result = params[0].axisValueLabel + '<br/>'
          params.forEach((param: any) => {
            const marker = `<span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${param.color};"></span>`
            const value = param.seriesName === '统调' ? 
              param.value + ' TWh' : 
              param.value + ' MWh'
            result += marker + param.seriesName + ': ' + value + '<br/>'
          })
          return result
        }
      },
      legend: {
        data: ['预测量', '实际量', '用户去年同期（补全）', '统调'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.dates,
        axisLine: {
          lineStyle: {
            color: '#ccc'
          }
        },
        axisLabel: {
          color: '#606266',
          fontSize: 12,
          interval: 'auto'
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'MWh',
          position: 'left',
          axisLine: {
            show: true,
            lineStyle: {
              color: '#1f78b4'
            }
          },
          axisLabel: {
            color: '#606266',
            fontSize: 12
          },
          splitLine: {
            lineStyle: {
              type: 'dashed',
              color: '#eee'
            }
          }
        },
        {
          type: 'value',
          name: 'TWh',
          position: 'right',
          axisLine: {
            show: true,
            lineStyle: {
              color: '#ffbb33'
            }
          },
          axisLabel: {
            color: '#606266',
            fontSize: 12
          },
          splitLine: {
            show: false
          }
        }
      ],
      series: [
        {
          name: '预测量',
          type: 'line',
          yAxisIndex: 0,
          data: data.predictedValues,
          smooth: true,
          symbol: 'none',
          itemStyle: {
            color: '#1f78b4'
          },
          lineStyle: {
            width: 2
          }
        },
        {
          name: '实际量',
          type: 'line',
          yAxisIndex: 0,
          data: data.actualValues,
          smooth: true,
          symbol: 'none',
          itemStyle: {
            color: '#ff7f0e'
          },
          lineStyle: {
            width: 2
          }
        },
        {
          name: '用户去年同期（补全）',
          type: 'line',
          yAxisIndex: 0,
          data: data.lastYearValues,
          smooth: true,
          symbol: 'none',
          itemStyle: {
            color: '#808080'
          },
          lineStyle: {
            width: 2
          }
        },
        {
          name: '统调',
          type: 'line',
          yAxisIndex: 1,
          data: data.dispatchValues,
          smooth: true,
          symbol: 'none',
          itemStyle: {
            color: '#ffbb33'
          },
          lineStyle: {
            width: 2
          }
        }
      ]
    }
    
    dualAxisChart.setOption(option)
  }
}

// 加载散点图数据
function loadScatterChartData(): void {
  // 为左右两个图表生成独立的数据
  const consumptionData = generateScatterData(consumptionWeatherVariable.value, consumptionGroupingMethod.value);
  const deviationData = generateScatterData(deviationWeatherVariable.value, deviationGroupingMethod.value);
  
  // 初始化两个散点图
  initConsumptionScatterChart(consumptionData);
  initDeviationScatterChart(deviationData);
}

// 生成散点图模拟数据
function generateScatterData(weatherVarType: string, groupMethodType: string): ScatterDataItem[] {
  const startDate = dayjs(chartDateRange.value[0])
  const endDate = dayjs(chartDateRange.value[1])
  const differenceInDays = endDate.diff(startDate, 'day') + 1
  
  // 根据分组方式确定数据点的类别和颜色
  let categories: CategoryItem[] = []
  if (groupMethodType === 'industry') {
    categories = industries
  } else if (groupMethodType === 'region') {
    categories = regions
  } else {
    // 不分组时只有一个类别 - 按日总览模式
    categories = [{ value: 'default', label: '总览', color: '#5470c6' }]
    // 在按日总览模式下，只生成默认类别的数据点
    const data = generateDefaultCategoryData(startDate, differenceInDays, weatherVarType)
    return data
  }
  
  // 生成散点数据
  const data: ScatterDataItem[] = []
  
  // 确定要生成的数据点数量
  // 按日总览模式下，只生成一个类别的数据点，数量为天数的10倍
  // 分组模式下，为每个类别生成与天数相同的数据点
  const pointsPerDay = groupMethodType ? 1 : 10
  const totalPoints = differenceInDays * (groupMethodType ? categories.length : pointsPerDay)
  
  for (let i = 0; i < totalPoints; i++) {
    // 为每个数据点选择一个类别
    // 在按日总览模式下，所有点都使用默认类别
    // 在分组模式下，按顺序为每个类别生成点
    const categoryIndex = groupMethodType ? (i % categories.length) : 0
    const category = categories[categoryIndex]
    
    // 随机生成用户电量数据（3000-9000 MWh）
    const consumption = 3000 + Math.random() * 6000
    
    // 随机生成偏差率（-10% 到 +10%）
    const deviation = (Math.random() * 0.2) - 0.1
    
    // 根据选择的气象变量生成对应的值
    let weatherValue = 0
    switch (weatherVarType) {
      case 'temperature':
        weatherValue = 15 + Math.random() * 20 // 15-35°C
        break
      case 'cloudCover':
        weatherValue = Math.random() * 100 // 0-100%
        break
      case 'windSpeed':
        weatherValue = Math.random() * 15 // 0-15 m/s
        break
      case 'precipitation':
        weatherValue = Math.random() * 50 // 0-50 mm
        break
      case 'radiation':
        weatherValue = 200 + Math.random() * 800 // 200-1000 W/m²
        break
      default:
        weatherValue = 15 + Math.random() * 20 // 默认为气温
    }
    
    // 生成当前日期
    const currentDate = startDate.add(i % differenceInDays, 'day').format('YYYY-MM-DD')
    
    // 日类型（工作日/周末/节假日）
    const dayTypes = ['工作日', '周末', '节假日']
    const dayType = dayTypes[Math.floor(Math.random() * dayTypes.length)]
    
    // 添加数据点
    data.push({
      category: category.value,
      categoryLabel: category.label,
      color: category.color,
      consumption: consumption.toFixed(2), // 用户电量
      deviation: (deviation * 100).toFixed(2), // 偏差率，转为百分比
      weatherValue: weatherValue.toFixed(2), // 气象值
      weatherType: weatherVarType, // 保存使用的气象变量类型
      date: currentDate,
      dayType: dayType
    })
  }
  
  return data
}

// 生成默认类别的数据点
function generateDefaultCategoryData(startDate: any, differenceInDays: number, weatherVarType: string): ScatterDataItem[] {
  const data: ScatterDataItem[] = []
  const pointsPerDay = 10 // 每天生成10个数据点
  const totalPoints = differenceInDays * pointsPerDay

  for (let i = 0; i < totalPoints; i++) {
    const consumption = 3000 + Math.random() * 6000
    const deviation = (Math.random() * 0.2) - 0.1
    let weatherValue = 0

    switch (weatherVarType) {
      case 'temperature':
        weatherValue = 15 + Math.random() * 20
        break
      case 'cloudCover':
        weatherValue = Math.random() * 100
        break
      case 'windSpeed':
        weatherValue = Math.random() * 15
        break
      case 'precipitation':
        weatherValue = Math.random() * 50
        break
      case 'radiation':
        weatherValue = 200 + Math.random() * 800
        break
      default:
        weatherValue = 15 + Math.random() * 20
    }

    const currentDate = startDate.add(i % differenceInDays, 'day').format('YYYY-MM-DD')
    const dayTypes = ['工作日', '周末', '节假日']
    const dayType = dayTypes[Math.floor(Math.random() * dayTypes.length)]

    data.push({
      category: 'default',
      categoryLabel: '总览',
      color: '#5470c6',
      consumption: consumption.toFixed(2),
      deviation: (deviation * 100).toFixed(2),
      weatherValue: weatherValue.toFixed(2),
      weatherType: weatherVarType,
      date: currentDate,
      dayType: dayType
    })
  }

  return data
}

// 初始化用户电量散点图 (左侧)
function initConsumptionScatterChart(data: ScatterDataItem[]): void {
  if (consumptionScatterRef.value) {
    if (!consumptionScatterChart) {
      consumptionScatterChart = echarts.init(consumptionScatterRef.value)
    }
    
    // 获取Y轴的变量名和单位
    const weatherConfig = getWeatherVariableConfig(consumptionWeatherVariable.value)
    
    // 准备散点图数据
    const seriesData: Array<{
      name: string;
      type: string;
      data: Array<[string, string]>;
      itemStyle: {
        color: string;
      };
    }> = []
    
    // 根据分组方式组织数据
    if (consumptionGroupingMethod.value) {
      // 按类别分组的数据
      const categories = consumptionGroupingMethod.value === 'industry' ? industries : regions
      
      categories.forEach(category => {
        // 只筛选当前类别的数据点
        const categoryData = data.filter(item => item.category === category.value)
        
        if (categoryData.length > 0) {
          seriesData.push({
            name: category.label,
            type: 'scatter',
            data: categoryData.map(item => [
              item.consumption, // X轴：用户电量
              item.weatherValue // Y轴：气象变量值
            ]),
            itemStyle: {
              color: category.color
            }
          })
        }
      })
    } else {
      // 按日总览模式：使用所有数据点，因为generateScatterData已经只返回默认类别的数据
      seriesData.push({
        name: '总览',
        type: 'scatter',
        data: data.map(item => [
          item.consumption, // X轴：用户电量
          item.weatherValue // Y轴：气象变量值
        ]),
        itemStyle: {
          color: '#5470c6' // 使用统一的颜色
        }
      })
    }
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: function(params: any) {
          // 根据当前分组模式获取对应的数据项
          let item: ScatterDataItem | undefined;
          if (consumptionGroupingMethod.value) {
            // 分组模式下，从对应分组的数据中获取
            const seriesIndex = params.seriesIndex;
            const dataIndex = params.dataIndex;
            if (seriesIndex !== undefined && seriesIndex < seriesData.length) {
              const seriesName = seriesData[seriesIndex].name;
              const filteredData = data.filter(d => 
                d.categoryLabel === seriesName || 
                d.category === seriesName.toLowerCase()
              );
              if (dataIndex !== undefined && dataIndex < filteredData.length) {
                item = filteredData[dataIndex];
              }
            }
          } else {
            // 按日总览模式下，从默认类别数据中获取
            const dataIndex = params.dataIndex;
            const defaultData = data.filter(d => d.category === 'default');
            if (dataIndex !== undefined && dataIndex < defaultData.length) {
              item = defaultData[dataIndex];
            }
          }
          
          if (!item) return '';
          
          return `
            ${consumptionGroupingMethod.value ? `${consumptionGroupingMethod.value === 'industry' ? '行业' : '地区'}: ${item.categoryLabel}<br/>` : ''}
            用户电量: ${item.consumption} MWh<br/>
            ${weatherConfig.label}: ${item.weatherValue} ${weatherConfig.unit}<br/>
            日期: ${item.date}<br/>
            日类型: ${item.dayType}
          `
        }
      },
      legend: {
        show: consumptionGroupingMethod.value !== '',
        bottom: 10,
        data: seriesData.map(series => series.name)
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: consumptionGroupingMethod.value ? '15%' : '10%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: '用户电量 (MWh)',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: {
          fontWeight: 'bold',
          fontSize: 12,
          color: '#606266'
        }
      },
      yAxis: {
        type: 'value',
        name: `${weatherConfig.label} (${weatherConfig.unit})`,
        nameLocation: 'middle',
        nameGap: 40,
        nameTextStyle: {
          fontWeight: 'bold',
          fontSize: 12,
          color: '#606266'
        }
      },
      series: seriesData
    }
    
    // 完全重置图表选项，确保颜色正确应用
    consumptionScatterChart.setOption(option, true)
  }
}

// 初始化偏差率散点图 (右侧)
function initDeviationScatterChart(data: ScatterDataItem[]): void {
  if (deviationScatterRef.value) {
    if (!deviationScatterChart) {
      deviationScatterChart = echarts.init(deviationScatterRef.value)
    }
    
    // 获取Y轴的变量名和单位
    const weatherConfig = getWeatherVariableConfig(deviationWeatherVariable.value)
    
    // 准备散点图数据
    const seriesData: Array<{
      name: string;
      type: string;
      data: Array<[string, string]>;
      itemStyle: {
        color: string;
      };
    }> = []
    
    // 根据分组方式组织数据
    if (deviationGroupingMethod.value) {
      // 按类别分组的数据
      const categories = deviationGroupingMethod.value === 'industry' ? industries : regions
      
      categories.forEach(category => {
        // 只筛选当前类别的数据点
        const categoryData = data.filter(item => item.category === category.value)
        
        if (categoryData.length > 0) {
          seriesData.push({
            name: category.label,
            type: 'scatter',
            data: categoryData.map(item => [
              item.deviation, // X轴：偏差率
              item.weatherValue // Y轴：气象变量值
            ]),
            itemStyle: {
              color: category.color
            }
          })
        }
      })
    } else {
      // 按日总览模式：使用所有数据点，因为generateScatterData已经只返回默认类别的数据
      seriesData.push({
        name: '总览',
        type: 'scatter',
        data: data.map(item => [
          item.deviation, // X轴：偏差率
          item.weatherValue // Y轴：气象变量值
        ]),
        itemStyle: {
          color: '#5470c6' // 使用统一的颜色
        }
      })
    }
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: function(params: any) {
          // 根据当前分组模式获取对应的数据项
          let item: ScatterDataItem | undefined;
          if (deviationGroupingMethod.value) {
            // 分组模式下，从对应分组的数据中获取
            const seriesIndex = params.seriesIndex;
            const dataIndex = params.dataIndex;
            if (seriesIndex !== undefined && seriesIndex < seriesData.length) {
              const seriesName = seriesData[seriesIndex].name;
              const filteredData = data.filter(d => 
                d.categoryLabel === seriesName || 
                d.category === seriesName.toLowerCase()
              );
              if (dataIndex !== undefined && dataIndex < filteredData.length) {
                item = filteredData[dataIndex];
              }
            }
          } else {
            // 按日总览模式下，从默认类别数据中获取
            const dataIndex = params.dataIndex;
            const defaultData = data.filter(d => d.category === 'default');
            if (dataIndex !== undefined && dataIndex < defaultData.length) {
              item = defaultData[dataIndex];
            }
          }
          
          if (!item) return '';
          
          return `
            ${deviationGroupingMethod.value ? `${deviationGroupingMethod.value === 'industry' ? '行业' : '地区'}: ${item.categoryLabel}<br/>` : ''}
            偏差率: ${item.deviation} %<br/>
            ${weatherConfig.label}: ${item.weatherValue} ${weatherConfig.unit}<br/>
            日期: ${item.date}<br/>
            日类型: ${item.dayType}
          `
        }
      },
      legend: {
        show: deviationGroupingMethod.value !== '',
        bottom: 10,
        data: seriesData.map(series => series.name)
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: deviationGroupingMethod.value ? '15%' : '10%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: '偏差率 (%)',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: {
          fontWeight: 'bold',
          fontSize: 12,
          color: '#606266'
        }
      },
      yAxis: {
        type: 'value',
        name: `${weatherConfig.label} (${weatherConfig.unit})`,
        nameLocation: 'middle',
        nameGap: 40,
        nameTextStyle: {
          fontWeight: 'bold',
          fontSize: 12,
          color: '#606266'
        }
      },
      series: seriesData
    }
    
    // 完全重置图表选项，确保颜色正确应用
    deviationScatterChart.setOption(option, true)
  }
}

// 获取气象变量的名称和单位
function getWeatherVariableConfig(weatherVarType: string): WeatherConfig {
  switch (weatherVarType) {
    case 'temperature':
      return { label: '气温', unit: '°C' }
    case 'cloudCover':
      return { label: '云量', unit: '%' }
    case 'windSpeed':
      return { label: '风速', unit: 'm/s' }
    case 'precipitation':
      return { label: '降水量', unit: 'mm' }
    case 'radiation':
      return { label: '辐照', unit: 'W/m²' }
    default:
      return { label: '气温', unit: '°C' }
  }
}

// 监听窗口大小变化，调整图表大小
function handleResize() {
  dualAxisChart?.resize()
  consumptionScatterChart?.resize()
  deviationScatterChart?.resize()
}

// 监听各自的气象变量和分组方式变化
watch([consumptionWeatherVariable], () => {
  // 仅重新加载左侧散点图数据
  const consumptionData = generateScatterData(consumptionWeatherVariable.value, consumptionGroupingMethod.value);
  initConsumptionScatterChart(consumptionData);
})

watch([consumptionGroupingMethod], () => {
  // 仅重新加载左侧散点图数据
  const consumptionData = generateScatterData(consumptionWeatherVariable.value, consumptionGroupingMethod.value);
  initConsumptionScatterChart(consumptionData);
})

watch([deviationWeatherVariable], () => {
  // 仅重新加载右侧散点图数据
  const deviationData = generateScatterData(deviationWeatherVariable.value, deviationGroupingMethod.value);
  initDeviationScatterChart(deviationData);
})

watch([deviationGroupingMethod], () => {
  // 仅重新加载右侧散点图数据
  const deviationData = generateScatterData(deviationWeatherVariable.value, deviationGroupingMethod.value);
  initDeviationScatterChart(deviationData);
})

// 监听时间粒度变化
watch(timeGranularity, () => {
  loadDualAxisData()
})

// 监听是否显示绝对值变化
watch(showAbsoluteDeviation, () => {
  loadDualAxisData()
})

// 监听偏差阈值变化
watch(deviationThreshold, () => {
  loadDualAxisData()
})

// 监听维度选择变化（特别是特殊事件维度）
watch([timeSegmentAll, selectedTimeSegments], () => {
  loadDualAxisData()
})

// 生命周期钩子
onMounted(() => {
  // 初始化加载数据
  loadData()
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize)
})

// 在组件卸载前，移除事件监听并销毁图表实例
const onUnmounted = () => {
  window.removeEventListener('resize', handleResize)
  dualAxisChart?.dispose()
  consumptionScatterChart?.dispose()
  deviationScatterChart?.dispose()
}

// KPI状态类判断函数
function getKpiStatusClass(value: number, warningThreshold: number, dangerThreshold: number): string {
  // 对于同比增长率，正增长为好，负增长为差
  if (dangerThreshold < warningThreshold) {
    // 针对同比增长率这类值越小越差的指标
    if (value > warningThreshold) {
      return 'kpi-status-good'
    } else if (value > dangerThreshold) {
      return 'kpi-status-warning'
    } else {
      return 'kpi-status-danger'
    }
  } else {
    // 针对偏差率这类值越大越差的指标
  if (value <= warningThreshold) {
    return 'kpi-status-good'
  } else if (value <= dangerThreshold) {
    return 'kpi-status-warning'
  } else {
    return 'kpi-status-danger'
    }
  }
}

// 增减阈值的函数
function decreaseThreshold() {
  if (deviationThreshold.value > 1) {
    deviationThreshold.value -= 1;
    loadDualAxisData();
  }
}

function increaseThreshold() {
  if (deviationThreshold.value < 50) {
    deviationThreshold.value += 1;
    loadDualAxisData();
  }
}

// 折线图日期范围变更
function handleChartDateRangeChange() {
  console.log('图表日期范围变更:', chartDateRange.value)
  loadDualAxisData() // 重新加载图表数据
}

// 预测模型变更
function handleModelChange() {
  console.log('预测模型变更:', chartPredictionModel.value)
  loadDualAxisData() // 重新加载图表数据
}

// 维度选择器方法
// 时段全选/取消全选
function handleTimeSegmentAllChange(val: boolean) {
  if (val) {
    selectedTimeSegments.value = ['peak', 'high', 'normal', 'low']
  } else {
    selectedTimeSegments.value = []
  }
}

// 时段选择变化
function handleTimeSegmentsChange(val: string[]) {
  timeSegmentAll.value = val.length === 4
}

// 用户维度全选/取消全选
function handleUserDimensionAllChange(val: boolean) {
  userLevelAll.value = val
  voltageTypeAll.value = val
  industryAll.value = val
  regionAll.value = val
  
  if (val) {
    selectedUserLevels.value = ['large', 'medium', 'small', 'micro']
    selectedVoltageTypes.value = ['1-10kv', '20kv', '35-110kv', '220kv']
    selectedIndustries.value = ['hotel', 'manufacturing', 'retail', 'education', 'health']
    selectedRegions.value = ['shenzhen', 'guangzhou', 'dongguan', 'foshan']
  } else {
    selectedUserLevels.value = []
    selectedVoltageTypes.value = []
    selectedIndustries.value = []
    selectedRegions.value = []
  }
}

// 用户分级全选/取消全选
function handleUserLevelAllChange(val: boolean) {
  if (val) {
    selectedUserLevels.value = ['large', 'medium', 'small', 'micro']
  } else {
    selectedUserLevels.value = []
  }
  updateUserDimensionAllStatus()
}

// 用户分级选择变化
function handleUserLevelsChange(val: string[]) {
  userLevelAll.value = val.length === 4
  updateUserDimensionAllStatus()
}

// 电压类型全选/取消全选
function handleVoltageTypeAllChange(val: boolean) {
  if (val) {
    selectedVoltageTypes.value = ['1-10kv', '20kv', '35-110kv', '220kv']
  } else {
    selectedVoltageTypes.value = []
  }
  updateUserDimensionAllStatus()
}

// 电压类型选择变化
function handleVoltageTypesChange(val: string[]) {
  voltageTypeAll.value = val.length === 4
  updateUserDimensionAllStatus()
}

// 行业全选/取消全选
function handleIndustryAllChange(val: boolean) {
  if (val) {
    selectedIndustries.value = ['hotel', 'manufacturing', 'retail', 'education', 'health']
  } else {
    selectedIndustries.value = []
  }
  updateUserDimensionAllStatus()
}

// 行业选择变化
function handleIndustriesChange(val: string[]) {
  industryAll.value = val.length === 5
  updateUserDimensionAllStatus()
}

// 地区全选/取消全选
function handleRegionAllChange(val: boolean) {
  if (val) {
    selectedRegions.value = ['shenzhen', 'guangzhou', 'dongguan', 'foshan']
  } else {
    selectedRegions.value = []
  }
  updateUserDimensionAllStatus()
}

// 地区选择变化
function handleRegionsChange(val: string[]) {
  regionAll.value = val.length === 4
  updateUserDimensionAllStatus()
}

// 更新用户维度全选状态
function updateUserDimensionAllStatus() {
  const hasCustomGroups = customUserGroups.value.length > 0
  
  userDimensionAll.value = 
    userLevelAll.value && 
    voltageTypeAll.value && 
    industryAll.value && 
    regionAll.value &&
    (!hasCustomGroups || customUserGroupsAll.value)
}

// 应用维度过滤器
function applyDimensionFilters() {
  showDimensionSelector.value = false
  loadDualAxisData() // 重新加载图表数据
}

function remoteSearchUsers(query: string) {
  // 保留原有的远程搜索用户功能，但现在改为搜索公司
  searchCompanies()
}

// 自定义用户组
const customUserGroupsAll = ref(false)
const selectedCustomUserGroups = ref<string[]>([])

// 自定义用户组全选/取消全选
function handleCustomUserGroupsAllChange(val: boolean) {
  if (val) {
    selectedCustomUserGroups.value = customUserGroups.value.map(group => group.id.toString())
  } else {
    selectedCustomUserGroups.value = []
  }
  updateUserDimensionAllStatus()
}

// 自定义用户组选择变化
function handleCustomUserGroupsChange(val: string[]) {
  customUserGroupsAll.value = val.length === customUserGroups.value.length && customUserGroups.value.length > 0
  updateUserDimensionAllStatus()
}
</script>

<style scoped>
.consumption-deviation-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.global-filter-section {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.filter-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-left {
  display: flex;
  align-items: center;
  flex-wrap: nowrap; /* 确保元素水平排列 */
  gap: 16px;
}

.filter-right {
  display: flex;
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
}

.filter-label {
  margin-right: 8px;
  font-weight: 500;
  color: #606266;
}

.filter-row {
  display: flex;
  margin-top: 16px;
  gap: 24px;
}

.advanced-filters {
  padding: 16px 0;
  border-top: 1px dashed #dcdfe6;
  margin-top: 12px;
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

.user-dimensions .dimension-title {
  color: #67c23a;
}

.weather-dimensions .dimension-title {
  color: #e6a23c;
}

.other-dimensions .dimension-title {
  color: #f56c6c;
}

.comparison-selector {
  flex: 1;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #ffffff;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.analysis-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: calc(100vh - 50px); /* 调整高度，移除了顶部筛选器的高度 */
}

.main-analysis-section {
  flex: 2; /* 占据2/3宽度 */
  padding: 16px;
  overflow-y: auto;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  background-color: #fafafa;
  max-height: none; /* 移除最大高度限制 */
  height: 100%; /* 设置为100%以匹配右侧区域高度 */
  min-height: 718px; /* 确保最小高度 */
}

.auxiliary-analysis-section {
  flex: 1; /* 占据1/3宽度 */
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background-color: #fafafa;
  height: 100%; /* 确保右侧也设置了高度 */
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 16px 0;
  color: #303133;
  position: relative;
  padding-left: 12px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 3px;
  bottom: 3px;
  width: 4px;
  background-color: #409eff;
  border-radius: 2px;
}

.kpi-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.kpi-card {
  padding: 16px;
  border-radius: 4px;
  background-color: #ffffff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-top: 4px solid #e4e7ed;
}

.kpi-status-good {
  border-top-color: #67c23a;
}

.kpi-status-good .kpi-value {
  color: #67c23a;
}

.kpi-status-warning {
  border-top-color: #e6a23c;
}

.kpi-status-warning .kpi-value {
  color: #e6a23c;
}

.kpi-status-danger {
  border-top-color: #f56c6c;
}

.kpi-status-danger .kpi-value {
  color: #f56c6c;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.2);
}

.kpi-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.kpi-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.kpi-sub-info {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.status-text {
  font-weight: 600;
}

.related-charts {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 24px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chart-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.chart-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.dimension-drill-down,
.drill-down-path,
.dimension-filters,
.dimension-filter-group,
.dimension-filter-title,
.dimension-filter-options {
  display: none; /* 保留样式定义但设为不显示，以防其他部分引用 */
}

.time-series-chart-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 16px;
  height: calc(100% - 40px); /* 调整内部高度占比 */
}

.time-series-chart-container .chart-container {
  flex: 1;
  width: 100%;
  height: calc(100% - 80px); /* 确保图表高度适应容器 */
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #606266;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 4px;
}

.legend-line {
  width: 20px;
  height: 2px;
  margin-right: 4px;
}

.legend-label {
  font-size: 12px;
}

.main-analysis-section {
  flex: 2; /* 占据2/3宽度 */
  padding: 16px;
  overflow-y: auto;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  background-color: #fafafa;
}

.custom-user-group {
  margin-top: 8px;
}

.prediction-model-selector {
  display: flex;
  align-items: center;
}

.threshold-button {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
  color: #000000;
}

.threshold-value {
  min-width: 40px;
  text-align: center;
  font-weight: 500;
  color: #000000;
  font-size: 14px;
}

.dual-axis-chart-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 16px;
  height: 100%; /* 调整为100%以利用主分析区的全部高度 */
  min-height: 400px; /* 确保最小高度 */
}

.dual-axis-chart-container .chart-container {
  flex: 1;
  width: 100%;
  height: calc(100% - 80px);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

@media (max-width: 1400px) {
  .kpi-cards {
    grid-template-columns: 1fr;
  }
}

/* 新增散点图相关样式 */
.dual-scatter-container {
  display: flex;
  flex-direction: column;
  margin-top: 20px;
  margin-bottom: 20px;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 16px;
}

.scatter-controls {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-label {
  font-weight: 500;
  color: #606266;
  white-space: nowrap;
}

.scatter-charts-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  flex: 1;
}

.scatter-chart-box {
  flex: 1;
  min-width: 300px; 
  height: 470px; /* 增加高度以适应新增的控件和标题 */
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 16px;
  overflow: hidden;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
}

.scatter-chart-box .chart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 12px;
}

.scatter-chart-box .chart-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #303133;
  text-align: center;
}

.scatter-chart-box .chart-container {
  flex: 1;
  width: 100%;
  min-height: 350px;
}

@media (max-width: 1200px) {
  .scatter-charts-wrapper {
    flex-direction: column;
  }
  
  .scatter-chart-box {
    width: 100%;
  }
}

/* 气象关联分析独立容器样式 */
.weather-correlation-section {
  margin: 16px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.weather-correlation-section .section-title {
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 16px 0;
  color: #303133;
  position: relative;
  padding-left: 12px;
}

.weather-correlation-section .section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 3px;
  bottom: 3px;
  width: 4px;
  background-color: #409eff;
  border-radius: 2px;
}

.trend-up {
  color: #f56c6c; /* 上升趋势用红色，因为电力消耗增加通常是需要关注的 */
  display: flex;
  align-items: center;
}

.trend-down {
  color: #67c23a; /* 下降趋势用绿色，因为电力消耗减少通常是良好的 */
  display: flex;
  align-items: center;
}

/* 折线图控件样式 */
.chart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px 4px 0 0;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 8px;
}

.control-item {
  display: flex;
  align-items: center;
  margin-right: 16px;
}

.control-label {
  font-weight: 500;
  margin-right: 8px;
  color: #303133;
}

/* 维度选择器对话框样式 */
.dimension-selector-dialog {
  max-height: 70vh;
  overflow-y: auto;
}

.dimension-groups {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dimension-group {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  background-color: #f5f7fa;
}

.dimension-group-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #303133;
}

.dimension-subgroup {
  margin-left: 20px;
  padding: 10px;
  margin-bottom: 10px;
  border-left: 2px solid #e4e7ed;
}

.dimension-subgroup-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #606266;
}

.dimension-options {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 8px;
}

.add-user-group-btn {
  margin-top: 16px;
  display: flex;
  justify-content: flex-start;
}

/* 确保选项文字不会被截断 */
:deep(.el-checkbox) {
  margin-right: 20px;
  height: 28px;
}

:deep(.el-checkbox__label) {
  font-size: 14px;
}

/* 新增用户组对话框样式 */
.user-group-form {
  max-height: 60vh;
  overflow-y: auto;
}

/* 搜索公司输入框样式优化 */
.company-search-input {
  width: 100%;
}

.user-group-form :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset !important;
  border-radius: 4px;
  padding: 0 10px;
  transition: box-shadow 0.2s;
}

.user-group-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset !important;
}

.user-group-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset !important;
}

.user-group-form :deep(.el-input__inner) {
  color: #303133;
  font-size: 14px;
  height: 36px;
  line-height: 36px;
}

.user-group-form :deep(.el-input__placeholder) {
  color: #a8abb2;
}

.search-results-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 8px;
}

.search-result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background-color: #f5f7fa;
}

.selected-companies-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 8px;
}

.selected-company-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.selected-company-item:last-child {
  border-bottom: none;
}

.empty-tip {
  color: #909399;
  padding: 20px;
  text-align: center;
  font-size: 14px;
}

/* 搜索公司输入框样式优化 */
.company-search-input {
  width: 100%;
}
</style>
