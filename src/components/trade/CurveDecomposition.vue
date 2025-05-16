<template>
  <div class="curve-decomposition">
      <!-- 1. 顶部曲线管理区域 -->
      <el-card class="section-card">
        <template #header>
          <div class="section-header">
            <span>曲线分解</span>
          <el-tooltip content="将总电量按照典型曲线分解到更细粒度的时间单位" placement="top">
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
          </div>
        </template>
        
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="曲线选择">
              <el-select v-model="selectedCurve" placeholder="选择曲线" style="width: 100%">
                <el-option-group label="系统曲线">
                  <el-option v-for="curve in systemCurves" :key="curve.id" :label="curve.name" :value="curve.id" />
                </el-option-group>
                <el-option-group label="自定义曲线">
                  <el-option v-for="curve in userCurves" :key="curve.id" :label="curve.name" :value="curve.id" />
                </el-option-group>
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :xs="24" :sm="12" :md="16" :lg="18">
            <div class="curve-actions">
              <el-button type="primary" size="small" @click="openCurveUploadDialog">
                <el-icon><Upload /></el-icon> 上传曲线
              </el-button>
              <el-button type="info" size="small" @click="downloadCurve">
                <el-icon><Download /></el-icon> 下载曲线
              </el-button>
              <el-button type="success" size="small" @click="downloadTemplate">
                <el-icon><Download /></el-icon> 下载模板
              </el-button>
              <el-button type="warning" size="small" @click="createNewCurve">
                <el-icon><Plus /></el-icon> 新建曲线
              </el-button>
              <el-button size="small" @click="manageCurves">
                <el-icon><Setting /></el-icon> 管理曲线
              </el-button> 
            </div>
          </el-col>
        </el-row>
        
        <!-- 选中曲线预览 -->
        <el-row v-if="selectedCurve">
          <el-col :span="24">
            <div class="preview-tables-container">
              <div class="preview-header">
                <div class="preview-title">曲线权重表</div>
                <el-button
                  type="text"
                  class="collapse-button"
                  @click="toggleCollapse"
                  @keydown.enter.prevent="toggleCollapse"
                  @keydown.space.prevent="toggleCollapse"
                  :aria-expanded="!isCollapsed"
                  :aria-controls="'weight-tables'"
                  :title="isCollapsed ? '展开曲线权重表' : '折叠曲线权重表'"
                  tabindex="0"
                  role="button"
                >
                  <span class="collapse-text">{{ isCollapsed ? '展开' : '折叠' }}</span>
                  <el-icon :class="{ 'is-collapsed': isCollapsed }">
                    <ArrowDown />
                  </el-icon>
                  <span class="sr-only">{{ isCollapsed ? '展开' : '折叠' }}曲线权重表</span>
                </el-button>
              </div>
              
              <div v-show="!isCollapsed" 
                   id="weight-tables" 
                   class="weight-tables-content"
                   :aria-hidden="isCollapsed"
                   role="region"
                   aria-label="曲线权重表详细信息">
                <!-- 第一个表格：月份权重表 -->
                <div class="weight-table-section">
                  <div class="weight-table-title">年分月</div>
                  <el-table :data="monthWeightData" border style="width: 100%; margin-bottom: 20px">
                    <el-table-column v-for="month in 12" :key="month" :prop="'month' + month" :label="month + '月'" align="center" />
                  </el-table>
                </div>

                <!-- 第二个表格：一月日期权重表 -->
                <div class="weight-table-section">
                  <div class="weight-table-title">1月-月分日</div>
                  <el-table :data="januaryDayWeightData" border style="width: 100%; margin-bottom: 20px">
                    <el-table-column v-for="day in 31" :key="day" :prop="'day' + day" :label="day + '日'" align="center" />
                  </el-table>
                </div>

                <!-- 第三个表格：二月日期权重表 -->
                <div class="weight-table-section">
                  <div class="weight-table-title">2月-月分日</div>
                  <el-table :data="februaryDayWeightData" border style="width: 100%; margin-bottom: 20px">
                    <el-table-column v-for="day in 28" :key="day" :prop="'day' + day" :label="day + '日'" align="center" />
                  </el-table>
                </div>

                <!-- 第四个表格：三至十二月日类型权重表 -->
                <div class="weight-table-section">
                  <div class="weight-table-title">3-12月-月分日</div>
                  <el-table :data="otherMonthsDayTypeWeightData" border style="width: 100%; margin-bottom: 20px">
                    <el-table-column v-for="(dayType, index) in dayTypes" :key="index" :prop="'dayType' + index" :label="dayType" align="center" />
                  </el-table>
                </div>

                <!-- 第五个表格：一、二月时段权重表 -->
                <div class="weight-table-section">
                  <div class="weight-table-title">1-2月-日分时</div>
                  <el-table :data="janFebHourWeightData" border style="width: 100%; margin-bottom: 20px">
                    <el-table-column prop="dayType" label="日类型" width="80" align="center" fixed="left" />
                    <el-table-column v-for="hour in 24" :key="hour - 1" :prop="'hour' + (hour - 1)" :label="(hour - 1) + '时'" align="center" />
                  </el-table>
                </div>

                <!-- 第六个表格：三至十二月时段权重表 -->
                <div class="weight-table-section">
                  <div class="weight-table-title">3-12月-日分时</div>
                  <el-table :data="otherMonthsHourWeightData" border style="width: 100%; margin-bottom: 20px">
                    <el-table-column prop="dayType" label="日类型" width="80" align="center" fixed="left" />
                    <el-table-column v-for="hour in 24" :key="hour - 1" :prop="'hour' + (hour - 1)" :label="(hour - 1) + '时'" align="center" />
                  </el-table>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 2. 中部曲线分解表区域 -->
      <el-card class="section-card">
        <template #header>
          <div class="section-header">
          <span>曲线分解表</span>
          </div>
        </template>
        
        <div v-if="!selectedCurve" class="no-curve-selected">
          <el-alert
            title="请先选择一条曲线"
            type="warning"
            show-icon
            :closable="false"
          />
        </div>
        
        <div v-else>
          <!-- 分解结果 -->
          <div class="result-section">
            <div class="result-header">
              <div class="result-title">分解结果</div>
              <div class="result-action">
                <el-button size="small" @click="resetDecomposition">重置</el-button>
                <el-button type="success" size="small" @click="exportDecompositionResults">
                  <el-icon><Download /></el-icon> 导出结果
                </el-button>
              </div>
            </div>
            
          <!-- 第一个表格：月份电量 -->
          <div class="decomposition-table-section">
            <div class="decomposition-table-title">月度电量分解</div>
            <el-table :data="monthlyDecompositionData" border stripe style="width: 100%; margin-bottom: 20px">
              <el-table-column prop="type" label="类型" width="100" align="center" fixed="left" />
              <el-table-column label="1月" align="center">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.month1" 
                    class="custom-input-number"
                    :controls="false"
                    :min="0"
                    :precision="2"
                    style="width: 90px"
                    @change="updateMonthlyTotal(1)" 
                  />
                </template>
              </el-table-column>
              <el-table-column label="2月" align="center">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.month2" 
                    class="custom-input-number"
                    :controls="false"
                    :min="0"
                    :precision="2"
                    style="width: 90px"
                    @change="updateMonthlyTotal(2)" 
                  />
                </template>
              </el-table-column>
              <el-table-column label="3月" align="center">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.month3" 
                    class="custom-input-number"
                    :controls="false"
                    :min="0"
                    :precision="2"
                    style="width: 90px"
                    @change="updateMonthlyTotal(3)" 
                  />
                </template>
              </el-table-column>
              <el-table-column label="4月" align="center">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.month4" 
                    class="custom-input-number"
                    :controls="false"
                    :min="0"
                    :precision="2"
                    style="width: 90px"
                    @change="updateMonthlyTotal(4)" 
                  />
                </template>
              </el-table-column>
              <el-table-column label="5月" align="center">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.month5" 
                    class="custom-input-number"
                    :controls="false"
                    :min="0"
                    :precision="2"
                    style="width: 90px"
                    @change="updateMonthlyTotal(5)" 
                  />
                </template>
              </el-table-column>
              <el-table-column label="6月" align="center">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.month6" 
                    class="custom-input-number"
                    :controls="false"
                    :min="0"
                    :precision="2"
                    style="width: 90px"
                    @change="updateMonthlyTotal(6)" 
                  />
                </template>
              </el-table-column>
              <el-table-column label="7月" align="center">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.month7" 
                    class="custom-input-number"
                    :controls="false"
                    :min="0"
                    :precision="2"
                    style="width: 90px"
                    @change="updateMonthlyTotal(7)" 
                  />
                </template>
              </el-table-column>
              <el-table-column label="8月" align="center">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.month8" 
                    class="custom-input-number"
                    :controls="false"
                    :min="0"
                    :precision="2"
                    style="width: 90px"
                    @change="updateMonthlyTotal(8)" 
                  />
                </template>
              </el-table-column>
              <el-table-column label="9月" align="center">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.month9" 
                    class="custom-input-number"
                    :controls="false"
                    :min="0"
                    :precision="2"
                    style="width: 90px"
                    @change="updateMonthlyTotal(9)" 
                  />
                </template>
              </el-table-column>
              <el-table-column label="10月" align="center">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.month10" 
                    class="custom-input-number"
                    :controls="false"
                    :min="0"
                    :precision="2"
                    style="width: 90px"
                    @change="updateMonthlyTotal(10)" 
                  />
                </template>
              </el-table-column>
              <el-table-column label="11月" align="center">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.month11" 
                    class="custom-input-number"
                    :controls="false"
                    :min="0"
                    :precision="2"
                    style="width: 90px"
                    @change="updateMonthlyTotal(11)" 
                  />
                </template>
              </el-table-column>
              <el-table-column label="12月" align="center">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.month12" 
                    class="custom-input-number"
                    :controls="false"
                    :min="0"
                    :precision="2"
                    style="width: 90px"
                    @change="updateMonthlyTotal(12)" 
                  />
                </template>
              </el-table-column>
              <el-table-column label="合计" align="center">
                <template #default="scope">
                  <el-input-number 
                    v-model="totalDistribution" 
                    class="custom-input-number"
                    :controls="false"
                    :min="0"
                    :precision="2"
                    style="width: 90px"
                    @change="handleTotalChange" 
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <!-- 第二个表格：详细分解表格 -->
          <div class="decomposition-table-title">详细分解表 <span class="table-subtitle"></span></div>
          <div class="filter-section">
            <el-date-picker
              v-model="dateRangeFilter"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :shortcuts="dateRangeShortcuts"
              style="width: 350px"
              @change="handleDateRangeChange"
            />
            <div class="filter-info" v-if="filteredDetailDecompositionData.length > 0">
              当前显示: {{ filteredDetailDecompositionData.length }}条记录
            </div>
          </div>
          
          <el-table 
            :data="filteredDetailDecompositionData" 
            border 
            stripe 
            style="width: 100%; margin-top: 10px"
            max-height="500"
            :empty-text="detailDecompositionData.length > 0 ? '没有符合筛选条件的数据' : '暂无数据'"
            @row-click="handleRowClick"
            highlight-current-row
          >
            <el-table-column prop="date" label="日期" width="120" align="center" fixed="left" />
            <el-table-column v-for="hour in 24" :key="hour - 1" :prop="'hour' + (hour - 1)" :label="(hour - 1) + '时'" align="center" />
            <el-table-column prop="dayType" label="日类型" width="100" align="center" fixed="right" />
            <el-table-column prop="month" label="月份" width="80" align="center" fixed="right" />
            <el-table-column prop="dayWeight" label="日权重" width="100" align="center" fixed="right" />
            <el-table-column prop="totalVolume" label="日电量(万千瓦时)" width="150" align="center" fixed="right" />
          </el-table>
          
          <el-tabs v-model="activeResultTab" class="result-tabs" style="display: none;">
              <el-tab-pane label="日电量" name="day">
                <el-table :data="dailyResults" border stripe style="width: 100%">
                  <el-table-column type="index" label="序号" width="60" align="center" />
                  <el-table-column prop="date" label="日期" width="120" align="center" />
                  <el-table-column prop="dayOfWeek" label="星期" width="80" align="center" />
                  <el-table-column prop="volume" label="电量(万千瓦时)" min-width="140" align="center" />
                  <el-table-column prop="percentage" label="占比(%)" width="100" align="center" />
                  <el-table-column label="操作" width="120" align="center">
                    <template #default="scope">
                      <el-button type="primary" link @click="showHourlyDetail(scope.row)">小时明细</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-tab-pane>
              
              <el-tab-pane label="小时电量" name="hour">
                <div class="filter-row">
                  <span>选择日期：</span>
                  <el-select v-model="selectedDate" placeholder="选择日期" style="width: 180px">
                    <el-option
                      v-for="item in dailyResults"
                      :key="item.date"
                      :label="`${item.date} (${item.dayOfWeek})`"
                      :value="item.date"
                    />
                  </el-select>
                </div>
                
                <el-table
                  v-if="selectedDate"
                  :data="hourlyResultsForSelectedDate"
                  border
                  stripe
                  style="width: 100%; margin-top: 10px"
                >
                  <el-table-column prop="hour" label="小时" width="80" align="center">
                    <template #default="scope">
                      {{ scope.row.hour }}:00-{{ scope.row.hour }}:59
                    </template>
                  </el-table-column>
                  <el-table-column prop="volume" label="电量(万千瓦时)" min-width="140" align="center" />
                  <el-table-column prop="percentage" label="占比(%)" width="100" align="center" />
                  <el-table-column prop="curvePercentage" label="曲线基础占比(%)" width="120" align="center" />
                </el-table>
                
                <el-empty v-else description="请选择日期查看小时电量"></el-empty>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </el-card>

      <!-- 3. 底部折线图区域 -->
      <el-card class="section-card">
        <template #header>
          <div class="section-header">
            <span>电量分布图</span>
            <el-radio-group v-model="chartView" size="small">
              <el-radio-button label="day">日视图</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        
        <div class="chart-container">
          <div id="resultChart" class="result-chart"></div>
        </div>
    </el-card>
    
    <!-- 曲线上传对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传曲线" width="500px">
      <el-form :model="curveUploadForm" label-position="top">
        <el-form-item label="曲线名称" required>
          <el-input v-model="curveUploadForm.name" placeholder="输入曲线名称" />
        </el-form-item>
        <el-form-item label="曲线描述">
          <el-input v-model="curveUploadForm.description" type="textarea" placeholder="输入曲线描述" />
        </el-form-item>
        <el-form-item label="上传文件" required>
          <el-upload
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
            accept=".xlsx,.xls,.csv"
          >
            <template #trigger>
              <el-button type="primary">选择文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">请上传Excel或CSV格式的曲线数据文件</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="uploadCurve">确认上传</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 曲线管理对话框 -->
    <el-dialog v-model="manageDialogVisible" title="曲线管理" width="680px">
      <el-tabs v-model="manageActiveTab">
        <el-tab-pane label="我的曲线" name="user">
          <el-table :data="userCurves" style="width: 100%">
            <el-table-column prop="name" label="曲线名称" min-width="120" />
            <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
            <el-table-column prop="createTime" label="创建时间" min-width="120" />
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button type="primary" size="small" link @click="previewCurve(scope.row)">预览</el-button>
                <el-button type="danger" size="small" link @click="deleteCurve(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="系统曲线" name="system">
          <el-table :data="systemCurves" style="width: 100%">
            <el-table-column prop="name" label="曲线名称" min-width="120" />
            <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
            <el-table-column label="操作" width="80">
              <template #default="scope">
                <el-button type="primary" size="small" link @click="previewCurve(scope.row)">预览</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
    
    <!-- 曲线预览对话框 -->
    <el-dialog v-model="previewDialogVisible" title="曲线预览" width="680px">
      <div id="previewDetailChart" style="height: 400px;"></div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { QuestionFilled, Upload, Download, Setting, Plus, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

// 日类型定义
const dayTypes = ['工作日', '周六', '周日', '调休', '节假日']

// 曲线管理相关状态
const selectedCurve = ref('')
const systemCurves = ref([
  { id: 'sys-1', name: '统调负荷曲线(典型工作日)', description: '基于历史数据统计的典型工作日负荷曲线', type: 'system' },
  { id: 'sys-2', name: '统调负荷曲线(典型休息日)', description: '基于历史数据统计的典型休息日负荷曲线', type: 'system' },
  { id: 'sys-3', name: '市场交易曲线(春季)', description: '春季市场交易电量分布曲线', type: 'system' },
  { id: 'sys-4', name: '市场交易曲线(夏季)', description: '夏季市场交易电量分布曲线', type: 'system' },
  { id: 'sys-5', name: '市场交易曲线(秋季)', description: '秋季市场交易电量分布曲线', type: 'system' },
  { id: 'sys-6', name: '市场交易曲线(冬季)', description: '冬季市场交易电量分布曲线', type: 'system' }
])

const userCurves = ref([
  { id: 'user-1', name: '工业负荷曲线', description: '工业企业自定义用电负荷曲线', createTime: '2024-05-15', type: 'user' },
  { id: 'user-2', name: '商业负荷曲线', description: '商业企业自定义用电负荷曲线', createTime: '2024-05-10', type: 'user' }
])

// 表格数据
// 1. 月份权重表数据
const monthWeightData = ref([
  {
    month1: '0.08',
    month2: '0.07',
    month3: '0.08',
    month4: '0.08',
    month5: '0.09',
    month6: '0.09',
    month7: '0.10',
    month8: '0.10',
    month9: '0.09',
    month10: '0.08',
    month11: '0.07',
    month12: '0.07'
  }
])

// 新增的数据结构
// 月度电量分解表数据
const monthlyDecompositionData = ref([
  {
    type: '电量(万千瓦时)',
    month1: 0,
    month2: 0,
    month3: 0,
    month4: 0,
    month5: 0,
    month6: 0,
    month7: 0,
    month8: 0,
    month9: 0,
    month10: 0,
    month11: 0,
    month12: 0,
    total: 0
  }
])

// 月份权重数据 - 用于分配总电量
const monthWeights = ref({
  month1: 0.08,
  month2: 0.07,
  month3: 0.08,
  month4: 0.08,
  month5: 0.09,
  month6: 0.09,
  month7: 0.10,
  month8: 0.10,
  month9: 0.09,
  month10: 0.08,
  month11: 0.07,
  month12: 0.07
})

// 详细分解表数据
const detailDecompositionData = ref([])
const filteredDetailDecompositionData = ref([])

// 日期范围筛选
const dateRangeFilter = ref([])
const dateRangeShortcuts = [
  {
    text: '当前月份',
    value: () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const firstDay = new Date(year, month - 1, 1)
      const lastDay = new Date(year, month, 0)
      return [formatDate(firstDay), formatDate(lastDay)]
    }
  },
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [formatDate(start), formatDate(end)]
    }
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [formatDate(start), formatDate(end)]
    }
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [formatDate(start), formatDate(end)]
    }
  },
  {
    text: '第一季度',
    value: () => {
      const year = new Date().getFullYear()
      return [`${year}-01-01`, `${year}-03-31`]
    }
  },
  {
    text: '第二季度',
    value: () => {
      const year = new Date().getFullYear()
      return [`${year}-04-01`, `${year}-06-30`]
    }
  },
  {
    text: '第三季度',
    value: () => {
      const year = new Date().getFullYear()
      return [`${year}-07-01`, `${year}-09-30`]
    }
  },
  {
    text: '第四季度',
    value: () => {
      const year = new Date().getFullYear()
      return [`${year}-10-01`, `${year}-12-31`]
    }
  }
]

// 格式化日期为YYYY-MM-DD
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 2. 一月日期权重表数据
const januaryDayWeightData = ref([
  {
    ...Array.from({ length: 31 }, (_, i) => ({ 
      [`day${i + 1}`]: (Math.round((1 / 31 + (Math.random() * 0.01 - 0.005)) * 1000) / 1000).toFixed(3)
    })).reduce((acc, curr) => ({ ...acc, ...curr }), {})
  }
])

// 3. 二月日期权重表数据
const februaryDayWeightData = ref([
  {
    ...Array.from({ length: 28 }, (_, i) => ({ 
      [`day${i + 1}`]: (Math.round((1 / 28 + (Math.random() * 0.01 - 0.005)) * 1000) / 1000).toFixed(3)
    })).reduce((acc, curr) => ({ ...acc, ...curr }), {})
  }
])

// 4. 三至十二月日类型权重表数据
const otherMonthsDayTypeWeightData = ref([
  {
    dayType0: '0.65',
    dayType1: '0.12',
    dayType2: '0.12',
    dayType3: '0.03',
    dayType4: '0.08'
  }
])

// 5. 一、二月时段权重表数据
const janFebHourWeightData = ref([
  {
    dayType: '工作日',
    hour0: '0.024',
    hour1: '0.018',
    hour2: '0.014',
    hour3: '0.014',
    hour4: '0.016',
    hour5: '0.022',
    hour6: '0.041',
    hour7: '0.055',
    hour8: '0.058',
    hour9: '0.054',
    hour10: '0.051',
    hour11: '0.049',
    hour12: '0.045',
    hour13: '0.042',
    hour14: '0.043',
    hour15: '0.047',
    hour16: '0.053',
    hour17: '0.061',
    hour18: '0.072',
    hour19: '0.065',
    hour20: '0.051',
    hour21: '0.042',
    hour22: '0.038',
    hour23: '0.025'
  },
  {
    dayType: '周六',
    hour0: '0.030',
    hour1: '0.025',
    hour2: '0.022',
    hour3: '0.020',
    hour4: '0.020',
    hour5: '0.022',
    hour6: '0.028',
    hour7: '0.036',
    hour8: '0.042',
    hour9: '0.048',
    hour10: '0.050',
    hour11: '0.050',
    hour12: '0.048',
    hour13: '0.046',
    hour14: '0.046',
    hour15: '0.048',
    hour16: '0.052',
    hour17: '0.056',
    hour18: '0.062',
    hour19: '0.058',
    hour20: '0.048',
    hour21: '0.041',
    hour22: '0.036',
    hour23: '0.033'
  },
  {
    dayType: '周日',
    hour0: '0.032',
    hour1: '0.028',
    hour2: '0.024',
    hour3: '0.022',
    hour4: '0.020',
    hour5: '0.022',
    hour6: '0.026',
    hour7: '0.030',
    hour8: '0.036',
    hour9: '0.042',
    hour10: '0.046',
    hour11: '0.048',
    hour12: '0.048',
    hour13: '0.046',
    hour14: '0.046',
    hour15: '0.046',
    hour16: '0.048',
    hour17: '0.052',
    hour18: '0.060',
    hour19: '0.058',
    hour20: '0.052',
    hour21: '0.046',
    hour22: '0.040',
    hour23: '0.036'
  },
  {
    dayType: '调休',
    hour0: '0.032',
    hour1: '0.028',
    hour2: '0.024',
    hour3: '0.022',
    hour4: '0.020',
    hour5: '0.022',
    hour6: '0.026',
    hour7: '0.032',
    hour8: '0.038',
    hour9: '0.044',
    hour10: '0.048',
    hour11: '0.050',
    hour12: '0.048',
    hour13: '0.046',
    hour14: '0.046',
    hour15: '0.048',
    hour16: '0.050',
    hour17: '0.054',
    hour18: '0.060',
    hour19: '0.056',
    hour20: '0.050',
    hour21: '0.044',
    hour22: '0.038',
    hour23: '0.034'
  },
  {
    dayType: '节假日',
    hour0: '0.035',
    hour1: '0.030',
    hour2: '0.026',
    hour3: '0.024',
    hour4: '0.022',
    hour5: '0.022',
    hour6: '0.024',
    hour7: '0.028',
    hour8: '0.034',
    hour9: '0.040',
    hour10: '0.044',
    hour11: '0.046',
    hour12: '0.046',
    hour13: '0.044',
    hour14: '0.044',
    hour15: '0.046',
    hour16: '0.048',
    hour17: '0.052',
    hour18: '0.060',
    hour19: '0.058',
    hour20: '0.052',
    hour21: '0.046',
    hour22: '0.042',
    hour23: '0.038'
  }
])

// 6. 三至十二月时段权重表数据
const otherMonthsHourWeightData = ref([
  {
    dayType: '工作日',
    hour0: '0.020',
    hour1: '0.015',
    hour2: '0.012',
    hour3: '0.010',
    hour4: '0.012',
    hour5: '0.020',
    hour6: '0.040',
    hour7: '0.052',
    hour8: '0.056',
    hour9: '0.052',
    hour10: '0.048',
    hour11: '0.046',
    hour12: '0.042',
    hour13: '0.040',
    hour14: '0.040',
    hour15: '0.044',
    hour16: '0.050',
    hour17: '0.058',
    hour18: '0.070',
    hour19: '0.064',
    hour20: '0.050',
    hour21: '0.040',
    hour22: '0.035',
    hour23: '0.025'
  },
  {
    dayType: '周六',
    hour0: '0.028',
    hour1: '0.022',
    hour2: '0.018',
    hour3: '0.016',
    hour4: '0.016',
    hour5: '0.018',
    hour6: '0.024',
    hour7: '0.032',
    hour8: '0.038',
    hour9: '0.044',
    hour10: '0.048',
    hour11: '0.048',
    hour12: '0.046',
    hour13: '0.044',
    hour14: '0.044',
    hour15: '0.046',
    hour16: '0.050',
    hour17: '0.056',
    hour18: '0.062',
    hour19: '0.058',
    hour20: '0.048',
    hour21: '0.042',
    hour22: '0.036',
    hour23: '0.030'
  },
  {
    dayType: '周日',
    hour0: '0.030',
    hour1: '0.026',
    hour2: '0.022',
    hour3: '0.020',
    hour4: '0.018',
    hour5: '0.020',
    hour6: '0.024',
    hour7: '0.028',
    hour8: '0.034',
    hour9: '0.040',
    hour10: '0.044',
    hour11: '0.046',
    hour12: '0.046',
    hour13: '0.044',
    hour14: '0.044',
    hour15: '0.044',
    hour16: '0.046',
    hour17: '0.050',
    hour18: '0.058',
    hour19: '0.056',
    hour20: '0.050',
    hour21: '0.044',
    hour22: '0.038',
    hour23: '0.034'
  },
  {
    dayType: '调休',
    hour0: '0.030',
    hour1: '0.026',
    hour2: '0.022',
    hour3: '0.020',
    hour4: '0.018',
    hour5: '0.020',
    hour6: '0.024',
    hour7: '0.030',
    hour8: '0.036',
    hour9: '0.042',
    hour10: '0.046',
    hour11: '0.048',
    hour12: '0.046',
    hour13: '0.044',
    hour14: '0.044',
    hour15: '0.046',
    hour16: '0.048',
    hour17: '0.052',
    hour18: '0.058',
    hour19: '0.054',
    hour20: '0.048',
    hour21: '0.042',
    hour22: '0.036',
    hour23: '0.032'
  },
  {
    dayType: '节假日',
    hour0: '0.032',
    hour1: '0.028',
    hour2: '0.024',
    hour3: '0.022',
    hour4: '0.020',
    hour5: '0.020',
    hour6: '0.022',
    hour7: '0.026',
    hour8: '0.032',
    hour9: '0.038',
    hour10: '0.042',
    hour11: '0.044',
    hour12: '0.044',
    hour13: '0.042',
    hour14: '0.042',
    hour15: '0.044',
    hour16: '0.046',
    hour17: '0.050',
    hour18: '0.058',
    hour19: '0.056',
    hour20: '0.050',
    hour21: '0.044',
    hour22: '0.040',
    hour23: '0.036'
  }
])

// 对话框控制
const uploadDialogVisible = ref(false)
const manageDialogVisible = ref(false)
const previewDialogVisible = ref(false)
const manageActiveTab = ref('user')

// 上传表单
const curveUploadForm = reactive({
  name: '',
  description: '',
  file: null
})

// 曲线预览图表
let previewDetailChart = null

// 曲线分解相关状态
const decompositionForm = reactive({
  yearMonth: '',
  totalVolume: 10000
})

// 分解结果
const decompositionResults = ref([])
const dailyResults = ref([])
const hourlyResults = ref([])
const activeResultTab = ref('day')
const selectedDate = ref('')

// 计算属性：是否可以执行分解
const canDecompose = computed(() => {
  return selectedCurve.value
})

// 计算属性：选中日期的小时电量数据
const hourlyResultsForSelectedDate = computed(() => {
  if (!selectedDate.value) return []
  return hourlyResults.value.filter(item => item.date === selectedDate.value)
})

// 打开曲线上传对话框
const openCurveUploadDialog = () => {
  uploadDialogVisible.value = true
  curveUploadForm.name = ''
  curveUploadForm.description = ''
  curveUploadForm.file = null
}

// 处理文件选择
const handleFileChange = (file) => {
  curveUploadForm.file = file.raw
}

// 上传曲线
const uploadCurve = () => {
  if (!curveUploadForm.name.trim()) {
    ElMessage.warning('请输入曲线名称')
    return
  }
  
  if (!curveUploadForm.file) {
    ElMessage.warning('请选择曲线数据文件')
    return
  }
  
  // 这里应该处理文件上传和解析逻辑
  // 简化起见，这里直接添加一个新的用户曲线
  const newCurve = {
    id: `user-${Date.now()}`,
    name: curveUploadForm.name,
    description: curveUploadForm.description || '用户上传曲线',
    createTime: new Date().toLocaleDateString(),
    type: 'user'
  }
  
  userCurves.value.unshift(newCurve)
  uploadDialogVisible.value = false
  ElMessage.success('曲线上传成功')
  
  // 自动选择新上传的曲线
  selectedCurve.value = newCurve.id
}

// 下载模板
const downloadTemplate = () => {
  // 实际应用中这里应该提供模板下载链接
  ElMessage.success('模板下载中...')
}

// 管理曲线
const manageCurves = () => {
  manageDialogVisible.value = true
}

// 预览曲线
const previewCurve = (curve) => {
  previewDialogVisible.value = true
  nextTick(() => {
    initPreviewDetailChart(curve)
  })
}

// 删除曲线
const deleteCurve = (curve) => {
  userCurves.value = userCurves.value.filter(item => item.id !== curve.id)
  ElMessage.success('曲线已删除')
  
  // 如果删除的是当前选中的曲线，清空选择
  if (selectedCurve.value === curve.id) {
    selectedCurve.value = ''
  }
}

// 初始化曲线预览图表
const initCurvePreviewChart = () => {
  // 不再需要初始化图表，因为我们现在使用表格展示数据
}

// 初始化详细预览图表
const initPreviewDetailChart = (curve) => {
  if (!document.getElementById('previewDetailChart')) return
  
  if (previewDetailChart) {
    previewDetailChart.dispose()
  }
  
  previewDetailChart = echarts.init(document.getElementById('previewDetailChart'))
  
  const hours = Array.from({ length: 24 }, (_, i) => `${i}`)
  const mockData = generateMockCurveData()
  
  const option = {
    title: {
      text: `${curve.name}`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}时 {c}%'
    },
    toolbox: {
      feature: {
        saveAsImage: {}
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: hours
    },
    yAxis: {
      type: 'value',
      name: '占比 (%)',
      min: 0,
      max: 10
    },
    series: [
      {
        name: '占比',
        data: mockData,
        type: 'line',
        smooth: true,
        markLine: {
          data: [
            { type: 'average', name: '平均值' }
          ]
        },
        lineStyle: {
          width: 3,
          color: '#409EFF'
        },
        areaStyle: {
          opacity: 0.2,
          color: '#409EFF'
        }
      }
    ]
  }
  
  previewDetailChart.setOption(option)
}

// 生成模拟曲线数据
const generateMockCurveData = () => {
  return [
    1.2, 0.8, 0.6, 0.5, 0.7, 1.0,
    2.5, 4.8, 6.2, 5.8, 5.2, 4.9,
    4.5, 4.2, 4.3, 4.7, 5.3, 6.1,
    7.2, 6.5, 5.1, 4.2, 2.8, 1.8
  ]
}

// 监听曲线选择变化
watch(selectedCurve, () => {
  if (selectedCurve.value) {
    // 当曲线选择变化时，可以在这里添加相关逻辑
    // 比如基于选中的曲线更新表格数据
  }
})

// 图表相关状态
const chartView = ref('day')
let resultChart = null

// 初始化结果图表
const initResultChart = () => {
  if (!document.getElementById('resultChart')) return;
  
  if (resultChart) {
    resultChart.dispose();
  }
  
  resultChart = echarts.init(document.getElementById('resultChart'));
  
  // 直接调用日视图图表初始化
  initDailyChart();
};

// 初始化日视图图表 - 显示每个日期在选定时点的电量
const initDailyChart = () => {
  if (filteredDetailDecompositionData.value.length === 0) return;
  
  const dates = filteredDetailDecompositionData.value.map(item => item.date);
  const dayTypes = filteredDetailDecompositionData.value.map(item => item.dayType);
  
  // 准备数据：只使用一条折线，包含所有日期的24小时电量（连续排列）
  const hoursData = [];
  const xAxisData = [];
  
  // 为每个日期收集24个小时的数据
  filteredDetailDecompositionData.value.forEach(dayData => {
    // 收集该日期的24个时点的电量值
    for (let hour = 0; hour < 24; hour++) {
      hoursData.push(parseFloat(dayData[`hour${hour}`]));
      xAxisData.push(`${dayData.date.substring(5)}-${hour}时`); // 例如：03-25-0时
    }
  });
  
  const option = {
    title: {
      text: '电量日分布曲线',
      left: 'center',
      textStyle: {
        fontSize: 14
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const data = params[0];
        const xLabel = data.name;
        const parts = xLabel.split('-');
        const date = parts[0] + '-' + parts[1];
        const hour = parseInt(parts[2]);
        return `${date} ${hour}时<br/>电量: ${data.value} 万千瓦时`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    dataZoom: [
      {
        type: 'slider',
        show: true,
        start: 0,
        end: 25, // 默认显示约一天的数据
        bottom: 10
      },
      {
        type: 'inside',
        start: 0,
        end: 25
      }
    ],
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData,
      axisLabel: {
        interval: 23, // 仅在每个日期的0时显示标签
        rotate: 45,
        formatter: function(value) {
          // 只显示日期部分，不显示小时
          return value.split('-').slice(0, 2).join('-');
        }
      },
      axisTick: {
        alignWithLabel: true,
        interval: function(index) {
          return index % 24 === 0; // 每24个点（一天的起点）显示刻度
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '电量 (万千瓦时)',
      splitLine: {
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '电量',
        type: 'line',
        data: hoursData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: '#409EFF'
        },
        itemStyle: {
          color: '#409EFF'
        },
        markArea: {
          silent: true,
          itemStyle: {
            opacity: 0.1,
            color: '#8395a7'
          },
          data: dates.map((date, index) => {
            const startIndex = index * 24;
            const endIndex = startIndex + 23;
            return [
              {
                xAxis: xAxisData[startIndex]
              },
              {
                xAxis: xAxisData[endIndex]
              }
            ];
          }).filter((_, i) => i % 2 === 0) // 隔一天显示背景色
        }
      }
    ]
  };
  
  resultChart.setOption(option);
};

// 初始化小时视图图表
const initHourlyChart = () => {
  // 如果没有选择日期，使用第一天数据
  if (!selectedDate.value && dailyResults.value.length > 0) {
    selectedDate.value = dailyResults.value[0].date
  }
  
  const hourlyData = hourlyResultsForSelectedDate.value
  
  if (hourlyData.length === 0) return
  
  const hours = hourlyData.map(item => `${item.hour}时`)
  const volumes = hourlyData.map(item => item.volume)
  
  const option = {
    title: {
      text: `${selectedDate.value} 日内小时电量分布`,
      left: 'center',
      textStyle: {
        fontSize: 14
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const data = params[0]
        const hourInfo = hourlyData[data.dataIndex]
        return `${hourInfo.hour}时<br/>电量: ${hourInfo.volume} 万千瓦时`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: hours
    },
    yAxis: {
      type: 'value',
      name: '电量 (万千瓦时)',
      splitLine: {
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '电量',
        data: volumes,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: '#409EFF'
        },
          itemStyle: {
          color: '#409EFF'
        }
      }
    ]
  }
  
  resultChart.setOption(option)
}

// 监听图表视图变化
watch(chartView, () => {
  if (filteredDetailDecompositionData.value.length > 0) {
    nextTick(() => {
      initResultChart();
    });
  }
});

// 监听日期范围变化
watch(dateRangeFilter, () => {
  console.log('日期范围变化:', dateRangeFilter.value);
  handleDateRangeChange();
}, { deep: true });

// 监听选择日期变化
watch(selectedDate, () => {
  if (filteredDetailDecompositionData.value.length > 0) {
    nextTick(() => {
      updateDailyChart();
    });
  }
});

// 更新日视图图表
const updateDailyChart = () => {
  nextTick(() => {
    initDailyChart();
  });
};

// 初始化日期视图图表 - 显示多日期的总电量对比
const initDatesChart = () => {
  if (filteredDetailDecompositionData.value.length === 0) return;
  
  const dates = filteredDetailDecompositionData.value.map(item => item.date);
  const volumes = filteredDetailDecompositionData.value.map(item => item.totalVolume);
  const dayTypes = filteredDetailDecompositionData.value.map(item => item.dayType);
  
  const option = {
    title: {
      text: '日期电量分布曲线',
      left: 'center',
      textStyle: {
        fontSize: 14
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const data = params[0];
        const index = data.dataIndex;
        const rowData = filteredDetailDecompositionData.value[index];
        return `${rowData.date} (${rowData.dayType})<br/>电量: ${rowData.totalVolume} 万千瓦时`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        interval: 0,
        rotate: 45,
        formatter: function(value) {
          return value.substring(5); // 显示MM-DD格式
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '电量 (万千瓦时)',
      splitLine: {
        lineStyle: {
          type: 'dashed'
  }
      }
    },
    series: [
      {
        name: '日期电量',
        data: volumes,
        type: 'line',
        smooth: false,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: '#409EFF'
        },
        itemStyle: {
          color: function(params) {
            // 根据日类型设置不同颜色
            const dayType = dayTypes[params.dataIndex];
            if (dayType === '周六' || dayType === '周日') {
              return '#FF9800'; // 周末用橙色
            } else {
              return '#409EFF'; // 工作日用蓝色
            }
          }
        }
      }
    ]
  };
  
  resultChart.setOption(option);
};

// 窗口大小变化时调整图表大小
const handleResize = () => {
  previewDetailChart && previewDetailChart.resize()
  resultChart && resultChart.resize()
}

// 生命周期钩子
onMounted(() => {
  window.addEventListener('resize', handleResize)
  
  // 设置默认值
  if (!decompositionForm.yearMonth) {
    const now = new Date()
    decompositionForm.yearMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
  }
  
  // 设置默认电量为10000
  decompositionForm.totalVolume = 10000
  totalDistribution.value = 10000
  
  // 默认选择统调负荷曲线（典型工作日）
  selectedCurve.value = 'sys-1'
  
  // 设置默认显示最近一个月的数据
  const now = new Date()
  const end = formatDate(now)
  const start = new Date()
  start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
  const startStr = formatDate(start)
  dateRangeFilter.value = [startStr, end]
  
  // 默认生成当前月份的曲线分解表
  nextTick(() => {
    executeDecomposition()
    
    // 初始化后添加一个延时来确保图表能正确渲染
    setTimeout(() => {
      if (filteredDetailDecompositionData.value.length > 0) {
        initResultChart();
      }
    }, 500);
  })
  
  // 读取保存的折叠状态
  const savedCollapsed = localStorage.getItem('curveWeightTableCollapsed')
  if (savedCollapsed !== null) {
    isCollapsed.value = savedCollapsed === 'true'
  }
  
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  
  if (previewDetailChart) {
    previewDetailChart.dispose()
    previewDetailChart = null
  }
  
  if (resultChart) {
    resultChart.dispose()
    resultChart = null
  }
  
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleKeyDown)
})

// 执行分解
const executeDecomposition = () => {
  if (!canDecompose.value) {
    ElMessage.warning('请先选择曲线');
    return;
  }
  
  // 使用默认年月
  if (!decompositionForm.yearMonth) {
    const now = new Date();
    decompositionForm.yearMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }
  
  // 确保总电量默认值
  if (decompositionForm.totalVolume <= 0) {
    decompositionForm.totalVolume = 10000;
  }
  
  totalDistribution.value = decompositionForm.totalVolume;
  
  // 根据权重分配总电量到各月
  distributeVolumeToMonths();
  
  // 生成分解结果（保留原有功能）
  generateDecompositionResults();
  
  // 确保详细分解表被更新
  updateDetailDecompositionFromMonthly();
  
  // 设置默认显示最近一个月的数据
  const now = new Date();
  const end = formatDate(now);
  const start = new Date();
  start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
  const startStr = formatDate(start);
  
  // 更新日期范围过滤器
  dateRangeFilter.value = [startStr, end];
  console.log('设置默认日期范围:', dateRangeFilter.value);
  
  // 应用筛选
  handleDateRangeChange();
  
  ElMessage.success('电量分解完成');
  
  // 更新图表
  nextTick(() => {
    initResultChart();
  });
}

// 重置分解
const resetDecomposition = () => {
  // 设置默认值
  const now = new Date()
  decompositionForm.yearMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
  decompositionForm.totalVolume = 0
  
  totalDistribution.value = 0
  decompositionResults.value = []
  dailyResults.value = []
  hourlyResults.value = []
  selectedDate.value = ''
  
  // 重置月度电量分解表
  resetMonthlyDecomposition()
  
  // 重置详细分解表
  detailDecompositionData.value = []
  filteredDetailDecompositionData.value = []
  dateRangeFilter.value = []
  
  ElMessage.success('已重置')
}

// 总电量分配变量
const totalDistribution = ref(10000)

// 计算月电量总和
const calculateMonthlyTotal = () => {
  let total = 0;
  
  for (let i = 1; i <= 12; i++) {
    const monthValue = Number(monthlyDecompositionData.value[0][`month${i}`]) || 0;
    console.log(`月份${i}电量:`, monthValue);
    total += monthValue;
  }
  
  console.log('计算得到总电量:', total);
  monthlyDecompositionData.value[0].total = total;
  totalDistribution.value = total;
  decompositionForm.totalVolume = total;
  
  // 更新当前选择月份的详细分解表
  if (decompositionForm.yearMonth) {
    const [, month] = decompositionForm.yearMonth.split('-');
    const currentMonth = parseInt(month);
    console.log('当前选择月份:', currentMonth);
    updateDetailDecompositionFromMonthly();
  }
}

// 更新特定月份电量后重新计算总电量
const updateMonthlyTotal = (monthIndex) => {
  console.log(`更新第${monthIndex}月电量`);
  calculateMonthlyTotal();
  
  // 更新详细分解表
  updateDetailDecompositionFromMonthly();
}

// 根据权重分配总电量到各月
const distributeVolumeToMonths = (monthIndex) => {
  // 如果指定了月份索引，重新计算总电量
  if (monthIndex !== undefined) {
    let total = 0;
    for (let i = 1; i <= 12; i++) {
      const monthValue = Number(monthlyDecompositionData.value[0][`month${i}`]) || 0;
      total += monthValue;
    }
    totalDistribution.value = total;
    decompositionForm.totalVolume = total;
    console.log('根据月份更新总电量:', total);
    return;
  }
  
  const total = totalDistribution.value;
  console.log('分配总电量:', total);
  
  // 如果总电量为0且未指定月份索引，不进行分配
  if (total === 0 && monthIndex === undefined) {
    return;
  }
  
  // 根据选择的曲线获取月份权重
  let monthWeightsToUse = {};
  
  // 使用曲线权重表中的月权重数据
  if (monthWeightData.value.length > 0) {
    const weightData = monthWeightData.value[0];
    
    // 计算权重总和以确保等于1
    let totalWeight = 0;
    for (let i = 1; i <= 12; i++) {
      totalWeight += parseFloat(weightData[`month${i}`] || 0);
    }
    
    console.log('月权重总和:', totalWeight);
    
    // 根据权重分配总电量
    for (let i = 1; i <= 12; i++) {
      const weight = parseFloat(weightData[`month${i}`] || 0);
      const monthVolume = (total * weight / totalWeight).toFixed(2);
      console.log(`月份${i}权重:${weight}, 分配电量:${monthVolume}`);
      monthlyDecompositionData.value[0][`month${i}`] = parseFloat(monthVolume);
    }
  } else {
    // 若无权重数据，均分到各月
    for (let i = 1; i <= 12; i++) {
      monthlyDecompositionData.value[0][`month${i}`] = (total / 12).toFixed(2);
    }
  }
  
  // 更新详细分解表
  updateDetailDecompositionFromMonthly();
}

// 处理合计值变化，分配电量到各月
const handleTotalChange = () => {
  const total = totalDistribution.value;
  console.log('合计电量变化:', total);
  
  // 确保总电量默认值
  if (total <= 0) {
    ElMessage.warning('总电量必须大于0');
    return;
  }
  
  // 根据权重分配总电量到各月
  distributeVolumeToMonths();
  
  // 更新图表
  nextTick(() => {
    initResultChart();
  });
}

// 根据月电量更新详细分解表
const updateDetailDecompositionFromMonthly = () => {
  if (!decompositionForm.yearMonth) {
    console.warn('未选择年月');
    return;
  }
  
  const [year] = decompositionForm.yearMonth.split('-');
  
  // 创建详细分解数据
  const detailData = [];
  
  // 生成全年的详细分解数据
  for (let month = 1; month <= 12; month++) {
    const monthlyVolume = Number(monthlyDecompositionData.value[0][`month${month}`]) || 0;
    console.log(`${month}月电量:`, monthlyVolume);
    
    // 只有当月电量大于0时才生成该月数据
    if (monthlyVolume <= 0) continue;
    
    const daysInMonth = new Date(parseInt(year), month, 0).getDate();
    console.log(`${month}月天数:`, daysInMonth);
    
    // 生成日权重
    const dayPercentages = generateDailyPercentages(daysInMonth);
    
    // 遍历当月所有日期
    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = month.toString().padStart(2, '0');
      const dayStr = day.toString().padStart(2, '0');
      const date = `${year}-${monthStr}-${dayStr}`;
      const dateObj = new Date(`${date}T00:00:00`);
      const dayOfWeek = getDayOfWeek(dateObj);
      
      // 确定日类型
      let dayType;
      if (dayOfWeek === '周六') {
        dayType = '周六';
      } else if (dayOfWeek === '周日') {
        dayType = '周日';
      } else {
        dayType = '工作日';
      }
      
      // 日权重
      const dayPercentage = dayPercentages[day - 1];
      const dayWeight = (dayPercentage / 100).toFixed(4);
      
      // 计算日电量
      const dayVolume = (monthlyVolume * (dayPercentage / 100)).toFixed(2);
      
      // 创建日分解数据
      const dayData = {
        date: date,
        dayType: dayType,
        month: `${month}月`,
        dayWeight: dayWeight,
        totalVolume: dayVolume
      };
      
      // 分配到小时电量
      const hourlyPercentages = generateHourlyPercentages(dayType);
      for (let hour = 0; hour < 24; hour++) {
        const hourPercentage = hourlyPercentages[hour];
        const hourVolume = (parseFloat(dayVolume) * hourPercentage / 100).toFixed(4);
        dayData[`hour${hour}`] = hourVolume;
      }
      
      detailData.push(dayData);
    }
  }
  
  console.log('生成详细分解数据条数:', detailData.length);
  detailDecompositionData.value = detailData;
  
  // 应用日期筛选
  handleDateRangeChange();
}

// 重置月度电量分解表
const resetMonthlyDecomposition = () => {
  for (let i = 1; i <= 12; i++) {
    monthlyDecompositionData.value[0][`month${i}`] = 0;
  }
  monthlyDecompositionData.value[0].total = 0;
}

// 更新月度电量分解表
const updateMonthlyDecomposition = () => {
  distributeVolumeToMonths()
}

// 生成分解结果
const generateDecompositionResults = () => {
  if (!decompositionForm.yearMonth) return
  
  const [year, month] = decompositionForm.yearMonth.split('-')
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate()
  const totalVolume = decompositionForm.totalVolume
  
  // 生成日电量数据
  const dailyData = []
  const hourlyData = []
  
  // 计算各日期的电量占比（模拟基于曲线的计算）
  const dayPercentages = generateDailyPercentages(daysInMonth)
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${decompositionForm.yearMonth}-${day.toString().padStart(2, '0')}`
    const dayOfWeek = getDayOfWeek(new Date(`${date}T00:00:00`))
    const percentage = dayPercentages[day - 1]
    const volume = (totalVolume * percentage / 100).toFixed(2)
    
    dailyData.push({
      date,
      dayOfWeek,
      volume,
      percentage: percentage.toFixed(2)
    })
    
    // 生成小时电量数据
    const hourPercentages = generateHourlyPercentages(dayOfWeek.includes('周六') ? '周六' : 
                                                     dayOfWeek.includes('周日') ? '周日' : '工作日')
    
    for (let hour = 0; hour < 24; hour++) {
      const hourPercentage = hourPercentages[hour]
      const hourlyVolume = (volume * hourPercentage / 100).toFixed(4)
      
      hourlyData.push({
        date,
        hour,
        volume: hourlyVolume,
        percentage: (hourPercentage * percentage / 100).toFixed(2),
        curvePercentage: hourPercentage.toFixed(2)
      })
    }
  }
  
  dailyResults.value = dailyData
  hourlyResults.value = hourlyData
  decompositionResults.value = hourlyData // 存储所有结果用于图表绘制
  
  // 默认选择第一天
  if (dailyData.length > 0) {
    selectedDate.value = dailyData[0].date
  }
}

// 获取星期几
const getDayOfWeek = (date) => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[date.getDay()]
}

// 生成日电量百分比（模拟）
const generateDailyPercentages = (daysInMonth) => {
  let percentages = []
  let totalPercentage = 0
  
  for (let i = 0; i < daysInMonth; i++) {
    // 生成随机占比，但要确保工作日比周末大
    const date = new Date(decompositionForm.yearMonth)
    date.setDate(i + 1)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    
    // 工作日占比高于周末
    const percentage = isWeekend 
      ? 2 + Math.random() * 1 // 周末占比2-3%
      : 3 + Math.random() * 1.5 // 工作日占比3-4.5%
    
    percentages.push(percentage)
    totalPercentage += percentage
  }
  
  // 规范化确保总和为100%
  return percentages.map(p => (p / totalPercentage) * 100)
}

// 生成小时电量百分比（模拟基于选中曲线）
const generateHourlyPercentages = (dayType) => {
  // 根据日类型选择不同的小时分配模式
  if (dayType === '周六') {
  return [
      2.8, 2.0, 1.8, 1.6, 1.6, 1.8,
      2.4, 3.2, 3.8, 4.4, 4.8, 4.8,
      4.6, 4.4, 4.4, 4.6, 5.0, 5.6,
      6.2, 5.8, 4.8, 4.2, 3.6, 3.0
    ];
  } else if (dayType === '周日') {
    return [
      3.0, 2.6, 2.2, 2.0, 1.8, 2.0,
      2.4, 2.8, 3.4, 4.0, 4.4, 4.6,
      4.6, 4.4, 4.4, 4.4, 4.6, 5.0,
      5.8, 5.6, 5.0, 4.4, 3.8, 3.4
    ];
  } else {
    // 工作日
    return [
      2.0, 1.5, 1.2, 1.0, 1.2, 2.0,
      4.0, 5.2, 5.6, 5.2, 4.8, 4.6,
      4.2, 4.0, 4.0, 4.4, 5.0, 5.8,
      7.0, 6.4, 5.0, 4.0, 3.5, 2.5
    ];
  }
}

// 显示小时明细
const showHourlyDetail = (row) => {
  selectedDate.value = row.date;
  // 直接初始化该行的小时数据图表
  nextTick(() => {
    initHourlyChartFromRow(row);
  });
}

// 导出分解结果
const exportDecompositionResults = () => {
  ElMessage.success('分解结果导出中...')
  // 实际应用中这里需要实现导出逻辑
}

// 下载曲线
const downloadCurve = () => {
  if (!selectedCurve.value) {
    ElMessage.warning('请先选择一条曲线')
    return
  }
  
  // 实际应用中这里应该执行真实的曲线数据下载逻辑
  const curve = [...systemCurves.value, ...userCurves.value].find(item => item.id === selectedCurve.value)
  if (curve) {
    ElMessage.success(`${curve.name} 下载中...`)
  }
}

// 新建曲线
const createNewCurve = () => {
  curveUploadForm.name = ''
  curveUploadForm.description = ''
  curveUploadForm.file = null
  uploadDialogVisible.value = true
  // 这里复用上传曲线的对话框，实际应用中可以创建专门的新建曲线对话框
}

// 处理日期范围变化
const handleDateRangeChange = () => {
  if (!dateRangeFilter.value || dateRangeFilter.value.length !== 2 || detailDecompositionData.value.length === 0) {
    console.log('日期范围为空或详细数据为空，显示全部数据');
    filteredDetailDecompositionData.value = detailDecompositionData.value;
  } else {
    const [startDateStr, endDateStr] = dateRangeFilter.value;
    console.log('筛选日期范围:', startDateStr, '至', endDateStr);
    
    try {
      const filteredData = detailDecompositionData.value.filter(item => {
        const itemDateStr = item.date;
        
        // 直接比较日期字符串（格式为YYYY-MM-DD）
        return itemDateStr >= startDateStr && itemDateStr <= endDateStr;
      });
      
      console.log('筛选后数据条数:', filteredData.length);
      filteredDetailDecompositionData.value = filteredData.length > 0 
        ? filteredData 
        : detailDecompositionData.value;
    } catch (error) {
      console.error('日期筛选出错:', error);
      filteredDetailDecompositionData.value = detailDecompositionData.value;
    }
  }
  
  // 有数据时，自动更新图表
  if (filteredDetailDecompositionData.value.length > 0) {
    // 如果没有选中的日期，默认选择第一条记录的日期
    if (!selectedDate.value && filteredDetailDecompositionData.value.length > 0) {
      selectedDate.value = filteredDetailDecompositionData.value[0].date;
    }
    
    // 更新图表
    nextTick(() => {
      initResultChart();
    });
  }
}

// 更新详细分解表 - 用于兼容原有功能
const updateDetailDecomposition = () => {
  // 调用新的根据月电量更新详细分解表的函数
  updateDetailDecompositionFromMonthly()
  
  // 设置默认显示最近一个月的数据
  const now = new Date()
  const end = formatDate(now)
  const start = new Date()
  start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
  const startStr = formatDate(start)
  
  // 更新日期范围过滤器
  dateRangeFilter.value = [startStr, end]
  
  // 应用筛选
  handleDateRangeChange()
}

// 处理表格行点击事件
const handleRowClick = (row) => {
  // 更新选中的日期
  selectedDate.value = row.date;
  // 更新图表
  nextTick(() => {
    updateDailyChart();
  });
}

// 从表格行数据初始化小时视图图表
const initHourlyChartFromRow = (row) => {
  if (!row) return;
  
  const hours = [];
  const volumes = [];
  
  // 从行数据中提取小时电量数据
  for (let i = 0; i < 24; i++) {
    hours.push(`${i}时`);
    volumes.push(parseFloat(row[`hour${i}`]));
  }
  
  const option = {
    title: {
      text: `${row.date} 日内小时电量分布`,
      left: 'center',
      textStyle: {
        fontSize: 14
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const data = params[0];
        const hour = parseInt(data.name);
        return `${hour}时<br/>电量: ${data.value} 万千瓦时`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: hours
    },
    yAxis: {
      type: 'value',
      name: '电量 (万千瓦时)',
      splitLine: {
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '电量',
        data: volumes,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: '#409EFF'
        },
        itemStyle: {
          color: '#409EFF'
        }
      }
    ]
  };
  
  resultChart.setOption(option);
}

// 添加时点选择器响应式变量
const selectedHourPoint = ref(0);

// 时点筛选响应式变量 
const timePointFilter = ref('all')
const selectedTimePoints = ref([0, 8, 16]) // 默认选择几个典型时点

// 监听时点筛选变化
watch(timePointFilter, () => {
  if (timePointFilter.value === 'all') {
    // 显示所有时点
    selectedTimePoints.value = Array.from({ length: 24 }, (_, i) => i)
  } else if (timePointFilter.value === 'peak') {
    // 显示高峰时段 (如8-11时, 18-21时)
    selectedTimePoints.value = [8, 9, 10, 11, 18, 19, 20, 21]
  } else if (timePointFilter.value === 'valley') {
    // 显示低谷时段 (如0-6时, 22-23时)
    selectedTimePoints.value = [0, 1, 2, 3, 4, 5, 6, 22, 23]
  }
  
  // 更新图表
  updateDailyChart()
}, { immediate: true })

// 折叠状态变量 - 默认展开
const isCollapsed = ref(false)

// 切换折叠状态
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  // 保存用户偏好
  localStorage.setItem('curveWeightTableCollapsed', isCollapsed.value.toString())
}

// 键盘事件处理
const handleKeyDown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggleCollapse()
  }
}
</script>

<style scoped>
.curve-decomposition {
  padding: 0 10px;
}

.section-card {
  margin-bottom: 20px;
}

.section-card:first-child {
  margin-top: 10px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 14px;
}

.curve-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 10px;
  gap: 10px;
}

.preview-tables-container {
  padding: 10px;
}

.preview-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 10px;
}

.weight-table-section {
  margin-bottom: 20px;
}

.weight-table-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 10px;
}

.no-curve-selected {
  padding: 20px 0;
}

.input-section {
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
  height: 100%;
  padding-bottom: 18px;
  gap: 10px;
}

.result-section {
  margin-top: 20px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.result-title {
  font-weight: bold;
  font-size: 14px;
}

.decomposition-table-section {
  margin-bottom: 30px;
}

.decomposition-table-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 15px;
}

.table-subtitle {
  font-weight: normal;
  font-size: 12px;
  color: #909399;
}

.filter-section {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-info {
  color: #606266;
  font-size: 14px;
  background-color: #f5f7fa;
  padding: 4px 10px;
  border-radius: 4px;
}

.result-tabs {
  margin-bottom: 10px;
}

.chart-container {
  padding: 10px;
}

.chart-date-selector {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  font-size: 14px;
}

.chart-date-selector .el-select {
  margin-left: 10px;
}

.result-chart {
  height: 360px;
  width: 100%;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .preview-tables-container {
    padding: 10px;
  }
  
  .result-chart {
    height: 280px;
  }
}

/* 添加自定义输入框样式 */
.custom-input-number :deep(.el-input__inner) {
  color: #333 !important; /* 确保文本颜色可见 */
  text-align: center;
  background-color: #f5f7fa;
  border-radius: 4px;
  height: 28px;
  line-height: 28px;
  padding: 0 8px;
}

.custom-input-number :deep(.el-input-number__decrease),
.custom-input-number :deep(.el-input-number__increase) {
  display: none;
}

.custom-input-number:hover :deep(.el-input__inner) {
  background-color: #ebeef5;
}

.custom-input-number :deep(.el-input__inner:focus) {
  background-color: #fff;
  border-color: #409EFF;
}

.collapse-button {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  margin: 0;
  font-size: 14px;
  color: #409EFF;
  transition: all 0.3s ease;
}

.collapse-text {
  font-size: 14px;
  margin-right: 2px;
}

.collapse-button:hover {
  color: #66b1ff;
}

.collapse-button:focus {
  outline: none;
}

.collapse-button .el-icon {
  transition: transform 0.3s ease;
}

.is-collapsed {
  transform: rotate(-180deg);
}

.weight-tables-content {
  transition: all 0.3s ease-in-out;
  overflow: hidden;
  padding-left: 20px;
}

.weight-tables-content[aria-hidden="true"] {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
  margin-bottom: 0;
}

.weight-tables-content[aria-hidden="false"] {
  max-height: 3000px; /* 根据实际内容调整 */
  opacity: 1;
}

.preview-tables-container {
  background-color: #fff;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.weight-table-section {
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.weight-table-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 10px;
  color: #606266;
  transition: all 0.3s ease;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.collapse-button:focus-visible {
  outline: 2px solid #409EFF;
  outline-offset: 2px;
  border-radius: 4px;
}
</style> 