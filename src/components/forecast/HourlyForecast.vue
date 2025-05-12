<template>
  <el-card class="hourly-forecast-card">
      <template #header>
        <div class="card-header">
          <span>分时电量预测</span>
        </div>
      </template>
      
    <div class="forecast-form">
      <div class="form-row">
        <div class="form-label">预测标的日期</div>
        <el-date-picker 
            v-model="selectedDate"
          type="date" 
          placeholder="选择日期"
            format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
            :disabled-date="disablePastDates"
            @change="handleDateChange"
            class="date-picker"
        />
      </div>
      
      <div class="form-row">
        <div class="form-label">预测日总电量 (MWh)</div>
        <el-input
          v-model.number="predictedTotalMWh"
          type="number"
          placeholder="输入总电量"
          clearable
          class="total-mwh-input"
        >
          <!-- <template #append>MWh</template> -->
        </el-input>
      </div>
    </div>
      
    <el-divider />

    <h4 class="table-title">分时电量预测表</h4>
    <el-table :data="tableDisplayData" stripe border class="forecast-table" size="small">
      <el-table-column prop="item" label="" width="80" fixed="left">
        <template #default="scope">
          <span class="item-label">{{ scope.row.item }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="dataSource" label="标的日期" width="100" align="center" header-align="center">
        <template #default="scope">
          <span :class="{ 'value-highlight': scope.row.item === '预测量' && scope.row.dataSource !== '-' }">
            {{ scope.row.dataSource }}
          </span>
        </template>
      </el-table-column>
      <el-table-column
        v-for="hour in 24"
        :key="`hour-${hour - 1}`"
        :prop="`h${hour - 1}`"
        :label="`${hour - 1}时`"
        width="59"
        align="center"
        header-align="center"
      >
            <template #default="scope">
          <span :class="{ 'value-bold': scope.row.item === '预测量' && scope.row[`h${hour-1}`] !== '-' }">
            {{ scope.row[`h${hour - 1}`] }}
          </span>
            </template>
          </el-table-column>
        </el-table>
    </el-card>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

// --- Utility Functions ---
function getTomorrow() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

function disablePastDates(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
}

// --- Reactive State ---
const selectedDate = ref(getTomorrow());
const predictedTotalMWh = ref(null);
const hourlyRatios = ref([]); // Array of 24 ratio numbers (0.0 to 1.0)

// --- Mock Data Fetching ---
async function mockFetchHourlyRatios(date) {
  if (!date) {
    return [];
  }
  await new Promise(resolve => setTimeout(resolve, 200)); 

  // 使用图片中的实际比例数据
  const ACTUAL_RATIOS = [
    0.040, 0.039, 0.038, 0.037, 0.036, 0.036,  // 0-5
    0.037, 0.0389, 0.0451, 0.0472, 0.0464, 0.0436,  // 6-11
    0.0398, 0.0436, 0.0456, 0.0465, 0.0476, 0.0448,  // 12-17
    0.0432, 0.0444, 0.043, 0.0408, 0.0389, 0.0374  // 18-23
  ];

  return ACTUAL_RATIOS;
}

// --- Computed Properties ---
const hourlyForecasts = computed(() => {
  if (
    !selectedDate.value ||
    predictedTotalMWh.value === null ||
    predictedTotalMWh.value === '' ||
    hourlyRatios.value.length !== 24
  ) {
    return Array(24).fill('-');
  }
  const total = typeof predictedTotalMWh.value === 'number' ? predictedTotalMWh.value : parseFloat(predictedTotalMWh.value);
  if (isNaN(total)) {
    return Array(24).fill('-');
  }
  return hourlyRatios.value.map(ratio => (total * ratio));
});

const tableDisplayData = computed(() => {
  const data = [];

  const ratioRow = { item: '曲线', dataSource: selectedDate.value || '-' };
  const forecastRow = { 
    item: '预测量', 
    dataSource: (predictedTotalMWh.value !== null && predictedTotalMWh.value !== '') ? predictedTotalMWh.value.toFixed(1) : '-' 
  };

  const canCalculateForecasts = 
    selectedDate.value &&
    predictedTotalMWh.value !== null &&
    predictedTotalMWh.value !== '' &&
    !isNaN(parseFloat(predictedTotalMWh.value)) &&
    hourlyRatios.value.length === 24;

    for (let i = 0; i < 24; i++) {
    if (selectedDate.value && hourlyRatios.value.length === 24) {
      ratioRow[`h${i}`] = hourlyRatios.value[i].toFixed(4);  // 显示4位小数
    } else {
      ratioRow[`h${i}`] = '-';
    }

    if (canCalculateForecasts) {
      forecastRow[`h${i}`] = hourlyForecasts.value[i].toFixed(1);  // 显示1位小数
    } else {
      forecastRow[`h${i}`] = '-';
    }
  }
  data.push(ratioRow);
  data.push(forecastRow);
  return data;
});

// --- Watchers ---
watch(selectedDate, async (newDate) => {
  if (newDate) {
    hourlyRatios.value = await mockFetchHourlyRatios(newDate);
  } else {
    hourlyRatios.value = [];
  }
}, { immediate: true });

watch(predictedTotalMWh, (newValue) => {
  if (newValue === '') {
    // Allow user to clear the input
  } else if (newValue !== null && isNaN(parseFloat(newValue))) {
    ElMessage.warning('请输入有效的预测日总电量数值。');
      }
});

// --- Event Handlers ---
function handleDateChange(newDate) {
  if (!newDate) {
    selectedDate.value = null; 
    hourlyRatios.value = [];
  }
}

// --- Lifecycle Hooks ---
onMounted(async () => {
  if (selectedDate.value) {
    hourlyRatios.value = await mockFetchHourlyRatios(selectedDate.value);
  }
});

</script>

<style scoped>
.hourly-forecast-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 18px;
  font-weight: 600;
}

.forecast-form {
  padding: 0 10px;
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.form-label {
  font-weight: 500;
  margin-right: 15px;
  min-width: 150px;
}

.date-picker {
  width: 230px !important;
}

.total-mwh-input {
  width: 220px;
}

.total-mwh-input :deep(.el-input__wrapper) {
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  box-shadow: none;
  
  &:hover {
    border-color: var(--el-border-color-hover);
  }
  
  &.is-focus {
    border-color: var(--el-color-primary);
  }
}

.total-mwh-input :deep(.el-input__inner) {
  color: #303133;
  -webkit-text-fill-color: #303133;
}

.total-mwh-input :deep(.el-input__inner::placeholder) {
  color: #909399;
  -webkit-text-fill-color: #909399;
}

:deep(.el-date-editor.el-input) {
  .el-input__wrapper {
    background-color: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    box-shadow: none;
    
    &:hover {
      border-color: var(--el-border-color-hover);
    }
    
    &.is-focus {
      border-color: var(--el-color-primary);
    }
  }
  
  .el-input__inner {
    color: #303133;
    background-color: transparent;
    height: 32px;
    line-height: 32px;
    font-size: 14px;
  }
  
  .el-input__prefix,
  .el-input__suffix {
    color: var(--el-text-color-regular);
  }
}

.forecast-table {
  margin-top: 10px;
  overflow-x: hidden;
}

.table-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 15px;
  padding-left: 10px;
}

.item-label {
  font-weight: 500;
}

.value-bold {
  font-weight: bold;
}

.value-highlight {
  font-weight: bold;
  color: var(--el-color-primary);
}

.empty-tip {
  margin-top: 20px;
}

:deep(.el-table) {
  font-size: 13px;
  width: 100% !important;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 500;
  padding: 8px 0;
}

:deep(.el-table td) {
  padding: 6px 0;
}

:deep(.el-table .cell) {
  padding: 0 2px;
  white-space: nowrap;
  text-align: center;
}

</style> 