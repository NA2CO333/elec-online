<template>
  <div class="schedule-management">
    <el-card class="schedule-card">
      <template #header>
        <div class="card-header">
          <h2>日程管理</h2>
          <el-button type="primary" @click="openAddDialog">添加日程</el-button>
        </div>
      </template>
      
      <el-calendar v-model="currentDate">
        <template #date-cell="{ data }">
          <div 
            class="calendar-day" 
            @click="handleDateClick(data.day)"
          >
            <div class="day-number">{{ data.day.split('-').slice(2).join('') }}</div>
            <div class="day-events">
              <div 
                v-for="(event, index) in getEventsForDay(data.day)" 
                :key="index" 
                class="event-item"
                :class="{ 'is-today': isToday(event.time) }"
                @click.stop="openEventDetail(event)"
              >
                <el-tag size="small" :type="getEventTypeColor(event.type)">{{ event.type }}</el-tag>
                {{ formatEventTime(event.time) }} {{ event.title }}
              </div>
            </div>
          </div>
        </template>
      </el-calendar>
    </el-card>
    
    <!-- 日期日程对话框 -->
    <el-dialog
      v-model="dateDialogVisible"
      :title="isEdit ? '编辑日程' : (isFromCalendar ? `添加${selectedDateText}日程` : '添加日程')"
      width="500px"
      append-to-body
    >
      <el-form :model="dateScheduleForm" :rules="dateScheduleRules" ref="dateScheduleFormRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="dateScheduleForm.title" placeholder="请输入日程标题"></el-input>
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="dateScheduleForm.type" placeholder="选择日程类型" style="width: 100%">
            <el-option v-for="item in eventTypes" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="!isFromCalendar" label="日期" prop="date">
          <el-date-picker 
            v-model="dateScheduleForm.date" 
            type="date" 
            placeholder="选择日期"
            style="width: 100%"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="时间" prop="timeOnly">
          <el-time-picker v-model="dateScheduleForm.timeOnly" format="HH:mm" placeholder="选择时间" style="width: 100%"></el-time-picker>
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="dateScheduleForm.location" placeholder="请输入地点"></el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="dateScheduleForm.description" type="textarea" placeholder="请输入备注信息"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveDateSchedule">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 日程详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="日程详情"
      width="500px"
    >
      <div v-if="currentEvent" class="event-detail">
        <h3>{{ currentEvent.title }}</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="时间">{{ formatDateTime(currentEvent.time) }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="getEventTypeColor(currentEvent.type)">{{ currentEvent.type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="地点">{{ currentEvent.location }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ currentEvent.description || '无' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <div class="detail-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <div>
            <el-button type="primary" @click="currentEvent && openEditDialog(currentEvent)">编辑</el-button>
            <el-button type="danger" @click="currentEvent && confirmDeleteEvent()">删除</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { Calendar, Document, Delete, Edit, InfoFilled, Bell } from '@element-plus/icons-vue'

// 确保dayjs使用中文
dayjs.locale('zh-cn')

// 模拟数据和类型定义
interface ScheduleEvent {
  id: string
  title: string
  time: Date
  type: string
  location: string
  description?: string
}

// 日程类型
const eventTypes = [
  { value: '会议', label: '会议' },
  { value: '培训', label: '培训' },
  { value: '出差', label: '出差' },
  { value: '客户拜访', label: '客户拜访' },
  { value: '休假', label: '休假' },
  { value: '其他', label: '其他' }
]

// 日程相关状态
const schedules = ref<ScheduleEvent[]>([])
const dateDialogVisible = ref(false)
const detailsDialogVisible = ref(false)
const selectedSchedule = ref<ScheduleEvent | null>(null)
const selectedDate = ref(new Date())
const isEdit = ref(false)
const isFromCalendar = ref(false)

// 日期日程表单
const dateScheduleFormRef = ref<FormInstance>()
const dateScheduleForm = reactive({
  id: '',
  title: '',
  type: '',
  date: new Date(),
  timeOnly: new Date('2000-01-01 09:00:00'),
  location: '',
  description: ''
})

// 表单验证规则
const dateScheduleRules = {
  title: [
    { required: true, message: '请输入日程标题', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择日程类型', trigger: 'change' }
  ],
  date: [
    { type: 'date', required: true, message: '请选择日期', trigger: 'change' }
  ],
  timeOnly: [
    { type: 'date', required: true, message: '请选择时间', trigger: 'change' }
  ]
}

// 日程类型选项
const scheduleTypes = [
  { value: 'meeting', label: '会议' },
  { value: 'appointment', label: '预约' },
  { value: 'task', label: '任务' },
  { value: 'reminder', label: '提醒' },
  { value: 'other', label: '其他' }
]

// 状态变量
const currentDate = ref(new Date())
const loading = ref(false)
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentEvent = ref<ScheduleEvent | null>(null)
const filterType = ref('')
const scheduleFormRef = ref<FormInstance>()

// 选中的日期相关
const selectedDateText = computed(() => {
  if (!selectedDate.value) return ''
  return dayjs(selectedDate.value).format('YYYY年MM月DD日')
})

// 普通表单数据
const scheduleForm = reactive({
  id: '',
  title: '',
  time: new Date(),
  type: '',
  location: '',
  description: ''
})

// 过滤后的日程列表
const filteredSchedules = computed(() => {
  if (!filterType.value) {
    return schedules.value.sort((a, b) => a.time.getTime() - b.time.getTime())
  }
  return schedules.value
    .filter(s => s.type === filterType.value)
    .sort((a, b) => a.time.getTime() - b.time.getTime())
})

// 获取当前最近日程
const latestSchedule = computed(() => {
  const now = new Date()
  const futureEvents = schedules.value
    .filter(event => event.time >= now)
    .sort((a, b) => a.time.getTime() - b.time.getTime())
  
  return futureEvents.length > 0 ? futureEvents[0] : null
})

// 向外暴露当前最近日程
defineExpose({
  latestSchedule
})

// 处理日期点击事件
function handleDateClick(dateString: string) {
  const clickedDate = new Date(dateString)
  selectedDate.value = clickedDate
  isFromCalendar.value = true
  
  // 重置表单
  dateScheduleForm.id = ''
  dateScheduleForm.title = ''
  dateScheduleForm.type = ''
  dateScheduleForm.date = clickedDate
  dateScheduleForm.timeOnly = new Date('2000-01-01 09:00:00') // 默认9点
  dateScheduleForm.location = ''
  dateScheduleForm.description = ''
  
  // 打开特定日期的添加对话框
  dateDialogVisible.value = true
}

// 保存从日期点击添加的日程
function saveDateSchedule() {
  dateScheduleFormRef.value?.validate(valid => {
    if (valid) {
      // 根据是否从日历点击确定日期
      const dateToUse = isFromCalendar.value ? selectedDate.value : dateScheduleForm.date
      const combinedDateTime = new Date(dateToUse)
      
      // 从timeOnly中获取小时和分钟
      const hours = dateScheduleForm.timeOnly.getHours()
      const minutes = dateScheduleForm.timeOnly.getMinutes()
      
      // 设置时间部分
      combinedDateTime.setHours(hours, minutes, 0, 0)
      
      if (isEdit.value) {
        // 编辑现有日程
        const index = schedules.value.findIndex(item => item.id === dateScheduleForm.id)
        if (index !== -1) {
          schedules.value[index] = {
            id: dateScheduleForm.id,
            title: dateScheduleForm.title,
            time: combinedDateTime,
            type: dateScheduleForm.type,
            location: dateScheduleForm.location,
            description: dateScheduleForm.description
          }
        }
        ElMessage.success('日程已更新')
      } else {
        // 添加新日程
        const newEvent = {
          id: generateId(),
          title: dateScheduleForm.title,
          time: combinedDateTime,
          type: dateScheduleForm.type,
          location: dateScheduleForm.location,
          description: dateScheduleForm.description
        }
        schedules.value.push(newEvent)
        ElMessage.success('日程已添加')
      }
      
      // 关闭对话框并保存到本地存储
      dateDialogVisible.value = false
      isEdit.value = false
      isFromCalendar.value = false
      saveToLocalStorage()
    }
  })
}

// 打开普通添加日程对话框
function openAddDialog() {
  isEdit.value = false
  isFromCalendar.value = false
  
  // 重置日期日程表单
  dateScheduleForm.id = ''
  dateScheduleForm.title = ''
  dateScheduleForm.type = ''
  dateScheduleForm.date = new Date()
  dateScheduleForm.timeOnly = new Date('2000-01-01 09:00:00')
  dateScheduleForm.location = ''
  dateScheduleForm.description = ''
  
  // 显示日期对话框
  dateDialogVisible.value = true
}

// 获取指定日期的日程
function getEventsForDay(day: string) {
  const date = new Date(day)
  return schedules.value.filter(event => {
    const eventDate = new Date(event.time)
    return eventDate.getFullYear() === date.getFullYear() &&
           eventDate.getMonth() === date.getMonth() &&
           eventDate.getDate() === date.getDate()
  })
}

// 格式化日期时间
function formatDateTime(date: Date) {
  return dayjs(date).format('YYYY年MM月DD日 HH:mm')
}

// 格式化事件时间
function formatEventTime(date: Date) {
  return dayjs(date).format('HH:mm')
}

// 检查事件是否为今天
function isToday(date: Date) {
  const today = new Date()
  return date.getDate() === today.getDate() && 
         date.getMonth() === today.getMonth() && 
         date.getFullYear() === today.getFullYear()
}

// 获取事件类型对应的颜色
function getEventTypeColor(type: string) {
  const typeMap: Record<string, string> = {
    '会议': '',      // default
    '交易': 'success',
    '拜访': 'warning',
    '培训': 'info',
    '节假日': 'danger'
  }
  return typeMap[type] || ''
}

// 打开编辑日程对话框
function openEditDialog(event: ScheduleEvent) {
  isEdit.value = true
  isFromCalendar.value = false
  selectedSchedule.value = event
  currentEvent.value = event
    
  // 使用日期时间分离的方式编辑
  dateScheduleForm.id = event.id
  dateScheduleForm.title = event.title
  dateScheduleForm.type = event.type
  
  // 设置日期
  dateScheduleForm.date = new Date(event.time)
  
  // 提取时间部分
  const scheduleTime = new Date(event.time)
  dateScheduleForm.timeOnly = new Date(2000, 0, 1, scheduleTime.getHours(), scheduleTime.getMinutes())
  
  dateScheduleForm.location = event.location || ''
  dateScheduleForm.description = event.description || ''
  
  // 设置选中的日期
  selectedDate.value = new Date(event.time)
  
  // 显示对话框
  dateDialogVisible.value = true
}

// 打开日程详情对话框
function openEventDetail(event: ScheduleEvent) {
  currentEvent.value = event
  selectedSchedule.value = event
  detailDialogVisible.value = true
}

// 重置表单
function resetForm() {
  scheduleForm.id = ''
  scheduleForm.title = ''
  scheduleForm.time = new Date()
  scheduleForm.type = ''
  scheduleForm.location = ''
  scheduleForm.description = ''
}

// 保存日程
function saveSchedule() {
  // 这个函数不再需要，所有保存操作由saveDateSchedule处理
  console.log("原saveSchedule函数已不再使用")
}

// 删除日程
function deleteSchedule(event: ScheduleEvent) {
  ElMessageBox.confirm('确定要删除此日程吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    schedules.value = schedules.value.filter(item => item.id !== event.id)
    ElMessage.success('日程已删除')
    saveToLocalStorage()
  }).catch(() => {})
}

// 确认删除事件
function confirmDeleteEvent() {
  if (!currentEvent.value && !selectedSchedule.value) return
  
  const eventToDelete = currentEvent.value || selectedSchedule.value
  
  ElMessageBox.confirm('确定要删除此日程吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    if (eventToDelete) {
      schedules.value = schedules.value.filter(item => item.id !== eventToDelete.id)
      ElMessage.success('日程已删除')
      saveToLocalStorage()
      detailDialogVisible.value = false
    }
  }).catch(() => {})
}

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

// 保存到本地存储
function saveToLocalStorage() {
  localStorage.setItem('schedules', JSON.stringify(schedules.value.map(s => ({
    ...s,
    time: s.time.toISOString()
  }))))
}

// 从本地存储加载
function loadFromLocalStorage() {
  const saved = localStorage.getItem('schedules')
  if (saved) {
    try {
      schedules.value = JSON.parse(saved).map((s: any) => ({
        ...s,
        time: new Date(s.time)
      }))
    } catch (error) {
      console.error('Error loading schedules:', error)
    }
  } else {
    // 生成一些示例数据
    generateSampleData()
  }
}

// 生成示例数据
function generateSampleData() {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)
  
  schedules.value = [
    {
      id: generateId(),
      title: '月度双边交易',
      time: new Date(today.setHours(10, 0, 0, 0)),
      type: '交易',
      location: '交易中心会议室',
      description: '与华能集团进行月度电力交易洽谈'
    },
    {
      id: generateId(),
      title: '客户拜访',
      time: new Date(tomorrow.setHours(14, 30, 0, 0)),
      type: '拜访',
      location: '江苏电力有限公司',
      description: '了解客户用电需求，介绍新的电力产品'
    },
    {
      id: generateId(),
      title: '电力交易培训',
      time: new Date(nextWeek.setHours(9, 0, 0, 0)),
      type: '培训',
      location: '培训中心',
      description: '组织新员工参加电力交易基础知识培训'
    }
  ]
  
  saveToLocalStorage()
}

// 初始化
onMounted(() => {
  loadFromLocalStorage()
})
</script>

<style scoped>
.schedule-management {
  padding: 20px;
}

.schedule-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calendar-day {
  height: 80px;
  overflow-y: auto;
  cursor: pointer;
  transition: background-color 0.2s;
}

.calendar-day:hover {
  background-color: #f0f9ff;
}

.day-number {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-item {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 2px 5px;
}

.event-item:hover {
  background-color: #ebeef5;
}

.event-item.is-today {
  background-color: #f0f9eb;
  border-left: 2px solid #67c23a;
}

.event-detail h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #303133;
}

.schedule-form :deep(.el-input__wrapper),
.schedule-form :deep(.el-textarea__inner),
.schedule-form :deep(.el-select),
.schedule-form :deep(.el-date-editor) {
  width: 100%;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

.schedule-form :deep(.el-form-item__content) {
  display: flex;
}

.schedule-form :deep(.el-select .el-input) {
  width: 100%;
}

.schedule-form :deep(.el-date-editor.el-input) {
  width: 100%;
}

.schedule-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.detail-footer {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

:deep(.el-calendar-day) {
  height: auto;
  padding: 4px;
}

:deep(.el-calendar-table) td {
  border: 1px solid #ebeef5;
}

.calendar-container {
  margin-top: 20px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.calendar-nav {
  display: flex;
  align-items: center;
}

.current-date {
  margin: 0 10px;
  font-size: 14px;
  font-weight: bold;
}

.calendar-view-options {
  margin-left: auto;
}
</style> 