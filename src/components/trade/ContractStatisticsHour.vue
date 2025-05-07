<template>
  <div class="contract-statistics-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 数据展示区域 -->
    <div v-else-if="!noData" class="statistics-content">
      <!-- 头部选择区域 -->
      <div class="section-container">
        <div class="filter-container">
          <h3 class="section-title">合约统计：按时</h3>
          <div class="date-picker-container">
            <span class="picker-label">选择年份：</span>
            <el-date-picker
              v-model="selectedYear"
              type="year"
              placeholder="选择年份"
              format="YYYY"
              value-format="YYYY"
              @change="handleYearChange"
            />
          </div>
        </div>
        
        <!-- 单位说明 -->
        <div class="unit-note">
          <span class="unit-label">电量单位：兆瓦时</span>
          <span class="unit-label">价格单位：元/兆瓦时</span>
          <span class="unit-label">金额单位：元</span>
        </div>
      </div>

      <!-- 电量汇总表 -->
      <div class="section-container">
        <h3 class="section-title">电量汇总表</h3>
        <el-table 
          :data="volumeTableData" 
          border 
          stripe 
          style="width: 100%" 
          max-height="400" 
          :header-cell-style="{background:'#f5f7fa',color:'#606266'}"
          :row-class-name="getRowClassName"
        >
          <el-table-column prop="year" label="年份" align="center" width="80" fixed />
          <el-table-column prop="month" label="月份" align="center" width="80" fixed />
          <el-table-column v-for="hour in 24" :key="hour" :prop="'h'+(hour-1)" :label="(hour-1)+'时'" align="center" width="80" />
        </el-table>
      </div>

      <!-- 电量分时曲线图 -->
      <div class="section-container">
        <h3 class="section-title">电量分时曲线图</h3>
        
        <!-- 图表说明 -->
        <div class="chart-description">
          <div class="chart-note">
            <span>该图表展示一天内电量相关指标随时间变化的趋势</span>
          </div>
        </div>
        
        <!-- 图表容器 -->
        <div ref="volumeChartRef" class="chart-container"></div>
      </div>

      <!-- 电价汇总表 -->
      <div class="section-container">
        <h3 class="section-title">电价汇总表</h3>
        <el-table 
          :data="priceTableData" 
          border 
          stripe 
          style="width: 100%" 
          max-height="400"
          :header-cell-style="{background:'#f5f7fa',color:'#606266'}"
          :row-class-name="getRowClassName"
        >
          <el-table-column prop="year" label="年份" align="center" width="80" fixed />
          <el-table-column prop="month" label="月" align="center" width="80" fixed />
          <el-table-column v-for="hour in 24" :key="hour" :prop="'h'+(hour-1)" :label="(hour-1)+'时'" align="center" width="80" />
        </el-table>
      </div>

      <!-- 电价分时曲线图 -->
      <div class="section-container">
        <h3 class="section-title">电价分时曲线图</h3>
        
        <!-- 图表说明 -->
        <div class="chart-description">
          <div class="chart-note">
            <span>该图表展示一天内平均电价随时间变化的趋势</span>
          </div>
        </div>
        
        <!-- 图表容器 -->
        <div ref="priceChartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 空数据状态 -->
    <el-empty v-if="!loading && noData" description="暂无数据" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onBeforeUnmount, computed } from 'vue'
import * as echarts from 'echarts'

// 年份选择和加载状态
const selectedYear = ref(new Date().getFullYear().toString())
const loading = ref(true)
const noData = ref(false)

// 数据模型
const statisticsData = reactive({
  volumeData: [],    // 电量数据
  priceData: [],     // 电价数据
  dispatchData: [],  // 统调数据
  dayAheadPrice: []  // 日前价格数据
})

// 表格数据计算属性
const volumeTableData = computed(() => {
  return formatTableData(statisticsData.volumeData, true)
})

const priceTableData = computed(() => {
  const data = formatTableData(statisticsData.priceData, false)
  // 添加日前价格行
  if (statisticsData.dayAheadPrice.length > 0) {
    const dayAheadRow = {
      year: selectedYear.value,
      month: '日前价',
      isSpecial: true
    }
    
    // 添加24小时数据
    for (let i = 0; i < 24; i++) {
      dayAheadRow[`h${i}`] = statisticsData.dayAheadPrice[i]?.price || '-'
    }
    
    data.push(dayAheadRow)
  }
  
  return data
})

// 表格行样式
const getRowClassName = ({ row }) => {
  if (row.isTotal) return 'is-total'
  if (row.isAverage) return 'is-average'
  if (row.isSpecial) return 'is-special'
  return ''
}

// 图表引用
const volumeChartRef = ref(null)
const priceChartRef = ref(null)
let volumeChart = null
let priceChart = null

// 处理年份变更
const handleYearChange = () => {
  loadData()
}

// 格式化表格数据
function formatTableData(sourceData, includeTotal = true) {
  const result = []
  
  // 按月份分组
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  
  // 遍历月份
  months.forEach(month => {
    // 查找当前月份的数据
    const monthData = sourceData.filter(item => item.month === month)
    
    if (monthData.length > 0) {
      const row = {
        year: selectedYear.value,
        month: `${month}月`,
      }
      
      // 添加24小时数据
      for (let hour = 0; hour < 24; hour++) {
        const hourData = monthData.find(item => item.hour === hour)
        row[`h${hour}`] = hourData ? (includeTotal ? hourData.volume : hourData.price) : '-'
      }
      
      result.push(row)
    }
  })
  
  // 添加合计/平均行
  if (includeTotal && result.length > 0) {
    const totalRow = {
      year: selectedYear.value,
      month: '合计',
      isTotal: true
    }
    
    // 计算每小时合计
    for (let hour = 0; hour < 24; hour++) {
      const hourKey = `h${hour}`
      const hourValues = result
        .map(row => row[hourKey])
        .filter(val => val !== '-')
        .map(val => parseFloat(val))
      
      totalRow[hourKey] = hourValues.length > 0 
        ? hourValues.reduce((sum, val) => sum + val, 0).toFixed(2)
        : '-'
    }
    
    result.push(totalRow)
  } else if (!includeTotal && result.length > 0) {
    // 计算平均值行
    const avgRow = {
      year: selectedYear.value,
      month: '平均',
      isAverage: true
    }
    
    // 计算每小时平均
    for (let hour = 0; hour < 24; hour++) {
      const hourKey = `h${hour}`
      const hourValues = result
        .map(row => row[hourKey])
        .filter(val => val !== '-')
        .map(val => parseFloat(val))
      
      avgRow[hourKey] = hourValues.length > 0 
        ? (hourValues.reduce((sum, val) => sum + val, 0) / hourValues.length).toFixed(4)
        : '-'
    }
    
    result.push(avgRow)
  }
  
  return result
}

// 加载数据函数
const loadData = () => {
  loading.value = true
  noData.value = false
  
  // 模拟API请求延迟
  setTimeout(() => {
    // 生成模拟数据
    generateMockData()
    
    if (statisticsData.volumeData.length === 0) {
      noData.value = true
    }
    
    loading.value = false
    
    nextTick(() => {
      initVolumeChart()
      initPriceChart()
    })
  }, 1000)
}

// 生成模拟数据
const generateMockData = () => {
  // 清空旧数据
  statisticsData.volumeData = []
  statisticsData.priceData = []
  statisticsData.dispatchData = []
  statisticsData.dayAheadPrice = []
  
  // 为每个月和每小时生成数据
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const hours = Array.from({ length: 24 }, (_, i) => i)
  
  // 生成电量数据 (兆瓦时)
  months.forEach(month => {
    hours.forEach(hour => {
      // 基础参数 - 已转换为兆瓦时 (1 兆瓦时 = 1000 千瓦时)
      const baseVolume = 0.5 + Math.random() * 1.0 // 0.5-1.5 兆瓦时
      
      // 高峰时段(8-12, 17-21)电量和价格更高
      const isPeakHour = (hour >= 8 && hour <= 12) || (hour >= 17 && hour <= 21)
      const volumeFactor = isPeakHour ? 1.5 : 1
      const priceFactor = isPeakHour ? 1.3 : 1
      
      // 夏季(6-8月)电量更高
      const isSummer = month >= 6 && month <= 8
      const seasonFactor = isSummer ? 1.4 : 1
      
      // 计算电量(兆瓦时)和价格(元/兆瓦时)
      const volume = (baseVolume * volumeFactor * seasonFactor).toFixed(2)
      // 价格调整为元/兆瓦时 (通常比元/千瓦时高约1000倍)
      const price = (850 + Math.random() * 300) * priceFactor
      
      // 保存电量数据
      statisticsData.volumeData.push({
        year: selectedYear.value,
        month,
        hour,
        volume
      })
      
      // 保存电价数据
      statisticsData.priceData.push({
        year: selectedYear.value,
        month,
        hour,
        price: price.toFixed(2)
      })
    })
  })
  
  // 生成统调数据 (兆瓦时)
  hours.forEach(hour => {
    const baseVolume = 0.6 + Math.random() * 0.8 // 0.6-1.4 兆瓦时
    const isPeakHour = (hour >= 8 && hour <= 12) || (hour >= 17 && hour <= 21)
    const factor = isPeakHour ? 1.3 : 1
    
    statisticsData.dispatchData.push({
      hour,
      value: (baseVolume * factor).toFixed(2)
    })
  })
  
  // 生成日前价格数据 (元/兆瓦时)
  hours.forEach(hour => {
    const basePrice = 900 + Math.random() * 200 // 900-1100 元/兆瓦时
    const isPeakHour = (hour >= 8 && hour <= 12) || (hour >= 17 && hour <= 21)
    const factor = isPeakHour ? 1.2 : 1
    
    statisticsData.dayAheadPrice.push({
      hour,
      price: (basePrice * factor).toFixed(2)
    })
  })
}

// 初始化电量图表
const initVolumeChart = () => {
  if (!volumeChartRef.value) return
  
  if (volumeChart) {
    volumeChart.dispose()
  }
  
  volumeChart = echarts.init(volumeChartRef.value)
  
  const hours = Array.from({ length: 24 }, (_, i) => `${i}时`)
  const series = []
  const legendData = []
  
  // 添加选定月份的数据
  const selectedMonths = [1, 2, 3, 4] // 示例选择前4个月
  const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666']
  
  selectedMonths.forEach((month, index) => {
    const monthName = `${selectedYear.value} ${month}月`
    legendData.push(monthName)
    
    const monthData = statisticsData.volumeData
      .filter(item => item.month === month)
      .sort((a, b) => a.hour - b.hour)
    
    series.push({
      name: monthName,
      type: 'line',
      data: monthData.map(item => parseFloat(item.volume)),
      smooth: true,
      lineStyle: {
        width: 2,
        color: colors[index % colors.length]
      },
      symbol: 'circle',
      symbolSize: 6
    })
  })
  
  // 添加合计数据
  const totalData = []
  for (let h = 0; h < 24; h++) {
    let total = 0
    selectedMonths.forEach(month => {
      const hourData = statisticsData.volumeData
        .filter(item => item.month === month && item.hour === h)
      
      if (hourData.length > 0) {
        total += parseFloat(hourData[0].volume)
      }
    })
    totalData.push(parseFloat(total.toFixed(2)))
  }
  
  series.push({
    name: '合计',
    type: 'line',
    data: totalData,
    smooth: true,
    lineStyle: {
      width: 3,
      color: '#5c6ac4'
    },
    symbol: 'circle',
    symbolSize: 8
  })
  legendData.push('合计')
  
  // 添加统调数据
  series.push({
    name: '统调曲线',
    type: 'line',
    data: statisticsData.dispatchData.map(item => parseFloat(item.value)),
    smooth: true,
    lineStyle: {
      width: 2,
      color: '#73c0de',
      type: 'dashed'
    },
    symbol: 'circle',
    symbolSize: 6
  })
  legendData.push('统调曲线')
  
  const option = {
    title: {
      text: '电量分时曲线',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        let result = params[0].axisValue + '<br/>';
        params.forEach(param => {
          result += `${param.seriesName}: ${param.value} 兆瓦时<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: legendData,
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: hours
    },
    yAxis: {
      type: 'value',
      name: '电量(兆瓦时)',
      axisLabel: {
        formatter: '{value}'
      }
    },
    series
  }
  
  volumeChart.setOption(option)
}

// 初始化价格图表
const initPriceChart = () => {
  if (!priceChartRef.value) return
  
  if (priceChart) {
    priceChart.dispose()
  }
  
  priceChart = echarts.init(priceChartRef.value)
  
  const hours = Array.from({ length: 24 }, (_, i) => `${i}时`)
  const series = []
  const legendData = []
  
  // 添加选定月份的数据
  const selectedMonths = [1, 2, 3, 4] // 示例选择前4个月
  const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666']
  
  selectedMonths.forEach((month, index) => {
    const monthName = `${month}月`
    legendData.push(monthName)
    
    const monthData = statisticsData.priceData
      .filter(item => item.month === month)
      .sort((a, b) => a.hour - b.hour)
    
    series.push({
      name: monthName,
      type: 'line',
      data: monthData.map(item => parseFloat(item.price)),
      smooth: true,
      lineStyle: {
        width: 2,
        color: colors[index % colors.length]
      },
      symbol: 'circle',
      symbolSize: 6
    })
  })
  
  // 添加日前价
  series.push({
    name: '日前价',
    type: 'line',
    data: statisticsData.dayAheadPrice.map(item => parseFloat(item.price)),
    smooth: true,
    lineStyle: {
      width: 2,
      color: '#73c0de',
      type: 'dashed'
    },
    symbol: 'circle',
    symbolSize: 6
  })
  legendData.push('日前价')
  
  const option = {
    title: {
      text: '电价分时曲线',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        let result = params[0].axisValue + '<br/>';
        params.forEach(param => {
          result += `${param.seriesName}: ${param.value} 元/兆瓦时<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: legendData,
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: hours
    },
    yAxis: {
      type: 'value',
      name: '价格(元/兆瓦时)',
      axisLabel: {
        formatter: '{value} 元'
      }
    },
    series
  }
  
  priceChart.setOption(option)
}

// 窗口大小改变时重新绘制图表
const handleResize = () => {
  if (volumeChart) {
    volumeChart.resize()
  }
  if (priceChart) {
    priceChart.resize()
  }
}

// 生命周期钩子
onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  if (volumeChart) {
    volumeChart.dispose()
    volumeChart = null
  }
  if (priceChart) {
    priceChart.dispose()
    priceChart = null
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.contract-statistics-container {
  width: 100%;
  padding-top: 0;
}

.section-container {
  background-color: #fff;
  padding: 12px 20px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 15px;
}

.section-title {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
  color: #303133;
}

.filter-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.date-picker-container {
  display: flex;
  align-items: center;
}

.picker-label {
  margin-right: 10px;
  color: #606266;
  font-size: 14px;
}

.unit-note {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.unit-label {
  font-size: 13px;
  color: #606266;
  background-color: #f0f9eb;
  border-radius: 4px;
  padding: 4px 8px;
  margin-right: 12px;
  margin-bottom: 5px;
  border-left: 3px solid #67c23a;
}

.chart-container {
  height: 400px;
  width: 100%;
  margin-top: 20px;
}

.loading-container {
  margin-top: 5px;
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.statistics-content {
  margin-top: 5px;
}

.chart-description {
  margin: 10px 0 15px;
  padding: 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
  border-left: 4px solid #409EFF;
}

.chart-note {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  font-size: 13px;
  color: #606266;
}

.chart-note-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  border-radius: 2px;
}

/* 表格样式定制 */
:deep(.el-table .is-total) {
  background-color: #f8f8f8;
  font-weight: bold;
  color: #409EFF;
}

:deep(.el-table .is-average) {
  background-color: #f8f8f8;
  font-weight: bold;
  color: #67c23a;
}

:deep(.el-table .is-special) {
  background-color: #fdf6ec;
  font-weight: bold;
  color: #e6a23c;
}

/* 响应式样式 */
@media screen and (max-width: 768px) {
  .chart-container {
    height: 300px;
  }
  
  .unit-note {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .unit-label {
    margin-bottom: 5px;
  }
  
  .filter-container {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .date-picker-container {
    margin-top: 10px;
    width: 100%;
  }
}
</style>
