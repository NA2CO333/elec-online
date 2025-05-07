<template>
  <div class="system-log-container">
    <el-card class="system-log-card">
      <template #header>
        <div class="card-header">
          <span>系统日志</span>
        </div>
      </template>

      <div class="filter-container">
        <div class="filter-row">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :shortcuts="dateShortcuts"
            @change="handleDateChange"
            style="width: 350px;"
          />
          <el-select v-model="logType" placeholder="日志类型" @change="handleLogTypeChange" style="width: 150px;">
            <el-option v-for="item in logTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-select v-model="operatorId" placeholder="操作人员" @change="handleOperatorChange" style="width: 150px;">
            <el-option v-for="item in operatorOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <div class="filter-buttons">
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button type="success" :icon="Download" @click="handleExport">导出</el-button>
          </div>
        </div>
      </div>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="查询记录" name="query">
          <el-table :data="queryLogs" style="width: 100%" v-loading="loading" border stripe>
            <el-table-column prop="logId" label="日志ID" width="100" />
            <el-table-column prop="timestamp" label="时间" width="160" sortable />
            <el-table-column prop="operator" label="操作人员" width="120" />
            <el-table-column prop="operation" label="操作内容" />
            <el-table-column prop="queryParams" label="查询参数" width="200">
              <template #default="scope">
                <el-popover placement="top" :width="300" trigger="hover">
                  <template #default>
                    <div v-for="(value, key) in scope.row.queryParamsObj" :key="key" class="param-item">
                      <span class="param-label">{{ key }}:</span>
                      <span class="param-value">{{ value }}</span>
                    </div>
                  </template>
                  <template #reference>
                    <el-tag size="small">查看参数</el-tag>
                  </template>
                </el-popover>
              </template>
            </el-table-column>
            <el-table-column prop="ipAddress" label="IP地址" width="140" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === '成功' ? 'success' : 'danger'">{{ scope.row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="查询结果" name="queryResult">
          <el-table :data="queryResultLogs" style="width: 100%" v-loading="loading" border stripe>
            <el-table-column prop="logId" label="日志ID" width="120" />
            <el-table-column prop="timestamp" label="时间" width="160" sortable />
            <el-table-column prop="queryId" label="查询ID" width="120" />
            <el-table-column prop="operator" label="查询人员" width="120" />
            <el-table-column prop="resultType" label="结果类型" width="120" />
            <el-table-column prop="resultCount" label="结果数量" width="100" />
            <el-table-column prop="executionTime" label="执行时间" width="120">
              <template #default="scope">
                {{ scope.row.executionTime }}ms
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === '成功' ? 'success' : 'danger'">{{ scope.row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="action" label="操作" width="180">
              <template #default="scope">
                <el-button size="small" type="primary" @click="viewQueryResult(scope.row)">查看详情</el-button>
                <el-button size="small" type="success" @click="exportQueryResult(scope.row)">导出</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="修改请求" name="modify">
          <el-table :data="modifyLogs" style="width: 100%" v-loading="loading" border stripe>
            <el-table-column prop="logId" label="日志ID" width="100" />
            <el-table-column prop="timestamp" label="时间" width="160" sortable />
            <el-table-column prop="operator" label="申请人员" width="120" />
            <el-table-column prop="operationType" label="操作类型" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.operationType === '新增' ? 'success' : 
                               scope.row.operationType === '修改' ? 'warning' : 'danger'">
                  {{ scope.row.operationType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="targetModule" label="目标模块" width="120" />
            <el-table-column prop="targetId" label="目标ID" width="120" />
            <el-table-column prop="modifyContent" label="修改内容" width="200">
              <template #default="scope">
                <el-popover placement="top" :width="300" trigger="hover">
                  <template #default>
                    <div class="modify-content">
                      <div class="content-header">修改前：</div>
                      <div v-for="(value, key) in scope.row.beforeObj" :key="`before-${key}`" class="param-item">
                        <span class="param-label">{{ key }}:</span>
                        <span class="param-value">{{ value }}</span>
                      </div>
                      <div class="content-header mt-10">修改后：</div>
                      <div v-for="(value, key) in scope.row.afterObj" :key="`after-${key}`" class="param-item">
                        <span class="param-label">{{ key }}:</span>
                        <span class="param-value">{{ value }}</span>
                      </div>
                    </div>
                  </template>
                  <template #reference>
                    <el-tag size="small">查看详情</el-tag>
                  </template>
                </el-popover>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="申请理由" />
            <el-table-column prop="approvalStatus" label="审批状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.approvalStatus === '已批准' ? 'success' : 
                               scope.row.approvalStatus === '待审批' ? 'info' : 'danger'">
                  {{ scope.row.approvalStatus }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="批复结果" name="approval">
          <el-table :data="approvalLogs" style="width: 100%" v-loading="loading" border stripe>
            <el-table-column prop="logId" label="日志ID" width="100" />
            <el-table-column prop="timestamp" label="时间" width="160" sortable />
            <el-table-column prop="requestId" label="申请ID" width="100" />
            <el-table-column prop="requester" label="申请人" width="120" />
            <el-table-column prop="approver" label="审批人" width="120" />
            <el-table-column prop="targetModule" label="目标模块" width="120" />
            <el-table-column prop="operationType" label="操作类型" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.operationType === '新增' ? 'success' : 
                               scope.row.operationType === '修改' ? 'warning' : 'danger'">
                  {{ scope.row.operationType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="decision" label="决定" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.decision === '批准' ? 'success' : 'danger'">
                  {{ scope.row.decision }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="comment" label="批复意见" />
            <el-table-column prop="action" label="操作" width="120">
              <template #default="scope">
                <el-button size="small" type="primary" @click="viewApprovalDetail(scope.row)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="导出记录" name="export">
          <el-table :data="exportLogs" style="width: 100%" v-loading="loading" border stripe>
            <el-table-column prop="logId" label="日志ID" width="100" />
            <el-table-column prop="timestamp" label="时间" width="160" sortable />
            <el-table-column prop="operator" label="操作人员" width="120" />
            <el-table-column prop="exportType" label="导出类型" width="120" />
            <el-table-column prop="dataRange" label="数据范围" width="180" />
            <el-table-column prop="recordCount" label="记录数量" width="100" />
            <el-table-column prop="fileSize" label="文件大小" width="100">
              <template #default="scope">
                {{ scope.row.fileSize }}KB
              </template>
            </el-table-column>
            <el-table-column prop="fileFormat" label="文件格式" width="100">
              <template #default="scope">
                <el-tag :type="getFileFormatType(scope.row.fileFormat)">
                  {{ scope.row.fileFormat }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="ipAddress" label="IP地址" width="140" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === '成功' ? 'success' : 'danger'">{{ scope.row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      
      <div class="pagination-container">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalRecords"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Search, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 日志类型选项
const logTypeOptions = [
  { value: 'all', label: '全部' },
  { value: 'query', label: '查询记录' },
  { value: 'queryResult', label: '查询结果' },
  { value: 'modify', label: '修改请求' },
  { value: 'approval', label: '批复结果' },
  { value: 'export', label: '导出记录' }
]

// 操作人员选项
const operatorOptions = [
  { value: 'all', label: '全部' },
  { value: 'admin', label: '系统管理员' },
  { value: 'operator1', label: '操作员1' },
  { value: 'operator2', label: '操作员2' },
  { value: 'supervisor', label: '主管' },
  { value: 'auditor', label: '审计员' }
]

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    }
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    }
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    }
  }
]

// 响应式变量
const dateRange = ref([])
const logType = ref('all')
const operatorId = ref('all')
const activeTab = ref('query')
const loading = ref(true)
const pageSize = ref(10)
const currentPage = ref(1)
const totalRecords = ref(0)

// 查询日志数据
const queryLogs = ref([])
const queryResultLogs = ref([])
const modifyLogs = ref([])
const approvalLogs = ref([])
const exportLogs = ref([])

// 初始化加载
onMounted(() => {
  fetchLogData()
})

// 获取日志数据
const fetchLogData = async () => {
  loading.value = true
  
  try {
    // 模拟数据加载延迟
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 根据当前选项加载不同的数据
    if (activeTab.value === 'query') {
      loadQueryLogs()
    } else if (activeTab.value === 'queryResult') {
      loadQueryResultLogs()
    } else if (activeTab.value === 'modify') {
      loadModifyLogs()
    } else if (activeTab.value === 'approval') {
      loadApprovalLogs()
    } else if (activeTab.value === 'export') {
      loadExportLogs()
    }
  } catch (error) {
    console.error('获取日志数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 生成随机日志ID
const generateLogId = () => {
  return 'LOG' + Math.floor(Math.random() * 900000 + 100000)
}

// 生成随机时间戳
const generateTimestamp = () => {
  const now = new Date()
  const randomDays = Math.floor(Math.random() * 30)
  const randomHours = Math.floor(Math.random() * 24)
  const randomMinutes = Math.floor(Math.random() * 60)
  const randomSeconds = Math.floor(Math.random() * 60)
  
  const date = new Date(now.getTime() - (randomDays * 24 * 60 * 60 * 1000) - (randomHours * 60 * 60 * 1000) - (randomMinutes * 60 * 1000) - (randomSeconds * 1000))
  
  return date.toISOString().replace('T', ' ').substring(0, 19)
}

// 加载查询日志
const loadQueryLogs = () => {
  const operations = [
    '查询用户信息',
    '查询合同详情',
    '查询账单记录',
    '查询交易历史',
    '查询系统配置',
    '查询操作权限',
    '查询客户档案'
  ]
  
  const ipAddresses = [
    '192.168.1.101',
    '192.168.1.102',
    '192.168.1.103',
    '192.168.1.104',
    '192.168.1.105',
    '10.0.0.1',
    '10.0.0.2'
  ]
  
  // 模拟查询参数
  const queryParamsObjects = [
    { userId: '10001', dateRange: '2023-01-01 至 2023-01-31', status: '活跃' },
    { contractId: 'C20230001', type: '购电合同', party: '某公司' },
    { billId: 'B2023001', month: '2023-01', status: '已支付' },
    { transactionId: 'T20230001', date: '2023-01-15', amount: '10000' },
    { module: 'security', configType: 'password', status: 'enabled' },
    { roleId: 'admin', permissionType: 'read', module: 'user' },
    { customerId: 'CUS20230001', name: '张三', phone: '13800138000' }
  ]
  
  queryLogs.value = Array.from({ length: 20 }, (_, i) => {
    const operatorIndex = Math.floor(Math.random() * operatorOptions.length - 1) + 1
    const operationIndex = Math.floor(Math.random() * operations.length)
    const ipIndex = Math.floor(Math.random() * ipAddresses.length)
    const paramsIndex = Math.floor(Math.random() * queryParamsObjects.length)
    
    return {
      logId: generateLogId(),
      timestamp: generateTimestamp(),
      operator: operatorOptions[operatorIndex].label,
      operation: operations[operationIndex],
      queryParams: '查看详情',
      queryParamsObj: queryParamsObjects[paramsIndex],
      ipAddress: ipAddresses[ipIndex],
      status: Math.random() > 0.1 ? '成功' : '失败'
    }
  })
  
  // 更新总记录数
  totalRecords.value = 156
}

// 处理日期变化
const handleDateChange = () => {
  handleSearch()
}

// 处理日志类型变化
const handleLogTypeChange = () => {
  handleSearch()
}

// 处理操作人员变化
const handleOperatorChange = () => {
  handleSearch()
}

// 处理标签页切换
const handleTabChange = () => {
  fetchLogData()
}

// 处理查询
const handleSearch = () => {
  currentPage.value = 1
  fetchLogData()
  ElMessage.success('查询条件已更新')
}

// 处理导出
const handleExport = () => {
  ElMessage.success('日志数据导出成功')
}

// 处理每页显示数量变化
const handleSizeChange = (size) => {
  pageSize.value = size
  fetchLogData()
}

// 处理页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchLogData()
}

// 加载查询结果日志
const loadQueryResultLogs = () => {
  const resultTypes = ['用户数据', '合同数据', '账单数据', '交易数据', '配置数据', '权限数据', '客户数据']
  
  queryResultLogs.value = Array.from({ length: 15 }, (_, i) => {
    const operatorIndex = Math.floor(Math.random() * operatorOptions.length - 1) + 1
    const resultTypeIndex = Math.floor(Math.random() * resultTypes.length)
    const resultCount = Math.floor(Math.random() * 200) + 1
    const executionTime = Math.floor(Math.random() * 900) + 100
    
    return {
      logId: generateLogId(),
      timestamp: generateTimestamp(),
      queryId: 'Q' + Math.floor(Math.random() * 900000 + 100000),
      operator: operatorOptions[operatorIndex].label,
      resultType: resultTypes[resultTypeIndex],
      resultCount: resultCount,
      executionTime: executionTime,
      status: Math.random() > 0.1 ? '成功' : '失败'
    }
  })
  
  // 更新总记录数
  totalRecords.value = 83
}

// 查看查询结果详情
const viewQueryResult = (row) => {
  ElMessage.info(`查看查询结果详情: ${row.logId}`)
}

// 导出查询结果
const exportQueryResult = (row) => {
  ElMessage.success(`导出查询结果: ${row.logId}`)
}

// 加载修改请求日志
const loadModifyLogs = () => {
  const operationTypes = ['新增', '修改', '删除']
  const targetModules = ['用户管理', '角色权限', '系统配置', '合同管理', '电价规则', '交易规则']
  const approvalStatuses = ['待审批', '已批准', '已拒绝']
  const reasons = [
    '系统更新需要',
    '应用新政策',
    '修复错误数据',
    '客户要求变更',
    '业务流程调整',
    '安全策略更新',
    '优化系统设置'
  ]
  
  // 模拟修改内容
  const modifyContents = [
    {
      beforeObj: { name: '用户A', email: 'usera@example.com', role: '普通用户', status: '活跃' },
      afterObj: { name: '用户A', email: 'usera@example.com', role: '管理员', status: '活跃' }
    },
    {
      beforeObj: { price: '0.55', unit: '元/kWh', period: '平段' },
      afterObj: { price: '0.65', unit: '元/kWh', period: '平段' }
    },
    {
      beforeObj: { serverIp: '192.168.1.100', port: '8080', timeout: '30' },
      afterObj: { serverIp: '192.168.1.100', port: '8443', timeout: '60' }
    },
    {
      beforeObj: { contractId: 'C20230001', status: '草稿', amount: '10000' },
      afterObj: { contractId: 'C20230001', status: '生效', amount: '12000' }
    },
    {
      beforeObj: { password: '******', expiresDays: '90', complexity: '中' },
      afterObj: { password: '******', expiresDays: '30', complexity: '高' }
    }
  ]
  
  modifyLogs.value = Array.from({ length: 12 }, (_, i) => {
    const operatorIndex = Math.floor(Math.random() * operatorOptions.length - 1) + 1
    const operationTypeIndex = Math.floor(Math.random() * operationTypes.length)
    const targetModuleIndex = Math.floor(Math.random() * targetModules.length)
    const reasonIndex = Math.floor(Math.random() * reasons.length)
    const modifyContentIndex = Math.floor(Math.random() * modifyContents.length)
    const approvalStatusIndex = Math.floor(Math.random() * approvalStatuses.length)
    
    return {
      logId: generateLogId(),
      timestamp: generateTimestamp(),
      operator: operatorOptions[operatorIndex].label,
      operationType: operationTypes[operationTypeIndex],
      targetModule: targetModules[targetModuleIndex],
      targetId: targetModuleIndex + '-' + Math.floor(Math.random() * 10000),
      modifyContent: '查看详情',
      beforeObj: modifyContents[modifyContentIndex].beforeObj,
      afterObj: modifyContents[modifyContentIndex].afterObj,
      reason: reasons[reasonIndex],
      approvalStatus: approvalStatuses[approvalStatusIndex]
    }
  })
  
  // 更新总记录数
  totalRecords.value = 67
}

// 加载批复结果日志
const loadApprovalLogs = () => {
  const operationTypes = ['新增', '修改', '删除']
  const targetModules = ['用户管理', '角色权限', '系统配置', '合同管理', '电价规则', '交易规则']
  const decisions = ['批准', '拒绝']
  const comments = [
    '符合系统规范，同意变更',
    '请求合理，予以批准',
    '经审核无问题，同意操作',
    '数据不完整，请补充后重新提交',
    '超出权限范围，不予批准',
    '与现有政策冲突，需要调整',
    '风险过高，建议采用其他方案'
  ]
  
  approvalLogs.value = Array.from({ length: 10 }, (_, i) => {
    const requesterIndex = Math.floor(Math.random() * (operatorOptions.length - 1)) + 1
    const approverIndex = Math.floor(Math.random() * (operatorOptions.length - 1)) + 1
    const operationTypeIndex = Math.floor(Math.random() * operationTypes.length)
    const targetModuleIndex = Math.floor(Math.random() * targetModules.length)
    const decisionIndex = Math.floor(Math.random() * decisions.length)
    const commentIndex = decisionIndex === 0 ? 
                        Math.floor(Math.random() * 3) : // 批准的评论
                        Math.floor(Math.random() * 4) + 3 // 拒绝的评论
    
    return {
      logId: generateLogId(),
      timestamp: generateTimestamp(),
      requestId: 'REQ' + Math.floor(Math.random() * 900000 + 100000),
      requester: operatorOptions[requesterIndex].label,
      approver: operatorOptions[approverIndex].label,
      targetModule: targetModules[targetModuleIndex],
      operationType: operationTypes[operationTypeIndex],
      decision: decisions[decisionIndex],
      comment: comments[commentIndex]
    }
  })
  
  // 更新总记录数
  totalRecords.value = 43
}

// 查看批复详情
const viewApprovalDetail = (row) => {
  ElMessage.info(`查看批复详情: ${row.logId}`)
}

// 加载导出记录日志
const loadExportLogs = () => {
  const exportTypes = ['用户数据', '合同数据', '账单数据', '交易数据', '系统日志', '操作记录']
  const fileFormats = ['CSV', 'XLSX', 'PDF', 'JSON']
  const ipAddresses = [
    '192.168.1.101',
    '192.168.1.102',
    '192.168.1.103',
    '192.168.1.104',
    '192.168.1.105',
    '10.0.0.1',
    '10.0.0.2'
  ]
  
  exportLogs.value = Array.from({ length: 8 }, (_, i) => {
    const operatorIndex = Math.floor(Math.random() * (operatorOptions.length - 1)) + 1
    const exportTypeIndex = Math.floor(Math.random() * exportTypes.length)
    const fileFormatIndex = Math.floor(Math.random() * fileFormats.length)
    const ipIndex = Math.floor(Math.random() * ipAddresses.length)
    const recordCount = Math.floor(Math.random() * 9000) + 100
    const fileSize = Math.floor(recordCount * (0.5 + Math.random() * 0.5))
    
    // 生成日期范围
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30))
    const dateRange = `${startDate.toISOString().slice(0, 10)} 至 ${endDate.toISOString().slice(0, 10)}`
    
    return {
      logId: generateLogId(),
      timestamp: generateTimestamp(),
      operator: operatorOptions[operatorIndex].label,
      exportType: exportTypes[exportTypeIndex],
      dataRange: dateRange,
      recordCount: recordCount,
      fileSize: fileSize,
      fileFormat: fileFormats[fileFormatIndex],
      ipAddress: ipAddresses[ipIndex],
      status: Math.random() > 0.1 ? '成功' : '失败'
    }
  })
  
  // 更新总记录数
  totalRecords.value = 32
}

// 获取文件格式对应的标签类型
const getFileFormatType = (format) => {
  switch (format) {
    case 'CSV':
      return 'info'
    case 'XLSX':
      return 'success'
    case 'PDF':
      return 'danger'
    case 'JSON':
      return 'warning'
    default:
      return 'info'
  }
}
</script>

<style scoped>
.system-log-container {
  width: 100%;
  height: 100%;
}

.system-log-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-container {
  margin-bottom: 15px;
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.filter-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 15px;
}

.filter-buttons {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

:deep(.el-card__body) {
  padding: 15px;
  height: calc(100% - 60px);
  overflow: auto;
}

:deep(.el-tabs__content) {
  height: calc(100% - 40px);
  overflow: auto;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.data-placeholder {
  padding: 20px;
}

.param-item {
  margin-bottom: 5px;
}

.param-label {
  font-weight: bold;
  margin-right: 5px;
}

.param-value {
  color: #606266;
}

.modify-content {
  font-size: 13px;
}

.content-header {
  font-weight: bold;
  margin-bottom: 5px;
  color: #409EFF;
}
</style> 