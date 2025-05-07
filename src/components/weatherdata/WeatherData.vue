<template>
  <div class="weather-data-container">
    <el-card class="weather-data-card">
      <template #header>
        <div class="card-header">
          <span>气象数据</span>
          <div class="header-actions">
            <el-date-picker
              v-model="selectedDate"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleDateChange"
            />
            <el-select v-model="selectedCity" placeholder="选择城市" @change="handleCityChange">
              <el-option v-for="item in cityOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-button type="primary" :icon="Refresh" size="small" @click="refreshData">刷新</el-button>
            <el-button type="success" :icon="Download" size="small" @click="exportData">导出</el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="气象监测" name="monitor">
          <div class="current-weather">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-card shadow="hover" class="weather-overview-card">
                  <div class="weather-icon">
                    <template v-if="currentWeather.weather === '晴'">
                      <el-icon size="48"><Sunny /></el-icon>
                    </template>
                    <template v-else-if="currentWeather.weather === '多云'">
                      <el-icon size="48"><Cloudy /></el-icon>
                    </template>
                    <template v-else-if="currentWeather.weather === '雷阵雨'">
                      <el-icon size="48"><Lightning /></el-icon>
                    </template>
                    <template v-else-if="currentWeather.weather === '夜间晴'">
                      <el-icon size="48"><Moon /></el-icon>
                    </template>
                    <template v-else>
                      <el-icon size="48"><Sunrise /></el-icon>
                    </template>
                  </div>
                  <div class="weather-temp">{{ currentWeather.temperature }}°C</div>
                  <div class="weather-desc">{{ currentWeather.weather }}</div>
                  <div class="weather-city">{{ selectedCityName }}</div>
                  <div class="weather-time">{{ currentTime }}</div>
                </el-card>
              </el-col>
              <el-col :span="18">
                <div class="weather-details">
                  <el-row :gutter="20">
                    <el-col :span="8">
                      <div class="weather-detail-item">
                        <el-icon><Odometer /></el-icon>
                        <span class="label">湿度</span>
                        <span class="value">{{ currentWeather.humidity }}%</span>
                      </div>
                    </el-col>
                    <el-col :span="8">
                      <div class="weather-detail-item">
                        <el-icon><WindPower /></el-icon>
                        <span class="label">风速</span>
                        <span class="value">{{ currentWeather.windSpeed }} m/s</span>
                      </div>
                    </el-col>
                    <el-col :span="8">
                      <div class="weather-detail-item">
                        <el-icon><DCaret /></el-icon>
                        <span class="label">风向</span>
                        <span class="value">{{ currentWeather.windDirection }}</span>
                      </div>
                    </el-col>
                  </el-row>
                  <el-row :gutter="20" class="mt-20">
                    <el-col :span="8">
                      <div class="weather-detail-item">
                        <el-icon><Cloudy /></el-icon>
                        <span class="label">云量</span>
                        <span class="value">{{ currentWeather.cloudCover }}%</span>
                      </div>
                    </el-col>
                    <el-col :span="8">
                      <div class="weather-detail-item">
                        <el-icon><Position /></el-icon>
                        <span class="label">气压</span>
                        <span class="value">{{ currentWeather.pressure }} hPa</span>
                      </div>
                    </el-col>
                    <el-col :span="8">
                      <div class="weather-detail-item">
                        <el-icon><View /></el-icon>
                        <span class="label">能见度</span>
                        <span class="value">{{ currentWeather.visibility }} km</span>
                      </div>
                    </el-col>
                  </el-row>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="历史数据" name="history">
          <div class="summary-cards">
            <el-card class="summary-card" shadow="hover" v-for="(item, index) in dailySummary" :key="index">
              <template #header>
                <div class="summary-header">
                  <span>{{ item.title }}</span>
                </div>
              </template>
              <div class="summary-content">
                <div class="summary-value">{{ item.value }}</div>
                <div class="summary-info">{{ item.info }}</div>
              </div>
            </el-card>
          </div>
          
          <el-table :data="historyData" style="width: 100%" v-loading="loading" border stripe>
            <el-table-column prop="time" label="时间" width="150" />
            <el-table-column prop="temperature" label="温度(°C)" width="100" />
            <el-table-column prop="humidity" label="湿度(%)" width="100" />
            <el-table-column prop="windSpeed" label="风速(m/s)" width="100" />
            <el-table-column prop="windDirection" label="风向" width="100" />
            <el-table-column prop="cloudCover" label="云量(%)" width="100" />
            <el-table-column prop="weather" label="天气" width="100" />
            <el-table-column prop="pressure" label="气压(hPa)" width="100" />
            <el-table-column prop="visibility" label="能见度(km)" width="120" />
            <el-table-column prop="note" label="备注" />
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="极端天气预警" name="warning">
          <div class="warning-container">
            <template v-if="warningData.length === 0">
              <el-empty description="当前无极端天气预警" />
            </template>
            <template v-else>
              <el-alert
                v-for="(warning, index) in warningData"
                :key="index"
                :title="warning.title"
                :description="warning.description"
                :type="warning.type"
                :closable="false"
                show-icon
                class="warning-alert"
              >
                <template #default>
                  <div class="warning-content">
                    <div class="warning-details">
                      <div><strong>预警级别：</strong>{{ warning.level }}</div>
                      <div><strong>发布时间：</strong>{{ warning.issueTime }}</div>
                      <div><strong>预计持续时间：</strong>{{ warning.duration }}</div>
                      <div><strong>影响区域：</strong>{{ warning.area }}</div>
                    </div>
                    <div class="warning-actions">
                      <el-button type="primary" size="small">查看详情</el-button>
                      <el-button type="success" size="small">查看防范指南</el-button>
                    </div>
                  </div>
                </template>
              </el-alert>
            </template>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { 
  Refresh, Download, WindPower, Odometer, 
  Sunny, Cloudy, Lightning, Moon, Sunrise, 
  DCaret, Position, View
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 城市选项
const cityOptions = [
  { value: 'guangzhou', label: '广州' },
  { value: 'shenzhen', label: '深圳' },
  { value: 'beijing', label: '北京' },
  { value: 'shanghai', label: '上海' },
  { value: 'hangzhou', label: '杭州' },
  { value: 'chengdu', label: '成都' }
]

// 响应式变量
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const selectedCity = ref('guangzhou')
const activeTab = ref('monitor')
const loading = ref(true)
const currentTime = ref(new Date().toLocaleTimeString())

// 获取选中城市名称
const selectedCityName = computed(() => {
  const city = cityOptions.find(city => city.value === selectedCity.value)
  return city ? city.label : ''
})

// 当前气象数据
const currentWeather = reactive({
  temperature: 25,
  weather: '晴',
  humidity: 60,
  windSpeed: 3.2,
  windDirection: '东北风',
  cloudCover: 30,
  pressure: 1013,
  visibility: 10
})

// 历史数据
const historyData = ref([])

// 极端天气预警
const warningData = ref([])

// 每日统计
const dailySummary = ref([
  { title: '平均温度', value: '26.5°C', info: '高于往年同期2.3°C' },
  { title: '最高温度', value: '32.8°C', info: '14:30记录' },
  { title: '最低温度', value: '21.3°C', info: '05:10记录' },
  { title: '平均湿度', value: '65%', info: '正常范围' }
])

// 初始化加载
onMounted(() => {
  fetchWeatherData()
  // 更新当前时间
  setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString()
  }, 1000)
})

// 获取气象数据
const fetchWeatherData = async () => {
  loading.value = true
  
  try {
    // 模拟数据加载延迟
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 根据当前选项加载不同的数据
    if (activeTab.value === 'monitor') {
      loadCurrentWeather()
    } else if (activeTab.value === 'history') {
      loadHistoryData()
    } else if (activeTab.value === 'warning') {
      loadWarningData()
    }
  } catch (error) {
    console.error('获取气象数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载当前气象数据
const loadCurrentWeather = () => {
  // 根据城市随机生成一些合理的气象数据
  const cityTemp = {
    'guangzhou': [22, 35],
    'shenzhen': [23, 34],
    'beijing': [10, 30],
    'shanghai': [15, 32],
    'hangzhou': [16, 33],
    'chengdu': [18, 30]
  }
  
  const weatherTypes = ['晴', '多云', '阴', '小雨', '中雨', '大雨', '雷阵雨', '夜间晴']
  const windDirections = ['东风', '南风', '西风', '北风', '东北风', '东南风', '西南风', '西北风']
  
  const tempRange = cityTemp[selectedCity.value] || [15, 30]
  const temperature = Math.round((Math.random() * (tempRange[1] - tempRange[0]) + tempRange[0]) * 10) / 10
  const weatherIndex = Math.floor(Math.random() * 5) // 大部分情况生成前5种天气
  
  currentWeather.temperature = temperature
  currentWeather.weather = weatherTypes[weatherIndex]
  currentWeather.humidity = Math.round(Math.random() * 40 + 40) // 40-80%
  currentWeather.windSpeed = Math.round(Math.random() * 8 * 10) / 10 // 0-8 m/s
  currentWeather.windDirection = windDirections[Math.floor(Math.random() * windDirections.length)]
  currentWeather.cloudCover = Math.round(Math.random() * 80) // 0-80%
  currentWeather.pressure = Math.round(Math.random() * 30 + 990) // 990-1020 hPa
  currentWeather.visibility = Math.round(Math.random() * 15 + 5) // 5-20 km
}

// 处理日期变化
const handleDateChange = () => {
  fetchWeatherData()
}

// 处理城市变化
const handleCityChange = () => {
  fetchWeatherData()
}

// 处理标签页切换
const handleTabChange = () => {
  fetchWeatherData()
}

// 刷新数据
const refreshData = () => {
  ElMessage.success('数据已刷新')
  fetchWeatherData()
}

// 导出数据
const exportData = () => {
  ElMessage.success('气象数据导出成功')
}

// 加载历史数据
const loadHistoryData = () => {
  // 根据选中的日期生成当天24小时的历史数据
  const weatherTypes = ['晴', '多云', '阴', '小雨', '中雨', '大雨', '雷阵雨']
  const windDirections = ['东风', '南风', '西风', '北风', '东北风', '东南风', '西南风', '西北风']
  
  const tempRange = {
    'guangzhou': [22, 35],
    'shenzhen': [23, 34],
    'beijing': [10, 30],
    'shanghai': [15, 32],
    'hangzhou': [16, 33],
    'chengdu': [18, 30]
  }[selectedCity.value] || [15, 30]
  
  // 生成24小时数据
  historyData.value = Array.from({ length: 24 }, (_, i) => {
    const hour = i
    const time = `${hour.toString().padStart(2, '0')}:00`
    
    // 根据时间变化生成温度 - 早晨低，下午高
    const timeFactor = Math.sin((hour - 6) / 24 * Math.PI * 2)
    const tempVariation = (tempRange[1] - tempRange[0]) * 0.5
    const temperature = tempRange[0] + tempVariation + tempVariation * timeFactor
    
    // 根据温度生成湿度 - 温度越高湿度越低
    const humidityBase = 70 - (temperature - tempRange[0]) / (tempRange[1] - tempRange[0]) * 30
    const humidity = Math.max(30, Math.min(90, humidityBase + (Math.random() - 0.5) * 10))
    
    // 风速一般在1-8之间波动
    const windSpeed = Math.max(0, Math.min(10, 3 + Math.random() * 5))
    
    // 天气类型 - 根据温度和时间生成
    // 温度高且湿度低时多为晴，温度低且湿度高时多为阴雨
    let weatherTypeIndex
    const rainChance = (humidity - 50) / 50 // 湿度影响下雨概率
    
    if (rainChance > 0.3 && Math.random() < rainChance) {
      // 可能下雨
      weatherTypeIndex = Math.floor(Math.random() * 3) + 3 // 小到大雨
    } else {
      // 晴到阴
      weatherTypeIndex = Math.floor(Math.random() * 3)
    }
    
    // 特殊情况 - 雷雨
    if (hour >= 14 && hour <= 17 && humidity > 60 && Math.random() < 0.2) {
      weatherTypeIndex = 6 // 雷阵雨
    }
    
    const weather = weatherTypes[weatherTypeIndex]
    
    // 云量 - 与天气相关
    const cloudCoverBase = weatherTypeIndex * 15 // 晴天少云，阴雨天多云
    const cloudCover = Math.min(100, cloudCoverBase + Math.random() * 20)
    
    // 气压 - 天气越差气压越低
    const pressureBase = 1013 - weatherTypeIndex * 3
    const pressure = pressureBase + (Math.random() - 0.5) * 6
    
    // 能见度 - 与天气相关
    const visibilityBase = 15 - weatherTypeIndex * 2
    const visibility = Math.max(2, visibilityBase + (Math.random() - 0.5) * 3)
    
    // 备注
    let note = ''
    if (weatherTypeIndex >= 3) {
      note = '雨天，注意出行安全'
    } else if (temperature > tempRange[1] - 3) {
      note = '高温，注意防暑'
    } else if (temperature < tempRange[0] + 3) {
      note = '较凉，注意保暖'
    } else if (windSpeed > 6) {
      note = '风力较大，注意防风'
    } else {
      note = '天气良好'
    }
    
    return {
      time,
      temperature: temperature.toFixed(1),
      humidity: Math.round(humidity),
      windSpeed: windSpeed.toFixed(1),
      windDirection: windDirections[Math.floor(Math.random() * windDirections.length)],
      cloudCover: Math.round(cloudCover),
      weather,
      pressure: Math.round(pressure),
      visibility: visibility.toFixed(1),
      note
    }
  })
  
  // 更新每日统计数据
  updateDailySummary()
}

// 更新每日统计数据
const updateDailySummary = () => {
  if (historyData.value.length > 0) {
    const temperatures = historyData.value.map(item => parseFloat(item.temperature))
    const humidities = historyData.value.map(item => item.humidity)
    
    const avgTemp = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length
    const maxTemp = Math.max(...temperatures)
    const minTemp = Math.min(...temperatures)
    const avgHumidity = humidities.reduce((sum, humidity) => sum + humidity, 0) / humidities.length
    
    const maxTempItem = historyData.value.find(item => parseFloat(item.temperature) === maxTemp)
    const minTempItem = historyData.value.find(item => parseFloat(item.temperature) === minTemp)
    
    // 更新统计卡片
    dailySummary.value[0].value = `${avgTemp.toFixed(1)}°C`
    dailySummary.value[0].info = `${Math.random() > 0.5 ? '高' : '低'}于往年同期${(Math.random() * 3).toFixed(1)}°C`
    
    dailySummary.value[1].value = `${maxTemp.toFixed(1)}°C`
    dailySummary.value[1].info = `${maxTempItem ? maxTempItem.time : ''}记录`
    
    dailySummary.value[2].value = `${minTemp.toFixed(1)}°C`
    dailySummary.value[2].info = `${minTempItem ? minTempItem.time : ''}记录`
    
    dailySummary.value[3].value = `${Math.round(avgHumidity)}%`
    dailySummary.value[3].info = avgHumidity > 70 ? '湿度偏高' : avgHumidity < 40 ? '湿度偏低' : '正常范围'
  }
}

// 加载预警数据
const loadWarningData = () => {
  // 清空现有数据
  warningData.value = []
  
  // 根据城市和季节随机生成可能的预警
  const season = getSeason()
  const warningTypes = getWarningTypesForSeason(season, selectedCity.value)
  
  // 随机决定是否有预警 (30%概率)
  if (Math.random() < 0.3) {
    // 随机确定预警数量 (1-3个)
    const warningsCount = Math.floor(Math.random() * 3) + 1
    
    for (let i = 0; i < warningsCount; i++) {
      if (warningTypes.length > 0) {
        // 随机选择一种预警类型
        const warningTypeIndex = Math.floor(Math.random() * warningTypes.length)
        const warningType = warningTypes[warningTypeIndex]
        
        // 避免重复添加同类预警
        warningTypes.splice(warningTypeIndex, 1)
        
        // 创建预警信息
        warningData.value.push(generateWarning(warningType, selectedCity.value))
      }
    }
  }
  
  // 根据预警类型来排序 - 红色预警优先显示
  warningData.value.sort((a, b) => {
    const typeOrder = { error: 0, warning: 1, info: 2 }
    return typeOrder[a.type] - typeOrder[b.type]
  })
}

// 获取当前季节
const getSeason = () => {
  const month = new Date(selectedDate.value).getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

// 获取特定季节可能的预警类型
const getWarningTypesForSeason = (season, city) => {
  const baseTypes = []
  
  // 根据季节添加可能的预警类型
  switch (season) {
    case 'spring':
      baseTypes.push('大风', '沙尘暴', '雷雨')
      break
    case 'summer':
      baseTypes.push('高温', '暴雨', '雷暴', '台风')
      break
    case 'autumn':
      baseTypes.push('台风', '大风', '暴雨')
      break
    case 'winter':
      baseTypes.push('寒潮', '大风', '霜冻')
      // 北方城市可能有雪灾
      if (['beijing', 'shanghai', 'hangzhou'].includes(city)) {
        baseTypes.push('暴雪')
      }
      break
  }
  
  // 根据城市添加特定预警类型
  if (['guangzhou', 'shenzhen'].includes(city)) {
    // 南方城市更可能有台风和暴雨
    if (season === 'summer' || season === 'autumn') {
      baseTypes.push('台风', '暴雨')
    }
  }
  
  return baseTypes
}

// 生成预警详情
const generateWarning = (warningType, city) => {
  const cityName = cityOptions.find(c => c.value === city)?.label || '全市'
  const now = new Date()
  const issueTime = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  
  // 根据预警类型设置不同的信息
  const warningInfo = {
    '高温': {
      title: `${cityName}高温橙色预警`,
      description: `预计未来24小时内最高气温将达到37℃以上，请注意防暑降温。`,
      type: 'warning',
      level: '橙色',
      duration: '24小时',
      area: `${cityName}全域`
    },
    '暴雨': {
      title: `${cityName}暴雨红色预警`,
      description: `预计未来3小时降雨量将超过100毫米，部分地区可能出现内涝，请注意防范。`,
      type: 'error',
      level: '红色',
      duration: '12小时',
      area: `${cityName}市区及郊区`
    },
    '台风': {
      title: `${cityName}台风黄色预警`,
      description: `台风"XX"即将登陆，预计未来48小时内可能带来强风雨天气，请提前做好防范工作。`,
      type: 'warning',
      level: '黄色',
      duration: '48小时',
      area: `${cityName}沿海地区`
    },
    '大风': {
      title: `${cityName}大风蓝色预警`,
      description: `预计未来12小时内可能出现6-7级大风，请注意户外活动安全。`,
      type: 'info',
      level: '蓝色',
      duration: '12小时',
      area: `${cityName}全域`
    },
    '雷暴': {
      title: `${cityName}雷暴黄色预警`,
      description: `预计未来6小时内可能出现雷暴天气，局部地区可能伴有短时强降水，请注意防范。`,
      type: 'warning',
      level: '黄色',
      duration: '6小时',
      area: `${cityName}东部和南部地区`
    },
    '沙尘暴': {
      title: `${cityName}沙尘暴黄色预警`,
      description: `预计未来24小时内可能出现沙尘暴天气，请做好防尘措施，减少户外活动。`,
      type: 'warning',
      level: '黄色',
      duration: '24小时',
      area: `${cityName}北部地区`
    },
    '寒潮': {
      title: `${cityName}寒潮蓝色预警`,
      description: `预计未来48小时内气温将下降8-10℃，请注意保暖，防范感冒。`,
      type: 'info',
      level: '蓝色',
      duration: '48小时',
      area: `${cityName}全域`
    },
    '霜冻': {
      title: `${cityName}霜冻蓝色预警`,
      description: `预计今夜到明晨最低气温将下降到0℃以下，可能出现霜冻现象，请注意农作物防护。`,
      type: 'info',
      level: '蓝色',
      duration: '12小时',
      area: `${cityName}郊区`
    },
    '暴雪': {
      title: `${cityName}暴雪橙色预警`,
      description: `预计未来24小时内累积降雪量将超过10厘米，请注意道路结冰和交通安全。`,
      type: 'warning',
      level: '橙色',
      duration: '24小时',
      area: `${cityName}全域`
    },
    '雷雨': {
      title: `${cityName}雷雨蓝色预警`,
      description: `预计未来6小时内可能出现雷阵雨天气，局部地区可能有冰雹，请注意防范。`,
      type: 'info',
      level: '蓝色',
      duration: '6小时',
      area: `${cityName}南部地区`
    }
  }
  
  return {
    ...warningInfo[warningType],
    issueTime
  }
}
</script>

<style scoped>
.weather-data-container {
  width: 100%;
  height: 100%;
}

.weather-data-card {
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

:deep(.el-card__body) {
  padding: 10px;
  height: calc(100% - 60px);
  overflow: auto;
}

:deep(.el-tabs__content) {
  height: calc(100% - 40px);
  overflow: auto;
}

.current-weather {
  margin-bottom: 20px;
}

.weather-overview-card {
  text-align: center;
  padding: 20px 0;
}

.weather-icon {
  margin-bottom: 10px;
}

.weather-temp {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 5px;
}

.weather-desc {
  font-size: 16px;
  color: #606266;
  margin-bottom: 10px;
}

.weather-city {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.weather-time {
  font-size: 14px;
  color: #909399;
}

.weather-details {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
  height: 100%;
}

.weather-detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.weather-detail-item .el-icon {
  font-size: 24px;
  color: #409EFF;
  margin-bottom: 10px;
}

.weather-detail-item .label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.weather-detail-item .value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.mt-20 {
  margin-top: 20px;
}

.data-placeholder {
  padding: 20px;
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

.summary-change, .summary-time, .summary-info {
  font-size: 12px;
  color: #909399;
}

.warning-container {
  padding: 20px;
}

.warning-alert {
  margin-bottom: 15px;
}

.warning-content {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.warning-details {
  flex: 1;
  line-height: 1.8;
}

.warning-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-left: 20px;
}
</style> 