<template>
  <div class="market-data-container">
    <el-card class="market-data-card">
      <template #header>
        <div class="card-header">
          <span>市场数据</span>
          <div class="header-actions">
            <el-date-picker
              v-model="selectedDate"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleDateChange"
            />
            <el-select v-model="selectedMarket" placeholder="选择市场类型" @change="handleMarketChange">
              <el-option v-for="item in marketOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-button type="primary" :icon="Refresh" size="small" @click="refreshData">刷新</el-button>
            <el-button type="success" :icon="Download" size="small" @click="exportData">导出</el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="市场价格" name="price">
          <div class="summary-cards">
            <el-card class="summary-card" shadow="hover">
              <template #header>
                <div class="summary-header">
                  <span>平均价格</span>
                </div>
              </template>
              <div class="summary-content">
                <div class="summary-value">{{ priceStats.average }}元/MWh</div>
                <div class="summary-change" :class="priceStats.averageChange >= 0 ? 'value-up' : 'value-down'">
                  {{ priceStats.averageChange >= 0 ? '+' : '' }}{{ priceStats.averageChange.toFixed(2) }}%
                </div>
              </div>
            </el-card>
            <el-card class="summary-card" shadow="hover">
              <template #header>
                <div class="summary-header">
                  <span>最高价格</span>
                </div>
              </template>
              <div class="summary-content">
                <div class="summary-value">{{ priceStats.max }}元/MWh</div>
                <div class="summary-time">{{ priceStats.maxTime }}</div>
              </div>
            </el-card>
            <el-card class="summary-card" shadow="hover">
              <template #header>
                <div class="summary-header">
                  <span>最低价格</span>
                </div>
              </template>
              <div class="summary-content">
                <div class="summary-value">{{ priceStats.min }}元/MWh</div>
                <div class="summary-time">{{ priceStats.minTime }}</div>
              </div>
            </el-card>
            <el-card class="summary-card" shadow="hover">
              <template #header>
                <div class="summary-header">
                  <span>峰谷差</span>
                </div>
              </template>
              <div class="summary-content">
                <div class="summary-value">{{ priceStats.peakValleyDiff }}元/MWh</div>
                <div class="summary-rate">{{ priceStats.peakValleyRatio.toFixed(2) }}</div>
              </div>
            </el-card>
          </div>
          <el-table :data="priceData" style="width: 100%" v-loading="loading" border stripe>
            <el-table-column prop="time" label="时段" width="120" />
            <el-table-column prop="price" label="价格(元/MWh)" width="150" />
            <el-table-column prop="change" label="较前日涨跌" width="150">
              <template #default="scope">
                <span :class="[scope.row.change >= 0 ? 'price-up' : 'price-down']">
                  {{ scope.row.change >= 0 ? '+' : '' }}{{ scope.row.change.toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="note" label="备注" />
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="市场负荷" name="load">
          <div class="summary-cards">
            <el-card class="summary-card" shadow="hover">
              <template #header>
                <div class="summary-header">
                  <span>最大负荷</span>
                </div>
              </template>
              <div class="summary-content">
                <div class="summary-value">{{ loadStats.max }}MW</div>
                <div class="summary-time">{{ loadStats.maxTime }}</div>
              </div>
            </el-card>
            <el-card class="summary-card" shadow="hover">
              <template #header>
                <div class="summary-header">
                  <span>最小负荷</span>
                </div>
              </template>
              <div class="summary-content">
                <div class="summary-value">{{ loadStats.min }}MW</div>
                <div class="summary-time">{{ loadStats.minTime }}</div>
              </div>
            </el-card>
            <el-card class="summary-card" shadow="hover">
              <template #header>
                <div class="summary-header">
                  <span>平均负荷</span>
                </div>
              </template>
              <div class="summary-content">
                <div class="summary-value">{{ loadStats.average }}MW</div>
                <div class="summary-change" :class="loadStats.changeRate >= 0 ? 'value-up' : 'value-down'">
                  {{ loadStats.changeRate >= 0 ? '+' : '' }}{{ loadStats.changeRate.toFixed(2) }}%
                </div>
              </div>
            </el-card>
            <el-card class="summary-card" shadow="hover">
              <template #header>
                <div class="summary-header">
                  <span>负荷率</span>
                </div>
              </template>
              <div class="summary-content">
                <div class="summary-value">{{ loadStats.loadFactor.toFixed(2) }}%</div>
                <div class="summary-info">{{ loadStats.evaluation }}</div>
              </div>
            </el-card>
          </div>
          <el-table :data="loadData" style="width: 100%" v-loading="loading" border stripe>
            <el-table-column prop="time" label="时段" width="120" />
            <el-table-column prop="forecast" label="预测负荷(MW)" width="150" />
            <el-table-column prop="actual" label="实际负荷(MW)" width="150" />
            <el-table-column prop="deviation" label="偏差率(%)" width="150">
              <template #default="scope">
                <span :class="[Math.abs(scope.row.deviation) > 3 ? 'deviation-high' : 'deviation-normal']">
                  {{ scope.row.deviation.toFixed(2) }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="note" label="备注" />
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="交易数据" name="trade">
          <div class="summary-cards">
            <el-card class="summary-card" shadow="hover">
              <template #header>
                <div class="summary-header">
                  <span>总交易量</span>
                </div>
              </template>
              <div class="summary-content">
                <div class="summary-value">{{ tradeStats.totalVolume }}MWh</div>
                <div class="summary-info">共{{ tradeData.length }}笔交易</div>
              </div>
            </el-card>
            <el-card class="summary-card" shadow="hover">
              <template #header>
                <div class="summary-header">
                  <span>平均价格</span>
                </div>
              </template>
              <div class="summary-content">
                <div class="summary-value">{{ tradeStats.avgPrice }}元/MWh</div>
                <div class="summary-change" :class="tradeStats.priceChange >= 0 ? 'value-up' : 'value-down'">
                  {{ tradeStats.priceChange >= 0 ? '+' : '' }}{{ tradeStats.priceChange.toFixed(2) }}%
                </div>
              </div>
            </el-card>
            <el-card class="summary-card" shadow="hover">
              <template #header>
                <div class="summary-header">
                  <span>交易金额</span>
                </div>
              </template>
              <div class="summary-content">
                <div class="summary-value">{{ tradeStats.totalAmount }}元</div>
                <div class="summary-change" :class="tradeStats.amountChange >= 0 ? 'value-up' : 'value-down'">
                  {{ tradeStats.amountChange >= 0 ? '+' : '' }}{{ tradeStats.amountChange.toFixed(2) }}%
                </div>
              </div>
            </el-card>
            <el-card class="summary-card" shadow="hover">
              <template #header>
                <div class="summary-header">
                  <span>结算比例</span>
                </div>
              </template>
              <div class="summary-content">
                <div class="summary-value">{{ tradeStats.settledRate.toFixed(2) }}%</div>
                <div class="summary-progress">
                  <el-progress :percentage="tradeStats.settledRate" :color="tradeStats.settledColor" />
                </div>
              </div>
            </el-card>
          </div>
          <el-table :data="tradeData" style="width: 100%" v-loading="loading" border stripe>
            <el-table-column prop="tradeId" label="交易ID" width="100" />
            <el-table-column prop="time" label="时段" width="120" />
            <el-table-column prop="volume" label="交易电量(MWh)" width="150" />
            <el-table-column prop="price" label="成交价格(元/MWh)" width="150" />
            <el-table-column prop="amount" label="交易金额(元)" width="150" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === '已结算' ? 'success' : 
                               scope.row.status === '待结算' ? 'warning' : 'info'">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="tradeType" label="交易类型" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { Download, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 市场类型选项
const marketOptions = [
  { value: 'dayAhead', label: '日前市场' },
  { value: 'realTime', label: '实时市场' },
  { value: 'monthly', label: '月度市场' },
  { value: 'annual', label: '年度市场' }
]

// 响应式变量
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const selectedMarket = ref('dayAhead')
const activeTab = ref('price')
const loading = ref(true)

// 表格数据
const priceData = ref([])
const loadData = ref([])
const tradeData = ref([])

// 统计数据
const priceStats = reactive({
  average: 0,
  averageChange: 0,
  max: 0,
  maxTime: '',
  min: 0,
  minTime: '',
  peakValleyDiff: 0,
  peakValleyRatio: 0
})

const loadStats = reactive({
  max: 0,
  maxTime: '',
  min: 0,
  minTime: '',
  average: 0,
  changeRate: 0,
  loadFactor: 0,
  evaluation: '正常'
})

const tradeStats = reactive({
  totalVolume: 0,
  avgPrice: 0,
  totalAmount: 0,
  settledRate: 0,
  settledColor: '#67c23a',
  priceChange: 0,
  amountChange: 0
})

// 初始化加载
onMounted(() => {
  fetchMarketData()
})

// 获取市场数据
const fetchMarketData = async () => {
  loading.value = true
  
  try {
    // 模拟数据加载延迟
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 根据当前选项加载不同的数据
    if (activeTab.value === 'price') {
      loadPriceData()
    } else if (activeTab.value === 'load') {
      loadLoadData()
    } else if (activeTab.value === 'trade') {
      loadTradeData()
    }
  } catch (error) {
    console.error('获取市场数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 模拟价格数据
const loadPriceData = () => {
  const basePrice = selectedMarket.value === 'dayAhead' ? 350 : 
                   selectedMarket.value === 'realTime' ? 380 :
                   selectedMarket.value === 'monthly' ? 320 : 300
                   
  priceData.value = Array.from({ length: 24 }, (_, i) => {
    const timeIndex = i
    const hour = timeIndex.toString().padStart(2, '0')
    const nextHour = ((timeIndex + 1) % 24).toString().padStart(2, '0')
    const hourVariation = Math.sin(timeIndex / 24 * Math.PI * 2) * 30
    const randVariation = (Math.random() - 0.5) * 20
    const price = basePrice + hourVariation + randVariation
    const change = (Math.random() - 0.3) * 15

    return {
      time: `${hour}:00-${nextHour}:00`,
      price: price.toFixed(2),
      change,
      note: price > basePrice + 20 ? '高峰时段' : price < basePrice - 20 ? '低谷时段' : '平段'
    }
  })
  
  // 计算统计数据
  if (priceData.value.length > 0) {
    const prices = priceData.value.map(item => parseFloat(item.price))
    const maxPrice = Math.max(...prices)
    const minPrice = Math.min(...prices)
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
    
    const maxPriceItem = priceData.value.find(item => parseFloat(item.price) === maxPrice)
    const minPriceItem = priceData.value.find(item => parseFloat(item.price) === minPrice)
    
    priceStats.average = avgPrice.toFixed(2)
    priceStats.averageChange = (Math.random() * 10 - 5) // 模拟与前一日的变化率
    priceStats.max = maxPrice.toFixed(2)
    priceStats.maxTime = maxPriceItem ? maxPriceItem.time : ''
    priceStats.min = minPrice.toFixed(2)
    priceStats.minTime = minPriceItem ? minPriceItem.time : ''
    priceStats.peakValleyDiff = (maxPrice - minPrice).toFixed(2)
    priceStats.peakValleyRatio = maxPrice / minPrice
  }
}

// 模拟负荷数据
const loadLoadData = () => {
  const baseLoad = selectedMarket.value === 'dayAhead' ? 25000 : 
                  selectedMarket.value === 'realTime' ? 26000 :
                  selectedMarket.value === 'monthly' ? 24000 : 23000
                  
  loadData.value = Array.from({ length: 24 }, (_, i) => {
    const timeIndex = i
    const hour = timeIndex.toString().padStart(2, '0')
    const nextHour = ((timeIndex + 1) % 24).toString().padStart(2, '0')
    const hourFactor = 1 + Math.sin((timeIndex - 8) / 24 * Math.PI * 2) * 0.3
    const forecastLoad = baseLoad * hourFactor
    const actualLoad = forecastLoad * (1 + (Math.random() - 0.5) * 0.1)
    const deviation = ((actualLoad - forecastLoad) / forecastLoad) * 100

    return {
      time: `${hour}:00-${nextHour}:00`,
      forecast: Math.round(forecastLoad),
      actual: Math.round(actualLoad),
      deviation,
      note: timeIndex >= 8 && timeIndex <= 11 ? '上午高峰' : 
           timeIndex >= 17 && timeIndex <= 21 ? '晚间高峰' : 
           timeIndex >= 1 && timeIndex <= 5 ? '夜间低谷' : '平段'
    }
  })
  
  // 计算统计数据
  if (loadData.value.length > 0) {
    const actualLoads = loadData.value.map(item => parseFloat(item.actual))
    const maxLoad = Math.max(...actualLoads)
    const minLoad = Math.min(...actualLoads)
    const avgLoad = actualLoads.reduce((sum, load) => sum + load, 0) / actualLoads.length
    
    const maxLoadItem = loadData.value.find(item => parseFloat(item.actual) === maxLoad)
    const minLoadItem = loadData.value.find(item => parseFloat(item.actual) === minLoad)
    
    loadStats.max = maxLoad.toFixed(0)
    loadStats.maxTime = maxLoadItem ? maxLoadItem.time : ''
    loadStats.min = minLoad.toFixed(0)
    loadStats.minTime = minLoadItem ? minLoadItem.time : ''
    loadStats.average = avgLoad.toFixed(0)
    loadStats.changeRate = (Math.random() * 6 - 3) // 模拟与前一日的变化率
    loadStats.loadFactor = (avgLoad / maxLoad) * 100
    
    // 评估负荷率
    if (loadStats.loadFactor > 85) {
      loadStats.evaluation = '优秀'
    } else if (loadStats.loadFactor > 75) {
      loadStats.evaluation = '良好'
    } else if (loadStats.loadFactor > 65) {
      loadStats.evaluation = '一般'
    } else {
      loadStats.evaluation = '欠佳'
    }
  }
}

// 模拟交易数据
const loadTradeData = () => {
  const tradesCount = selectedMarket.value === 'dayAhead' ? 15 : 
                      selectedMarket.value === 'realTime' ? 24 :
                      selectedMarket.value === 'monthly' ? 8 : 5
  
  const basePrice = selectedMarket.value === 'dayAhead' ? 350 : 
                   selectedMarket.value === 'realTime' ? 380 :
                   selectedMarket.value === 'monthly' ? 320 : 300
                   
  const tradeTypes = ['双边交易', '集中竞价', '挂牌交易', '合约交易']
  const statuses = ['已结算', '待结算', '处理中']
  
  tradeData.value = Array.from({ length: tradesCount }, (_, i) => {
    const timeIndex = Math.floor(Math.random() * 24)
    const hour = timeIndex.toString().padStart(2, '0')
    const nextHour = ((timeIndex + 1) % 24).toString().padStart(2, '0')
    const volume = Math.round((Math.random() * 200 + 50) * 10) / 10
    const price = basePrice + (Math.random() - 0.5) * 50
    const amount = price * volume
    
    return {
      tradeId: `T${selectedDate.value.replace(/-/g, '')}${(i + 1).toString().padStart(3, '0')}`,
      time: `${hour}:00-${nextHour}:00`,
      volume: volume.toFixed(1),
      price: price.toFixed(2),
      amount: amount.toFixed(2),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      tradeType: tradeTypes[Math.floor(Math.random() * tradeTypes.length)]
    }
  })
  
  // 按时段排序
  tradeData.value.sort((a, b) => a.time.localeCompare(b.time))
  
  // 计算统计数据
  if (tradeData.value.length > 0) {
    // 计算总交易量、平均价格和总金额
    let totalVolume = 0
    let totalAmount = 0
    let settledCount = 0
    
    tradeData.value.forEach(trade => {
      totalVolume += parseFloat(trade.volume)
      totalAmount += parseFloat(trade.amount)
      if (trade.status === '已结算') {
        settledCount++
      }
    })
    
    const avgPrice = totalAmount / totalVolume
    const settledRate = (settledCount / tradeData.value.length) * 100
    
    tradeStats.totalVolume = totalVolume.toFixed(1)
    tradeStats.avgPrice = avgPrice.toFixed(2)
    tradeStats.totalAmount = totalAmount.toFixed(2)
    tradeStats.settledRate = settledRate
    tradeStats.priceChange = (Math.random() * 8 - 4) // 模拟价格变化率
    tradeStats.amountChange = (Math.random() * 10 - 5) // 模拟金额变化率
    
    // 设置结算比例的颜色
    if (settledRate >= 80) {
      tradeStats.settledColor = '#67c23a' // 绿色
    } else if (settledRate >= 50) {
      tradeStats.settledColor = '#e6a23c' // 黄色
    } else {
      tradeStats.settledColor = '#f56c6c' // 红色
    }
  }
}

// 处理日期变化
const handleDateChange = () => {
  fetchMarketData()
}

// 处理市场类型变化
const handleMarketChange = () => {
  fetchMarketData()
}

// 处理标签页切换
const handleTabChange = () => {
  fetchMarketData()
}

// 刷新数据
const refreshData = () => {
  ElMessage.success('数据已刷新')
  fetchMarketData()
}

// 导出数据
const exportData = () => {
  const tabData = activeTab.value === 'price' ? priceData.value :
                 activeTab.value === 'load' ? loadData.value :
                 tradeData.value
  
  if (!tabData || tabData.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  
  // 构建CSV数据
  const headers = Object.keys(tabData[0])
  const csvContent = [
    headers.join(','),
    ...tabData.map(row => headers.map(key => {
      // 包装带逗号的字段
      let cellData = row[key]
      if (typeof cellData === 'string' && cellData.includes(',')) {
        return `"${cellData}"`
      }
      return cellData
    }).join(','))
  ].join('\n')
  
  // 创建Blob并下载
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  // 设置文件名
  const fileName = `市场数据_${selectedMarket.value}_${activeTab.value}_${selectedDate.value}.csv`
  
  link.setAttribute('href', url)
  link.setAttribute('download', fileName)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success('数据导出成功')
}
</script>

<style scoped>
.market-data-container {
  width: 100%;
  height: 100%;
}

.market-data-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.price-up {
  color: #f56c6c;
  font-weight: bold;
}

.price-down {
  color: #67c23a;
  font-weight: bold;
}

.deviation-high {
  color: #e6a23c;
  font-weight: bold;
}

.deviation-normal {
  color: #409eff;
}

.data-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: #909399;
}

:deep(.el-card__body) {
  padding: 10px;
  height: calc(100% - 60px);
  overflow: auto;
}

:deep(.el-tabs__content) {
  height: calc(100% - 40px);
  overflow: auto;
}

.summary-cards {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.summary-card {
  flex: 1;
  min-width: 180px;
}

.summary-header {
  font-size: 14px;
  color: #606266;
}

.summary-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.summary-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.summary-change, .summary-time, .summary-rate, .summary-info {
  font-size: 12px;
  color: #909399;
}

.value-up {
  color: #f56c6c;
}

.value-down {
  color: #67c23a;
}

.summary-progress {
  width: 100%;
  margin-top: 5px;
}
</style> 