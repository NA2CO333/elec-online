<template>
    <div class="user-metrics-container">
      <!-- 顶部：日期范围选择器 -->
      <div class="filter-section">
        <h3 class="section-title">用户关联指标</h3>
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
            <div class="quick-selects">
              <el-button size="small" @click="setCustomRange('last3Months')">近3个月</el-button>
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
      <div v-else-if="!noData" class="metrics-content">
        <!-- 环形图和簇状条形图区域 -->
        <div class="charts-container">
          <el-row :gutter="20">
            <!-- 环形图：当月利润来源（百分比）- 用户行业 -->
            <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
              <div class="chart-section">
                <h4 class="chart-title">当月利润来源（按用户行业）</h4>
                <div ref="industryProfitChartRef" class="chart-container"></div>
              </div>
            </el-col>
  
            <!-- 环形图：当月利润来源（百分比）- 用户地区 -->
            <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
              <div class="chart-section">
                <h4 class="chart-title">当月利润来源（按用户地区）</h4>
                <div ref="regionProfitChartRef" class="chart-container"></div>
              </div>
            </el-col>
          </el-row>
  
          <el-row :gutter="20">
            <!-- 簇状条形图：利润来源排名前20 -->
            <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
              <div class="chart-section">
                <h4 class="chart-title">利润来源排名前20用户</h4>
                <div ref="top20ProfitChartRef" class="chart-container"></div>
              </div>
            </el-col>
  
            <!-- 簇状条形图：亏损来源排名前20 -->
            <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
              <div class="chart-section">
                <h4 class="chart-title">亏损来源排名前20用户</h4>
                <div ref="top20LossChartRef" class="chart-container"></div>
              </div>
            </el-col>
          </el-row>
  
          <!-- 用户电量数据情况表 -->
          <el-row :gutter="20">
            <el-col :span="24">
              <div class="chart-section">
                <h4 class="chart-title">用户电量数据质量概览</h4>
                <div class="data-quality-table">
                  <el-table :data="dataQualityData" border style="width: 100%">
                    <el-table-column prop="totalUsers" label="总代理用户数" width="180" />
                    <el-table-column prop="abnormalDataUsers" label="电量数据异常用户数" width="180" />
                    <el-table-column prop="missingDataUsers" label="系统电量缺失用户数" width="180" />
                    <el-table-column prop="unusualPatternUsers" label="用电规律异常用户数" />
                  </el-table>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
  
      <!-- 空数据状态 -->
      <el-empty v-if="!loading && noData" description="暂无数据" />
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
  import * as echarts from 'echarts'
  
  // 状态变量
  const loading = ref(true)
  const noData = ref(false)
  
  // 图表引用
  const industryProfitChartRef = ref(null)
  const regionProfitChartRef = ref(null)
  const top20ProfitChartRef = ref(null)
  const top20LossChartRef = ref(null)
  
  // 图表实例
  let industryProfitChart = null
  let regionProfitChart = null
  let top20ProfitChart = null
  let top20LossChart = null
  
  // 日期范围选择相关
  const dateRangeType = ref('currentMonth') // 默认为当月
  const dateRange = ref([])
  const today = new Date()
  
  // 数据质量表数据
  const dataQualityData = ref([
    {
      totalUsers: 0,
      abnormalDataUsers: 0,
      missingDataUsers: 0,
      unusualPatternUsers: 0
    }
  ])
  
  // 计算当前显示的日期范围
  const displayDateRange = computed(() => {
    if (dateRangeType.value === 'currentMonth') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      return `${formatDate(startOfMonth)} 至 ${formatDate(today)}`
    } else if (dateRangeType.value === 'lastMonth') {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
      return `${formatDate(lastMonth)} 至 ${formatDate(endOfLastMonth)}`
    } else if (dateRangeType.value === 'currentQuarter') {
      const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3
      const startOfQuarter = new Date(today.getFullYear(), quarterStartMonth, 1)
      return `${formatDate(startOfQuarter)} 至 ${formatDate(today)}`
    } else if (dateRangeType.value === 'currentYear') {
      const startOfYear = new Date(today.getFullYear(), 0, 1)
      return `${formatDate(startOfYear)} 至 ${formatDate(today)}`
    } else if (dateRangeType.value === 'custom' && dateRange.value && dateRange.value.length === 2) {
      return `${dateRange.value[0]} 至 ${dateRange.value[1]}`
    }
    
    // 默认返回当月
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    return `${formatDate(startOfMonth)} 至 ${formatDate(today)}`
  })
  
  // 日期工具函数
  function formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
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
  
  // 设置自定义范围
  const setCustomRange = (rangeType) => {
    const now = new Date()
    
    if (rangeType === 'last3Months') {
      // 近3个月
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 3)
      
      dateRange.value = [formatDate(startDate), formatDate(endDate)]
    } else if (rangeType === 'lastYear') {
      // 去年同期
      const startDate = new Date(now.getFullYear() - 1, now.getMonth() - 2, 1)
      const endDate = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0)
      
      dateRange.value = [formatDate(startDate), formatDate(endDate)]
    }
    
    loadDataByDateRange(dateRange.value)
  }
  
  // 清除日期范围
  const clearDateRange = () => {
    dateRange.value = []
    dateRangeType.value = 'currentMonth'
    loadDataByDateRange(getEffectiveDateRange())
  }
  
  // 获取有效的日期范围
  const getEffectiveDateRange = () => {
    if (dateRangeType.value === 'currentMonth') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      return [formatDate(startOfMonth), formatDate(today)]
    } else if (dateRangeType.value === 'lastMonth') {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
      return [formatDate(lastMonth), formatDate(endOfLastMonth)]
    } else if (dateRangeType.value === 'currentQuarter') {
      const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3
      const startOfQuarter = new Date(today.getFullYear(), quarterStartMonth, 1)
      return [formatDate(startOfQuarter), formatDate(today)]
    } else if (dateRangeType.value === 'currentYear') {
      const startOfYear = new Date(today.getFullYear(), 0, 1)
      return [formatDate(startOfYear), formatDate(today)]
    } else if (dateRangeType.value === 'custom' && dateRange.value && dateRange.value.length === 2) {
      return dateRange.value
    }
    
    // 默认当月
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    return [formatDate(startOfMonth), formatDate(today)]
  }
  
  // 根据日期范围加载数据
  const loadDataByDateRange = (dateRange) => {
    loading.value = true
    
    // 模拟API请求延迟
    setTimeout(() => {
      // 生成所选日期范围的模拟数据
      generateMockData(dateRange)
      
      // 检查是否有数据
      noData.value = false
      
      loading.value = false
      
      nextTick(() => {
        initAllCharts()
      })
    }, 800)
  }
  
  // 生成模拟数据
  const generateMockData = (dateRange) => {
    console.log('生成数据：', dateRange)
    
    // 模拟行业利润数据
    const industryProfitData = [
      { value: 35, name: '制造业' },
      { value: 25, name: '商业' },
      { value: 20, name: '电力' },
      { value: 10, name: '农业' },
      { value: 5, name: '建筑业' },
      { value: 5, name: '其他' }
    ]
    
    // 模拟地区利润数据
    const regionProfitData = [
      { value: 30, name: '华东' },
      { value: 25, name: '华南' },
      { value: 15, name: '华北' },
      { value: 15, name: '西南' },
      { value: 10, name: '东北' },
      { value: 5, name: '西北' }
    ]
    
    // 模拟利润排名前20用户数据
    const top20ProfitData = []
    
    for (let i = 1; i <= 20; i++) {
      top20ProfitData.push({
        user: `用户${i}`,
        profit: (Math.random() * 0.4 + 0.1).toFixed(4) // 0.1-0.5元/千瓦时
      })
    }
    
    // 按利润降序排序
    top20ProfitData.sort((a, b) => b.profit - a.profit)
    
    // 模拟亏损排名前20用户数据
    const top20LossData = []
    
    for (let i = 1; i <= 20; i++) {
      top20LossData.push({
        user: `用户${i + 20}`,
        loss: -(Math.random() * 0.3 + 0.05).toFixed(4) // -0.05到-0.35元/千瓦时
      })
    }
    
    // 按亏损额升序排序（亏损最严重的在前面）
    top20LossData.sort((a, b) => a.loss - b.loss)
    
    // 更新电量数据质量表数据
    dataQualityData.value = [
      {
        totalUsers: 2500,
        abnormalDataUsers: Math.floor(2500 * 0.12), // 约12%的用户数据异常
        missingDataUsers: Math.floor(2500 * 0.08), // 约8%的用户系统数据缺失
        unusualPatternUsers: Math.floor(2500 * 0.15) // 约15%的用户用电规律异常
      }
    ]
    
    // 初始化环形图：当月利润来源（按用户行业）
    initIndustryProfitChart(industryProfitData)
    
    // 初始化环形图：当月利润来源（按用户地区）
    initRegionProfitChart(regionProfitData)
    
    // 初始化簇状条形图：利润来源排名前20
    initTop20ProfitChart(top20ProfitData)
    
    // 初始化簇状条形图：亏损来源排名前20
    initTop20LossChart(top20LossData)
  }
  
  // 初始化所有图表
  const initAllCharts = () => {
    // 仅在有数据的情况下初始化图表
    if (!noData.value) {
      generateMockData(getEffectiveDateRange())
    }
  }
  
  // 初始化环形图：当月利润来源（按用户行业）
  const initIndustryProfitChart = (data) => {
    if (!industryProfitChartRef.value) return
    
    if (industryProfitChart) {
      industryProfitChart.dispose()
    }
    
    industryProfitChart = echarts.init(industryProfitChartRef.value)
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        data: data.map(item => item.name)
      },
      series: [
        {
          name: '利润来源',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: data
        }
      ]
    }
    
    industryProfitChart.setOption(option)
  }
  
  // 初始化环形图：当月利润来源（按用户地区）
  const initRegionProfitChart = (data) => {
    if (!regionProfitChartRef.value) return
    
    if (regionProfitChart) {
      regionProfitChart.dispose()
    }
    
    regionProfitChart = echarts.init(regionProfitChartRef.value)
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        data: data.map(item => item.name)
      },
      series: [
        {
          name: '利润来源',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: data
        }
      ]
    }
    
    regionProfitChart.setOption(option)
  }
  
  // 初始化簇状条形图：利润来源排名前20
  const initTop20ProfitChart = (data) => {
    if (!top20ProfitChartRef.value) return
    
    if (top20ProfitChart) {
      top20ProfitChart.dispose()
    }
    
    top20ProfitChart = echarts.init(top20ProfitChartRef.value)
    
    const userNames = data.map(item => item.user)
    const profits = data.map(item => parseFloat(item.profit))
    
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params) {
          const param = params[0]
          return `${param.name}<br/>${param.seriesName}: ${param.value.toFixed(4)} 元/千瓦时`
        }
      },
      grid: {
        left: '3%',
        right: '6%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: '度电利润(元/千瓦时)',
        axisLabel: {
          formatter: '{value}'
        }
      },
      yAxis: {
        type: 'category',
        name: '用户',
        data: userNames.reverse(), // 反转顺序，使最高利润在顶部
        axisLabel: {
          interval: 0,
          rotate: 0,
          formatter: function (value) {
            // 截断太长的名称
            if (value.length > 8) {
              return value.substring(0, 8) + '...'
            }
            return value
          }
        }
      },
      series: [
        {
          name: '度电利润',
          type: 'bar',
          data: profits.reverse(), // 反转顺序，与用户名匹配
          itemStyle: {
            color: '#67C23A' // 利润为绿色
          },
          label: {
            show: true,
            position: 'right',
            formatter: function(params) {
              return params.value.toFixed(4)
            }
          }
        }
      ]
    }
    
    top20ProfitChart.setOption(option)
  }
  
  // 初始化簇状条形图：亏损来源排名前20
  const initTop20LossChart = (data) => {
    if (!top20LossChartRef.value) return
    
    if (top20LossChart) {
      top20LossChart.dispose()
    }
    
    top20LossChart = echarts.init(top20LossChartRef.value)
    
    const userNames = data.map(item => item.user)
    // 将负数转换为正数以便图表显示，但颜色表示亏损
    const losses = data.map(item => Math.abs(parseFloat(item.loss)))
    
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params) {
          const param = params[0]
          return `${param.name}<br/>${param.seriesName}: -${param.value.toFixed(4)} 元/千瓦时`
        }
      },
      grid: {
        left: '3%',
        right: '6%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: '度电亏损(元/千瓦时)',
        axisLabel: {
          formatter: '{value}'
        }
      },
      yAxis: {
        type: 'category',
        name: '用户',
        data: userNames.reverse(), // 反转数组，使损失最大的在顶部
        axisLabel: {
          interval: 0,
          rotate: 0,
          formatter: function (value) {
            // 截断太长的名称
            if (value.length > 8) {
              return value.substring(0, 8) + '...'
            }
            return value
          }
        }
      },
      series: [
        {
          name: '度电亏损',
          type: 'bar',
          data: losses.reverse(), // 反转数组，与用户名匹配
          itemStyle: {
            color: '#F56C6C' // 亏损为红色
          },
          label: {
            show: true,
            position: 'right',
            formatter: function(params) {
              return '-' + params.value.toFixed(4)
            }
          }
        }
      ]
    }
    
    top20LossChart.setOption(option)
  }
  
  // 窗口大小改变时重新绘制图表
  const handleResize = () => {
    if (industryProfitChart) {
      industryProfitChart.resize()
    }
    if (regionProfitChart) {
      regionProfitChart.resize()
    }
    if (top20ProfitChart) {
      top20ProfitChart.resize()
    }
    if (top20LossChart) {
      top20LossChart.resize()
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
    if (industryProfitChart) {
      industryProfitChart.dispose()
      industryProfitChart = null
    }
    if (regionProfitChart) {
      regionProfitChart.dispose()
      regionProfitChart = null
    }
    if (top20ProfitChart) {
      top20ProfitChart.dispose()
      top20ProfitChart = null
    }
    if (top20LossChart) {
      top20LossChart.dispose()
      top20LossChart = null
    }
    window.removeEventListener('resize', handleResize)
  })
  </script>
  
  <style scoped>
  .user-metrics-container {
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
  
  .metrics-content {
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
  
  .quick-selects {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  
  .current-date-range {
    font-size: 14px;
    color: #606266;
    background-color: #f0f9eb;
    padding: 8px 12px;
    border-radius: 4px;
    border-left: 3px solid #67c23a;
  }
  
  .charts-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
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
  
  .data-quality-table {
    margin-top: 16px;
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
  
