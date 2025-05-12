<template>
  <div class="day-ahead-arbitrage">
    <div class="header-actions">
      <el-form-item label="预测标的日期" class="info-item standalone-date-picker-form-item">
                <el-date-picker
          v-model="selectedDate" 
                  type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          :disabled-date="disablePastDates"
          @change="handleDateChange"
          class="el-date-editor el-date-editor--date date-picker"
                />
              </el-form-item>
      <div class="file-actions">
        <el-upload
          class="upload-component"
          :action="uploadAction"
          :before-upload="beforeUpload"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          accept=".xlsx,.csv"
          :auto-upload="true"
          :limit="1"
          :show-file-list="false"
        >
          <el-button type="primary">导入分时电量曲线</el-button>
        </el-upload>
        <el-button type="success" @click="downloadTemplate">导出模板</el-button>
                  </div>
                </div>
                
    <div class="strategy-table">
      <el-table
        :data="tableData"
        border
        style="width: 100%"
        size="small"
        :cell-style="getCellStyle"
      >
        <!-- 第一列：标签列 -->
        <el-table-column
          prop="label"
          :label="tableHeaderDate"
          width="105"
          align="center"
          fixed="left"
        />
        <!-- 24小时列 -->
        <el-table-column
          v-for="hour in 24"
          :key="hour - 1"
          :prop="'hour' + (hour - 1)"
          :label="(hour - 1) + '时'"
          align="center"
          width="62"
        />
      </el-table>
          </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadProps } from 'element-plus'
import * as XLSX from 'xlsx'

interface TableRow {
  label: string
  [key: string]: string | number // 用于动态小时属性
}

interface CellInfo {
  row: TableRow
  column: {
    property: string
  }
}

// 响应式状态
const selectedDate = ref<string>(getTomorrowDate()) // 默认选择明天
const hourlyData = ref<number[]>(new Array(24).fill(0))
const gameStrategy = ref<number[]>([
  20, 20, 20, -20, 10, 20, 20, 20, 10, 10,
  -20, -20, -20, -20, -20, -20, 20, 20, 20,
  20, 20, 20, 10, 20
])
const bidCurve = ref<number[]>(new Array(24).fill(0))

// 获取明天的日期
function getTomorrowDate(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

// 上传相关配置
const uploadAction = '/api/upload' // 实际使用时需要替换为真实的上传接口

// 计算属性
const tableData = computed<TableRow[]>(() => {
  return [
    {
      label: '分时电量曲线(MWh)',
      ...Object.fromEntries(hourlyData.value.map((value, i) => [`hour${i}`, value || '-'])),
    },
    {
      label: '博弈策略',
      ...Object.fromEntries(gameStrategy.value.map((value, i) => [`hour${i}`, value ? `${value}%` : '-'])),
    },
    {
      label: '分时申报曲线(MWh)',
      ...Object.fromEntries(bidCurve.value.map((value, i) => [`hour${i}`, value ? value.toFixed(1) : '-'])),
    },
  ]
})

// 修复类型错误
const tableHeaderDate = computed(() => selectedDate.value || '请选择日期')

// 方法
const disablePastDates = (date: Date): boolean => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() < today.getTime()
}

const handleDateChange = async (date: string) => {
  if (!date) return
  
  try {
    // 模拟获取博弈策略数据
    // 实际项目中需要替换为真实的API调用
    const mockStrategy = [
      20, 20, 20, -20, 10, 20, 20, 20, 10, 10,
      -20, -20, -20, -20, -20, -20, 20, 20, 20,
      20, 20, 20, 10, 20
    ]
    gameStrategy.value = mockStrategy
    
    // 如果已有电量数据，重新计算申报曲线
    if (hourlyData.value.some(v => v > 0)) {
      calculateBidCurve()
    }
  } catch (error) {
    ElMessage.error('获取博弈策略失败')
    console.error('获取博弈策略失败:', error)
  }
}

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isXLSX = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  const isCSV = file.type === 'text/csv'
  
  if (!isXLSX && !isCSV) {
    ElMessage.error('只能上传 xlsx/csv 文件!')
    return false
  }
  return true
}

interface UploadResponse {
  data: number[]
}

const handleUploadSuccess = (response: UploadResponse) => {
  try {
    hourlyData.value = response.data
    
    // 如果已有博弈策略数据，重新计算申报曲线
    if (gameStrategy.value.some(v => v !== 0)) {
      calculateBidCurve()
    }
    
    ElMessage.success('文件上传成功')
  } catch (error) {
    ElMessage.error('文件处理失败')
    console.error('文件处理失败:', error)
  }
}

const handleUploadError = () => {
  ElMessage.error('文件上传失败')
}

const downloadTemplate = () => {
  // 创建模板工作簿
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([
    ['时间', '预测电量(MWh)'],
    ...Array.from({ length: 24 }, (_, i) => [`${i}时`, '']),
  ])
  
  XLSX.utils.book_append_sheet(wb, ws, '分时电量曲线')
  XLSX.writeFile(wb, '分时电量曲线模板.xlsx')
}

const calculateBidCurve = () => {
  bidCurve.value = hourlyData.value.map((value, index) => {
    const strategy = gameStrategy.value[index] / 100 // 将百分比转换为小数
    return Number((value * (1 + strategy)).toFixed(1)) // 保留一位小数
  })
}

const getCellStyle = ({ row, column }: CellInfo) => {
  const style: Record<string, string> = {
    'text-align': 'center',
    'padding': '8px'
  }
  
  // 为第一列添加特殊样式
  if (column.property === 'label') {
    style['background-color'] = '#F5F7FA'
    style['font-weight'] = '500'
  }

  // 为第一行添加特殊样式
  if (row.label === selectedDate.value || row.label === '请选择日期') {
    style['font-weight'] = '500'
  }
  
  return style
}
</script>

<style scoped>
.day-ahead-arbitrage {
  padding: 20px;
  background-color: #fff;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.standalone-date-picker-form-item {
  margin: 0;
}

.standalone-date-picker-form-item :deep(.el-form-item__label) {
  font-size: 14px;
  color: #606266;
  padding-right: 12px;
}

.date-picker {
  width: 200px;
}

:deep(.el-input__inner) {
  color: #000000;
}

.file-actions {
  display: flex;
  gap: 12px;
}

.strategy-table {
  border: 1px solid #EBEEF5;
  overflow-x: auto;
}

:deep(.el-table) {
  --el-table-border-color: #EBEEF5;
  --el-table-header-bg-color: #F5F7FA;
}

:deep(.el-table__header) th {
  background-color: #F5F7FA;
  color: #606266;
  font-weight: 500;
  height: 40px;
  padding: 8px 0;
}

:deep(.el-table__row) td {
  padding: 8px;
  height: 40px;
}

:deep(.el-table__cell) {
  text-align: center;
}

:deep(.el-button) {
  font-size: 14px;
  height: 32px;
  padding: 0 16px;
}

:deep(.el-date-editor) {
  width: 200px;
}

:deep(.el-table__fixed-right-patch) {
  background-color: #F5F7FA;
}
</style> 