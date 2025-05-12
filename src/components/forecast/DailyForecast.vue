<template>
  <div class="daily-forecast">
    <!-- Removed main forecast card -->

    <el-card class="forecast-card forecast-details-card">
      <template #header>
        <div class="card-header">
          <span>预测数据详情</span>
        </div>
      </template>

      <el-form-item label="预测标的日期" class="info-item standalone-date-picker-form-item">
        <el-date-picker 
          v-model="forecastParams.currentDate" 
          type="date" 
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          :disabled-date="disablePastDates"
          @change="handleSingleDateChange"
          class="el-date-editor el-date-editor--date date-picker"
        />
      </el-form-item>

      <el-table :data="calculationTableData" stripe style="width: 100%">
        <el-table-column prop="name" label="计算项目" width="180">
          <template #default="scope">
            <span :class="{ 'forecast-name-bold': scope.row.isForecast }">{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="值" width="180">
          <template #default="scope">
            <template v-if="scope.row.hasError">
              <el-tooltip content="计算过程中出现错误" placement="top">
                <el-icon class="error-icon"><Warning /></el-icon>
              </el-tooltip>
            </template>
            <template v-else-if="scope.row.isForecast">
              <span class="forecast-value">{{ scope.row.value }}</span>
            </template>
            <template v-else-if="scope.row.isInput && forecastResult.calculationItems">
              <el-input 
                v-model="forecastResult.calculationItems.manualAdjustmentAmount" 
                placeholder="请输入调整量"
                type="number"
                size="small"
                class="manual-adjustment-input-field"
              />
            </template>
            <template v-else-if="scope.row.isInput && !forecastResult.calculationItems">
               <el-input 
                placeholder="-"
                type="number"
                size="small"
                disabled
                class="manual-adjustment-input-field"
              />
            </template>
            <template v-else>
              <span>{{ scope.row.value }}</span>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" />
      </el-table>
        <el-form-item class="button-form-item">
          <el-button @click="resetForm">重置参数</el-button>
        </el-form-item>
    </el-card>
    
  </div>
</template>

<script setup>
import { reactive, computed, onMounted, watch } from 'vue'
import { Warning } from '@element-plus/icons-vue'

const getTomorrow = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().slice(0, 10)
}

const forecastParams = reactive({
  currentDate: getTomorrow(), 
})

const getDefaultCalculationItems = () => ({
  lastYearBaseValue: Math.floor(Math.random() * 1001) + 7000,
  weightedGrowthRate: 2.5,
  dayTypeCoefficient: 1.0,
  forecast0: 0,
  temperatureCoefficient: 1.0,
  forecast1: 0,
  monthlyCoefficient: 1.0,
  forecast2: 0,
  cloudCoverage: 30,
  adjustmentAmount: 0,
  sixDayOneCoefficient: 1.0,
  photovoltaicAdjustment: 0,
  forecast3: 0,
  monthlyDecompositionAmount: 0,
  forecast4: 0,
  manualAdjustmentAmount: '',
  forecast5: null
})

const forecastResult = reactive({
  calculationItems: getDefaultCalculationItems(),
  hasError: false
})

const calculationTableData = computed(() => {
  if (!forecastResult.calculationItems) return []
  const items = forecastResult.calculationItems
  const hasError = forecastResult.hasError
  return [
    { name: '去年基准值', value: items.lastYearBaseValue, description: '去年同期的日总电量', hasError: false, isForecast: false, isInput: false },
    { name: '加权增长率', value: `${items.weightedGrowthRate}%`, description: '基于历史数据计算的加权增长率', hasError: false, isForecast: false, isInput: false },
    { name: '日类型系数', value: items.dayTypeCoefficient, description: '根据日期类型(工作日/节假日)确定的系数', hasError: false, isForecast: false, isInput: false },
    { name: '预测0', value: items.forecast0, description: '基于去年基准值、加权增长率和日类型系数的初步预测', hasError: hasError, isForecast: true, isInput: false },
    { name: '气温系数', value: items.temperatureCoefficient, description: '基于气温预报计算的调整系数', hasError: false, isForecast: false, isInput: false },
    { name: '预测1', value: hasError ? '-' : items.forecast1, description: '考虑气温因素后的预测值', hasError: hasError, isForecast: true, isInput: false },
    { name: '月内系数', value: items.monthlyCoefficient, description: '月内电量分布特性系数', hasError: false, isForecast: false, isInput: false },
    { name: '预测2', value: hasError ? '-' : items.forecast2, description: '考虑月内分布特性后的预测值', hasError: hasError, isForecast: true, isInput: false },
    { name: '云量(%)', value: `${items.cloudCoverage}%`, description: '预测日的云量覆盖百分比', hasError: false, isForecast: false, isInput: false },
    { name: '调整量', value: items.adjustmentAmount, description: '基于特殊事件的电量调整', hasError: false, isForecast: false, isInput: false },
    { name: '六日一系数', value: items.sixDayOneCoefficient, description: '每周规律性调整系数', hasError: false, isForecast: false, isInput: false },
    { name: '光伏调整量', value: items.photovoltaicAdjustment, description: '光伏发电影响的调整量', hasError: false, isForecast: false, isInput: false },
    { name: '预测3', value: hasError ? '-' : items.forecast3, description: '考虑云量、特殊事件和周规律后的预测值', hasError: hasError, isForecast: true, isInput: false },
    { name: '月分解量', value: items.monthlyDecompositionAmount, description: '月度计划分解到日的调整量', hasError: false, isForecast: false, isInput: false },
    { name: '预测4', value: hasError ? '-' : items.forecast4, description: '考虑月计划分解后的预测值', hasError: hasError, isForecast: true, isInput: false },
    { name: '手动调整量', value: items.manualAdjustmentAmount, description: '用户可输入需要调节的电量', hasError: false, isForecast: false, isInput: true },
    { name: '预测5', value: hasError || items.forecast5 === null || items.forecast5 === undefined ? '-' : items.forecast5, description: '最终预测值 (预测4 + 手动调整量)', hasError: hasError, isForecast: true, isInput: false }
  ]
})

const handleSingleDateChange = (newDate) => {
  if (!newDate) {
    forecastParams.currentDate = getTomorrow();
  }
}

const disablePastDates = (date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

const calculateForecastValues = (itemsToCalculateOn = forecastResult.calculationItems) => {
  if (!itemsToCalculateOn) return
  const items = itemsToCalculateOn
  items.forecast0 = Math.floor(parseFloat(items.lastYearBaseValue) * (1 + parseFloat(items.weightedGrowthRate) / 100) * parseFloat(items.dayTypeCoefficient))
  items.forecast1 = Math.floor(items.forecast0 * parseFloat(items.temperatureCoefficient))
  items.forecast2 = Math.floor(items.forecast1 * parseFloat(items.monthlyCoefficient))
  items.forecast3 = Math.floor((items.forecast2 + parseFloat(items.adjustmentAmount)) * parseFloat(items.sixDayOneCoefficient) + parseFloat(items.photovoltaicAdjustment))
  items.forecast4 = items.forecast3 + parseFloat(items.monthlyDecompositionAmount)
  const manualAdjustment = parseFloat(items.manualAdjustmentAmount)
  if (!isNaN(manualAdjustment)) {
    items.forecast5 = items.forecast4 + manualAdjustment
  } else {
    items.forecast5 = null
  }
}

watch(() => forecastResult.calculationItems.manualAdjustmentAmount, () => {
  if (forecastResult.calculationItems) {
    calculateForecastValues()
  }
}, { deep: true })

watch(() => forecastParams.currentDate, (newDateValue, oldDateValue) => {
    if (!newDateValue) {
        return; 
    }

    const newBase = getDefaultCalculationItems();
    newBase.weightedGrowthRate = (Math.random() * 1 + 2.0).toFixed(2);
    if (forecastResult.calculationItems) { 
      newBase.manualAdjustmentAmount = forecastResult.calculationItems.manualAdjustmentAmount;
    }
    forecastResult.calculationItems = newBase;
    calculateForecastValues();
    forecastResult.hasError = Math.random() > 0.95;
}, { immediate: false })

const resetForm = () => {
  forecastParams.currentDate = getTomorrow();
  forecastResult.hasError = false;
  if(forecastResult.calculationItems) {
      forecastResult.calculationItems.manualAdjustmentAmount = '';
  }
  calculateForecastValues(); 
}

onMounted(() => {
  calculateForecastValues(forecastResult.calculationItems);
})
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

.calculation-details-title,
.standalone-calculation-title {
  display: none;
}

.forecast-form {
  max-width: 700px;
  margin: 0 auto;
  padding: 0 10px; /* Add some padding for smaller screens */
}

.standalone-date-picker-form-item {
  padding: 10px;
  margin-bottom: 0 !important;
  display: flex;
  flex-direction: column;
}

.standalone-date-picker-form-item .date-range-picker {
  width: 100%;
}

.date-range-picker {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.date-preset-buttons {
  margin-bottom: 10px;
}

.date-picker {
  width: 100%;
}

.el-date-editor {
  :deep(.el-input) {
    .el-input__wrapper {
      background-color: var(--el-bg-color);
      border: 1px solid var(--el-border-color);
    }
    
    .el-input__inner {
      color: #303133;
      background-color: transparent;
    }
    
    .el-input__prefix,
    .el-input__suffix {
      color: var(--el-text-color-regular);
    }
  }
}

.standalone-date-picker-form-item {
  :deep(.el-form-item__content) {
    .el-date-editor {
      width: 100%;
      max-width: 220px;
    }
  }
}

/* 确保日期选择器内的文本可见 */
:deep(.el-date-editor) {
  .el-input__inner {
    color: #303133 !important;
    -webkit-text-fill-color: #303133 !important;
  }
  
  .el-input__wrapper {
    box-shadow: 0 0 0 1px var(--el-border-color) inset !important;
  }
  
  &.is-focus .el-input__wrapper {
    box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
  }
}

/* 占位符文本样式 */
:deep(.el-input__inner::placeholder) {
  color: var(--el-text-color-placeholder) !important;
  -webkit-text-fill-color: var(--el-text-color-placeholder) !important;
}

.forecast-name-bold {
  font-weight: bold;
}

.forecast-value {
  font-weight: bold;
}

.error-icon {
  color: #F56C6C;
  font-size: 20px;
}

.up {
  color: #67C23A;
}

.down {
  color: #F56C6C;
}

.historical-card,
.suggestion-card {
  /* margin-top: 20px; (Handled by grid gap) */
}

.suggestion-list {
  padding-left: 20px;
  line-height: 1.8;
}

.empty-result {
  padding: 40px 0;
}

.details-empty-result {
  margin-top: 0; /* Remove extra top margin if the details card is not shown */
}

.button-form-item {
  margin-top: 20px;
  text-align: right;
}

.manual-adjustment-input-field :deep(.el-input__inner) {
  color: #303133 !important; 
  -webkit-text-fill-color: #303133 !important;
}

.manual-adjustment-input-field.is-disabled :deep(.el-input__inner) {
  color: #a8abb2 !important; 
  -webkit-text-fill-color: #a8abb2 !important;
}

@media (min-width: 768px) {
  .standalone-date-picker-form-item {
    flex-direction: row;
    align-items: center; 
  }
  .standalone-date-picker-form-item .el-form-item__label {
    margin-bottom: 0; 
  }
  .standalone-date-picker-form-item .el-form-item__content {
    flex-grow: 1;
  }
  
  .date-picker {
    width: 220px; 
  }

  .button-form-item {
    text-align: center; 
  }
}
</style> 