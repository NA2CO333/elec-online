<template>
  <div class="hourly-forecast">
    <el-card class="forecast-card">
      <template #header>
        <div class="card-header">
          <span>分时电量预测</span>
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
        
        <el-form-item label="考虑天气因素">
          <el-switch v-model="forecastParams.includeWeather" />
        </el-form-item>
        
        <el-form-item label="预测方法">
          <el-radio-group v-model="forecastParams.method">
            <el-radio label="lstm">LSTM深度学习</el-radio>
            <el-radio label="prophet">Prophet</el-radio>
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
        <div class="chart-container" ref="chartRef"></div>
        
        <el-table :data="forecastResult.data.hourly" stripe style="width: 100%; margin-top: 20px;">
          <el-table-column prop="hour" label="时段" width="80" />
          <el-table-column prop="forecast" label="预测电量(万千瓦时)" />
          <el-table-column prop="lower" label="下限值(万千瓦时)" />
          <el-table-column prop="upper" label="上限值(万千瓦时)" />
          <el-table-column prop="price" label="预计电价(元/千瓦时)" />
          <el-table-column prop="suggestion" label="建议">
            <template #default="scope">
              <el-tag :type="scope.row.tag">{{ scope.row.suggestion }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
        
        <el-card class="analysis-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>预测分析</span>
            </div>
          </template>
          <div class="analysis-content">
            <h4>总体分析</h4>
            <p>{{ forecastResult.data.analysis.overall }}</p>
            
            <h4>峰谷分析</h4>
            <p>{{ forecastResult.data.analysis.peakValley }}</p>
            
            <h4>优化建议</h4>
            <ul class="suggestion-list">
              <li v-for="(suggestion, index) in forecastResult.data.analysis.suggestions" :key="index">
                {{ suggestion }}
              </li>
            </ul>
          </div>
        </el-card>
      </div>
      
      <div v-else class="empty-result">
        <el-empty description="暂无预测数据，请设置参数并点击开始预测" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Calendar, DataAnalysis, Connection, Cpu } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const chartRef = ref(null)
const chartInstance = ref(null)

const forecastParams = reactive({
  date: new Date().toISOString().slice(0, 10),
  userType: '',
  includeWeather: true,
  method: 'lstm'
})

const forecastResult = reactive({
  loading: false,
  data: null
})

// 初始化图表
const initChart = (hourlyData) => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
  }
  
  if (!chartRef.value) return
  
  chartInstance.value = echarts.init(chartRef.value)
  
  const hours = hourlyData.map(item => item.hour)
  const forecastValues = hourlyData.map(item => item.forecast)
  const lowerValues = hourlyData.map(item => item.lower)
  const upperValues = hourlyData.map(item => item.upper)
  
  const option = {
    title: {
      text: '24小时电量预测',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['预测电量', '下限值', '上限值'],
      bottom: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: hours,
      axisLabel: {
        formatter: '{value}时'
      }
    },
    yAxis: {
      type: 'value',
      name: '电量(万千瓦时)',
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: [
      {
        name: '预测电量',
        type: 'line',
        data: forecastValues,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#409EFF'
        },
        itemStyle: {
          color: '#409EFF'
        },
        emphasis: {
          focus: 'series'
        },
        markPoint: {
          data: [
            { type: 'max', name: '最大值' },
            { type: 'min', name: '最小值' }
          ]
        }
      },
      {
        name: '下限值',
        type: 'line',
        data: lowerValues,
        smooth: true,
        lineStyle: {
          width: 2,
          type: 'dashed',
          color: '#67C23A'
        },
        itemStyle: {
          color: '#67C23A'
        },
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: '上限值',
        type: 'line',
        data: upperValues,
        smooth: true,
        lineStyle: {
          width: 2,
          type: 'dashed',
          color: '#F56C6C'
        },
        itemStyle: {
          color: '#F56C6C'
        },
        emphasis: {
          focus: 'series'
        }
      }
    ]
  }
  
  chartInstance.value.setOption(option)
  
  // 自适应窗口大小
  window.addEventListener('resize', handleResize)
}

// 处理窗口大小变化
const handleResize = () => {
  chartInstance.value && chartInstance.value.resize()
}

// 开始预测
const startForecast = () => {
  forecastResult.loading = true
  
  // 模拟API请求延迟
  setTimeout(() => {
    forecastResult.loading = false
    
    // 生成24小时预测数据
    const hourlyData = []
    for (let i = 0; i < 24; i++) {
      const forecast = (Math.random() * 50 + 30).toFixed(2)
      const variance = forecast * 0.15 // 15%的浮动范围
      
      let tag = 'info'
      let suggestion = '正常用电'
      
      // 模拟不同时段的标签和建议
      if (i >= 8 && i <= 11) {
        tag = i >= 10 ? 'danger' : 'warning'
        suggestion = i >= 10 ? '高峰管控' : '削峰建议'
      } else if (i >= 13 && i <= 16) {
        tag = i >= 15 ? 'danger' : 'warning'
        suggestion = i >= 15 ? '高峰管控' : '削峰建议'
      } else if (i >= 0 && i <= 5) {
        tag = 'success'
        suggestion = '低谷填谷'
      }
      
      hourlyData.push({
        hour: i.toString().padStart(2, '0'),
        forecast: forecast,
        lower: (forecast - variance * Math.random()).toFixed(2),
        upper: (parseFloat(forecast) + variance * Math.random()).toFixed(2),
        price: (Math.random() * 0.2 + 0.4).toFixed(3),
        suggestion: suggestion,
        tag: tag
      })
    }
    
    forecastResult.data = {
      date: forecastParams.date,
      hourly: hourlyData,
      analysis: {
        overall: `预计${forecastParams.date}全天总用电量将达到${(hourlyData.reduce((sum, item) => sum + parseFloat(item.forecast), 0)).toFixed(2)}万千瓦时，整体负荷曲线呈现"双峰一谷"特征，早高峰出现在10-11时，晚高峰出现在15-18时，夜间低谷出现在2-5时。`,
        peakValley: `当日峰谷差预计为${(Math.random() * 2 + 1.8).toFixed(2)}，较前一日${Math.random() > 0.5 ? '上升' : '下降'}${(Math.random() * 0.2).toFixed(2)}。最大负荷预计出现在${hourlyData.indexOf(hourlyData.reduce((prev, current) => (parseFloat(prev.forecast) > parseFloat(current.forecast)) ? prev : current))}时，最小负荷预计出现在${hourlyData.indexOf(hourlyData.reduce((prev, current) => (parseFloat(prev.forecast) < parseFloat(current.forecast)) ? prev : current))}时。`,
        suggestions: [
          '建议10-11时段和15-18时段主动削减非必要用电，避开高峰电价',
          '夜间2-5时可安排增加用电负荷，利用低谷电价降低成本',
          '可根据预测曲线合理安排生产计划，优化分时段用电结构',
          '对于大型设备启停，建议避开负荷突变时段，保持电网稳定'
        ]
      }
    }
    
    // 初始化图表
    initChart(hourlyData)
  }, 1500)
}

// 重置表单
const resetForm = () => {
  forecastParams.date = new Date().toISOString().slice(0, 10)
  forecastParams.userType = ''
  forecastParams.includeWeather = true
  forecastParams.method = 'lstm'
  forecastResult.data = null
}

onMounted(() => {
  // 组件挂载后，可以进行一些初始化操作
})

onUnmounted(() => {
  // 组件卸载前，清理事件监听等资源
  window.removeEventListener('resize', handleResize)
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
})
</script>

<style scoped>
.hourly-forecast {
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

.chart-container {
  height: 400px;
  width: 100%;
}

.analysis-card {
  margin-top: 20px;
}

.analysis-content h4 {
  margin-top: 15px;
  margin-bottom: 10px;
  font-size: 16px;
  color: #303133;
}

.analysis-content p {
  line-height: 1.6;
  margin-bottom: 15px;
}

.suggestion-list {
  padding-left: 20px;
  line-height: 1.8;
}

.empty-result {
  padding: 40px 0;
}
</style> 