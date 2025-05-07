<template>
  <div class="monthly-profit-container">
    <!-- 顶部：日期范围选择器 -->
    <div class="filter-section">
      <h3 class="section-title">月度成本构成与利润分析</h3>
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

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 数据展示区域 -->
    <div v-else-if="!noData" class="profit-content">
      <!-- 月度汇总表格 -->
      <div class="profit-table-section">
        <el-table
          :data="monthlyProfitData"
          style="width: 100%"
          border
          stripe
          :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
          max-height="600"
        >
          <!-- 月份列 -->
          <el-table-column prop="month" label="月份" fixed="left" width="100" />
          
          <!-- 收益相关列 -->
          <el-table-column prop="predictedProfit" label="按预测收益(元)" :formatter="formatNumber" width="120" />
          <el-table-column prop="gameProfit" label="博弈收益(元)" :formatter="formatNumber" width="120" />
          <el-table-column prop="recoveryProfit" label="回收收益(元)" :formatter="formatNumber" width="120" />
          <el-table-column prop="spotOperationProfit" label="现货操作总收益(元)" :formatter="formatNumber" width="150" />
          
          <!-- 套利相关列 -->
          <el-table-column prop="arbitrageLimit" label="套利上限(元)" :formatter="formatNumber" width="120" />
          <el-table-column prop="arbitrageRatio" label="套利比例" width="120">
            <template #default="scope">
              <div class="arbitrage-ratio-wrapper">
                <el-progress 
                  :percentage="scope.row.arbitrageRatio * 100" 
                  :color="getArbitrageRatioColor(scope.row.arbitrageRatio)"
                  :format="(percentage) => percentage.toFixed(1) + '%'"
                  :stroke-width="8"
                />
              </div>
            </template>
          </el-table-column>
          
          <!-- 预计分摊相关列 -->
          <el-table-column prop="expectedProfitBeforeDistribution" label="预计分摊前(万元)" width="130">
            <template #default="scope">
              <span :class="getProfitClass(scope.row.expectedProfitBeforeDistribution)">
                {{ formatNumber(null, null, scope.row.expectedProfitBeforeDistribution) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="expectedDistributionPerKwh" label="预计度电分摊(厘)" width="130">
            <template #default="scope">
              <span>{{ formatNumberWithPrecision(scope.row.expectedDistributionPerKwh, 3) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="expectedProfitAfterDistribution" label="预计分摊后(万元)" width="130">
            <template #default="scope">
              <span :class="getProfitClass(scope.row.expectedProfitAfterDistribution)">
                {{ formatNumber(null, null, scope.row.expectedProfitAfterDistribution) }}
              </span>
            </template>
          </el-table-column>
          
          <!-- 实际分摊相关列 -->
          <el-table-column prop="actualProfitBeforeDistribution" label="实际分摊前(万元)" width="130">
            <template #default="scope">
              <span :class="getProfitClass(scope.row.actualProfitBeforeDistribution)">
                {{ formatNumber(null, null, scope.row.actualProfitBeforeDistribution) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="actualDistributionPerKwh" label="实际度电分摊(厘)" width="130">
            <template #default="scope">
              <span>{{ formatNumberWithPrecision(scope.row.actualDistributionPerKwh, 3) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="actualProfitAfterDistribution" label="实际分摊后(万元)" width="130">
            <template #default="scope">
              <span :class="getProfitClass(scope.row.actualProfitAfterDistribution)">
                {{ formatNumber(null, null, scope.row.actualProfitAfterDistribution) }}
              </span>
            </template>
          </el-table-column>
          
          <!-- 考核、其他费用列 -->
          <el-table-column prop="assessment" label="考核(万元)" width="110">
            <template #default="scope">
              <span :class="getProfitClass(-scope.row.assessment)">
                {{ formatNumber(null, null, scope.row.assessment) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="others" label="其他(万元)" width="110">
            <template #default="scope">
              <span :class="getProfitClass(-scope.row.others)">
                {{ formatNumber(null, null, scope.row.others) }}
              </span>
            </template>
          </el-table-column>
          
          <!-- 收入相关列 -->
          <el-table-column prop="actualRevenue" label="实际营收(万元)" width="130">
            <template #default="scope">
              <span :class="getProfitClass(scope.row.actualRevenue)">
                {{ formatNumber(null, null, scope.row.actualRevenue) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="revenuePerKwh" label="度电收入(元/千瓦时)" width="150">
            <template #default="scope">
              <span>{{ formatNumberWithPrecision(scope.row.revenuePerKwh, 4) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="marketRevenuePerKwh" label="市场度电收入(元/千瓦时)" width="170">
            <template #default="scope">
              <span>{{ formatNumberWithPrecision(scope.row.marketRevenuePerKwh, 4) }}</span>
            </template>
          </el-table-column>
          
          <!-- 中间费用列 -->
          <el-table-column prop="sellingBrokerage" label="售电居间(万元)" width="130" :formatter="formatNumber" />
          <el-table-column prop="buyingBrokerage" label="购电居间(万元)" width="130" :formatter="formatNumber" />
          <el-table-column prop="commission" label="手续费(万元)" width="120" :formatter="formatNumber" />
          <el-table-column prop="guaranteeCost" label="保函成本(万元)" width="130" :formatter="formatNumber" />
          
          <!-- 最终利润列 -->
          <el-table-column prop="finalProfit" label="利润(万元)" fixed="right" width="120">
            <template #default="scope">
              <span :class="getProfitClass(scope.row.finalProfit)">
                {{ formatNumber(null, null, scope.row.finalProfit) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="profitPerKwh" label="度电利润(元/千瓦时)" fixed="right" width="160">
            <template #default="scope">
              <span :class="getProfitClass(scope.row.profitPerKwh)">
                {{ formatNumberWithPrecision(scope.row.profitPerKwh, 4) }}
              </span>
            </template>
          </el-table-column>
          
          <!-- 将在后续步骤添加更多列 -->
          
        </el-table>

        <!-- 导出按钮 -->
        <div class="table-actions">
          <el-button type="primary" size="small" :loading="exporting" @click="exportTable">
            <el-icon><Download /></el-icon> 导出表格
          </el-button>
        </div>
      </div>
    </div>

    <!-- 空数据状态 -->
    <el-empty v-if="!loading && noData" description="暂无数据" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Download } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'

// 状态变量
const loading = ref(true)
const noData = ref(false)
const exporting = ref(false)

// 日期范围选择相关
const dateRangeType = ref('lastMonth') // 默认为上个月
const startMonth = ref('')
const endMonth = ref('')
const today = new Date()

// 月度利润数据
const monthlyProfitData = ref([])

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
  
  // 默认返回上个月
  return `${lastMonthYear}年${lastMonth}月`
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
  dateRangeType.value = 'lastMonth'
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
    // 默认为上个月
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    endDate = startDate
  }
  
  return [formatYearMonth(startDate), formatYearMonth(endDate)]
}

// 根据月份范围加载数据
const loadDataByDateRange = (monthRange) => {
  loading.value = true
  
  // 模拟API请求延迟
  setTimeout(() => {
    // 生成所选月份范围内的模拟数据
    generateMockData(monthRange)
    
    if (monthlyProfitData.value.length > 0) {
      noData.value = false
    } else {
      noData.value = true
    }
    
    loading.value = false
  }, 800)
}

// 生成模拟数据
const generateMockData = (monthRange) => {
  console.log('生成月度数据：', monthRange)
  
  // 解析月份范围
  const [startMonthStr, endMonthStr] = monthRange
  const startDate = new Date(startMonthStr)
  const endDate = new Date(endMonthStr)
  
  // 清空现有数据
  monthlyProfitData.value = []
  
  // 计算月份差
  let months = []
  let currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    months.push({
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1
    })
    currentDate.setMonth(currentDate.getMonth() + 1)
  }
  
  // 各种合计值的累加器
  let totalPredictedProfit = 0
  let totalGameProfit = 0
  let totalRecoveryProfit = 0
  let totalSpotOperationProfit = 0
  let totalArbitrageLimit = 0
  let totalArbitrageRatio = 0
  let totalExpectedProfitBeforeDistribution = 0
  let totalExpectedDistributionPerKwh = 0
  let totalExpectedProfitAfterDistribution = 0
  let totalActualProfitBeforeDistribution = 0
  let totalActualDistributionPerKwh = 0
  let totalActualProfitAfterDistribution = 0
  let totalAssessment = 0
  let totalOthers = 0
  let totalActualRevenue = 0
  let totalRevenuePerKwh = 0
  let totalMarketRevenuePerKwh = 0
  let totalSellingBrokerage = 0
  let totalBuyingBrokerage = 0
  let totalCommission = 0
  let totalGuaranteeCost = 0
  let totalFinalProfit = 0
  let totalProfitPerKwh = 0
  let totalCount = 0
  
  // 生成每个月份的数据
  months.forEach(({ year, month }) => {
    // 生成收益和套利相关模拟数据
    const predictedProfit = Math.floor(50000 + Math.random() * 30000)
    const gameProfit = Math.floor(20000 + Math.random() * 20000)
    const recoveryProfit = Math.floor(10000 + Math.random() * 15000)
    const spotOperationProfit = Math.floor(15000 + Math.random() * 25000)
    const arbitrageLimit = Math.floor(40000 + Math.random() * 20000)
    const arbitrageRatio = 0.3 + Math.random() * 0.6
    
    // 生成预计分摊和实际分摊模拟数据 (万元和厘)
    const expectedProfitBeforeDistribution = (predictedProfit + gameProfit + recoveryProfit) / 10000
    const expectedDistributionPerKwh = 0.5 + Math.random() * 1.5 // 0.5-2.0厘
    const expectedProfitAfterDistribution = expectedProfitBeforeDistribution - Math.random() * 5
    
    const actualProfitBeforeDistribution = (predictedProfit + gameProfit + recoveryProfit + spotOperationProfit) / 10000
    const actualDistributionPerKwh = 0.6 + Math.random() * 1.6 // 0.6-2.2厘
    const actualProfitAfterDistribution = actualProfitBeforeDistribution - Math.random() * 6
    
    // 生成考核和其他费用模拟数据 (万元)
    const assessment = Math.floor(Math.random() * 10) / 10  // 0-1万元
    const others = Math.floor(Math.random() * 20) / 10  // 0-2万元
    
    // 生成收入相关模拟数据
    const actualRevenue = actualProfitAfterDistribution - assessment - others
    const revenuePerKwh = 0.3 + Math.random() * 0.15  // 0.3-0.45元/千瓦时
    const marketRevenuePerKwh = revenuePerKwh * (0.8 + Math.random() * 0.15)  // 80%-95%的度电收入
    
    // 生成中间费用模拟数据 (万元)
    const sellingBrokerage = Math.floor(Math.random() * 30) / 10  // 0-3万元
    const buyingBrokerage = Math.floor(Math.random() * 25) / 10  // 0-2.5万元
    const commission = Math.floor(Math.random() * 15) / 10  // 0-1.5万元
    const guaranteeCost = Math.floor(Math.random() * 20) / 10  // 0-2万元
    
    // 生成最终利润模拟数据
    const finalProfit = actualRevenue - sellingBrokerage - buyingBrokerage - commission - guaranteeCost
    const profitPerKwh = 0.05 + Math.random() * 0.15  // 0.05-0.2元/千瓦时
    
    // 累加总计
    totalPredictedProfit += predictedProfit
    totalGameProfit += gameProfit
    totalRecoveryProfit += recoveryProfit
    totalSpotOperationProfit += spotOperationProfit
    totalArbitrageLimit += arbitrageLimit
    totalArbitrageRatio += arbitrageRatio
    totalExpectedProfitBeforeDistribution += expectedProfitBeforeDistribution
    totalExpectedDistributionPerKwh += expectedDistributionPerKwh
    totalExpectedProfitAfterDistribution += expectedProfitAfterDistribution
    totalActualProfitBeforeDistribution += actualProfitBeforeDistribution
    totalActualDistributionPerKwh += actualDistributionPerKwh
    totalActualProfitAfterDistribution += actualProfitAfterDistribution
    totalAssessment += assessment
    totalOthers += others
    totalActualRevenue += actualRevenue
    totalRevenuePerKwh += revenuePerKwh
    totalMarketRevenuePerKwh += marketRevenuePerKwh
    totalSellingBrokerage += sellingBrokerage
    totalBuyingBrokerage += buyingBrokerage
    totalCommission += commission
    totalGuaranteeCost += guaranteeCost
    totalFinalProfit += finalProfit
    totalProfitPerKwh += profitPerKwh
    totalCount++
    
    // 添加数据
    monthlyProfitData.value.push({
      month: `${year}年${month}月`,
      predictedProfit,
      gameProfit,
      recoveryProfit,
      spotOperationProfit,
      arbitrageLimit,
      arbitrageRatio,
      expectedProfitBeforeDistribution,
      expectedDistributionPerKwh,
      expectedProfitAfterDistribution,
      actualProfitBeforeDistribution,
      actualDistributionPerKwh,
      actualProfitAfterDistribution,
      assessment,
      others,
      actualRevenue,
      revenuePerKwh,
      marketRevenuePerKwh,
      sellingBrokerage,
      buyingBrokerage,
      commission,
      guaranteeCost,
      finalProfit,
      profitPerKwh,
    })
  })
  
  // 只有当有数据时才添加合计行
  if (totalCount > 0) {
    // 添加合计行
    monthlyProfitData.value.push({
      month: '合计',
      predictedProfit: totalPredictedProfit,
      gameProfit: totalGameProfit,
      recoveryProfit: totalRecoveryProfit,
      spotOperationProfit: totalSpotOperationProfit,
      arbitrageLimit: totalArbitrageLimit,
      arbitrageRatio: totalArbitrageRatio / totalCount, // 计算平均套利比例
      expectedProfitBeforeDistribution: totalExpectedProfitBeforeDistribution,
      expectedDistributionPerKwh: totalExpectedDistributionPerKwh / totalCount, // 计算平均度电分摊
      expectedProfitAfterDistribution: totalExpectedProfitAfterDistribution,
      actualProfitBeforeDistribution: totalActualProfitBeforeDistribution,
      actualDistributionPerKwh: totalActualDistributionPerKwh / totalCount, // 计算平均度电分摊
      actualProfitAfterDistribution: totalActualProfitAfterDistribution,
      assessment: totalAssessment,
      others: totalOthers,
      actualRevenue: totalActualRevenue,
      revenuePerKwh: totalRevenuePerKwh / totalCount, // 计算平均度电收入
      marketRevenuePerKwh: totalMarketRevenuePerKwh / totalCount, // 计算平均市场度电收入
      sellingBrokerage: totalSellingBrokerage,
      buyingBrokerage: totalBuyingBrokerage,
      commission: totalCommission,
      guaranteeCost: totalGuaranteeCost,
      finalProfit: totalFinalProfit,
      profitPerKwh: totalProfitPerKwh / totalCount, // 计算平均度电利润
    })
  }
}

// 格式化数字为千分位
const formatNumber = (row, column, cellValue) => {
  if (cellValue === undefined || cellValue === null) return '-'
  return cellValue.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

// 获取套利比例的颜色
const getArbitrageRatioColor = (ratio) => {
  if (ratio < 0.4) return '#f56c6c'  // 红色
  if (ratio < 0.7) return '#e6a23c'  // 黄色
  return '#67c23a'  // 绿色
}

// 格式化数字为指定精度
const formatNumberWithPrecision = (value, precision = 2) => {
  if (value === undefined || value === null) return '-'
  return value.toFixed(precision)
}

// 获取利润数值的类名
const getProfitClass = (value) => {
  if (value === undefined || value === null) return ''
  if (value > 0) return 'profit-positive'
  if (value < 0) return 'profit-negative'
  return ''
}

// 导出表格
const exportTable = () => {
  exporting.value = true
  
  try {
    // 创建工作簿
    const wb = XLSX.utils.book_new()
    
    // 准备数据
    const data = monthlyProfitData.value.map(item => {
      // 将数据对象转换为适合导出的格式
      return {
        '月份': item.month,
        '按预测收益(元)': item.predictedProfit,
        '博弈收益(元)': item.gameProfit,
        '回收收益(元)': item.recoveryProfit,
        '现货操作总收益(元)': item.spotOperationProfit,
        '套利上限(元)': item.arbitrageLimit,
        '套利比例': item.arbitrageRatio ? (item.arbitrageRatio * 100).toFixed(1) + '%' : '-',
        '预计分摊前(万元)': item.expectedProfitBeforeDistribution,
        '预计度电分摊(厘)': item.expectedDistributionPerKwh,
        '预计分摊后(万元)': item.expectedProfitAfterDistribution,
        '实际分摊前(万元)': item.actualProfitBeforeDistribution,
        '实际度电分摊(厘)': item.actualDistributionPerKwh,
        '实际分摊后(万元)': item.actualProfitAfterDistribution,
        '考核(万元)': item.assessment,
        '其他(万元)': item.others,
        '实际营收(万元)': item.actualRevenue,
        '度电收入(元/千瓦时)': item.revenuePerKwh,
        '市场度电收入(元/千瓦时)': item.marketRevenuePerKwh,
        '售电居间(万元)': item.sellingBrokerage,
        '购电居间(万元)': item.buyingBrokerage,
        '手续费(万元)': item.commission,
        '保函成本(万元)': item.guaranteeCost,
        '利润(万元)': item.finalProfit,
        '度电利润(元/千瓦时)': item.profitPerKwh,
      }
    })
    
    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(data)
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '月度成本构成与利润分析')
    
    // 导出文件
    XLSX.writeFile(wb, `月度成本构成与利润分析_${new Date().toISOString().split('T')[0]}.xlsx`)
  } catch (error) {
    console.error('导出表格失败:', error)
  } finally {
    exporting.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  // 默认加载上个月的数据
  loadDataByDateRange(getEffectiveMonthRange())
})
</script>

<style scoped>
.monthly-profit-container {
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

.profit-content {
  margin-top: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 16px;
}

.profit-table-section {
  background-color: #fff;
  padding: 16px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.table-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.profit-positive {
  color: #67c23a;
  font-weight: bold;
}

.profit-negative {
  color: #f56c6c;
  font-weight: bold;
}

.filter-section {
  background-color: #fff;
  padding: 16px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
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
</style>
