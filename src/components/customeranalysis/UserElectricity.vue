<template>
  <div class="user-electricity-container">
    <!-- 顶部搜索和工单区域 -->
    <el-card class="filter-card operations-card">
      <div class="header-area operations-bar">
        <div class="search-area left-operations">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索企业名称或ID"
            class="search-input"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <el-button type="primary" @click="handleSearch" class="search-btn">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetFilters" class="reset-btn" style="margin-left: 2px;">
            <el-icon><RefreshRight /></el-icon>重置
          </el-button>
        </div>
        
        <div class="action-area right-operations">
          <el-button type="warning" @click="createDataAnomalyTicket">
            <el-icon><WarningFilled /></el-icon>数据异常工单
          </el-button>
          <el-button type="success" @click="createDataModificationTicket">
            <el-icon><Edit /></el-icon>数据修改申请
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- 中部曲线图区域 -->
    <el-card class="chart-card">
      <template #header>
        <div class="chart-card-header">
          <div class="title">电量曲线比对</div>
          <div class="chart-controls">
            <el-radio-group v-model="timeScale" size="small" @change="handleTimeScaleChange">
              <el-radio-button value="hour">小时</el-radio-button>
              <el-radio-button value="day">日</el-radio-button>
              <el-radio-button value="month">月</el-radio-button>
              <el-radio-button value="year">年</el-radio-button>
            </el-radio-group>
            
            <el-button size="small" @click="exportChartData">
              <el-icon><Download /></el-icon>导出数据
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="chart-container">
        <div class="chart-wrapper">
          <div class="chart-area" ref="chartRef"></div>
        </div>
        <div class="chart-legend">
          <div class="legend-title">曲线选择</div>
          <el-checkbox-group v-model="selectedCurves" @change="updateChart">
            <el-checkbox value="current">当前曲线</el-checkbox>
            <el-checkbox value="history">历史同期</el-checkbox>
            <el-checkbox value="typical">市场实际量</el-checkbox>
            <el-checkbox value="baseline">统调基线</el-checkbox>
            <el-checkbox value="custom">自定义基线</el-checkbox>
          </el-checkbox-group>
          
          <div class="legend-filters">
            <div class="filter-title">数据筛选</div>
            <el-select v-model="dayType" placeholder="日类型" size="small" @change="updateChart">
              <el-option label="全部" value="all" />
              <el-option label="工作日" value="workday" />
              <el-option label="周末" value="weekend" />
              <el-option label="节假日" value="holiday" />
            </el-select>
            
            <el-select v-model="loadType" placeholder="负荷类型" size="small" @change="updateChart">
              <el-option label="全部" value="all" />
              <el-option label="峰时段" value="peak" />
              <el-option label="平时段" value="flat" />
              <el-option label="谷时段" value="valley" />
            </el-select>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 底部表格区域 -->
    <el-card class="data-card">
      <template #header>
        <div class="data-card-header">
          <span class="title">用电数据分析</span>
          <div class="header-actions">
            <el-radio-group v-model="dataViewMode" size="small">
              <el-radio-button value="table">表格视图</el-radio-button>
              <el-radio-button value="indicators">指标视图</el-radio-button>
              <el-radio-button value="anomalies">异常事件</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>
      
      <!-- 表格视图 -->
      <template v-if="dataViewMode === 'table'">
        <div class="table-container">
          <el-table
            :data="electricityData" 
            style="width: 100%"
            border 
            v-loading="loading"
            height="350"
          >
            <el-table-column type="index" width="50" align="center" />
            <el-table-column prop="timestamp" label="时间" min-width="150" sortable align="center" />
            <el-table-column prop="value" label="电量(kWh)" min-width="100" sortable align="right" />
            <el-table-column prop="anomalyType" label="异常类型" min-width="100" align="center">
              <template #default="scope">
                <el-tag v-if="scope.row.anomalyType" :type="getAnomalyTagType(scope.row.anomalyType)">
                  {{ scope.row.anomalyType }}
                </el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="corrected" label="已修正" width="70" align="center">
              <template #default="scope">
                <el-icon v-if="scope.row.corrected" color="#67C23A"><CircleCheck /></el-icon>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="dayType" label="日类型" min-width="90" align="center" />
            <el-table-column prop="loadPeriod" label="负荷时段" min-width="90" align="center" />
            <el-table-column prop="difference" label="同比差异" min-width="100" align="center">
              <template #default="scope">
                <span v-if="scope.row.difference !== null" :class="scope.row.difference >= 0 ? 'up' : 'down'">
                  {{ scope.row.difference >= 0 ? '+' : '' }}{{ scope.row.difference }}%
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="120" fixed="right" align="center">
              <template #default="scope">
                <div class="action-buttons">
                  <el-button v-if="!scope.row.corrected" size="small" type="primary" @click="correctData(scope.row)">
                    修正数据
                  </el-button>
                  <el-button v-if="scope.row.anomalyType" size="small" type="warning" @click="markAnomalyResolved(scope.row)">
                    标记已解决
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <div class="page-size-wrapper">
              <span>每页</span>
              <el-select v-model="pageSize" size="small" @change="handleSizeChange" class="page-size-select">
                <el-option
                  v-for="item in [10, 20, 50, 100]"
                  :key="item"
                  :label="`${item}`"
                  :value="item"
                />
              </el-select>
              <span>条</span>
            </div>
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              layout="prev, pager, next, jumper, total"
              :total="totalItems"
              @current-change="handleCurrentChange"
              :pager-count="5"
              background
              class="enhanced-pagination"
            />
          </div>
        </div>
      </template>
      
      <!-- 指标视图 -->
      <template v-else-if="dataViewMode === 'indicators'">
        <div class="indicators-container">
          <el-row :gutter="20">
            <el-col :span="8" v-for="indicator in keyIndicators" :key="indicator.name">
              <el-card class="indicator-card" shadow="hover">
                <div class="indicator-header">
                  <div class="indicator-name">{{ indicator.name }}</div>
                  <el-tooltip :content="indicator.description" placement="top">
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
                <div class="indicator-value">{{ indicator.value }}</div>
                <div class="indicator-comparison">
                  <div class="comparison-title">对比分析：</div>
                  <el-progress 
                    :percentage="indicator.comparisonPercentage" 
                    :stroke-width="8"
                    :color="indicator.color"
                    :show-text="false"
                  />
                  <div class="comparison-data">
                    <span>用户值: {{ indicator.value }}</span>
                    <span>参考值: {{ indicator.referenceValue }}</span>
                  </div>
                  <div class="comparison-note">{{ indicator.note }}</div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </template>
      
      <!-- 异常事件视图 -->
      <template v-else>
        <div class="anomalies-container">
          <el-alert
            title="数据异常和用电行为异常日志"
            type="info"
            :closable="false"
            description="记录所有检测到的数据异常和用户用电行为异常信息"
            show-icon
            style="margin-bottom: 15px;"
          />
          
          <el-timeline>
            <el-timeline-item
              v-for="(event, index) in anomalyEvents"
              :key="index"
              :timestamp="event.timestamp"
              :type="getEventType(event.type)"
              :hollow="event.resolved"
              :icon="getEventIcon(event.type)"
            >
              <el-card class="event-card">
                <div class="event-header">
                  <span class="event-title">{{ event.title }}</span>
                  <el-tag v-if="event.resolved" type="success" size="small">已解决</el-tag>
                  <el-tag v-else type="danger" size="small">未解决</el-tag>
                </div>
                <div class="event-content">{{ event.description }}</div>
                <div class="event-meta">
                  <span>影响时段: {{ event.affectedPeriod }}</span>
                  <span>异常度: {{ event.severity }}</span>
                </div>
                <div class="event-actions" v-if="!event.resolved">
                  <el-button size="small" type="primary" @click="resolveEvent(event)">标记已解决</el-button>
                  <el-button size="small" @click="viewEventDetails(event)">查看详情</el-button>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
      </template>
    </el-card>
    
    <!-- 数据异常工单对话框 -->
    <el-dialog
      v-model="anomalyTicketVisible"
      title="创建数据异常工单"
      width="600px"
    >
      <el-form :model="anomalyTicketForm" label-width="120px" :rules="ticketRules" ref="anomalyTicketFormRef">
        <el-form-item label="异常类型" prop="type">
          <el-select v-model="anomalyTicketForm.type" placeholder="请选择异常类型" style="width: 100%">
            <el-option label="负值" value="negative" />
            <el-option label="极大值" value="extreme" />
            <el-option label="缺失值" value="missing" />
            <el-option label="零值" value="zero" />
            <el-option label="其他异常" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="anomalyTicketForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="anomalyTicketForm.endTime"
            type="datetime"
            placeholder="选择结束时间"
            format="YYYY-MM-DD HH:mm"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="影响度" prop="severity">
          <el-rate v-model="anomalyTicketForm.severity" :max="5" />
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="anomalyTicketForm.description"
            type="textarea"
            placeholder="请详细描述异常情况"
            :rows="4"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="anomalyTicketVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAnomalyTicket">提交工单</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 数据修改申请对话框 -->
    <el-dialog
      v-model="modificationTicketVisible"
      title="创建数据修改申请"
      width="600px"
    >
      <el-form :model="modificationTicketForm" label-width="120px" :rules="ticketRules" ref="modificationTicketFormRef">
        <el-form-item label="修改时间段" prop="timeRange">
          <el-date-picker
            v-model="modificationTicketForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="修改原因" prop="reason">
          <el-select v-model="modificationTicketForm.reason" placeholder="请选择修改原因" style="width: 100%">
            <el-option label="设备故障" value="equipment_failure" />
            <el-option label="数据异常" value="data_anomaly" />
            <el-option label="计量错误" value="metering_error" />
            <el-option label="数据丢失" value="data_loss" />
            <el-option label="其他原因" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="修改方式" prop="method">
          <el-radio-group v-model="modificationTicketForm.method">
            <el-radio value="interpolation">插值法</el-radio>
            <el-radio value="historical">历史同期</el-radio>
            <el-radio value="manual">手动输入</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="修改值" prop="value" v-if="modificationTicketForm.method === 'manual'">
          <el-input-number v-model="modificationTicketForm.value" :precision="2" :step="0.1" style="width: 100%" />
        </el-form-item>
        
        <el-form-item label="备注说明" prop="description">
          <el-input
            v-model="modificationTicketForm.description"
            type="textarea"
            placeholder="请提供数据修改的详细说明"
            :rows="4"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="modificationTicketVisible = false">取消</el-button>
          <el-button type="primary" @click="submitModificationTicket">提交申请</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 数据修正对话框 -->
    <el-dialog
      v-model="dataCorrectDialogVisible"
      title="数据修正"
      width="500px"
    >
      <div v-if="currentRecord" class="data-correct-container">
        <el-alert
          title="请谨慎修改数据，修改历史将被记录"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 20px;"
        />
        
        <el-descriptions :column="1" border>
          <el-descriptions-item label="时间点">{{ currentRecord.timestamp }}</el-descriptions-item>
          <el-descriptions-item label="原始值">{{ currentRecord.value }} kWh</el-descriptions-item>
          <el-descriptions-item label="异常类型" v-if="currentRecord.anomalyType">
            <el-tag :type="getAnomalyTagType(currentRecord.anomalyType)">{{ currentRecord.anomalyType }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        
        <el-form :model="correctionForm" label-width="100px" style="margin-top: 20px;">
          <el-form-item label="修正方式">
            <el-radio-group v-model="correctionForm.method">
              <el-radio value="manual">手动输入</el-radio>
              <el-radio value="interpolation">线性插值</el-radio>
              <el-radio value="historical">历史同期</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="修正值" v-if="correctionForm.method === 'manual'">
            <el-input-number v-model="correctionForm.value" :precision="2" :step="0.1" controls-position="right" style="width: 100%" />
          </el-form-item>
          
          <el-form-item label="修正原因">
            <el-input v-model="correctionForm.reason" type="textarea" :rows="3" placeholder="请输入修正原因" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dataCorrectDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitDataCorrection">确认修正</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { 
  Search, 
  RefreshRight, 
  Download, 
  DataAnalysis, 
  User, 
  Histogram,
  PriceTag,
  View,
  Cpu,
  CircleCheck,
  CircleClose,
  WarningFilled,
  Edit,
  QuestionFilled,
  Timer
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'

// 搜索和筛选
const searchKeyword = ref('')

// 表格分页
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const loading = ref(false)

// 图表相关
const chartRef = ref(null)
const chartInstance = ref(null)
const timeScale = ref('day')
const selectedCurves = ref(['current'])
const dayType = ref('all')
const loadType = ref('all')

// 视图模式
const dataViewMode = ref('table')

// 对话框控制
const anomalyTicketVisible = ref(false)
const modificationTicketVisible = ref(false)
const dataCorrectDialogVisible = ref(false)

// 当前选中的记录
const currentRecord = ref(null)

// 表单对象
const anomalyTicketForm = reactive({
  type: '',
  startTime: '',
  endTime: '',
  severity: 3,
  description: ''
})

const modificationTicketForm = reactive({
  timeRange: [],
  reason: '',
  method: 'interpolation',
  value: 0,
  description: ''
})

const correctionForm = reactive({
  method: 'manual',
  value: 0,
  reason: ''
})

// 表单校验规则
const ticketRules = {
  type: [{ required: true, message: '请选择异常类型', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  timeRange: [{ required: true, message: '请选择时间范围', trigger: 'change' }],
  reason: [{ required: true, message: '请选择修改原因', trigger: 'change' }],
  method: [{ required: true, message: '请选择修改方式', trigger: 'change' }],
  value: [{ required: true, message: '请输入修改值', trigger: 'blur' }]
}

// 表单引用
const anomalyTicketFormRef = ref(null)
const modificationTicketFormRef = ref(null)

// 模拟电量数据
const electricityData = ref([])

// 模拟关键指标数据
const keyIndicators = ref([
  {
    name: '日前价值(元/kWh)',
    value: '0.567',
    description: '用户电量在日前市场的平均价值',
    comparisonPercentage: 65,
    referenceValue: '0.492',
    color: '#67C23A',
    note: '高于系统平均值15.2%，处于合理区间'
  },
  {
    name: '峰谷比',
    value: '2.35',
    description: '峰时段与谷时段用电量的比值',
    comparisonPercentage: 78,
    referenceValue: '1.92',
    color: '#E6A23C',
    note: '峰谷差异大于平均水平，可考虑负荷平移'
  },
  {
    name: '工作日用电占比',
    value: '82.4%',
    description: '工作日用电量占总用电量的比例',
    comparisonPercentage: 90,
    referenceValue: '75.6%',
    color: '#67C23A',
    note: '工作日用电集中，符合工商业用电特征'
  },
  {
    name: '周末用电占比',
    value: '12.6%',
    description: '周末用电量占总用电量的比例',
    comparisonPercentage: 72,
    referenceValue: '18.4%',
    color: '#F56C6C',
    note: '周末用电较低，可考虑优化周末用电计划'
  },
  {
    name: '节假日用电占比',
    value: '5.0%',
    description: '节假日用电量占总用电量的比例',
    comparisonPercentage: 56,
    referenceValue: '6.0%',
    color: '#409EFF',
    note: '节假日用电偏低，可关注节假日生产计划'
  },
  {
    name: '用电波动系数',
    value: '0.24',
    description: '衡量用电稳定性的指标',
    comparisonPercentage: 48,
    referenceValue: '0.18',
    color: '#F56C6C',
    note: '用电波动较大，建议分析原因'
  }
])

// 模拟异常事件数据
const anomalyEvents = ref([
  {
    timestamp: '2024-05-15 10:30:00',
    title: '电量数据异常 - 负值',
    type: 'data',
    description: '检测到用户 ID-12345 在2024-05-15 09:00-10:00时段存在负值电量数据，可能是设备故障或数据传输错误',
    affectedPeriod: '2024-05-15 09:00 - 10:00',
    severity: '高',
    resolved: false
  },
  {
    timestamp: '2024-05-14 16:45:00',
    title: '用电行为异常 - 峰值偏离',
    type: 'behavior',
    description: '用户 ID-12345 在2024-05-14 15:00-16:00时段用电量较历史同期偏高37%，超出正常波动范围',
    affectedPeriod: '2024-05-14 15:00 - 16:00',
    severity: '中',
    resolved: true
  },
  {
    timestamp: '2024-05-12 08:15:00',
    title: '电量数据异常 - 缺失',
    type: 'data',
    description: '检测到用户 ID-12345 在2024-05-12 00:00-08:00时段数据完全缺失，需要补充数据',
    affectedPeriod: '2024-05-12 00:00 - 08:00',
    severity: '高',
    resolved: false
  },
  {
    timestamp: '2024-05-10 20:30:00',
    title: '用电行为异常 - 波动异常',
    type: 'behavior',
    description: '用户 ID-12345 在2024-05-10 18:00-20:00时段用电波动频繁，短时间内有多次大幅度变化',
    affectedPeriod: '2024-05-10 18:00 - 20:00',
    severity: '低',
    resolved: true
  },
  {
    timestamp: '2024-05-08 14:10:00',
    title: '电量数据异常 - 零值',
    type: 'data',
    description: '检测到用户 ID-12345 在2024-05-08 12:00-14:00时段存在连续零值，与正常工作时间不符',
    affectedPeriod: '2024-05-08 12:00 - 14:00',
    severity: '中',
    resolved: false
  }
])

// 存储各曲线的固定数据
const chartDataCache = reactive({
  current: null,
  history: null,
  typical: null,
  baseline: null,
  custom: null
})

// 初始化图表
const initChart = () => {
  if (chartRef.value) {
    // 销毁现有实例
    if (chartInstance.value) {
      chartInstance.value.dispose()
    }
    
    // 创建新实例
    chartInstance.value = echarts.init(chartRef.value)
    updateChart()
    
    // 添加窗口大小变化监听
    window.addEventListener('resize', handleResize)
  }
}

// 更新图表
const updateChart = () => {
  if (!chartInstance.value) return
  
  const legends = getSelectedLegends()
  
  // 如果没有选中任何曲线，显示提示信息
  if (legends.length === 0) {
    chartInstance.value.setOption({
      title: {
        text: '请选择至少一条曲线进行显示',
        left: 'center',
        top: 'center',
        textStyle: {
          fontSize: 16,
          color: '#909399'
        }
      },
      xAxis: {
        show: false
      },
      yAxis: {
        show: false
      },
      series: []
    }, true)
    return
  }

  // 清除所有series数据，以确保不会显示未勾选的曲线
  chartInstance.value.clear()
  
  const option = {
    title: {
      text: '用户电量曲线分析',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    legend: {
      data: legends,
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
      data: getTimeAxisData()
    },
    yAxis: {
      type: 'value',
      name: '电量 (kWh)'
    },
    series: getChartSeries(),
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100
      }
    ],
    toolbox: {
      feature: {
        saveAsImage: {},
        dataZoom: {},
        restore: {}
      },
      right: 20,
      top: 20
    }
  }
  
  chartInstance.value.setOption(option, true) // 使用true参数确保完全覆盖之前的配置
}

// 获取时间轴数据
const getTimeAxisData = () => {
  const timeData = []
  const now = new Date()
  let format = ''
  let count = 0
  
  switch (timeScale.value) {
    case 'hour':
      format = 'HH:00'
      count = 24
      for (let i = 0; i < count; i++) {
        timeData.push(`${String(i).padStart(2, '0')}:00`)
      }
      break
    case 'day':
      format = 'MM-DD'
      count = 30
      for (let i = 0; i < count; i++) {
        const date = new Date(now)
        date.setDate(date.getDate() - (count - 1) + i)
        timeData.push(`${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)
      }
      break
    case 'month':
      format = 'YYYY-MM'
      count = 12
      for (let i = 0; i < count; i++) {
        timeData.push(`${now.getFullYear()}-${String(i + 1).padStart(2, '0')}`)
      }
      break
    case 'year':
      format = 'YYYY'
      count = 5
      for (let i = 0; i < count; i++) {
        timeData.push(`${now.getFullYear() - (count - 1) + i}`)
      }
      break
  }
  
  return timeData
}

// 获取选中的图例
const getSelectedLegends = () => {
  const legends = []
  
  if (selectedCurves.value.includes('current')) {
    legends.push('当前用户')
  }
  if (selectedCurves.value.includes('history')) {
    legends.push('历史同期')
  }
  if (selectedCurves.value.includes('typical')) {
    legends.push('市场实际量')
  }
  if (selectedCurves.value.includes('baseline')) {
    legends.push('统调基线')
  }
  if (selectedCurves.value.includes('custom')) {
    legends.push('自定义基线')
  }
  
  return legends
}

// 获取图表系列数据
const getChartSeries = () => {
  const series = []
  const legends = getSelectedLegends()
  
  // 如果没有选中任何曲线，返回空数组
  if (legends.length === 0) {
    return []
  }
  
  // 生成随机数据，但只有在没有缓存时才生成新数据
  const generateRandomData = (curve, base, variance) => {
    if (!chartDataCache[curve]) {
      const timeData = getTimeAxisData()
      chartDataCache[curve] = timeData.map(() => (Math.random() * variance + base).toFixed(2))
    }
    return chartDataCache[curve]
  }
  
  if (legends.includes('当前用户')) {
    series.push({
      name: '当前用户',
      type: 'line',
      data: generateRandomData('current', 100, 30),
      smooth: true,
      lineStyle: {
        width: 3
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
    })
  }
  
  if (legends.includes('历史同期')) {
    series.push({
      name: '历史同期',
      type: 'line',
      data: generateRandomData('history', 95, 25),
      smooth: true,
      lineStyle: {
        width: 2,
        type: 'dashed'
      },
      emphasis: {
        focus: 'series'
      }
    })
  }
  
  if (legends.includes('市场实际量')) {
    series.push({
      name: '市场实际量',
      type: 'line',
      data: generateRandomData('typical', 90, 15),
      smooth: true,
      lineStyle: {
        width: 2,
        type: 'dotted'
      },
      emphasis: {
        focus: 'series'
      }
    })
  }
  
  if (legends.includes('统调基线')) {
    series.push({
      name: '统调基线',
      type: 'line',
      data: generateRandomData('baseline', 85, 10),
      smooth: true,
      lineStyle: {
        width: 2
      },
      emphasis: {
        focus: 'series'
      }
    })
  }
  
  if (legends.includes('自定义基线')) {
    series.push({
      name: '自定义基线',
      type: 'line',
      data: generateRandomData('custom', 80, 20),
      smooth: true,
      lineStyle: {
        width: 2,
        type: 'dashed'
      },
      emphasis: {
        focus: 'series'
      }
    })
  }
  
  return series
}

// 清除缓存的曲线数据
const clearChartDataCache = () => {
  Object.keys(chartDataCache).forEach(key => {
    chartDataCache[key] = null
  })
}

// 处理时间尺度变化
const handleTimeScaleChange = () => {
  // 清除缓存，因为时间轴变了，数据需要重新生成
  clearChartDataCache()
  updateChart()
}

// 窗口大小变化处理
const handleResize = () => {
  chartInstance.value && chartInstance.value.resize()
}

// 处理查询
const handleSearch = () => {
  loading.value = true
  
  // 模拟数据加载
  setTimeout(() => {
    generateElectricityData()
    loading.value = false
    ElMessage.success('数据加载成功')
  }, 800)
}

// 重置筛选条件
const resetFilters = () => {
  searchKeyword.value = ''
  handleSearch()
}

// 创建数据异常工单
const createDataAnomalyTicket = () => {
  anomalyTicketForm.type = ''
  anomalyTicketForm.startTime = ''
  anomalyTicketForm.endTime = ''
  anomalyTicketForm.severity = 3
  anomalyTicketForm.description = ''
  
  anomalyTicketVisible.value = true
}

// 创建数据修改申请
const createDataModificationTicket = () => {
  modificationTicketForm.timeRange = []
  modificationTicketForm.reason = ''
  modificationTicketForm.method = 'interpolation'
  modificationTicketForm.value = 0
  modificationTicketForm.description = ''
  
  modificationTicketVisible.value = true
}

// 提交数据异常工单
const submitAnomalyTicket = async () => {
  if (!anomalyTicketFormRef.value) return
  
  await anomalyTicketFormRef.value.validate((valid) => {
    if (valid) {
      // 模拟提交
  setTimeout(() => {
        ElMessage.success('数据异常工单提交成功')
        anomalyTicketVisible.value = false
        
        // 添加到异常事件列表
        anomalyEvents.value.unshift({
          timestamp: new Date().toLocaleString(),
          title: `数据异常工单 - ${anomalyTicketForm.type === 'negative' ? '负值' : 
                  anomalyTicketForm.type === 'extreme' ? '极大值' : 
                  anomalyTicketForm.type === 'missing' ? '缺失值' : 
                  anomalyTicketForm.type === 'zero' ? '零值' : '其他异常'}`,
          type: 'data',
          description: anomalyTicketForm.description,
          affectedPeriod: `${new Date(anomalyTicketForm.startTime).toLocaleString()} - ${new Date(anomalyTicketForm.endTime).toLocaleString()}`,
          severity: anomalyTicketForm.severity <= 2 ? '低' : anomalyTicketForm.severity <= 4 ? '中' : '高',
          resolved: false
        })
      }, 1000)
    }
  })
}

// 提交数据修改申请
const submitModificationTicket = async () => {
  if (!modificationTicketFormRef.value) return
  
  await modificationTicketFormRef.value.validate((valid) => {
    if (valid) {
      // 模拟提交
      setTimeout(() => {
        ElMessage.success('数据修改申请提交成功')
        modificationTicketVisible.value = false
        
        // 获取时间范围字符串，确保timeRange存在且有效
        let timeRangeStr = "未指定时间范围";
        if (modificationTicketForm.timeRange && modificationTicketForm.timeRange.length === 2) {
          timeRangeStr = `${new Date(modificationTicketForm.timeRange[0]).toLocaleString()} - ${new Date(modificationTicketForm.timeRange[1]).toLocaleString()}`;
        }
        
        // 添加到异常事件列表
        anomalyEvents.value.unshift({
          timestamp: new Date().toLocaleString(),
          title: `数据修改申请 - ${modificationTicketForm.reason === 'equipment_failure' ? '设备故障' : 
                  modificationTicketForm.reason === 'data_anomaly' ? '数据异常' : 
                  modificationTicketForm.reason === 'metering_error' ? '计量错误' : 
                  modificationTicketForm.reason === 'data_loss' ? '数据丢失' : '其他原因'}`,
          type: 'modification',
          description: modificationTicketForm.description,
          affectedPeriod: timeRangeStr,
          severity: '中',
          resolved: false
        })
      }, 1000)
    }
  })
}

// 修正数据
const correctData = (record) => {
  currentRecord.value = record
  correctionForm.method = 'manual'
  correctionForm.value = record.value
  correctionForm.reason = ''
  
  dataCorrectDialogVisible.value = true
}

// 提交数据修正
const submitDataCorrection = () => {
  if (!currentRecord.value) return
  
  // 模拟数据修正
  setTimeout(() => {
    // 更新数据
    const index = electricityData.value.findIndex(item => item === currentRecord.value)
    if (index !== -1) {
      // 安全获取当前记录的值并确保是数值类型
      const currentValue = parseFloat(currentRecord.value.value) || 0
      
      // 根据不同修正方法计算新值
      let newValue = currentValue
      if (correctionForm.method === 'manual') {
        newValue = correctionForm.value
      } else if (correctionForm.method === 'interpolation') {
        newValue = (currentValue * 0.9).toFixed(2)
      } else if (correctionForm.method === 'historical') {
        newValue = (currentValue * 0.95).toFixed(2)
      }
      
      // 保存原始值并更新记录
      const originalValue = currentRecord.value.value
      electricityData.value[index] = {
        ...currentRecord.value,
        value: newValue,
        corrected: true,
        originalValue: originalValue
      }
    }
    
    ElMessage.success('数据修正成功')
    dataCorrectDialogVisible.value = false
    
    // 添加到异常事件列表
    if (currentRecord.value) {
      let newValueDesc = '未知'
      if (correctionForm.method === 'manual') {
        newValueDesc = correctionForm.value
      } else if (correctionForm.method === 'interpolation') {
        newValueDesc = (parseFloat(currentRecord.value.value || 0) * 0.9).toFixed(2)
      } else if (correctionForm.method === 'historical') {
        newValueDesc = (parseFloat(currentRecord.value.value || 0) * 0.95).toFixed(2)
      }
      
      anomalyEvents.value.unshift({
        timestamp: new Date().toLocaleString(),
        title: `数据修正 - ${correctionForm.method === 'manual' ? '手动输入' : 
                correctionForm.method === 'interpolation' ? '线性插值' : '历史同期'}`,
        type: 'correction',
        description: `修正了 ${currentRecord.value.timestamp} 的数据，原值: ${currentRecord.value.value}，新值: ${newValueDesc}。修正原因: ${correctionForm.reason}`,
        affectedPeriod: currentRecord.value.timestamp,
        severity: '中',
        resolved: true
      })
    }
  }, 800)
}

// 标记异常已解决
const markAnomalyResolved = (record) => {
  ElMessageBox.confirm('确定要将此异常标记为已解决吗?', '确认操作', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟处理
    setTimeout(() => {
      const index = electricityData.value.findIndex(item => item === record)
      if (index !== -1) {
        electricityData.value[index] = {
          ...record,
          anomalyType: null,
          corrected: true
        }
      }
      
      ElMessage.success('已标记为已解决')
    }, 500)
  }).catch(() => {})
}

// 解决事件
const resolveEvent = (event) => {
  ElMessageBox.confirm('确定要将此事件标记为已解决吗?', '确认操作', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟处理
    setTimeout(() => {
      const index = anomalyEvents.value.findIndex(item => item === event)
      if (index !== -1) {
        anomalyEvents.value[index] = {
          ...event,
          resolved: true
        }
      }
      
      ElMessage.success('事件已标记为已解决')
    }, 500)
  }).catch(() => {})
}

// 查看事件详情
const viewEventDetails = (event) => {
  ElMessageBox.alert(event.description, '事件详情', {
    confirmButtonText: '关闭'
  })
}

// 导出图表数据
const exportChartData = () => {
  // 模拟导出
  ElMessage.success('数据导出功能开发中...')
}

// 处理分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  // 重新加载数据
  generateElectricityData()
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  // 重新加载数据
  generateElectricityData()
}

// 获取异常类型标签样式
const getAnomalyTagType = (type) => {
  switch (type) {
    case '负值':
      return 'danger'
    case '极大值':
      return 'warning'
    case '缺失值':
      return 'info'
    case '零值':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取事件类型
const getEventType = (type) => {
  switch (type) {
    case 'data':
      return 'danger'
    case 'behavior':
      return 'warning'
    case 'correction':
      return 'success'
    case 'modification':
      return 'info'
    default:
      return 'info'
  }
}

// 获取事件图标
const getEventIcon = (type) => {
  switch (type) {
    case 'data':
      return CircleClose
    case 'behavior':
      return WarningFilled
    case 'correction':
      return CircleCheck
    case 'modification':
      return Edit
    default:
      return WarningFilled
  }
}

// 生成电量数据
const generateElectricityData = () => {
  const data = []
  const now = new Date()
  const anomalyTypes = [null, null, null, null, '负值', null, null, '极大值', null, null, '缺失值', null, null, '零值', null]
  const dayTypes = ['工作日', '工作日', '工作日', '工作日', '工作日', '周末', '周末']
  const loadPeriods = ['峰时段', '峰时段', '平时段', '平时段', '平时段', '谷时段', '谷时段']
  
  for (let i = 0; i < 100; i++) {
    const date = new Date(now)
    date.setHours(now.getHours() - i)
    
    const value = (Math.random() * 300 + 50).toFixed(2)
    const anomalyIndex = Math.floor(Math.random() * anomalyTypes.length)
    const dayTypeIndex = date.getDay() < 5 ? Math.min(4, Math.floor(Math.random() * 5)) : 5 + Math.floor(Math.random() * 2)
    const loadPeriodIndex = Math.floor(Math.random() * loadPeriods.length)
    
    data.push({
      timestamp: date.toLocaleString(),
      value: anomalyTypes[anomalyIndex] === '负值' ? -(Math.random() * 50).toFixed(2) : 
             anomalyTypes[anomalyIndex] === '极大值' ? (Math.random() * 1000 + 500).toFixed(2) :
             anomalyTypes[anomalyIndex] === '零值' ? '0.00' : value,
      anomalyType: anomalyTypes[anomalyIndex],
      corrected: false,
      dayType: dayTypes[dayTypeIndex],
      loadPeriod: loadPeriods[loadPeriodIndex],
      difference: (Math.random() * 20 - 10).toFixed(1)
    })
  }
  
  electricityData.value = data.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
  totalItems.value = data.length
}

// 监听视图模式变化
watch(dataViewMode, (newVal) => {
  if (newVal === 'table') {
    generateElectricityData()
  }
})

// 确保至少选中一条曲线，否则默认选中当前曲线
watch(selectedCurves, (newVal) => {
  if (newVal.length === 0) {
    selectedCurves.value = ['current']
    ElMessage.info('至少需要选择一条曲线')
  }
  updateChart()
}, { immediate: true })

// 页面初始化
onMounted(() => {
  // 生成测试数据
  generateElectricityData()
  
  // 默认选中当前曲线
  if (selectedCurves.value.length === 0) {
    selectedCurves.value = ['current']
  }
  
  // 初始化图表
  nextTick(() => {
    initChart()
  })
})

// 组件销毁时清理
onUnmounted(() => {
  if (chartInstance.value) {
    window.removeEventListener('resize', handleResize)
    chartInstance.value.dispose()
  }
})
</script>

<style lang="scss" scoped>
.user-electricity-container {
  width: 100%;
}

/* 顶部卡片样式 */
.filter-card {
  margin-bottom: 16px;
}

/* 复用UserArchives.vue的样式 */
.operations-card {
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.operations-card :deep(.el-card__body) {
  padding: 15px;
}

.operations-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.left-operations {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.search-area {
  flex: 1;
  display: flex;
  align-items: center;
  margin-right: 20px;
}

.search-input {
  width: 220px;
}

.search-input :deep(.el-input__wrapper) {
  background-color: #fff;
  box-shadow: 0 0 0 1px #dcdfe6 inset !important;
  border: none;
  border-radius: 4px;
}

.search-input :deep(.el-input__inner) {
  color: #606266;
}

.search-input :deep(.el-input__prefix) {
  color: #909399;
}

.search-btn,
.reset-btn {
  white-space: nowrap;
  height: 36px;
}

.search-btn {
  background-color: #409EFF;
  border-color: #409EFF;
  font-weight: 500;
}

.right-operations {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 原有样式保留 */
.action-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 图表卡片样式 */
.chart-card {
  margin-bottom: 16px;
}

.chart-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chart-container {
  display: flex;
  height: 400px;
  margin-top: 10px;
}

.chart-wrapper {
  flex: 1;
  height: 100%;
  border-right: 1px solid #ebeef5;
}

.chart-area {
  width: 100%;
  height: 100%;
}

.chart-legend {
  width: 200px;
  padding: 0 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.legend-title {
  font-weight: 500;
  font-size: 16px;
  margin-bottom: 10px;
}

.legend-filters {
  margin-top: 15px;
}

.filter-title {
  font-weight: 500;
  margin-bottom: 10px;
}

/* 数据卡片样式 */
.data-card {
  margin-bottom: 16px;
}

.data-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 表格样式 */
.table-container {
  position: relative;
  width: 100%;
  margin-bottom: 15px;
}

.up {
  color: #67C23A;
}

.down {
  color: #F56C6C;
}

/* 让表格占满整个区域 */
.table-container :deep(.el-table) {
  width: 100% !important;
}

/* 表格操作列按钮样式 */
.action-buttons {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 3px 0;
  position: relative;
  z-index: 1;
}

.action-buttons .el-button {
  margin-left: 0;
  padding: 4px 8px;
  font-size: 12px;
}

/* 表格样式增强 */
.table-container :deep(.el-table) {
  border: 1px solid #EBEEF5;
}

.table-container :deep(.el-table__fixed-right) {
  height: auto !important;
  box-shadow: -4px 0 10px rgba(0, 0, 0, 0.12);
}

.table-container :deep(.el-table__fixed-right-patch) {
  background-color: #fff;
  border-bottom: 1px solid #EBEEF5;
}

.table-container :deep(.el-table__cell) {
  padding: 8px 0;
}

.table-container :deep(.el-table__body td.el-table__cell) {
  border-bottom: 1px solid #EBEEF5;
}

.table-container :deep(.el-table--border .el-table__cell) {
  border-right: 1px solid #EBEEF5;
}

.table-container :deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background-color: #F5F7FA;
}

/* 指标样式 */
.indicators-container {
  padding: 10px 0;
}

.indicator-card {
  height: 100%;
  margin-bottom: 20px;
}

.indicator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.indicator-name {
  font-weight: 500;
  font-size: 16px;
}

.indicator-value {
  font-size: 24px;
  font-weight: bold;
  margin: 10px 0;
  color: #409EFF;
}

.indicator-comparison {
  margin-top: 15px;
}

.comparison-title {
  font-size: 14px;
  margin-bottom: 5px;
  color: #606266;
}

.comparison-data {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 12px;
  color: #606266;
}

.comparison-note {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

/* 异常事件样式 */
.event-card {
  margin-bottom: 10px;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.event-title {
  font-weight: 500;
}

.event-content {
  font-size: 14px;
  margin-bottom: 10px;
  line-height: 1.5;
}

.event-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-bottom: 10px;
}

.event-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 分页样式 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.page-size-wrapper {
  display: flex;
  align-items: center;
  margin-right: 15px;
  height: 32px;
}

.page-size-wrapper .page-size-select {
  margin: 0 5px;
  width: 70px;
}

.page-size-wrapper .el-select .el-input__wrapper {
  padding: 0 8px;
}

.page-size-wrapper .el-select .el-input__inner {
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .operations-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .right-operations {
    align-self: flex-end;
    margin-top: 10px;
  }
  
  .chart-container {
    flex-direction: column;
    height: auto;
  }
  
  .chart-wrapper {
    height: 350px;
    border-right: none;
    border-bottom: 1px solid #ebeef5;
    margin-bottom: 15px;
  }
  
  .chart-legend {
    width: 100%;
    padding: 15px 0;
    flex-direction: row;
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .operations-bar,
  .left-operations,
  .right-operations {
    flex-direction: column;
    width: 100%;
    align-items: stretch;
  }
  
  .search-input {
    width: 100%;
  }
  
  .right-operations {
    align-self: stretch;
    margin-top: 10px;
  }
  
  .header-area {
    flex-direction: column;
  }
  
  .search-area, .action-area {
    width: 100%;
  }
  
  .action-area {
    justify-content: space-between;
  }
}

@media (max-width: 1280px) {
  .action-buttons {
    flex-wrap: wrap;
  }
  
  .action-buttons .el-button {
    margin-bottom: 4px;
  }
}
</style> 