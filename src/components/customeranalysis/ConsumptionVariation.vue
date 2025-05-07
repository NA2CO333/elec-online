<template>
  <div class="consumption-variation-container">
    <!-- 内容区域 -->
    <div class="analysis-content">
      <!-- 主分析区域 -->
      <div class="main-analysis-area">
        <!-- 周期之间日总电量和变化率对比透视表 -->
        <div class="analysis-card">
          <div class="card-header">
            <h3>周期之间日总电量和变化率对比</h3>
            <div class="card-tools">
              <el-button 
                type="primary" 
                size="small"
                @click="periodSelectorVisible = true"
              >
                周期选择器
              </el-button>
            </div>
          </div>
          <div class="pivot-table-container">
            <el-table
              ref="pivotTableRef"
              :data="pivotTableData"
              style="width: 100%"
              height="350"
              border
              :default-sort="{prop: 'change_vs_past1', order: 'descending'}"
              :cell-class-name="getCellClassName"
            >
              <!-- 序号列 -->
              <el-table-column
                type="index"
                label="序号"
                width="60"
                align="center"
              />
              
              <!-- 操作列 -->
              <el-table-column 
                label="操作" 
                width="80"
                align="center"
                v-if="pivotTableData.length > 1"
              >
                <template #default="scope">
                  <!-- 不允许删除第一行（默认行） -->
                  <el-button
                    v-if="scope.$index > 0"
                    type="danger"
                    size="small"
                    circle
                    @click="removeComparisonRow(scope.$index)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </template>
              </el-table-column>
              
              <!-- 维度列 -->
              <el-table-column label="维度" align="center">
                <el-table-column
                  label="日类型"
                  width="120"
                  align="center"
                >
                  <template #default="scope">
                    <el-button 
                      type="text" 
                      @click="openDimensionSelector(scope.row, 'dayType')"
                    >
                      {{ formatDimensionDisplay(scope.row.dayType) }}
                    </el-button>
                  </template>
                </el-table-column>
                
                <el-table-column
                  label="时段"
                  width="120"
                  align="center"
                >
                  <template #default="scope">
                    <el-button 
                      type="text" 
                      @click="openDimensionSelector(scope.row, 'timeSegment')"
                    >
                      {{ formatDimensionDisplay(scope.row.timeSegment) }}
                    </el-button>
                  </template>
                </el-table-column>
                
                <el-table-column
                  label="用户等级"
                  width="120"
                  align="center"
                >
                  <template #default="scope">
                    <el-button 
                      type="text" 
                      @click="openDimensionSelector(scope.row, 'userLevel')"
                    >
                      {{ formatDimensionDisplay(scope.row.userLevel) }}
                    </el-button>
                  </template>
                </el-table-column>
                
                <el-table-column
                  label="行业"
                  width="120"
                  align="center"
                >
                  <template #default="scope">
                    <el-button 
                      type="text" 
                      @click="openDimensionSelector(scope.row, 'industry')"
                    >
                      {{ formatDimensionDisplay(scope.row.industry) }}
                    </el-button>
                  </template>
                </el-table-column>
                
                <el-table-column
                  label="地区"
                  width="120"
                  align="center"
                >
                  <template #default="scope">
                    <el-button 
                      type="text" 
                      @click="openDimensionSelector(scope.row, 'region')"
                    >
                      {{ formatDimensionDisplay(scope.row.region) }}
                    </el-button>
                  </template>
                </el-table-column>
                
                <el-table-column
                  label="用户组"
                  width="120"
                  align="center"
                >
                  <template #default="scope">
                    <el-button 
                      type="text" 
                      @click="openDimensionSelector(scope.row, 'userGroup')"
                    >
                      {{ formatDimensionDisplay(scope.row.userGroup) }}
                    </el-button>
                  </template>
                </el-table-column>
              </el-table-column>
              
              <!-- 平均电量列 -->
              <el-table-column label="平均电量 (MWh)" align="center">
                <el-table-column
                  prop="past2_consumption"
                  label="过去2"
                  width="100"
                  align="center"
                >
                  <template #default="scope">
                    {{ formatNumber(scope.row.past2_consumption) }}
                  </template>
                </el-table-column>
                
                <el-table-column
                  prop="past1_consumption"
                  label="过去1"
                  width="100"
                  align="center"
                >
                  <template #default="scope">
                    {{ formatNumber(scope.row.past1_consumption) }}
                  </template>
                </el-table-column>
                
                <el-table-column
                  prop="current_consumption"
                  label="现在"
                  width="100"
                  align="center"
                >
                  <template #default="scope">
                    {{ formatNumber(scope.row.current_consumption) }}
                  </template>
                </el-table-column>
              </el-table-column>
              
              <!-- 变化率列 -->
              <el-table-column label="变化率 (%)" align="center">
                <el-table-column
                  prop="change_vs_past2"
                  label="比过去2"
                  width="100"
                  align="center"
                >
                  <template #default="scope">
                    <div class="change-rate-cell">
                      {{ formatPercent(scope.row.change_vs_past2) }}
                      <div class="change-rate-bar" 
                        :style="{
                          width: Math.min(Math.abs(scope.row.change_vs_past2 * 5), 100) + '%',
                          'background-color': scope.row.change_vs_past2 >= 0 ? '#67C23A' : '#F56C6C'
                        }"
                      ></div>
                    </div>
                  </template>
                </el-table-column>
                
                <el-table-column
                  prop="change_vs_past1"
                  label="比过去1"
                  width="100"
                  align="center"
                >
                  <template #default="scope">
                    <div class="change-rate-cell">
                      {{ formatPercent(scope.row.change_vs_past1) }}
                      <div class="change-rate-bar" 
                        :style="{
                          width: Math.min(Math.abs(scope.row.change_vs_past1 * 5), 100) + '%',
                          'background-color': scope.row.change_vs_past1 >= 0 ? '#67C23A' : '#F56C6C'
                        }"
                      ></div>
                    </div>
                  </template>
                </el-table-column>
              </el-table-column>
            </el-table>
            
            <!-- 添加对比按钮 -->
            <div class="add-comparison-row">
              <el-button 
                type="primary" 
                plain 
                size="small" 
                @click="addComparisonRow"
              >
                添加对比
              </el-button>
            </div>
            
            <!-- 维度选择弹出层 -->
            <div 
              v-if="currentDimensionSelector.visible" 
              class="dimension-selector-popover"
              :style="{
                top: currentDimensionSelector.position.top + 'px',
                left: currentDimensionSelector.position.left + 'px'
              }"
            >
              <div class="dimension-selector-header">
                <span>选择{{ getDimensionLabel(currentDimensionSelector.dimension) }}</span>
                <el-button 
                  type="text" 
                  size="small" 
                  @click="cancelDimensionSelection"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
              
              <div class="dimension-selector-content">
                <div class="selector-quick-actions">
                  <el-button size="small" type="primary" @click="selectAllOptions">全选</el-button>
                  <el-button size="small" @click="clearAllOptions">清空</el-button>
                </div>
                <el-checkbox-group v-model="selectedDimensionOptions">
                  <el-checkbox 
                    v-for="option in getDimensionOptions(currentDimensionSelector.dimension)"
                    :key="option" 
                    :label="option"
                  >
                    {{ option }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
              
              <div class="dimension-selector-footer">
                <!-- 如果是用户组维度，显示新增用户组按钮 -->
                <el-button 
                  v-if="currentDimensionSelector.dimension === 'userGroup'"
                  type="primary" 
                  size="small"
                  @click="showAddUserGroupDialog"
                >
                  新增用户组
                </el-button>
                
                <div class="dimension-selector-actions">
                  <el-button size="small" @click="cancelDimensionSelection">取消</el-button>
                  <el-button type="primary" size="small" @click="confirmDimensionSelection">确定</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 周期之间电量分时曲线对比 -->
        <div class="analysis-card">
          <div class="card-header">
            <h3>周期之间电量分时曲线对比</h3>
          </div>
          
          <!-- 图表控制选项 -->
          <div class="chart-controls">
            <div class="chart-control-group">
              <span class="control-label">显示对比组：</span>
              <el-checkbox-group v-model="visibleCompareGroups" @change="updateHourlyConsumptionChart">
                <el-checkbox 
                  v-for="(group, index) in compareGroups" 
                  :key="index" 
                  :label="index" 
                  :disabled="!group.enabled"
                >
                  对比组 {{ index + 1 }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
            
            <div class="chart-control-group">
              <span class="control-label">数据类型：</span>
              <el-radio-group v-model="periodVisibility" @change="updateHourlyConsumptionChart">
                <el-radio label="both">全部</el-radio>
                <el-radio label="current">仅现在周期</el-radio>
                <el-radio label="previous">仅从前周期</el-radio>
              </el-radio-group>
            </div>
          </div>
          
          <div class="chart-container">
            <div id="hourlyConsumptionChart" class="chart"></div>
          </div>
        </div>
      </div>
      
      <!-- 辅助分析区域 -->
      <div class="secondary-analysis-area">
        <!-- 维度分布卡片 -->
        <div class="analysis-card">
          <div class="card-header">
            <h3>维度分布</h3>
            <div class="card-tools">
              <el-dropdown>
                <el-button size="small">
                  切换维度
                  <el-icon><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="changeDimensionView('userLevel')">用户分级</el-dropdown-item>
                    <el-dropdown-item @click="changeDimensionView('industry')">行业</el-dropdown-item>
                    <el-dropdown-item @click="changeDimensionView('region')">地区</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          <div class="chart-container">
            <div id="dimensionDistributionChart" class="chart"></div>
          </div>
        </div>
        
        <!-- 异常用户卡片 -->
        <div class="analysis-card">
          <div class="card-header">
            <h3>异常用户</h3>
            <div class="card-tools">
              <el-tooltip content="导出表格">
                <el-button size="small" circle>
                  <el-icon><Download /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </div>
          <div class="table-container">
            <el-table :data="abnormalUsersData" style="width: 100%" height="200" border>
              <el-table-column prop="userId" label="用户ID" width="80" />
              <el-table-column prop="userName" label="用户名称" width="120" />
              <el-table-column prop="changeRate" label="变化率(%)" width="100" />
              <el-table-column prop="abnormalReason" label="异常原因" />
            </el-table>
          </div>
        </div>
        
        <!-- 气象因素影响卡片 -->
        <div class="analysis-card">
          <div class="card-header">
            <h3>气象因素影响</h3>
            <div class="card-tools">
              <el-dropdown>
                <el-button size="small">
                  气象因素
                  <el-icon><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="changeWeatherFactor('temperature')">温度</el-dropdown-item>
                    <el-dropdown-item @click="changeWeatherFactor('precipitation')">降水</el-dropdown-item>
                    <el-dropdown-item @click="changeWeatherFactor('humidity')">湿度</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          <div class="chart-container">
            <div id="weatherFactorChart" class="chart"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增用户组对话框 -->
    <el-dialog
      title="新增用户组"
      v-model="userGroupDialogVisible"
      width="50%"
      destroy-on-close
    >
      <div class="user-group-form">
        <el-form :model="userGroupForm" label-width="80px">
          <!-- 搜索公司的输入框 -->
          <el-form-item label="搜索公司">
            <el-input 
              v-model="companySearchKeyword" 
              placeholder="请输入公司名称进行搜索" 
              clearable 
              @input="searchCompanies"
              size="default"
              class="company-search-input"
            />
          </el-form-item>
          
          <!-- 搜索结果列表 -->
          <el-form-item v-if="searchResults.length > 0" label="搜索结果">
            <div class="search-results-container">
              <div 
                v-for="company in searchResults" 
                :key="company.id" 
                class="search-result-item"
                @click="addCompanyToSelectedList(company)"
              >
                <span>{{ company.name }}</span>
                <el-button type="primary" size="small" circle>
                  <el-icon><Plus /></el-icon>
                </el-button>
              </div>
            </div>
          </el-form-item>
          
          <!-- 待添加用户组列表 -->
          <el-form-item label="待添加用户组">
            <div class="selected-companies-container">
              <div v-if="userGroupForm.selectedCompanies.length === 0" class="empty-tip">
                暂无选择的公司，请在上方搜索并添加
              </div>
              <div 
                v-for="(company, index) in userGroupForm.selectedCompanies" 
                :key="company.id" 
                class="selected-company-item"
              >
                <span>{{ company.name }}</span>
                <el-button 
                  type="danger" 
                  size="small" 
                  circle
                  @click="removeCompanyFromSelectedList(index)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelAddUserGroup">取消</el-button>
          <el-button type="primary" @click="confirmAddUserGroup">确认新增</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 周期选择器对话框 -->
    <el-dialog
      title="周期选择器"
      v-model="periodSelectorVisible"
      width="70%"
      destroy-on-close
    >
      <div class="period-selector-container">
        <!-- 现在周期 -->
        <div class="period-row">
          <div class="period-label">现在:</div>
          <div class="period-date-picker">
            <div class="period-date-info" style="color: #000000; margin-bottom: 8px;">
              {{ formatDateDisplay(currentPeriodRange[0]) }} 至 {{ formatDateDisplay(currentPeriodRange[1]) }}
            </div>
            <el-date-picker
              v-model="currentPeriodRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY/MM/DD"
              value-format="YYYY-MM-DD"
              size="default"
            />
          </div>
        </div>

        <!-- 过去周期 -->
        <div 
          v-for="(period, index) in pastPeriods" 
          :key="index"
          class="period-row"
        >
          <div class="period-label">过去{{ index + 1 }}:</div>
          <div class="period-date-picker">
            <div class="period-date-info" style="color: #000000; margin-bottom: 8px;">
              {{ formatDateDisplay(period.dateRange[0]) }} 至 {{ formatDateDisplay(period.dateRange[1]) }}
            </div>
            <el-date-picker
              v-model="period.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY/MM/DD"
              value-format="YYYY-MM-DD"
              size="default"
            />
            
          </div>
          <div class="period-quick-actions">
            <div class="weeks-average-input">
              <span>对比前</span>
              <el-button 
                type="primary"
                size="small"
                plain
                circle
                @click="decreaseWeeksToCompare(index)"
              >-</el-button>
              <el-input-number
                v-model="period.weeksToCompare"
                :min="1"
                :max="52"
                size="small"
                @change="handleWeeksToCompareChange(index)"
                controls-position="right"
                :controls="false"
                style="color: #000000;"
              />
              <el-button 
                type="primary"
                size="small"
                plain
                circle
                @click="increaseWeeksToCompare(index)"
              >+</el-button>
              <span>周均值</span>
            </div>
            <el-button 
              size="small" 
              @click="handleLastYearCompare(index)"
            >
              去年同比
            </el-button>
          </div>
        </div>

        <!-- 添加新的过去周期按钮 -->
        <div class="add-period-row" v-if="pastPeriods.length < 3">
          <el-button 
            type="primary" 
            plain 
            size="small"
            @click="addPastPeriod"
          >
            新建过去
          </el-button>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="periodSelectorVisible = false">取消</el-button>
          <el-button type="primary" @click="applyPeriodSelection">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { ArrowDown, Download, View, Close, Delete, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 维度选择数据
interface DimensionOptions {
  dayType: string[];
  timeSegment: string[];
  userLevel: string[];
  industry: string[];
  region: string[];
  userGroup: string[];
}

// 可供选择的维度选项
const dimensionOptions: DimensionOptions = {
  dayType: ['工', '六', '日', '一', '节', '调'],
  timeSegment: ['尖峰', '高峰', '平段', '低谷'],
  userLevel: ['大型用户', '中型用户', '小型用户', '微型用户'],
  industry: ['制造业', '金属开采业', '住宿业'],
  region: ['深圳', '广州', '东莞', '佛山'],
  userGroup: ['全部']
}

// 表格数据模型
interface TableRowData {
  id: number;
  dayType: string[];
  timeSegment: string[];
  userLevel: string[];
  industry: string[];
  region: string[];
  userGroup: string[];
  past2_consumption: number;
  past1_consumption: number;
  current_consumption: number;
  change_vs_past2: number;
  change_vs_past1: number;
}

// 当前选中的维度类型和行
const currentDimensionSelector = ref<{
  row: TableRowData | null;
  dimension: keyof DimensionOptions | null;
  visible: boolean;
  position: { top: number; left: number };
}>({
  row: null,
  dimension: null,
  visible: false,
  position: { top: 0, left: 0 }
})

// 当前选中的维度选项
const selectedDimensionOptions = ref<string[]>([])

// 周期选择器控制变量
const periodSelectorVisible = ref(false)

// 加载状态标志
const loadingComparison = ref(false);

// 对比数据
const comparisonData = ref<{
  name: string;
  data: Array<{
    date: string;
    consumption: string;
    percentage: string;
  }>;
}[]>([]);

// 获取当前周和上周的日期范围
function getCurrentWeekRange(): [Date, Date] {
  // 为了演示，我们假设当前日期是2025/4/30
  // 在实际生产环境中，这里应该使用真实的当前日期
  // const now = new Date();
  const now = new Date(2025, 3, 30); // 注意：月份是从0开始的，所以3代表4月
  
  const currentWeekDay = now.getDay(); // 0 是周日，1 是周一
  const startDate = new Date(now);
  
  // 计算到上一周最后一天(周日)的天数
  const daysToLastSunday = currentWeekDay === 0 ? 7 : currentWeekDay;
  // 回退到上一周一
  startDate.setDate(now.getDate() - daysToLastSunday - 6);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6); // 添加6天到周一，得到周日
  endDate.setHours(23, 59, 59, 999);
  
  // 这将返回4月21日至4月27日
  return [startDate, endDate];
}

function getLastWeekRange(): [Date, Date] {
  const [currentStart] = getCurrentWeekRange();
  const lastWeekStart = new Date(currentStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7); // 向前推一周
  
  const lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setDate(lastWeekStart.getDate() + 6); // 添加6天得到完整一周
  lastWeekEnd.setHours(23, 59, 59, 999);
  
  // 这将返回4月14日至4月20日
  return [lastWeekStart, lastWeekEnd];
}

// 周期选择器数据
const currentPeriodRange = ref(getCurrentWeekRange())

// 定义过去周期的类型
interface PastPeriod {
  id: number;
  dateRange: [Date, Date];
  weeksToCompare: number;
}

// 初始化一个过去周期（默认为上周）
const pastPeriods = ref<PastPeriod[]>([
  {
    id: 1,
    dateRange: getLastWeekRange(),
    weeksToCompare: 1
  }
])

// 周均值比较的周数
const weeksToCompare = ref(1)

// 处理周均值比较变化
function handleWeeksCompareChange() {
  if (pastPeriods.value.length > 0 && weeksToCompare.value > 0) {
    const [currentStart] = currentPeriodRange.value;
    const pastStart = new Date(currentStart);
    pastStart.setDate(pastStart.getDate() - (7 * weeksToCompare.value));
    
    const pastEnd = new Date(pastStart);
    pastEnd.setDate(pastStart.getDate() + 6);
    pastEnd.setHours(23, 59, 59, 999);
    
    pastPeriods.value[0].dateRange = [pastStart, pastEnd];
  }
}

// 处理去年同期比较
function handleLastYearCompare(index: number = 0) {
  if (pastPeriods.value.length > index) {
    const [currentStart, currentEnd] = currentPeriodRange.value;
    
    // 确保日期是Date对象
    const lastYearStart = new Date(currentStart);
    lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
    
    const lastYearEnd = new Date(currentEnd);
    lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1);
    
    pastPeriods.value[index].dateRange = [lastYearStart, lastYearEnd];
    
    // 提示用户
    ElMessage.success('已设置为去年同比周期');
  }
}

// 添加新的对比周期
function addPastPeriod() {
  if (pastPeriods.value.length < 3) {
    // 获取当前最大ID并创建新ID
    const newId = Math.max(...pastPeriods.value.map(p => p.id), 0) + 1;
    
    // 获取上一个周期的日期范围，用于计算新周期
    const lastPeriodIndex = pastPeriods.value.length - 1;
    const lastPeriod = pastPeriods.value[lastPeriodIndex];
    
    // 创建新周期的日期范围，往前推一周
    const [lastStart] = lastPeriod.dateRange;
    const newPeriodStart = new Date(lastStart);
    newPeriodStart.setDate(newPeriodStart.getDate() - 7); // 前推7天
    
    const newPeriodEnd = new Date(newPeriodStart);
    newPeriodEnd.setDate(newPeriodStart.getDate() + 6); // 设置为6天后
    newPeriodEnd.setHours(23, 59, 59, 999); // 设置为当天结束时间
    
    // 创建新周期对象
    pastPeriods.value.push({
      id: newId,
      dateRange: [newPeriodStart, newPeriodEnd],
      weeksToCompare: 1 // 默认对比前1周
    });
    
    // 提示用户
    ElMessage.success(`已添加过去周期 ${newId}`);
  } else {
    // 提示用户已达到最大数量限制
    ElMessage.warning('最多可以添加3个过去周期');
  }
}

// 应用周期选择
function applyPeriodSelection() {
  // 验证选择的日期范围
  if (!currentPeriodRange.value[0] || !currentPeriodRange.value[1]) {
    ElMessage.warning('请选择当前周期的有效日期范围');
    return;
  }
  
  for (const period of pastPeriods.value) {
    if (!period.dateRange[0] || !period.dateRange[1]) {
      ElMessage.warning('请为所有过去周期选择有效的日期范围');
      return;
    }
  }
  
  try {
    // 将日期字符串转换为Date对象
    const currentStart = new Date(currentPeriodRange.value[0]);
    const currentEnd = new Date(currentPeriodRange.value[1]);
    
    // 确保日期有效
    if (isNaN(currentStart.getTime()) || isNaN(currentEnd.getTime())) {
      ElMessage.warning('当前周期包含无效日期');
      return;
    }
    
    // 验证日期范围顺序
    if (currentStart > currentEnd) {
      ElMessage.warning('当前周期的开始日期不能晚于结束日期');
      return;
    }
    
    // 格式化后的当前周期日期范围
    const formattedCurrentPeriod: [Date, Date] = [currentStart, currentEnd];
    
    // 更新比较组
    comparisonGroups.value = [
      {
        name: '当前周期',
        dateRange: formattedCurrentPeriod
      },
      ...pastPeriods.value.map(period => {
        // 确保过去周期的日期是有效的Date对象
        const pastStart = new Date(period.dateRange[0]);
        const pastEnd = new Date(period.dateRange[1]);
        
        // 验证日期是否有效
        if (isNaN(pastStart.getTime()) || isNaN(pastEnd.getTime())) {
          throw new Error(`过去周期 ${period.id} 包含无效日期`);
        }
        
        // 验证日期范围顺序
        if (pastStart > pastEnd) {
          throw new Error(`过去周期 ${period.id} 的开始日期不能晚于结束日期`);
        }
        
        return {
          name: `过去周期 ${period.id}`,
          dateRange: [pastStart, pastEnd] as [Date, Date]
        };
      })
    ];
    
    // 重新加载数据
    reloadData();
    
    // 提示用户
    ElMessage.success('已应用周期选择');
    
    // 关闭对话框
    periodSelectorVisible.value = false;
  } catch (error) {
    console.error('应用周期选择时出错', error);
    if (error instanceof Error) {
      ElMessage.error(error.message);
    } else {
      ElMessage.error('应用周期选择时出错，请检查日期格式');
    }
  }
}

// 重新加载对比数据
function reloadData() {
  // 重置加载状态
  loadingComparison.value = true;
  
  // 这里模拟API调用
  setTimeout(() => {
    // 为每个比较组生成模拟数据
    const newData = comparisonGroups.value.map((group, index) => {
      // 生成7天的随机数据
      const dailyData: any[] = [];
      const startDate = new Date(group.dateRange[0]);
      
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        // 基础值，当前周期稍高一些
        const baseValue = index === 0 ? 300 + Math.random() * 100 : 250 + Math.random() * 100;
        
        dailyData.push({
          date: formatDate(currentDate),
          consumption: baseValue.toFixed(2),
          percentage: ((Math.random() * 20) - 10).toFixed(2) // -10% 到 +10% 的随机变化率
        });
      }
      
      return {
        name: group.name,
        data: dailyData
      };
    });
    
    // 更新比较数据
    comparisonData.value = newData;
    loadingComparison.value = false;
  }, 1000);
}

// 初始化比较组
const comparisonGroups = ref([
  {
    name: '当前周期',
    dateRange: getCurrentWeekRange()
  },
  {
    name: '过去周期 1',
    dateRange: getLastWeekRange()
  }
]);

// 格式化日期为 yyyy-MM-dd
function formatDate(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 在组件挂载时加载数据
onMounted(() => {
  // 初始化当前周期为最新的完整一周
  currentPeriodRange.value = getCurrentWeekRange();
  
  // 初始化过去周期
  if (pastPeriods.value.length > 0) {
    // 确保第一个过去周期是当前周期的上一周
    pastPeriods.value[0].dateRange = getLastWeekRange();
  }
  
  // 初始化加载对比数据
  reloadData();
  
  // 添加全局点击事件监听，用于关闭维度选择器
  document.addEventListener('click', handleClickOutside);
  
  // 初始化图表
  nextTick(() => {
    initCharts();
  });
})

// 在组件卸载时移除事件监听和清理资源
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  // 销毁图表实例，避免内存泄漏
  hourlyConsumptionChart.value?.dispose();
  dimensionDistributionChart.value?.dispose();
  weatherFactorChart.value?.dispose();
  
  // 移除全局点击事件监听
  document.removeEventListener('click', handleClickOutside);
});

// 监听点击事件，当点击其他区域时关闭维度选择器
function handleClickOutside(event: MouseEvent) {
  // 检查当前维度选择器是否打开
  if (!currentDimensionSelector.value.visible) return;
  
  // 获取点击的元素
  const target = event.target as HTMLElement;
  
  // 获取维度选择器元素
  const dimensionSelector = document.querySelector('.dimension-selector-popover');
  
  // 如果维度选择器不存在，不处理
  if (!dimensionSelector) return;
  
  // 如果是按钮触发的事件，不处理它，让openDimensionSelector处理
  if (target.tagName === 'BUTTON' || target.closest('button')) {
    return;
  }
  
  // 如果点击的不是维度选择器内部元素，则关闭选择器
  if (!dimensionSelector.contains(target)) {
    currentDimensionSelector.value.visible = false;
  }
}

// 透视表数据项接口
interface PivotData {
  // 维度字段
  industry?: string;
  userLevel?: string;
  dayType?: string;
  timeSegment?: string;
  region?: string;
  voltageLevel?: string;
  marketElectricity?: string;
  dimension?: string;
  
  // 组1数据
  group1_currentPeriod: number;
  group1_previousPeriod: number;
  group1_changeRate: number;
  
  // 组2数据
  group2_currentPeriod?: number;
  group2_previousPeriod?: number;
  group2_changeRate?: number;
  
  // 组3数据
  group3_currentPeriod?: number;
  group3_previousPeriod?: number;
  group3_changeRate?: number;
  
  // 组4数据
  group4_currentPeriod?: number;
  group4_previousPeriod?: number;
  group4_changeRate?: number;
  
  // 支持其他可能的字段
  [key: string]: any;
}

// 特殊事件模型
interface SpecialEvent {
  id: number;
  name: string;
  date: string;
  startHour: number;
  endHour: number;
  description: string;
}

// 特殊事件数据
const specialEvents = ref<SpecialEvent[]>([
  {
    id: 1,
    name: '设备检修',
    date: '2023-04-15',
    startHour: 10,
    endHour: 14,
    description: '计划性设备检修，影响部分用户供电'
  },
  {
    id: 2,
    name: '系统升级',
    date: '2023-04-16',
    startHour: 1,
    endHour: 3,
    description: '系统升级维护，用电量明显下降'
  },
  {
    id: 3,
    name: '大型活动',
    date: '2023-04-18',
    startHour: 18,
    endHour: 22,
    description: '城区大型活动，用电量显著上升'
  }
]);

// 分时电量数据模型
interface HourlyConsumptionData {
  groupIndex: number;
  periodType: 'current' | 'previous';
  data: number[];
}

// 分时电量数据
const hourlyConsumptionData = ref<HourlyConsumptionData[]>([])

// 图表显示控制
const visibleCompareGroups = ref<number[]>([0])
const periodVisibility = ref<'both' | 'current' | 'previous'>('both')

// 日期计算帮助函数
function getDaysAgo(days: number) {
  return dayjs().subtract(days, 'day').format('YYYY-MM-DD')
}

// 默认日期范围设置
const defaultCurrentPeriod = [getDaysAgo(10), getDaysAgo(4)]
const defaultPreviousPeriod = [getDaysAgo(17), getDaysAgo(11)]

// 对比组设置
const compareGroups = reactive([
  {
    enabled: true,
    currentPeriod: defaultCurrentPeriod,
    previousPeriod: defaultPreviousPeriod,
    quickCompare: '' // 存储选择的快捷对比选项
  },
  {
    enabled: false,
    currentPeriod: defaultCurrentPeriod,
    previousPeriod: defaultPreviousPeriod,
    quickCompare: ''
  },
  {
    enabled: false,
    currentPeriod: defaultCurrentPeriod,
    previousPeriod: defaultPreviousPeriod,
    quickCompare: ''
  },
  {
    enabled: false,
    currentPeriod: defaultCurrentPeriod,
    previousPeriod: defaultPreviousPeriod,
    quickCompare: ''
  }
])

// 日期快捷选项 - 现在周期
const currentPeriodShortcuts = [
  {
    text: '今日',
    value: () => {
      const today = new Date()
      return [today, today]
    }
  },
  {
    text: '昨日',
    value: () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return [yesterday, yesterday]
    }
  },
  {
    text: '近7日',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 6)
      return [start, end]
    }
  },
  {
    text: '近30日',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 29)
      return [start, end]
    }
  },
  {
    text: '本月',
    value: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date()
      return [start, end]
    }
  },
  {
    text: '上月',
    value: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return [start, end]
    }
  }
]

// 日期快捷选项 - 从前周期
const previousPeriodShortcuts = [
  {
    text: '与上周对比',
    value: () => {
      // 这里会根据现在周期动态计算，具体实现在 setQuickCompare 函数中
      return []
    }
  },
  {
    text: '与上月对比',
    value: () => {
      // 这里会根据现在周期动态计算，具体实现在 setQuickCompare 函数中
      return []
    }
  },
  {
    text: '与去年同期对比',
    value: () => {
      // 这里会根据现在周期动态计算，具体实现在 setQuickCompare 函数中
      return []
    }
  }
]

// 维度选择
const selectedTimeDimensions = ref<string[]>(['dayType', 'timeSegment'])
const selectedUserDimensions = ref<string[]>(['userLevel', 'voltageLevel', 'industry', 'region', 'marketElectricity'])
const selectedWeatherDimensions = ref<string[]>(['temperature', 'precipitation', 'humidity', 'radiation', 'windSpeed'])
const selectedOtherDimensions = ref<string[]>(['specialEvents'])

// 核心对比
const selectedComparisonMetrics = ref<string[]>(['electricityAmount', 'changeRate'])

// 自定义用户组
const userGroups = ref<Array<{ id: number; name: string; users: number[] }>>([])
const userGroupDialogVisible = ref(false)
const userGroupForm = reactive({
  name: '',
  selectedUsers: [] as number[],
  includeAllAgents: false,
  selectedCompanies: [] as { id: number; name: string }[]
})
const userOptions = ref<Array<{ id: number; name: string }>>([])
const userSearchLoading = ref(false)

// 图表实例引用
const hourlyConsumptionChart = ref<echarts.ECharts | null>(null)
const dimensionDistributionChart = ref<echarts.ECharts | null>(null)
const weatherFactorChart = ref<echarts.ECharts | null>(null)

// 透视表引用
const pivotTableRef = ref(null)

// 活跃维度列表 (用于透视表)
const activeDimensions = ref([
  { field: 'dimension', label: '维度' }
])

// 数据表格数据
const detailsTableData = ref<Array<{
  dimension: string;
  currentPeriodValue: number;
  previousPeriodValue: number;
  absoluteChange: number;
  percentageChange: number;
  contribution: number;
}>>([])

const abnormalUsersData = ref<Array<{
  userId: string;
  userName: string;
  changeRate: number;
  abnormalReason: string;
}>>([])

// 当前选择的维度和气象因素
const currentDimension = ref('userLevel')
const currentWeatherFactor = ref('temperature')

// 格式化数字
function formatNumber(value: number): string {
  if (value === undefined || value === null) return '-'
  return value.toLocaleString('zh-CN')
}

// 格式化百分比
function formatPercent(value: number): string {
  if (value === undefined || value === null) return '-'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${(value * 100).toFixed(2)}%`
}

// 获取单元格类名
function getCellClassName({ row, column }: { row: any, column: any }): string {
  // 为变化率列设置样式
  if (column.property === 'change_vs_past1' || column.property === 'change_vs_past2') {
    const value = row[column.property]
    if (value > 0.1) return 'change-rate-high-positive'
    if (value > 0) return 'change-rate-positive'
    if (value < -0.1) return 'change-rate-high-negative'
    if (value < 0) return 'change-rate-negative'
  }
  return ''
}

// 透视表数据
const pivotTableData = ref<TableRowData[]>([
  {
    id: 1,
    dayType: [],
    timeSegment: [],
    userLevel: [],
    industry: [],
    region: [],
    userGroup: [],
    past2_consumption: 150.5,
    past1_consumption: 162.3,
    current_consumption: 175.8,
    change_vs_past2: 0.168,
    change_vs_past1: 0.083
  }
])

// 透视表筛选
function filterPivotTable(type: string) {
  console.log('筛选透视表:', type)
  
  // 根据需要实现不同的筛选逻辑
  // 这里仅作为示例
  if (type === 'positive') {
    pivotTableData.value = pivotTableData.value.filter(item => item.change_vs_past1 > 0)
  } else if (type === 'negative') {
    pivotTableData.value = pivotTableData.value.filter(item => item.change_vs_past1 < 0)
  } else if (type === 'significant') {
    pivotTableData.value = pivotTableData.value.filter(item => Math.abs(item.change_vs_past1) > 0.1)
  }
}

// 导出透视表
function exportPivotTable() {
  console.log('导出透视表')
  // 实现导出逻辑，可以使用xlsx库或其他方式
  // 这里是一个简单的CSV导出示例
  const header = Object.keys(pivotTableData.value[0] || {}).join(',')
  const rows = pivotTableData.value.map(row => Object.values(row).join(','))
  const csv = [header, ...rows].join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '电量对比分析.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 原始透视表数据，用于筛选
const rawPivotData = ref<PivotData[]>([])

// 获取活跃的对比组
const activeCompareGroups = computed(() => {
  return compareGroups
})

// 方法定义
function handleCurrentPeriodChange(index: number) {
  // 清除该组的快捷对比选择
  compareGroups[index].quickCompare = ''
}

function handlePreviousPeriodChange(index: number) {
  // 清除该组的快捷对比选择
  compareGroups[index].quickCompare = ''
}

function setQuickCompare(index: number, type: string) {
  const group = compareGroups[index]
  group.quickCompare = type
  
  // 当前周期的开始和结束日期
  const currentStart = dayjs(group.currentPeriod[0])
  const currentEnd = dayjs(group.currentPeriod[1])
  const dayDiff = currentEnd.diff(currentStart, 'day')
  
  let previousStart = currentStart
  let previousEnd = currentEnd
  
  switch(type) {
    case 'lastWeek':
      // 上周同一时间段
      previousStart = currentStart.subtract(7, 'day')
      previousEnd = currentEnd.subtract(7, 'day')
      break
    
    case 'lastMonth':
      // 上月同一时间段
      previousStart = currentStart.subtract(1, 'month')
      previousEnd = currentEnd.subtract(1, 'month')
      break
    
    case 'lastYear':
      // 去年同期
      previousStart = currentStart.subtract(1, 'year')
      previousEnd = currentEnd.subtract(1, 'year')
      break
  }
  
  group.previousPeriod = [
    previousStart.format('YYYY-MM-DD'),
    previousEnd.format('YYYY-MM-DD')
  ]
}

function applyFilters() {
  // 应用筛选条件
  console.log('应用筛选条件')
  
  // 重新加载数据
  loadData()
  
  // 更新可见对比组
  initVisibleCompareGroups()
  
  // 如果选择了特殊事件，更新分时曲线图
  if (selectedOtherDimensions.value.includes('specialEvents')) {
    nextTick(() => {
      updateHourlyConsumptionChart()
    })
  }
}

function resetFilters() {
  // 重置所有筛选条件到默认值
  compareGroups.forEach((group, index) => {
    group.enabled = index === 0 // 只启用第一个对比组
    group.currentPeriod = defaultCurrentPeriod
    group.previousPeriod = defaultPreviousPeriod
    group.quickCompare = ''
  })
  
  selectedTimeDimensions.value = ['dayType', 'timeSegment']
  selectedUserDimensions.value = ['userLevel', 'voltageLevel', 'industry', 'region', 'marketElectricity']
  selectedWeatherDimensions.value = ['temperature', 'precipitation', 'humidity', 'radiation', 'windSpeed']
  selectedOtherDimensions.value = ['specialEvents']
  selectedComparisonMetrics.value = ['electricityAmount', 'changeRate']
  
  // 重新加载数据
  loadData()
}

function showAddUserGroupDialog() {
  // 重置表单数据
  userGroupForm.selectedCompanies = [];
  companySearchKeyword.value = '';
  searchResults.value = [];
  
  // 显示对话框
  userGroupDialogVisible.value = true;
  
  // 关闭维度选择器
  currentDimensionSelector.value.visible = false;
}

function remoteSearchUsers(query: string) {
  // 模拟远程搜索用户的功能
  if (query) {
    userSearchLoading.value = true
    setTimeout(() => {
      userOptions.value = Array.from({ length: 5 }).map((_, index) => ({
        id: index + 1,
        name: `用户${query}-${index + 1}`
      }))
      userSearchLoading.value = false
    }, 500)
  } else {
    userOptions.value = []
  }
}

function saveUserGroup() {
  // 保存用户组
  const newGroup = {
    id: Date.now(),
    name: userGroupForm.name,
    users: userGroupForm.selectedUsers,
    includeAllAgents: userGroupForm.includeAllAgents
  }
  
  userGroups.value.push(newGroup)
  userGroupDialogVisible.value = false
  
  // 添加到维度选择中
  selectedUserDimensions.value.push(`userGroup-${newGroup.id}`)
}

// 维度视图切换
function changeDimensionView(dimension: string) {
  currentDimension.value = dimension
  updateDimensionDistributionChart()
}

// 气象因素切换
function changeWeatherFactor(factor: string) {
  currentWeatherFactor.value = factor
  updateWeatherFactorChart()
}

// 初始化图表方法
function initCharts() {
  // 初始化周期之间电量分时曲线对比图表
  const hourlyConsumptionChartDom = document.getElementById('hourlyConsumptionChart')
  if (hourlyConsumptionChartDom) {
    hourlyConsumptionChart.value = echarts.init(hourlyConsumptionChartDom)
    updateHourlyConsumptionChart()
  }
  
  // 初始化维度分布图表
  const dimensionChartDom = document.getElementById('dimensionDistributionChart')
  if (dimensionChartDom) {
    dimensionDistributionChart.value = echarts.init(dimensionChartDom)
    updateDimensionDistributionChart()
  }
  
  // 初始化气象因素影响图表
  const weatherChartDom = document.getElementById('weatherFactorChart')
  if (weatherChartDom) {
    weatherFactorChart.value = echarts.init(weatherChartDom)
    updateWeatherFactorChart()
  }
  
  // 监听窗口大小变化，调整图表大小
  window.addEventListener('resize', handleResize)
}

// 处理窗口大小变化
function handleResize() {
  hourlyConsumptionChart.value?.resize()
  dimensionDistributionChart.value?.resize()
  weatherFactorChart.value?.resize()
}

// 更新周期之间电量分时曲线对比图表
function updateHourlyConsumptionChart() {
  if (!hourlyConsumptionChart.value) return
  
  // 生成模拟数据
  generateHourlyConsumptionData();

  // 准备图表系列数据
  const series: any[] = [];
  const legendData: string[] = [];
  
  // 为每个活跃对比组添加数据系列
  compareGroups.forEach((group, index) => {
    // 只显示被启用且在visibleCompareGroups中的对比组
    if (!group.enabled || !visibleCompareGroups.value.includes(index)) return;
    
    // 添加现在周期数据系列（如果显示设置允许）
    if (periodVisibility.value === 'both' || periodVisibility.value === 'current') {
      const currentData = hourlyConsumptionData.value.find(d => d.groupIndex === index && d.periodType === 'current');
      if (currentData) {
        const seriesName = `对比组${index + 1}：现在周期`;
        legendData.push(seriesName);
        series.push({
          name: seriesName,
          type: 'line',
          smooth: true,
          data: currentData.data,
          lineStyle: {
            width: 3
          },
          // 如果选择了特殊事件，添加标记区域
          markArea: selectedOtherDimensions.value.includes('specialEvents') ? {
            itemStyle: {
              color: 'rgba(255, 173, 177, 0.4)'
            },
            data: getSpecialEventsMarkAreas(index, 'current')
          } : undefined
        });
      }
    }
    
    // 添加从前周期数据系列（如果显示设置允许）
    if (periodVisibility.value === 'both' || periodVisibility.value === 'previous') {
      const previousData = hourlyConsumptionData.value.find(d => d.groupIndex === index && d.periodType === 'previous');
      if (previousData) {
        const seriesName = `对比组${index + 1}：从前周期`;
        legendData.push(seriesName);
        series.push({
          name: seriesName,
          type: 'line',
          smooth: true,
          data: previousData.data,
          lineStyle: {
            width: 3,
            type: 'dashed'
          },
          // 如果选择了特殊事件，添加标记区域
          markArea: selectedOtherDimensions.value.includes('specialEvents') ? {
            itemStyle: {
              color: 'rgba(173, 216, 230, 0.4)'
            },
            data: getSpecialEventsMarkAreas(index, 'previous')
          } : undefined
        });
      }
    }
  });
  
  // 设置图表选项
  const option = {
    title: {
      text: '周期之间电量分时曲线对比',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params: any[]) {
        let result = `<div>${params[0].axisValue}时</div>`;
        params.forEach(param => {
          result += `<div style="display:flex;justify-content:space-between;">
            <span style="margin-right:10px;">${param.seriesName}:</span>
            <span style="font-weight:bold;">${param.value} kWh</span>
          </div>`;
        });
        
        // 添加特殊事件信息
        if (selectedOtherDimensions.value.includes('specialEvents')) {
          const hour = parseInt(params[0].axisValue);
          const eventsAtHour = specialEvents.value.filter(e => e.startHour <= hour && e.endHour >= hour);
          
          if (eventsAtHour.length > 0) {
            result += '<div style="margin-top:8px;border-top:1px solid #eee;padding-top:4px;">特殊事件:</div>';
            eventsAtHour.forEach(event => {
              result += `<div style="font-size:11px;">◆ ${event.name}: ${event.description}</div>`;
            });
          }
        }
        
        return result;
      }
    },
    legend: {
      type: 'scroll',
      data: legendData,
      bottom: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    toolbox: {
      feature: {
        dataZoom: {
          yAxisIndex: 'none',
          title: {
            zoom: '区域缩放',
            back: '还原'
          }
        },
        restore: {
          title: '还原'
        },
        saveAsImage: {
          title: '保存为图片'
        }
      }
    },
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
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: Array.from({ length: 24 }, (_, i) => i.toString()),
      axisLabel: {
        formatter: '{value}时'
      }
    },
    yAxis: {
      type: 'value',
      name: '电量 (kWh)',
      axisLine: {
        show: true
      },
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: series
  };
  
  hourlyConsumptionChart.value.setOption(option);
}

// 获取特殊事件标记区域
function getSpecialEventsMarkAreas(groupIndex: number, periodType: 'current' | 'previous'): any[] {
  if (!selectedOtherDimensions.value.includes('specialEvents')) return [];
  
  return specialEvents.value.map(event => {
    return [
      {
        name: event.name,
        xAxis: event.startHour.toString(),
        itemStyle: {
          color: periodType === 'current' ? 'rgba(255, 173, 177, 0.4)' : 'rgba(173, 216, 230, 0.4)'
        }
      },
      {
        xAxis: event.endHour.toString()
      }
    ];
  });
}

// 生成分时电量模拟数据
function generateHourlyConsumptionData() {
  const data: HourlyConsumptionData[] = [];
  
  // 为每个启用的对比组生成数据
  compareGroups.forEach((group, index) => {
    if (!group.enabled) return;
    
    // 生成现在周期的基础曲线 (基于一天中不同时段的典型用电曲线)
    const basePattern = [
      // 凌晨低谷 (0-7点)
      50, 45, 40, 38, 40, 48, 60, 90,
      // 白天 (8-17点)
      120, 145, 162, 175, 170, 165, 172, 180, 175, 150,
      // 晚高峰 (18-23点)
      155, 160, 145, 120, 90, 65
    ];
    
    // 添加随机波动
    const currentData = basePattern.map(v => Math.round(v * (1 + (Math.random() * 0.1 - 0.05))));
    
    // 基于当前数据生成从前周期的数据 (通常略低于当前)
    const previousData = currentData.map(v => Math.round(v * (0.9 + Math.random() * 0.15)));
    
    // 添加到数据集
    data.push({
      groupIndex: index,
      periodType: 'current',
      data: currentData
    });
    
    data.push({
      groupIndex: index,
      periodType: 'previous',
      data: previousData
    });
  });
  
  hourlyConsumptionData.value = data;
}

// 更新维度分布图表
function updateDimensionDistributionChart() {
  if (!dimensionDistributionChart.value) return
  
  let data: any[] = []
  let title = ''
  
  // 根据当前选择的维度提供不同数据
  switch(currentDimension.value) {
    case 'userLevel':
      title = '用户分级分布'
      data = [
        { value: 40, name: '大用户' },
        { value: 25, name: '中型用户' },
        { value: 15, name: '小型用户' },
        { value: 20, name: '微型用户' }
      ]
      break
    case 'industry':
      title = '行业分布'
      data = [
        { value: 30, name: '工业' },
        { value: 15, name: '商业' },
        { value: 25, name: '农业' },
        { value: 20, name: '服务业' },
        { value: 10, name: '其他' }
      ]
      break
    case 'region':
      title = '地区分布'
      data = [
        { value: 20, name: '城区' },
        { value: 25, name: '郊区' },
        { value: 30, name: '工业园区' },
        { value: 25, name: '农村地区' }
      ]
      break
  }
  
  const option = {
    title: {
      text: title,
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: data.map(item => item.name)
    },
    series: [
      {
        name: currentDimension.value === 'userLevel' ? '用户分级' : 
              currentDimension.value === 'industry' ? '行业' : '地区',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  }
  
  dimensionDistributionChart.value.setOption(option)
}

// 更新气象因素影响图表
function updateWeatherFactorChart() {
  if (!weatherFactorChart.value) return
  
  let title = ''
  let yAxisName = ''
  let data: [number, number][] = []
  
  // 根据当前选择的气象因素提供不同数据
  switch(currentWeatherFactor.value) {
    case 'temperature':
      title = '温度与用电量关系'
      yAxisName = '用电量 (kWh)'
      data = [
        [0, 300], [5, 280], [10, 250], [15, 220], 
        [20, 210], [25, 230], [30, 280], [35, 340]
      ]
      break
    case 'precipitation':
      title = '降水与用电量关系'
      yAxisName = '用电量 (kWh)'
      data = [
        [0, 200], [10, 210], [20, 240], [30, 260], 
        [40, 230], [50, 220], [60, 210], [70, 200]
      ]
      break
    case 'humidity':
      title = '湿度与用电量关系'
      yAxisName = '用电量 (kWh)'
      data = [
        [20, 190], [30, 200], [40, 230], [50, 250], 
        [60, 270], [70, 290], [80, 310], [90, 320]
      ]
      break
  }
  
  const option = {
    title: {
      text: title,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params: any) {
        const param = params[0]
        return `${currentWeatherFactor.value === 'temperature' ? '温度' : 
                 currentWeatherFactor.value === 'precipitation' ? '降水量' : '湿度'}: ${param.data[0]}<br/>
                用电量: ${param.data[1]} kWh`
      }
    },
    xAxis: {
      type: 'value',
      name: currentWeatherFactor.value === 'temperature' ? '温度 (°C)' : 
            currentWeatherFactor.value === 'precipitation' ? '降水量 (mm)' : '湿度 (%)',
      nameLocation: 'middle',
      nameGap: 30
    },
    yAxis: {
      type: 'value',
      name: yAxisName
    },
    series: [
      {
        type: 'scatter',
        symbolSize: 10,
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(120, 36, 50, 0.5)'
          }
        }
      },
      {
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: data,
        lineStyle: {
          width: 2,
          type: 'dashed'
        }
      }
    ]
  }
  
  weatherFactorChart.value.setOption(option)
}

// 初始化加载对比组
function initVisibleCompareGroups() {
  // 初始化为启用的对比组索引
  visibleCompareGroups.value = compareGroups
    .map((group, index) => ({ group, index }))
    .filter(item => item.group.enabled)
    .map(item => item.index);
}

// 加载数据函数
function loadData() {
  // 加载所有相关数据（此处是模拟示例）
  console.log('加载数据')
  
  // 根据选择的维度设置活跃维度列表
  updateActiveDimensions()
  
  // 加载透视表数据
  loadPivotTableData()
  
  // 模拟详细数据表格
  detailsTableData.value = [
    {
      dimension: '大用户',
      currentPeriodValue: 12500,
      previousPeriodValue: 11800,
      absoluteChange: 700,
      percentageChange: 5.9,
      contribution: 35
    },
    {
      dimension: '中型用户',
      currentPeriodValue: 8300,
      previousPeriodValue: 7900,
      absoluteChange: 400,
      percentageChange: 5.1,
      contribution: 20
    },
    {
      dimension: '小型用户',
      currentPeriodValue: 4200,
      previousPeriodValue: 4500,
      absoluteChange: -300,
      percentageChange: -6.7,
      contribution: -15
    },
    {
      dimension: '工业',
      currentPeriodValue: 15600,
      previousPeriodValue: 14800,
      absoluteChange: 800,
      percentageChange: 5.4,
      contribution: 40
    },
    {
      dimension: '商业',
      currentPeriodValue: 6800,
      previousPeriodValue: 7200,
      absoluteChange: -400,
      percentageChange: -5.6,
      contribution: -20
    }
  ]
  
  // 模拟异常用户数据
  abnormalUsersData.value = [
    {
      userId: 'U10025',
      userName: '某工业用户A',
      changeRate: -32.5,
      abnormalReason: '设备检修停产'
    },
    {
      userId: 'U10078',
      userName: '某商业用户B',
      changeRate: 45.8,
      abnormalReason: '新增大型设备投入使用'
    },
    {
      userId: 'U10112',
      userName: '某服务业用户C',
      changeRate: -28.3,
      abnormalReason: '部分业务外包'
    }
  ]
  
  // 初始化图表显示控制
  initVisibleCompareGroups();
  
  // 更新图表
  nextTick(() => {
    initCharts()
  })
}

// 根据选择的维度更新活跃维度列表
function updateActiveDimensions() {
  const dimensions = []
  
  // 添加时间维度
  if (selectedTimeDimensions.value.includes('dayType')) {
    dimensions.push({ field: 'dayType', label: '日类型' })
  }
  if (selectedTimeDimensions.value.includes('timeSegment')) {
    dimensions.push({ field: 'timeSegment', label: '时段' })
  }
  
  // 添加用户维度
  if (selectedUserDimensions.value.includes('userLevel')) {
    dimensions.push({ field: 'userLevel', label: '用户分级' })
  }
  if (selectedUserDimensions.value.includes('industry')) {
    dimensions.push({ field: 'industry', label: '行业' })
  }
  if (selectedUserDimensions.value.includes('region')) {
    dimensions.push({ field: 'region', label: '地区' })
  }
  if (selectedUserDimensions.value.includes('voltageLevel')) {
    dimensions.push({ field: 'voltageLevel', label: '电压等级' })
  }
  if (selectedUserDimensions.value.includes('marketElectricity')) {
    dimensions.push({ field: 'marketElectricity', label: '市场电量' })
  }
  
  // 添加自定义用户组维度
  userGroups.value.forEach(group => {
    if (selectedUserDimensions.value.includes(`userGroup-${group.id}`)) {
      dimensions.push({ field: `userGroup-${group.id}`, label: group.name })
    }
  })
  
  // 如果没有选择任何维度，使用默认维度
  if (dimensions.length === 0) {
    dimensions.push({ field: 'dimension', label: '维度' })
  }
  
  activeDimensions.value = dimensions
}

// 加载透视表数据
function loadPivotTableData() {
  // 初始化示例数据
  pivotTableData.value = [
    {
      id: 1,
      dayType: [],
      timeSegment: [],
      userLevel: [],
      industry: [],
      region: [],
      userGroup: [],
      past2_consumption: 150.5,
      past1_consumption: 162.3,
      current_consumption: 175.8,
      change_vs_past2: 0.168,
      change_vs_past1: 0.083
    }
  ]
}

function getMonthRange(date = new Date()): [Date, Date] {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  firstDay.setHours(0, 0, 0, 0);
  
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  lastDay.setHours(23, 59, 59, 999);
  
  return [firstDay, lastDay];
}

// 减少周数
function decreaseWeeksToCompare(index: number) {
  const period = pastPeriods.value[index];
  if (!period) return;
  
  // 最小为1周
  if (period.weeksToCompare > 1) {
    period.weeksToCompare--;
    
    // 更新日期范围
    handleWeeksToCompareChange(index);
  } else {
    ElMessage.info('最少需对比前1周');
  }
}

// 增加周数
function increaseWeeksToCompare(index: number) {
  const period = pastPeriods.value[index];
  if (!period) return;
  
  // 最大为52周（一年）
  if (period.weeksToCompare < 52) {
    period.weeksToCompare++;
    
    // 更新日期范围
    handleWeeksToCompareChange(index);
  } else {
    ElMessage.info('最多对比前52周');
  }
}

function handleWeeksToCompareChange(index: number) {
  const period = pastPeriods.value[index];
  if (!period) return;
  
  // 获取现在周期的开始日期
  const [currentStart] = currentPeriodRange.value;
  if (!currentStart) {
    ElMessage.warning('请先设置现在周期');
    return;
  }
  
  const weeksToComp = period.weeksToCompare;
  
  // 检查输入值是否有效
  if (weeksToComp < 1 || weeksToComp > 52) {
    ElMessage.warning('对比周数应在1至52周之间');
    period.weeksToCompare = Math.min(Math.max(1, weeksToComp), 52);
    return;
  }
  
  try {
    // 确保currentStart是Date对象
    const startDate = new Date(currentStart);
    
    // 根据"对比前N周"设置日期范围
    const pastStart = new Date(startDate);
    pastStart.setDate(pastStart.getDate() - (7 * weeksToComp));
    
    const pastEnd = new Date(pastStart);
    pastEnd.setDate(pastStart.getDate() + 6);
    pastEnd.setHours(23, 59, 59, 999);
    
    period.dateRange = [pastStart, pastEnd];
    
    // 提示用户
    ElMessage.success(`已设置为对比前${weeksToComp}周`);
  } catch (error) {
    console.error('设置对比周期出错', error);
    ElMessage.error('设置对比周期时出错，请检查日期格式');
  }
}

// 格式化日期用于显示
function formatDateDisplay(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '';
  
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    
    // 验证日期是否有效
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // 格式化为 YYYY/MM/DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}/${month}/${day}`;
  } catch (error) {
    console.error('日期格式化错误', error);
    return '';
  }
}

// 格式化维度显示
function formatDimensionDisplay(values: string[]): string {
  if (!values || values.length === 0) {
    return '[全部]'
  }
  
  const displayText = values.join(', ')
  return displayText.length > 15 ? displayText.substring(0, 12) + '...' : displayText
}

// 打开维度选择器
function openDimensionSelector(row: TableRowData, dimension: keyof DimensionOptions) {
  // 阻止事件冒泡，防止立即触发handleClickOutside
  event?.stopPropagation();
  
  // 获取点击元素的位置信息
  const target = event?.target as HTMLElement
  const rect = target.getBoundingClientRect()
  
  // 设置当前选中的行和维度类型
  currentDimensionSelector.value = {
    row,
    dimension,
    visible: true,
    position: {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    }
  }
  
  // 如果当前行该维度没有选择值或为空数组，则默认选择全部
  if (!row[dimension] || row[dimension].length === 0) {
    // 使用所有可用的选项
    selectedDimensionOptions.value = [...dimensionOptions[dimension]]
  } else {
    // 使用已选择的选项
    selectedDimensionOptions.value = [...row[dimension]]
  }
}

// 确认维度选择
function confirmDimensionSelection() {
  if (!currentDimensionSelector.value.row || !currentDimensionSelector.value.dimension) {
    return
  }
  
  const { row, dimension } = currentDimensionSelector.value
  
  // 更新行数据中的维度选择
  row[dimension] = [...selectedDimensionOptions.value]
  
  // 关闭选择器
  currentDimensionSelector.value.visible = false
}

// 取消维度选择
function cancelDimensionSelection() {
  currentDimensionSelector.value.visible = false
}

// 添加对比行
function addComparisonRow() {
  // 生成新的行ID
  const newId = Math.max(...pivotTableData.value.map(row => row.id), 0) + 1
  
  // 创建新行
  const newRow: TableRowData = {
    id: newId,
    dayType: [],
    timeSegment: [],
    userLevel: [],
    industry: [],
    region: [],
    userGroup: [],
    past2_consumption: 0,
    past1_consumption: 0,
    current_consumption: 0,
    change_vs_past2: 0,
    change_vs_past1: 0
  }
  
  // 添加到表格数据
  pivotTableData.value.push(newRow)
  
  ElMessage.success('已添加新的对比行')
}

// 获取维度标签
function getDimensionLabel(dimension: keyof DimensionOptions | null): string {
  if (!dimension) return ''
  
  const labels: Record<keyof DimensionOptions, string> = {
    dayType: '日类型',
    timeSegment: '时段',
    userLevel: '用户等级',
    industry: '行业',
    region: '地区',
    userGroup: '用户组'
  }
  
  return labels[dimension] || dimension
}

// 获取维度选项
function getDimensionOptions(dimension: keyof DimensionOptions | null): string[] {
  if (!dimension) return []
  return dimensionOptions[dimension] || []
}

// 删除对比行
function removeComparisonRow(index: number) {
  pivotTableData.value.splice(index, 1);
  ElMessage.success('已删除对比行');
}

// 全选选项
function selectAllOptions() {
  selectedDimensionOptions.value = getDimensionOptions(currentDimensionSelector.value.dimension)
}

// 清空选项
function clearAllOptions() {
  selectedDimensionOptions.value = []
}

// 搜索公司
function searchCompanies(query: string) {
  if (!companySearchKeyword.value.trim()) {
    searchResults.value = [];
    return;
  }
  
  // 这里模拟从服务器获取搜索结果
  // 在实际项目中，这里应该调用API进行查询
  const keyword = companySearchKeyword.value.trim();
  
  // 模拟延迟
  setTimeout(() => {
    // 生成模拟数据
    searchResults.value = Array.from({ length: 5 }).map((_, index) => ({
      id: Date.now() + index,
      name: `${keyword}公司${index + 1}`
    }));
  }, 300);
}

// 添加公司到已选列表
function addCompanyToSelectedList(company: { id: number; name: string }) {
  // 检查是否已经存在
  const exists = userGroupForm.selectedCompanies.some(item => item.id === company.id);
  if (!exists) {
    userGroupForm.selectedCompanies.push(company);
    
    // 清空搜索结果
    searchResults.value = [];
    companySearchKeyword.value = '';
  } else {
    ElMessage.warning('该公司已添加到列表中');
  }
}

// 从已选列表中删除公司
function removeCompanyFromSelectedList(index: number) {
  userGroupForm.selectedCompanies.splice(index, 1);
}

// 取消添加用户组
function cancelAddUserGroup() {
  userGroupDialogVisible.value = false;
}

// 确认添加用户组
function confirmAddUserGroup() {
  if (userGroupForm.selectedCompanies.length === 0) {
    ElMessage.warning('请至少选择一个公司');
    return;
  }
  
  // 这里模拟向服务器提交数据
  // 在实际项目中，这里应该调用API进行创建用户组

  // 创建一个新的用户组选项
  const groupName = `用户组${Date.now().toString().slice(-4)}`;
  
  // 添加到维度选项中
  dimensionOptions.userGroup.push(groupName);
  
  // 关闭对话框
  userGroupDialogVisible.value = false;
  
  // 提示用户
  ElMessage.success(`用户组"${groupName}"创建成功`);
}

// 用户组相关变量
const companySearchKeyword = ref('')
const searchResults = ref<Array<{ id: number, name: string }>>([])
</script>

<style scoped>
.consumption-variation-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

/* 深度选择器确保能覆盖Element Plus的默认样式 */
:deep(.el-input-number .el-input__inner) {
  color: #000000 !important;
}

:deep(.el-input__inner) {
  color: #000000 !important;
}

/* 表格中文本按钮样式 */
:deep(.el-button--text) {
  padding: 2px 0;
}

:deep(.el-button--text:hover) {
  background-color: transparent;
  text-decoration: underline;
}

.analysis-content {
  display: flex;
  flex: 1;
  overflow: auto;
  padding: 16px;
  gap: 16px;
  height: calc(100vh - 50px);
}

.main-analysis-area {
  flex: 3;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: auto;
}

.secondary-analysis-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 300px;
  overflow: auto;
}

.analysis-card {
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.chart-container {
  flex: 1;
  min-height: 300px;
}

.table-container {
  flex: 1;
  min-height: 200px;
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.chart-controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin: 0 16px 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.chart-control-group {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 4px 0;
}

.control-label {
  font-weight: 500;
  color: #606266;
  min-width: 90px;
}

.card-tools {
  display: flex;
  gap: 8px;
}

.period-selector-container {
  padding: 16px;
}

.period-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  position: relative;
}

.period-label {
  width: 60px;
  font-weight: bold;
  color: #303133;
  padding-top: 8px;
}

.period-date-picker {
  flex: 1;
  min-width: 300px;
  margin-right: 20px;
}

.period-quick-actions {
  display: flex;
  align-items: center;
  margin-top: 12px;
  gap: 16px;
  flex-wrap: wrap;
}

.weeks-average-input {
  display: flex;
  align-items: center;
  gap: 8px;
  /* background-color: #f5f7fa; */
  padding: 8px 12px;
  border-radius: 4px;
  /* border: 1px solid #e4e7ed; */
}

.weeks-average-input span {
  color: #606266;
  font-size: 14px;
}

.weeks-average-input span:last-child {
  margin-left: 4px;
}

.weeks-average-input .el-input-number {
  width: 70px;
}

.weeks-average-input .el-input-number .el-input__inner {
  color: #000000;
  font-weight: 500;
}

.add-period-row {
  margin-top: 16px;
  padding-left: 60px;
  margin-bottom: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.period-date-info {
  font-size: 0.85em;
  color: #909399;
  margin-top: 8px;
}

.change-rate-cell {
  position: relative;
}

.change-rate-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  border-radius: 2px;
  z-index: 1;
}

.change-rate-high-positive {
  color: #67C23A;
  font-weight: bold;
}

.change-rate-positive {
  color: #67C23A;
}

.change-rate-high-negative {
  color: #F56C6C;
  font-weight: bold;
}

.change-rate-negative {
  color: #F56C6C;
}

.add-comparison-row {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.dimension-selector-popover {
  position: absolute;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 16px;
  z-index: 10;
  min-width: 220px;
}

.dimension-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.dimension-selector-content {
  margin-bottom: 16px;
  max-height: 200px;
  overflow-y: auto;
}

.selector-quick-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  justify-content: space-between;
}

.dimension-selector-content .el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dimension-selector-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}

.dimension-selector-actions {
  display: flex;
  gap: 8px;
}

/* 新增用户组对话框样式 */
.user-group-form {
  max-height: 60vh;
  overflow-y: auto;
}

/* 搜索公司输入框样式优化 */
.company-search-input {
  width: 100%;
}

.user-group-form :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset !important;
  border-radius: 4px;
  padding: 0 10px;
  transition: box-shadow 0.2s;
}

.user-group-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset !important;
}

.user-group-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset !important;
}

.user-group-form :deep(.el-input__inner) {
  color: #303133;
  font-size: 14px;
  height: 36px;
  line-height: 36px;
}

.user-group-form :deep(.el-input__placeholder) {
  color: #a8abb2;
}

.search-results-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 8px;
}

.search-result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background-color: #f5f7fa;
}

.selected-companies-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 8px;
}

.selected-company-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.selected-company-item:last-child {
  border-bottom: none;
}

.empty-tip {
  color: #909399;
  padding: 20px;
  text-align: center;
  font-size: 14px;
}

@media (max-width: 768px) {
  .period-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .period-date-picker {
    width: 100%;
    margin-right: 0;
    margin-top: 8px;
  }
  
  .period-quick-actions {
    margin-left: 0;
    margin-top: 16px;
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
