<template>
  <div class="customer-electricity-data">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>客户电量数据</span>
          <el-tooltip content="查看客户的月度、分时用电数据" placement="top">
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
      </template>
      
      <!-- 水平筛选条件区域 -->
      <el-form :model="queryForm" inline class="filter-form">
        <el-form-item label="数据周期">
          <el-select v-model="queryForm.period" placeholder="请选择数据周期" style="width: 120px">
            <el-option label="月度数据" value="monthly"></el-option>
            <el-option label="日分时数据" value="hourly"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="日期范围" v-if="queryForm.period === 'monthly'">
          <el-date-picker
            v-model="queryForm.dateRange"
            type="monthrange"
            range-separator="至"
            start-placeholder="开始月份"
            end-placeholder="结束月份"
            format="YYYY-MM"
            value-format="YYYY-MM"
          ></el-date-picker>
        </el-form-item>
        
        <el-form-item label="选择日期" v-if="queryForm.period === 'hourly'">
          <el-date-picker
            v-model="queryForm.date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          ></el-date-picker>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="searchData" :loading="loading">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetForm">
            <el-icon><RefreshRight /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>
      
      <!-- 月度数据展示 -->
      <div v-else-if="hasData && queryForm.period === 'monthly'">
        <el-descriptions title="客户基本信息" :column="3" border>
          <el-descriptions-item label="客户编号">{{ electricityData.customer.id }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ electricityData.customer.name }}</el-descriptions-item>
          <el-descriptions-item label="用户类型">{{ electricityData.customer.type }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="table-title">月度电量数据</div>
        <el-table :data="electricityData.monthlyData" stripe border style="width: 100%">
          <el-table-column prop="month" label="月份" width="120" />
          <el-table-column prop="totalConsumption" label="总用电量(kWh)" width="150">
            <template #default="scope">
              {{ formatNumber(scope.row.totalConsumption) }}
            </template>
          </el-table-column>
          <el-table-column prop="peakConsumption" label="峰时电量(kWh)" width="150">
            <template #default="scope">
              {{ formatNumber(scope.row.peakConsumption) }}
            </template>
          </el-table-column>
          <el-table-column prop="valleyConsumption" label="谷时电量(kWh)" width="150">
            <template #default="scope">
              {{ formatNumber(scope.row.valleyConsumption) }}
            </template>
          </el-table-column>
          <el-table-column prop="flatConsumption" label="平时电量(kWh)" width="150">
            <template #default="scope">
              {{ formatNumber(scope.row.flatConsumption) }}
            </template>
          </el-table-column>
          <el-table-column prop="averagePrice" label="平均电价(元/kWh)" width="170">
            <template #default="scope">
              {{ scope.row.averagePrice.toFixed(4) }}
            </template>
          </el-table-column>
          <el-table-column prop="totalCost" label="电费总额(元)" width="150">
            <template #default="scope">
              {{ formatNumber(scope.row.totalCost, 2) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 分时数据展示 -->
      <div v-else-if="hasData && queryForm.period === 'hourly'">
        <el-descriptions title="客户基本信息" :column="3" border>
          <el-descriptions-item label="客户编号">{{ electricityData.customer.id }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ electricityData.customer.name }}</el-descriptions-item>
          <el-descriptions-item label="用户类型">{{ electricityData.customer.type }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="table-title">日期: {{ electricityData.hourlyData.date }} 分时电量数据</div>
        <el-table :data="electricityData.hourlyData.data" stripe border style="width: 100%">
          <el-table-column prop="hour" label="时段" width="80">
            <template #default="scope">
              {{ scope.row.hour }}:00
            </template>
          </el-table-column>
          <el-table-column prop="consumption" label="用电量(kWh)" width="120">
            <template #default="scope">
              {{ formatNumber(scope.row.consumption) }}
            </template>
          </el-table-column>
          <el-table-column prop="price" label="电价(元/kWh)" width="130">
            <template #default="scope">
              {{ scope.row.price.toFixed(4) }}
            </template>
          </el-table-column>
          <el-table-column prop="cost" label="电费(元)" width="120">
            <template #default="scope">
              {{ formatNumber(scope.row.cost, 2) }}
            </template>
          </el-table-column>
          <el-table-column prop="periodType" label="时段类型" width="100">
            <template #default="scope">
              <el-tag 
                :type="scope.row.periodType === 'peak' ? 'danger' : 
                       scope.row.periodType === 'valley' ? 'success' : 'warning'">
                {{ scope.row.periodType === 'peak' ? '峰时段' : 
                   scope.row.periodType === 'valley' ? '谷时段' : '平时段' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="load" label="负荷率" width="100">
            <template #default="scope">
              {{ (scope.row.load * 100).toFixed(2) }}%
            </template>
          </el-table-column>
        </el-table>
        
        <div class="table-title">分时段汇总</div>
        <el-table :data="getPeriodSummary()" stripe border style="width: 100%">
          <el-table-column prop="name" label="时段类型" width="120" />
          <el-table-column prop="consumption" label="电量(kWh)" width="120">
            <template #default="scope">
              {{ formatNumber(scope.row.consumption) }}
            </template>
          </el-table-column>
          <el-table-column prop="ratio" label="占比" width="100">
            <template #default="scope">
              {{ scope.row.ratio }}%
            </template>
          </el-table-column>
          <el-table-column prop="price" label="电价(元/kWh)" width="140">
            <template #default="scope">
              {{ scope.row.price.toFixed(4) }}
            </template>
          </el-table-column>
          <el-table-column prop="period" label="时间段" />
        </el-table>
      </div>
      
      <!-- 空数据状态 -->
      <el-empty v-else description="请选择条件进行查询" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, RefreshRight, QuestionFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 查询表单数据
const queryForm = reactive({
  period: 'monthly',  // 默认月度数据
  dateRange: [],
  date: ''
})

// 控制状态
const loading = ref(false)
const electricityData = ref(null)
const hasData = computed(() => electricityData.value !== null)

// 查询数据方法
const searchData = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    // 模拟API请求延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟请求数据
    electricityData.value = generateMockData()
    
    ElMessage.success('数据加载成功')
  } catch (error) {
    ElMessage.error('数据加载失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 表单验证
const validateForm = () => {
  if (queryForm.period === 'monthly' && (!queryForm.dateRange || queryForm.dateRange.length < 2)) {
    ElMessage.warning('请选择月份范围')
    return false
  }
  
  if (queryForm.period === 'hourly' && !queryForm.date) {
    ElMessage.warning('请选择日期')
    return false
  }
  
  return true
}

// 重置表单
const resetForm = () => {
  queryForm.dateRange = []
  queryForm.date = ''
  electricityData.value = null
}

// 生成模拟数据
const generateMockData = () => {
  // 根据不同的查询类型生成不同的数据
  if (queryForm.period === 'monthly') {
    return generateMonthlyData()
  } else {
    return generateHourlyData()
  }
}

// 生成月度数据
const generateMonthlyData = () => {
  // 客户基本信息
  const customer = {
    id: 'C370702',
    name: '示例客户5',
    type: 'commercial'
  }
  
  // 月度数据
  let startDate = queryForm.dateRange && queryForm.dateRange.length > 0
    ? new Date(queryForm.dateRange[0])
    : new Date('2023-01-01')
  let endDate = queryForm.dateRange && queryForm.dateRange.length > 1
    ? new Date(queryForm.dateRange[1])
    : new Date('2023-12-01')
  
  // 确保日期是有效的
  if (!(startDate instanceof Date && !isNaN(startDate))) startDate = new Date('2023-01-01')
  if (!(endDate instanceof Date && !isNaN(endDate))) endDate = new Date('2023-12-01')
  
  const monthlyData = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const year = current.getFullYear()
    const month = current.getMonth() + 1
    const baseConsumption = 100000 + Math.random() * 900000
    
    // 根据月份调整电量，夏冬季高，春秋季低
    let seasonFactor = 1
    if (month >= 6 && month <= 8) seasonFactor = 1.3  // 夏季
    else if (month >= 12 || month <= 2) seasonFactor = 1.2  // 冬季
    else seasonFactor = 0.9  // 春秋季
    
    const totalConsumption = Math.floor(baseConsumption * seasonFactor)
    const peakRatio = 0.3 + Math.random() * 0.2  // 30-50%
    const valleyRatio = 0.1 + Math.random() * 0.15  // 10-25%
    const flatRatio = 1 - peakRatio - valleyRatio
    
    const peakConsumption = Math.floor(totalConsumption * peakRatio)
    const valleyConsumption = Math.floor(totalConsumption * valleyRatio)
    const flatConsumption = Math.floor(totalConsumption * flatRatio)
    
    // 电价（元/kWh）
    const peakPrice = 0.8 + Math.random() * 0.4
    const valleyPrice = 0.3 + Math.random() * 0.2
    const flatPrice = 0.5 + Math.random() * 0.3
    
    // 计算总费用和平均电价
    const peakCost = peakConsumption * peakPrice
    const valleyCost = valleyConsumption * valleyPrice
    const flatCost = flatConsumption * flatPrice
    const totalCost = peakCost + valleyCost + flatCost
    const averagePrice = totalCost / totalConsumption
    
    monthlyData.push({
      month: `${year}-${month < 10 ? '0' + month : month}`,
      totalConsumption,
      peakConsumption,
      valleyConsumption,
      flatConsumption,
      averagePrice,
      totalCost,
      peakRatio,
      valleyRatio,
      flatRatio
    })
    
    // 移到下一个月
    current.setMonth(current.getMonth() + 1)
  }
  
  return {
    customer,
    monthlyData
  }
}

// 生成小时数据
const generateHourlyData = () => {
  // 客户基本信息
  const customer = {
    id: 'C370702',
    name: '示例客户5',
    type: 'commercial'
  }
  
  // 分时段数据
  const date = queryForm.date || new Date().toISOString().split('T')[0]
  const hourlyData = []
  
  // 峰时段的时间范围
  const peakHours = [10, 11, 12, 13, 14, 18, 19, 20]
  // 谷时段的时间范围
  const valleyHours = [0, 1, 2, 3, 4, 5, 6, 23]
  // 平时段的时间范围
  const flatHours = [7, 8, 9, 15, 16, 17, 21, 22]
  
  // 设置不同时段的基本电价
  const peakPrice = 0.8 + Math.random() * 0.4
  const valleyPrice = 0.3 + Math.random() * 0.2
  const flatPrice = 0.5 + Math.random() * 0.3
  
  // 生成24小时的数据
  for (let i = 0; i < 24; i++) {
    let periodType = ''
    let price = 0
    
    if (peakHours.includes(i)) {
      periodType = 'peak'
      price = peakPrice + (Math.random() * 0.05 - 0.025) // 小幅波动
    } else if (valleyHours.includes(i)) {
      periodType = 'valley'
      price = valleyPrice + (Math.random() * 0.03 - 0.015) // 小幅波动
    } else {
      periodType = 'flat'
      price = flatPrice + (Math.random() * 0.04 - 0.02) // 小幅波动
    }
    
    // 基础电量，根据时段设置不同的基础负荷
    let baseConsumption = 0
    let loadFactor = 0
    
    if (periodType === 'peak') {
      baseConsumption = 100 + Math.random() * 100
      loadFactor = 0.7 + Math.random() * 0.25 // 70-95%
    } else if (periodType === 'valley') {
      baseConsumption = 30 + Math.random() * 50
      loadFactor = 0.3 + Math.random() * 0.2 // 30-50%
    } else {
      baseConsumption = 60 + Math.random() * 60
      loadFactor = 0.5 + Math.random() * 0.25 // 50-75%
    }
    
    // 根据工作时间调整电量
    let workDayFactor = 1
    if (i >= 9 && i <= 17) workDayFactor = 1.5 // 工作时间内用电量较高
    else if (i >= 22 || i <= 5) workDayFactor = 0.6 // 夜间用电量较低
    
    // 设置负荷率
    const load = loadFactor * workDayFactor > 1 ? 1 : loadFactor * workDayFactor
    
    // 计算最终电量 = 基础电量 * 工作时间因子 * (1 + 随机波动)
    const consumption = Math.floor(baseConsumption * workDayFactor * (1 + (Math.random() * 0.2 - 0.1)))
    // 计算电费
    const cost = consumption * price
    
    hourlyData.push({
      hour: i,
      consumption,
      price,
      cost,
      periodType,
      load
    })
  }
  
  // 统计汇总数据
  const peakConsumption = hourlyData
    .filter(item => item.periodType === 'peak')
    .reduce((sum, item) => sum + item.consumption, 0)
  
  const flatConsumption = hourlyData
    .filter(item => item.periodType === 'flat')
    .reduce((sum, item) => sum + item.consumption, 0)
  
  const valleyConsumption = hourlyData
    .filter(item => item.periodType === 'valley')
    .reduce((sum, item) => sum + item.consumption, 0)
  
  const totalConsumption = peakConsumption + flatConsumption + valleyConsumption
  
  // 计算电价和总费用
  const totalCost = hourlyData.reduce((sum, item) => sum + item.cost, 0)
  const avgPrice = totalCost / totalConsumption
  
  // 计算各时段占比
  const peakRatio = peakConsumption / totalConsumption
  const flatRatio = flatConsumption / totalConsumption
  const valleyRatio = valleyConsumption / totalConsumption
  
  return {
    customer,
    hourlyData: {
      date,
      data: hourlyData,
      summary: {
        totalConsumption,
        peakConsumption,
        flatConsumption,
        valleyConsumption,
        peakPrice,
        flatPrice,
        valleyPrice,
        totalCost,
        avgPrice,
        peakRatio,
        flatRatio,
        valleyRatio
      }
    }
  }
}

// 获取分时段汇总数据
const getPeriodSummary = () => {
  if (!electricityData.value || !electricityData.value.hourlyData) return []
  
  const summary = electricityData.value.hourlyData.summary
  return [
    {
      name: '峰时段', 
      consumption: summary.peakConsumption,
      ratio: (summary.peakRatio * 100).toFixed(2),
      price: summary.peakPrice,
      period: '10:00-15:00, 18:00-21:00'
    },
    {
      name: '平时段', 
      consumption: summary.flatConsumption,
      ratio: (summary.flatRatio * 100).toFixed(2),
      price: summary.flatPrice,
      period: '07:00-10:00, 15:00-18:00, 21:00-23:00'
    },
    {
      name: '谷时段', 
      consumption: summary.valleyConsumption,
      ratio: (summary.valleyRatio * 100).toFixed(2),
      price: summary.valleyPrice,
      period: '23:00-次日07:00'
    },
    {
      name: '合计', 
      consumption: summary.totalConsumption,
      ratio: '100.00',
      price: summary.avgPrice,
      period: '全天'
    }
  ]
}

// 格式化数字
const formatNumber = (num, decimals = 0) => {
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

// 自动填充默认表单数据
onMounted(() => {
  if (!queryForm.dateRange.length) {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const endDate = new Date(now.getFullYear(), now.getMonth(), 1)
    queryForm.dateRange = [
      startDate.toISOString().slice(0, 7),
      endDate.toISOString().slice(0, 7)
    ]
  }
  
  if (!queryForm.date) {
    queryForm.date = new Date().toISOString().split('T')[0]
  }
})
</script>

<style scoped>
.customer-electricity-data {
  width: 100%;
  height: 100%;
}

.main-card {
  margin-bottom: 20px;
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-form {
  margin-bottom: 15px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.loading-container {
  padding: 20px;
  min-height: 300px;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.table-title {
  font-size: 16px;
  font-weight: bold;
  margin: 15px 0 10px 0;
  padding-left: 5px;
  border-left: 4px solid #409eff;
}

/* 添加表格容器样式 */
.el-card__body {
  height: calc(100% - 60px);
  padding: 15px;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

/* 让描述列表更紧凑 */
:deep(.el-descriptions) {
  margin-bottom: 10px;
}

:deep(.el-descriptions__body) {
  padding: 0;
}

:deep(.el-descriptions__cell) {
  padding: 8px;
}

/* 让表格占据剩余空间 */
:deep(.el-table) {
  flex: 1;
}

:deep(.el-table__body) {
  width: 100% !important;
}

:deep(.el-table__header) {
  width: 100% !important;
}
</style> 