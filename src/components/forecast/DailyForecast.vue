<template>
  <div class="daily-forecast">
    <el-card class="forecast-card">
      <template #header>
        <div class="card-header">
          <span>日总电量预测</span>
        </div>
      </template>
      
      <el-form :model="forecastParams" label-width="120px" class="forecast-form">
        <el-form-item label="预测日期">
          <el-date-picker 
            v-model="forecastParams.date" 
            type="date" 
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="用户类型">
          <el-select v-model="forecastParams.userType" placeholder="选择用户类型" clearable>
            <el-option label="工业用户" value="industrial" />
            <el-option label="商业用户" value="commercial" />
            <el-option label="居民用户" value="residential" />
            <el-option label="农业用户" value="agricultural" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="预测方法">
          <el-radio-group v-model="forecastParams.method">
            <el-radio label="lstm">LSTM深度学习</el-radio>
            <el-radio label="xgboost">XGBoost</el-radio>
            <el-radio label="arima">ARIMA时序分析</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="startForecast">开始预测</el-button>
          <el-button @click="resetForm">重置参数</el-button>
        </el-form-item>
      </el-form>
      
      <el-divider content-position="center">预测结果</el-divider>
      
      <div v-if="forecastResult.loading" class="result-loading">
        <el-skeleton :rows="5" animated />
      </div>
      
      <div v-else-if="forecastResult.data" class="forecast-result">
        <el-descriptions title="预测结果详情" :column="2" border>
          <el-descriptions-item label="预测日期">{{ forecastResult.data.date }}</el-descriptions-item>
          <el-descriptions-item label="预测电量">{{ forecastResult.data.value }} 万千瓦时</el-descriptions-item>
          <el-descriptions-item label="同比变化">
            <span :class="forecastResult.data.yearChange >= 0 ? 'up' : 'down'">
              {{ forecastResult.data.yearChange >= 0 ? '+' : '' }}{{ forecastResult.data.yearChange }}%
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="环比变化">
            <span :class="forecastResult.data.monthChange >= 0 ? 'up' : 'down'">
              {{ forecastResult.data.monthChange >= 0 ? '+' : '' }}{{ forecastResult.data.monthChange }}%
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="准确度区间" :span="2">
            {{ forecastResult.data.minValue }} ~ {{ forecastResult.data.maxValue }} 万千瓦时 (置信度95%)
          </el-descriptions-item>
        </el-descriptions>
        
        <el-card class="historical-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>历史准确度</span>
            </div>
          </template>
          <el-table :data="historyRecords" stripe style="width: 100%">
            <el-table-column prop="date" label="日期" />
            <el-table-column prop="forecast" label="预测值(万千瓦时)" />
            <el-table-column prop="actual" label="实际值(万千瓦时)" />
            <el-table-column prop="accuracy" label="准确率">
              <template #default="scope">
                <el-progress 
                  :percentage="parseFloat(scope.row.accuracy)" 
                  :status="scope.row.accuracy > 95 ? 'success' : scope.row.accuracy > 85 ? 'warning' : 'exception'"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
        
        <el-card class="suggestion-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>优化建议</span>
            </div>
          </template>
          <ul class="suggestion-list">
            <li v-for="(suggestion, index) in forecastResult.data.suggestions" :key="index">
              {{ suggestion }}
            </li>
          </ul>
        </el-card>
      </div>
      
      <div v-else class="empty-result">
        <el-empty description="暂无预测数据，请设置参数并点击开始预测" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Calendar, DataAnalysis, Connection } from '@element-plus/icons-vue'

const forecastParams = reactive({
  date: new Date().toISOString().slice(0, 10),
  userType: '',
  method: 'lstm'
})

const forecastResult = reactive({
  loading: false,
  data: null
})

// 模拟历史数据
const historyRecords = ref([
  {
    date: '2024-05-15',
    forecast: '1238.5',
    actual: '1252.7',
    accuracy: '98.86'
  },
  {
    date: '2024-05-14',
    forecast: '1185.3',
    actual: '1201.2',
    accuracy: '98.68'
  },
  {
    date: '2024-05-13',
    forecast: '1302.7',
    actual: '1247.6',
    accuracy: '95.77'
  },
  {
    date: '2024-05-12',
    forecast: '1150.4',
    actual: '1273.8',
    accuracy: '90.31'
  }
])

// 开始预测
const startForecast = () => {
  forecastResult.loading = true
  
  // 模拟API请求延迟
  setTimeout(() => {
    forecastResult.loading = false
    forecastResult.data = {
      date: forecastParams.date,
      value: Math.floor(Math.random() * 500 + 1000),
      yearChange: (Math.random() * 10 - 2).toFixed(2),
      monthChange: (Math.random() * 5 - 1).toFixed(2),
      minValue: Math.floor(Math.random() * 200 + 900),
      maxValue: Math.floor(Math.random() * 200 + 1200),
      suggestions: [
        '建议根据预测结果，调整次日采购计划，优化成本结构',
        '电量预计上升，建议提前准备应对高峰时段的负荷平衡',
        '考虑与大型工业用户协商调整用电计划，优化电网资源分配',
        '建议关注天气变化对电量预测的影响，适时调整预测模型参数'
      ]
    }
  }, 1500)
}

// 重置表单
const resetForm = () => {
  forecastParams.date = new Date().toISOString().slice(0, 10)
  forecastParams.userType = ''
  forecastParams.method = 'lstm'
  forecastResult.data = null
}
</script>

<style scoped>
.daily-forecast {
  width: 100%;
}

.forecast-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  font-weight: 500;
}

.forecast-form {
  max-width: 600px;
  margin: 0 auto;
}

.result-loading {
  padding: 20px;
}

.forecast-result {
  margin-top: 20px;
}

.up {
  color: #67C23A;
}

.down {
  color: #F56C6C;
}

.historical-card,
.suggestion-card {
  margin-top: 20px;
}

.suggestion-list {
  padding-left: 20px;
  line-height: 1.8;
}

.empty-result {
  padding: 40px 0;
}
</style> 