<template>
  <div class="contract-statistics-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 数据展示区域 -->
    <div v-else class="statistics-content">
      <!-- 顶部筛选区 -->
      <div class="section-container filter-container">
        <div class="filter-item">
          <span class="filter-label">选择月份范围:</span>
          <el-date-picker
            v-model="dateRange"
            type="monthrange"
            range-separator="至"
            start-placeholder="开始月份"
            end-placeholder="结束月份"
            format="YYYY年MM月"
            value-format="YYYY-MM"
            :clearable="false"
            :default-value="[defaultStartDate, defaultEndDate]"
            @change="handleDateRangeChange"
          />
        </div>
      </div>

      <!-- 持仓电量构成分析 -->
      <div class="section-container">
        <h3 class="section-title">持仓电量构成分析</h3>
        
        <!-- 单位说明 -->
        <div class="unit-note">
          <span class="unit-label">电量单位：兆瓦时</span>
            </div>
        
        <!-- 汇总表格 -->
        <el-table :data="statisticsData.compositionData" border stripe style="width: 100%; margin-bottom: 20px;">
          <el-table-column prop="month" label="月份" align="center" width="80"/>
          <el-table-column v-for="type in statisticsData.tradeTypes" :key="type.value" :prop="type.value" :label="type.label" align="center">
                  <template #default="scope">
              {{ formatVolumeWithoutUnit(scope.row[type.value]) }}
                  </template>
                </el-table-column>
          <el-table-column prop="total" label="总计" align="center">
            <template #default="scope">
              {{ formatVolumeWithoutUnit(scope.row.total) }}
            </template>
          </el-table-column>
              </el-table>
        
        <!-- 图表说明 -->
        <div class="chart-description">
          <div class="chart-note">
            <span class="chart-note-icon bar-icon"></span>
            <span>柱状图：表示各交易品种在不同月份的占比情况（正值表示持有，负值表示卖出，各月份总计100%）</span>
          </div>
        </div>
        
        <!-- 柱状图展示 -->
        <div ref="compositionChartRef" class="chart-container"></div>
        </div>
        
      <!-- 持仓均价分析 -->
      <div class="section-container">
        <h3 class="section-title">持仓均价分析</h3>
        
        <!-- 单位说明 -->
        <div class="unit-note">
          <span class="unit-label">价格单位：元/兆瓦时</span>
              </div>
        
        <!-- 按月份汇总表格 -->
        <h4 class="subsection-title">月度持仓均价</h4>
        <el-table :data="statisticsData.priceByMonthData" border stripe style="width: 100%; margin-bottom: 20px;">
          <el-table-column prop="month" label="月份" align="center" width="80"/>
          <el-table-column v-for="type in statisticsData.tradeTypes" :key="type.value" :prop="type.value" :label="type.label" align="center">
            <template #default="scope">
              {{ formatPrice(scope.row[type.value]) }}
            </template>
          </el-table-column>
          <el-table-column prop="averagePrice" label="综合均价" align="center">
            <template #default="scope">
              {{ formatPrice(scope.row.averagePrice) }}
            </template>
          </el-table-column>
          <el-table-column prop="spotPrice" label="日前价值" align="center">
            <template #default="scope">
              {{ formatPrice(scope.row.spotPrice) }}
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 图表说明 -->
        <div class="chart-description">
          <div class="chart-note">
            <span class="chart-note-icon" style="background-color: #3a47d4;"></span>
            <span>持仓均价：表示各交易品种按持仓电量加权计算的综合均价</span>
              </div>
          <div class="chart-note">
            <span class="chart-note-icon" style="background-color: #ff9800;"></span>
            <span>日前价格：表示电力现货市场的日前出清价格</span>
              </div>
          <div class="chart-note">
            <span class="chart-note-icon" style="background-color: #ff9800; opacity: 0.2;"></span>
            <span>溢价区域：显示日前价格高于持仓均价的区域（溢价）</span>
              </div>
        </div>
        
        <!-- 折线图展示 -->
        <div ref="priceTrendChartRef" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

// 日期范围选择
const defaultStartDate = new Date(new Date().getFullYear(), 0, 1) // 当年1月1日
const defaultEndDate = new Date() // 当前日期
const dateRange = ref([
  defaultStartDate.getFullYear() + '-' + ('0' + (defaultStartDate.getMonth() + 1)).slice(-2),
  defaultEndDate.getFullYear() + '-' + ('0' + (defaultEndDate.getMonth() + 1)).slice(-2)
])

// 处理日期范围变化
const handleDateRangeChange = () => {
  // 检查日期范围是否有效
  if (!dateRange.value || dateRange.value.length !== 2) {
    ElMessage.warning('请选择有效的月份范围')
    return
  }
  
  // 重新加载数据
  loadData()
}

// 过滤后的月份数据 (基于选择的日期范围)
const filteredMonths = computed(() => {
  if (!dateRange.value || dateRange.value.length !== 2) return []
  
  const startYear = parseInt(dateRange.value[0].split('-')[0])
  const startMonth = parseInt(dateRange.value[0].split('-')[1])
  const endYear = parseInt(dateRange.value[1].split('-')[0])
  const endMonth = parseInt(dateRange.value[1].split('-')[1])
  
  const result = []
  
  // 如果是同一年
  if (startYear === endYear) {
    for (let month = startMonth; month <= endMonth; month++) {
      result.push(`${month}月`)
    }
  } else {
    // 跨年份
    for (let year = startYear; year <= endYear; year++) {
      const startM = year === startYear ? startMonth : 1
      const endM = year === endYear ? endMonth : 12
      
      for (let month = startM; month <= endM; month++) {
        result.push(`${month}月`)
      }
    }
  }
  
  return result
})

// 加载状态和统计结果
const loading = ref(true)
const statisticsData = reactive({
  compositionData: [],
  priceByMonthData: [], // 按月份的持仓均价数据
  tradeTypes: [
    { label: '年度双边', value: 'yearly_bilateral' },
    { label: '年度挂牌', value: 'yearly_listing' },
    { label: '年度集中', value: 'yearly_central' },
    { label: '多月双边', value: 'multimonth_bilateral' },
    { label: '多月集中', value: 'multimonth_central' },
    { label: '月度双边', value: 'monthly_bilateral' },
    { label: '月度集中', value: 'monthly_central' },
    { label: '月度分时', value: 'monthly_timeframe' },
    { label: '多日分时', value: 'multiday_timeframe' }
  ]
})

// 月份数据 (完整12月)
const allMonths = computed(() => {
  return ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
})

// 添加图表引用
const compositionChartRef = ref(null)
let compositionChart = null

// 持仓均价分析图表引用
const priceTrendChartRef = ref(null)
let priceTrendChart = null

// 格式化电量展示（不带单位）
const formatVolumeWithoutUnit = (value) => {
  if (value === undefined || value === null) return '-'
  return value.toFixed(2)
}

// 格式化价格展示
const formatPrice = (value) => {
  if (value === undefined || value === null) return '-'
  return value.toFixed(4)
}

// 加载数据函数
const loadData = () => {
  // 重置加载状态
  loading.value = true
  
  // 模拟API请求延迟
  setTimeout(() => {
    // 获取持仓电量构成数据
    fetchCompositionData()
    
    // 获取持仓均价数据
    fetchPriceByMonthData()
    
    loading.value = false
    
    nextTick(() => {
      initCompositionChart()
      initPriceTrendChart()
    })
  }, 1000)
}

// 模拟获取持仓电量构成数据
function fetchCompositionData() {
  // 不同交易类型在不同月份的基础占比模板（包含正负值，负值表示卖出）
  const basePercentages = {
    // 这三个始终为正，表示持有
    yearly_bilateral: [30, 30, 30, 28, 28, 28, 27, 27, 27, 25, 25, 25], // 年度双边全年较为稳定
    yearly_listing:   [18, 18, 18, 17, 17, 17, 16, 16, 16, 15, 15, 15], // 年度挂牌逐季微降
    yearly_central:   [15, 15, 15, 14, 14, 14, 13, 13, 13, 12, 12, 12], // 年度集中逐季微降
    
    // 这些可能为负，表示卖出
    multimonth_bilateral: [5, 6, 7, 8, -4, -6, -8, -5, 8, 7, 6, 5], // 多月双边中间高，夏季卖出
    multimonth_central:   [4, 5, 6, 7, -3, -4, -7, -3, 7, 6, 5, 4], // 多月集中中间高，夏季卖出
    monthly_bilateral:    [8, 8, -4, -5, 9, 9, 10, 10, -7, -9, 11, 11], // 月度双边有季节性卖出
    monthly_central:      [6, 6, -3, -5, 7, 7, 8, 8, -5, -7, 9, 9], // 月度集中有季节性卖出
    monthly_timeframe:    [4, 4, 4, -3, -5, -4, 6, 6, 6, -4, -6, 6], // 月度分时有特定月份卖出
    multiday_timeframe:   [2, 2, 3, 3, -2, -3, -3, 4, 4, 4, -3, -4]  // 多日分时部分月份卖出
  }
  
  // 生成全年数据
  const fullYearData = allMonths.value.map((month, monthIndex) => {
    const monthData = {
      month: month,
      total: 0 // 注意：total将包含正负值的代数和
    }
    
    // 给每种交易类型添加基于模板的数据
    statisticsData.tradeTypes.forEach(type => {
      // 从基础占比模板中获取基础占比，并添加小幅随机波动（-2%到+2%）
      const basePercentage = basePercentages[type.value][monthIndex]
      const randomVariation = (Math.random() * 4 - 2)
      let percentage = basePercentage + randomVariation
      
      // 确保正值和负值在合理范围内
      if (percentage > 0) {
        percentage = Math.min(percentage, 40) // 正值最高40
      } else {
        percentage = Math.max(percentage, -20) // 负值最低-20
      }
      
      // 将百分比转换为电量值（1%对应800万千瓦时基础值+200万基数）
      // 对于负值，直接乘以系数，保持负号
      let volume = Math.round(percentage * 800 + (percentage > 0 ? 200 : 0))
      
      monthData[type.value] = volume
      monthData.total += volume // 累加计算总量（包括正负）
    })
    
    return monthData
  })
  
  // 根据选定的日期范围过滤数据
  statisticsData.compositionData = filterDataByMonths(fullYearData)
}

// 生成月份持仓均价数据
function fetchPriceByMonthData() {
  // 模拟价格基础数据
  const basePrices = {
    yearly_bilateral: 0.42,
    yearly_listing: 0.45,
    yearly_central: 0.44,
    multimonth_bilateral: 0.48,
    multimonth_central: 0.47,
    monthly_bilateral: 0.52,
    monthly_central: 0.53,
    monthly_timeframe: 0.55,
    multiday_timeframe: 0.58,
  }
  
  // 月度波动系数(%)，模拟价格的月度变化趋势
  const monthlyFluctuation = [
    -2, -1, 0, 1, 3, 5, 8, 6, 4, 2, 0, -1
  ]
  
  // 日前价格基础值(高于合约均价)
  const baseSpotPrice = 0.60
  
  // 生成全年数据
  const fullYearData = allMonths.value.map((month, monthIndex) => {
    const monthData = {
      month: month,
      averagePrice: 0,
      spotPrice: baseSpotPrice * (1 + monthlyFluctuation[monthIndex] / 100)
    }
    
    let totalWeight = 0
    let weightedPriceSum = 0
    
    // 为每种交易类型添加价格
    statisticsData.tradeTypes.forEach(type => {
      // 基础价格加上月度波动影响
      const basePrice = basePrices[type.value]
      const randomVariation = (Math.random() * 0.01 - 0.005) // 小的随机波动 ±0.005
      const monthImpact = basePrice * (monthlyFluctuation[monthIndex] / 100)
      
      // 最终价格 = 基础价格 + 随机波动 + 月度影响
      const price = basePrice + randomVariation + monthImpact
      monthData[type.value] = parseFloat(price.toFixed(4))
      
      // 获取该类型在此月的电量
      const volumeData = statisticsData.compositionData.find(item => item.month === month)
      const volume = volumeData ? volumeData[type.value] || 0 : 0
      
      // 计算加权价格
      if (volume > 0) {
        weightedPriceSum += price * volume
        totalWeight += volume
      }
    })
    
    // 计算加权平均价格
    monthData.averagePrice = totalWeight > 0 
      ? parseFloat((weightedPriceSum / totalWeight).toFixed(4)) 
      : 0
    
    return monthData
  })
  
  // 根据选定的日期范围过滤数据
  statisticsData.priceByMonthData = filterDataByMonths(fullYearData)
}

// 生命周期钩子
onMounted(() => {
  // 初始加载自动获取数据
  loadData()
  
  // 监听窗口大小变化，以便重新调整图表大小
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  // 清理图表实例以避免内存泄漏
  if (compositionChart) {
    compositionChart.dispose()
    compositionChart = null
  }
  if (priceTrendChart) {
    priceTrendChart.dispose()
    priceTrendChart = null
  }
  
  // 移除事件监听器
  window.removeEventListener('resize', handleResize)
})

// 窗口大小改变时重新绘制图表
const handleResize = () => {
  if (compositionChart) {
    compositionChart.resize()
  }
  if (priceTrendChart) {
    priceTrendChart.resize()
  }
}

// 初始化并渲染持仓组成图表
const initCompositionChart = () => {
  if (!compositionChartRef.value) return
  
  if (compositionChart) {
    compositionChart.dispose()
  }
  
  compositionChart = echarts.init(compositionChartRef.value)
  
  // 准备X轴数据(月份)
  const months = statisticsData.compositionData.map(item => item.month)
  
  // 准备每种交易品种的数据系列
  const series = statisticsData.tradeTypes.map(type => {
    // 计算每个月该类型交易的百分比
    const data = statisticsData.compositionData.map(item => {
      const value = item[type.value] || 0
      const absTotal = Object.values(item)
        .filter(v => typeof v === 'number' && v !== item.total)
        .reduce((sum, v) => sum + Math.abs(v), 0)
      
      // 计算百分比（相对于所有值的绝对值总和）
      // 保持原有正负号，但转换为百分比
      const percentage = absTotal > 0 ? (value / absTotal) * 100 : 0
      return parseFloat(percentage.toFixed(2))
    })
    
    return {
      name: type.label,
      type: 'bar',
      stack: 'total', // 柱状图堆叠
      emphasis: {
        focus: 'series'
      },
      data: data,
      barMaxWidth: 50
    }
  })
  
  const option = {
    title: {
      text: '持仓电量月度构成分析',
      left: 'center',
      top: 0
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        let result = params[0].name + '<br/>'
        
        // 格式化每个系列的数据
        params.forEach(item => {
          const percentage = parseFloat(item.value).toFixed(2)
          const color = item.color
          const label = item.value >= 0 ? '持有' : '卖出'
          
          result += `<span style="display:inline-block;margin-right:4px;border-radius:50%;width:10px;height:10px;background-color:${color};"></span>`
          result += `${item.seriesName}(${label}): ${Math.abs(percentage)}% <br/>`
        })
        
        // 计算当月总和
        const monthData = statisticsData.compositionData.find(item => item.month === params[0].name)
        if (monthData) {
          result += `<br/><span style="font-weight:bold;">当月净持仓: ${monthData.total.toFixed(2)} 万千瓦时</span>`
        }
        
        return result
      }
    },
    legend: {
      data: statisticsData.tradeTypes.map(type => type.label),
      top: 30,
      type: 'scroll'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
      top: 80
    },
    toolbox: {
      feature: {
        saveAsImage: { title: '保存为图片' }
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: true,
      data: months,
      axisLabel: {
        interval: 0,
        rotate: 30 // 旋转标签以避免重叠
      }
    },
    yAxis: {
      type: 'value',
      name: '百分比(%)',
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: series,
    color: [
      '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
      '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'
    ]
  }
  
  compositionChart.setOption(option)
}

// 初始化并渲染持仓均价趋势图表
const initPriceTrendChart = () => {
  if (!priceTrendChartRef.value) return
  
  if (priceTrendChart) {
    priceTrendChart.dispose()
  }
  
  priceTrendChart = echarts.init(priceTrendChartRef.value)
  
  // 准备X轴数据(月份)
  const months = statisticsData.priceByMonthData.map(item => item.month)
  
  // 准备平均价格数据和日前价格数据
  const avgPrices = statisticsData.priceByMonthData.map(item => item.averagePrice)
  const spotPrices = statisticsData.priceByMonthData.map(item => item.spotPrice)
  
  // 计算溢价区域的数据
  const premiumAreaData = spotPrices.map((spotPrice, index) => {
    const avgPrice = avgPrices[index]
    // 只保留溢价区域（日前价格高于均价的部分）
    return spotPrice > avgPrice ? spotPrice : avgPrice
  })
  
  const option = {
    title: {
      text: '持仓均价与日前价格月度趋势',
      left: 'center',
      top: 0
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      formatter: function(params) {
        let result = params[0].name + '<br/>'
        
        // 持仓均价和日前价格
        let holdingPrice = 0
        let spotPrice = 0
        
        // 格式化每个系列的数据
        params.forEach(item => {
          if (item.seriesName === '溢价区域') return
          
          const price = parseFloat(item.value).toFixed(4)
          const color = item.color
          result += `<span style="display:inline-block;margin-right:4px;border-radius:50%;width:10px;height:10px;background-color:${color};"></span>`
          result += `${item.seriesName}: ${price} 元/千瓦时<br/>`
          
          if (item.seriesName === '持仓均价') {
            holdingPrice = parseFloat(item.value)
          } else if (item.seriesName === '日前价格') {
            spotPrice = parseFloat(item.value)
          }
        })
        
        // 计算溢价/折价
        if (holdingPrice > 0 && spotPrice > 0) {
          const premium = (spotPrice - holdingPrice).toFixed(4)
          const premiumPercent = ((spotPrice / holdingPrice - 1) * 100).toFixed(2)
          const isPositive = premium > 0
          
          const textColor = isPositive ? '#ff9800' : '#67c23a'
          const prefix = isPositive ? '溢价' : '折价'
          
          result += `<br/><span style="color: ${textColor};">${prefix}: ${Math.abs(premium)} 元/千瓦时 (${Math.abs(premiumPercent)}%)</span>`
        }
        
        return result
      }
    },
    legend: {
      data: ['持仓均价', '日前价格'],
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
      top: 80
    },
    toolbox: {
      feature: {
        saveAsImage: { title: '保存为图片' }
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: months
    },
    yAxis: {
      type: 'value',
      name: '价格（元/千瓦时）',
      axisLabel: {
        formatter: '{value} 元'
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '溢价区域',
        type: 'line',
        stack: 'price',
        symbol: 'none',
        lineStyle: { opacity: 0 },
        areaStyle: {
          color: '#ff9800',
          opacity: 0.2
        },
        data: premiumAreaData,
        z: 1
      },
      {
        name: '持仓均价',
        type: 'line',
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#3a47d4'
        },
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: '#3a47d4'
        },
        emphasis: {
          focus: 'series'
        },
        z: 3,
        data: avgPrices
      },
      {
        name: '日前价格',
        type: 'line',
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#ff9800'
        },
        symbol: 'diamond',
        symbolSize: 8,
        itemStyle: {
          color: '#ff9800'
        },
        emphasis: {
          focus: 'series'
        },
        z: 2,
        data: spotPrices
      }
    ]
  }
  
  priceTrendChart.setOption(option)
}

// 根据选择的月份范围过滤数据
const filterDataByMonths = (fullData) => {
  // 如果没有选择日期范围，返回全部数据
  if (!filteredMonths.value || filteredMonths.value.length === 0) {
    return fullData
  }
  
  // 根据filteredMonths过滤数据
  return fullData.filter(item => {
    return filteredMonths.value.includes(item.month)
  })
}
</script>

<style scoped>
.contract-statistics-container {
  width: 100%;
  padding-top: 0;
  /* padding: 20px;
  min-height: 100%; */
}

.statistics-main-title {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #303133;
}

.statistics-description {
  font-size: 14px;
  color: #606266;
  margin-bottom: 20px;
  line-height: 1.5;
}

.statistics-tip {
  font-size: 14px;
  color: #409EFF;
  margin-bottom: 15px;
  font-style: italic;
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

.bar-icon {
  background-color: #5470c6;
}

.premium-icon {
  background: linear-gradient(135deg, #3a47d4 0%, #3a47d4 50%, #ff9800 50%, #ff9800 100%);
}

.search-form-container {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
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

.subsection-title {
  font-weight: bold;
  font-size: 14px;
  margin: 15px 0 10px;
  color: #606266;
  padding-left: 10px;
  border-left: 3px solid #409EFF;
}

.subsection-description {
  font-size: 13px;
  color: #606266;
  margin-bottom: 15px;
  padding-left: 13px;
  font-style: italic;
}

.summary-total {
  margin-top: 15px;
  padding: 15px;
  background-color: #f8f8f8;
  border-radius: 4px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.total-item {
  margin-bottom: 10px;
  flex: 0 0 30%;
}

.total-label {
  font-weight: bold;
  color: #606266;
}

.total-value {
  margin-left: 10px;
  color: #303133;
  font-weight: 500;
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

.chart-container {
  height: 400px;
  width: 100%;
  margin-bottom: 20px;
}

@media screen and (max-width: 768px) {
  .summary-total {
    flex-direction: column;
  }
  
  .total-item {
    flex: 0 0 100%;
  }
  
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
}

.filter-container {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  margin-right: 20px;
  margin-bottom: 10px;
}

.filter-label {
  margin-right: 10px;
  font-weight: 500;
  color: #606266;
}
</style> 