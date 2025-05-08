<template>
  <div class="top-n-users-container">
    <div class="analysis-card">
      <div class="card-header">
        <h3>TOP N 用户排序</h3>
        <div class="card-tools">
          <el-dropdown @command="handleComparisonChange">
            <el-button size="small">
              选择对比: {{ currentComparison }}
              <el-icon><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="过去1">过去1</el-dropdown-item>
                <el-dropdown-item command="过去2">过去2</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      
      <!-- TOP N 用户表格 -->
      <div class="table-section">
        <h4 class="table-title">TOP N 用户</h4>
        <el-table
          :data="topPositiveUsers"
          style="width: 100%"
          :border="true"
          v-loading="loading"
          element-loading-text="加载中..."
        >
          <el-table-column
            label="序号"
            width="60"
            align="center"
          >
            <template #default="scope">
              {{ scope.$index + 1 }}
            </template>
          </el-table-column>
          <el-table-column
            prop="userName"
            label="用户名"
            min-width="110"
          />
          <el-table-column
            prop="changeValue"
            label="变化量"
            width="90"
            align="right"
          >
            <template #default="scope">
              <span class="positive-change">{{ formatNumber(scope.row.changeValue) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="changeRate"
            label="变化率"
            width="90"
            align="right"
          >
            <template #default="scope">
              <span class="positive-change">{{ formatPercent(scope.row.changeRate) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- TOP -N 用户表格 -->
      <div class="table-section">
        <h4 class="table-title">TOP -N 用户</h4>
        <el-table
          :data="topNegativeUsers"
          style="width: 100%"
          :border="true"
          v-loading="loading"
          element-loading-text="加载中..."
        >
          <el-table-column
            label="序号"
            width="60"
            align="center"
          >
            <template #default="scope">
              {{ -1 * (scope.$index + 1) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="userName"
            label="用户名"
            min-width="110"
          />
          <el-table-column
            prop="changeValue"
            label="变化量"
            width="90"
            align="right"
          >
            <template #default="scope">
              <span class="negative-change">{{ formatNumber(scope.row.changeValue) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="changeRate"
            label="变化率"
            width="90"
            align="right"
          >
            <template #default="scope">
              <span class="negative-change">{{ formatPercent(scope.row.changeRate) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'

// 定义组件属性
const props = defineProps({
  // 可配置的N值
  maxItems: {
    type: Number,
    default: 20
  },
  // 外部传入的用户数据
  externalUserData: {
    type: Array as () => UserData[],
    default: () => []
  },
  // 是否使用外部数据
  useExternalData: {
    type: Boolean,
    default: false
  }
})

// 定义事件
const emit = defineEmits(['comparison-change'])

// 定义用户数据类型
interface UserData {
  userId: string;
  userName: string;
  currentValue: number;
  past1Value: number;
  past2Value: number;
}

// 定义处理后的用户数据类型
interface ProcessedUserData {
  userId: string;
  userName: string;
  changeValue: number;
  changeRate: number;
}

// 模拟数据
const mockUsers: UserData[] = [
  { userId: 'user001', userName: '小米公司1', currentValue: 150, past1Value: 120, past2Value: 100 },
  { userId: 'user002', userName: '小憨公司2', currentValue: 80, past1Value: 110, past2Value: 120 },
  { userId: 'user003', userName: '大华公司3', currentValue: 200, past1Value: 150, past2Value: 130 },
  { userId: 'user004', userName: '腾讯科技4', currentValue: 300, past1Value: 250, past2Value: 220 },
  { userId: 'user005', userName: '阿里巴巴5', currentValue: 500, past1Value: 400, past2Value: 350 },
  { userId: 'user006', userName: '百度公司6', currentValue: 180, past1Value: 200, past2Value: 210 },
  { userId: 'user007', userName: '京东集团7', currentValue: 250, past1Value: 300, past2Value: 320 },
  { userId: 'user008', userName: '网易科技8', currentValue: 120, past1Value: 130, past2Value: 140 },
  { userId: 'user009', userName: '字节跳动9', currentValue: 350, past1Value: 300, past2Value: 280 },
  { userId: 'user010', userName: '华为技术10', currentValue: 400, past1Value: 380, past2Value: 350 },
  { userId: 'user011', userName: '小米公司11', currentValue: 160, past1Value: 130, past2Value: 110 },
  { userId: 'user012', userName: '小憨公司12', currentValue: 90, past1Value: 120, past2Value: 130 },
  { userId: 'user013', userName: '大华公司13', currentValue: 210, past1Value: 160, past2Value: 140 },
  { userId: 'user014', userName: '腾讯科技14', currentValue: 310, past1Value: 260, past2Value: 230 },
  { userId: 'user015', userName: '阿里巴巴15', currentValue: 510, past1Value: 410, past2Value: 360 },
  { userId: 'user016', userName: '百度公司16', currentValue: 170, past1Value: 190, past2Value: 200 },
  { userId: 'user017', userName: '京东集团17', currentValue: 240, past1Value: 290, past2Value: 310 },
  { userId: 'user018', userName: '网易科技18', currentValue: 110, past1Value: 120, past2Value: 130 },
  { userId: 'user019', userName: '字节跳动19', currentValue: 340, past1Value: 290, past2Value: 270 },
  { userId: 'user020', userName: '华为技术20', currentValue: 390, past1Value: 370, past2Value: 340 },
  { userId: 'user021', userName: '小米公司21', currentValue: 155, past1Value: 125, past2Value: 105 },
  { userId: 'user022', userName: '小憨公司22', currentValue: 85, past1Value: 115, past2Value: 125 },
  { userId: 'user023', userName: '大华公司23', currentValue: 205, past1Value: 155, past2Value: 135 },
  { userId: 'user024', userName: '腾讯科技24', currentValue: 305, past1Value: 255, past2Value: 225 },
  { userId: 'user025', userName: '阿里巴巴25', currentValue: 505, past1Value: 405, past2Value: 355 },
  { userId: 'user026', userName: '百度公司26', currentValue: 175, past1Value: 195, past2Value: 205 },
  { userId: 'user027', userName: '京东集团27', currentValue: 245, past1Value: 295, past2Value: 315 },
  { userId: 'user028', userName: '网易科技28', currentValue: 115, past1Value: 125, past2Value: 135 },
  { userId: 'user029', userName: '字节跳动29', currentValue: 345, past1Value: 295, past2Value: 275 },
  { userId: 'user030', userName: '华为技术30', currentValue: 395, past1Value: 375, past2Value: 345 },
];

// 配置参数
const topN = computed(() => props.maxItems); // 使用props中的maxItems
const currentComparison = ref('过去1'); // 默认选择过去1
const loading = ref(false); // 加载状态

// 原始用户数据
const userData = ref<UserData[]>([]);

// 监听外部数据变化
watch(() => props.externalUserData, (newVal) => {
  if (props.useExternalData && newVal.length > 0) {
    userData.value = [...newVal];
  }
}, { deep: true });

// 计算处理后的用户数据
const processedUsers = computed<ProcessedUserData[]>(() => {
  return userData.value.map(user => {
    const pastValue = currentComparison.value === '过去1' ? user.past1Value : user.past2Value;
    const changeValue = user.currentValue - pastValue;
    
    // 计算变化率，处理除零情况
    let changeRate = 0;
    if (pastValue !== 0) {
      changeRate = changeValue / pastValue;
    } else if (changeValue > 0) {
      changeRate = 1; // 如果过去值为0，当前值大于0，则变化率为100%
    }
    
    return {
      userId: user.userId,
      userName: user.userName,
      changeValue,
      changeRate
    };
  });
});

// 计算TOP N（正向变化最大的用户）
const topPositiveUsers = computed<ProcessedUserData[]>(() => {
  return [...processedUsers.value]
    .sort((a, b) => b.changeValue - a.changeValue) // 降序排列
    .slice(0, topN.value); // 取前N个
});

// 计算TOP -N（负向变化最大的用户）
const topNegativeUsers = computed<ProcessedUserData[]>(() => {
  return [...processedUsers.value]
    .sort((a, b) => a.changeValue - b.changeValue) // 升序排列
    .slice(0, topN.value); // 取前N个
});

// 格式化数字
function formatNumber(value: number): string {
  if (value === undefined || value === null) return '-';
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 格式化百分比
function formatPercent(value: number): string {
  if (value === undefined || value === null) return '-';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(2)}%`;
}

// 处理对比周期变化
function handleComparisonChange(command: string) {
  currentComparison.value = command;
  // 通知外部组件对比周期已更改
  emit('comparison-change', command);
  loadData();
}

// 加载数据
function loadData() {
  loading.value = true;
  
  // 模拟API调用延迟
  setTimeout(() => {
    // 如果使用外部数据且外部数据不为空，则使用外部数据
    if (props.useExternalData && props.externalUserData.length > 0) {
      userData.value = [...props.externalUserData];
    } else {
      // 否则使用模拟数据
      userData.value = [...mockUsers];
    }
    loading.value = false;
  }, 500);
}

// 组件挂载时加载数据
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.top-n-users-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.analysis-card {
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
  font-weight: 600;
}

.card-tools {
  display: flex;
  gap: 8px;
}

.table-section {
  margin-bottom: 20px;
}

.table-title {
  margin: 10px 0;
  font-size: 14px;
  font-weight: bold;
  color: #606266;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}

:deep(.el-table) {
  margin-bottom: 20px;
}

:deep(.el-table__header-wrapper) {
  background-color: #f5f7fa;
}

:deep(.el-table__header th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: bold;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

/* 为正向变化添加绿色样式 */
:deep(.el-table .positive-change) {
  color: #67C23A;
}

/* 为负向变化添加红色样式 */
:deep(.el-table .negative-change) {
  color: #F56C6C;
}
</style> 