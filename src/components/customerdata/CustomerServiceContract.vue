<template>
  <div class="customer-service-contract">
    <el-card class="service-card">
      <template #header>
        <div class="card-header">
          <span>客户增值服务合同条款</span>
          <el-tooltip content="查看和管理客户增值服务合同的分成比例" placement="top">
            <el-icon><InfoFilled /></el-icon>
          </el-tooltip>
        </div>
      </template>
      
      <!-- 查询条件 -->
      <el-form :model="queryForm" label-width="100px" size="default" class="query-form">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="24" :md="8" :lg="8">
            <el-form-item label="客户名称">
              <el-input 
                v-model="queryForm.customerName" 
                placeholder="请输入客户名称" 
                clearable 
                @keyup.enter="searchContracts"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="8" :lg="8">
            <el-form-item label="服务类型">
              <el-select v-model="queryForm.serviceType" placeholder="请选择服务类型" clearable style="width: 100%">
                <el-option label="需求响应" value="demand_response" />
                <el-option label="能源管理" value="energy_management" />
                <el-option label="节能服务" value="energy_saving" />
                <el-option label="碳资产管理" value="carbon_asset" />
                <el-option label="其他服务" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="8" :lg="8">
            <el-form-item label="合同状态">
              <el-select v-model="queryForm.status" placeholder="请选择合同状态" clearable style="width: 100%">
                <el-option label="生效中" value="active" />
                <el-option label="已到期" value="expired" />
                <el-option label="未生效" value="pending" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="24" :md="8" :lg="8">
            <el-form-item label="有效期">
              <el-date-picker
                v-model="queryForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="8" :lg="8">
            <el-form-item label="分成比例">
              <el-select v-model="queryForm.profitRatio" placeholder="请选择分成比例" clearable style="width: 100%">
                <el-option label="30%以下" value="below30" />
                <el-option label="30%-50%" value="30to50" />
                <el-option label="50%-70%" value="50to70" />
                <el-option label="70%以上" value="above70" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="8" :lg="8" class="query-buttons">
            <el-button type="primary" @click="searchContracts">查询</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-col>
        </el-row>
      </el-form>
      
      <!-- 表格部分将在下一步添加 -->
      
      <!-- 表格展示 -->
      <div class="table-container">
        <div class="table-operations">
          <el-button type="primary" size="small" @click="addContract">
            <el-icon><Plus /></el-icon>新增合同
          </el-button>
          <el-button type="success" size="small" @click="exportData">
            <el-icon><Download /></el-icon>导出
          </el-button>
        </div>

        <el-table
          v-loading="tableLoading"
          :data="contractsData"
          border
          stripe
          style="width: 100%"
        >
          <el-table-column prop="customerName" label="客户名称" min-width="120" show-overflow-tooltip />
          <el-table-column prop="contractNumber" label="合同编号" min-width="120" show-overflow-tooltip />
          <el-table-column prop="serviceTypeName" label="服务类型" width="110" />
          <el-table-column label="分成比例" min-width="150">
            <template #default="scope">
              <div class="profit-ratio-container">
                <div class="profit-ratio-bar">
                  <div 
                    class="profit-ratio-fill" 
                    :style="{width: scope.row.profitRatio + '%', backgroundColor: getProfitColor(scope.row.profitRatio)}"
                  ></div>
                </div>
                <span class="profit-ratio-text">{{ scope.row.profitRatio }}%</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="客户基础费用(元/月)" min-width="150">
            <template #default="scope">
              {{ scope.row.baseAmount.toLocaleString('zh-CN') }}
            </template>
          </el-table-column>
          <el-table-column label="预计年收益(元)" min-width="150">
            <template #default="scope">
              {{ scope.row.yearlyProfit.toLocaleString('zh-CN') }}
            </template>
          </el-table-column>
          <el-table-column prop="effectiveDate" label="生效日期" min-width="110" />
          <el-table-column prop="expiryDate" label="到期日期" min-width="110" />
          <el-table-column prop="statusName" label="状态" width="90">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.statusName }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" text @click="viewDetails(scope.row)">查看</el-button>
              <el-button type="success" size="small" text @click="editContract(scope.row)">编辑</el-button>
              <el-button type="danger" size="small" text @click="deleteContract(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>

    <!-- 合同详情对话框 -->
    <el-dialog
      v-model="contractDialog.visible"
      :title="contractDialog.title"
      width="70%"
      destroy-on-close
    >
      <div v-loading="contractDialog.loading">
        <el-form
          ref="contractFormRef"
          :model="contractForm"
          :rules="contractRules"
          label-width="120px"
          status-icon
        >
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12">
              <el-form-item label="客户名称" prop="customerName">
                <el-select
                  v-model="contractForm.customerName"
                  filterable
                  remote
                  placeholder="请输入客户名称"
                  :remote-method="searchCustomers"
                  :loading="customersLoading"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in customerOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="合同编号" prop="contractNumber">
                <el-input v-model="contractForm.contractNumber" placeholder="请输入合同编号" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :xs="24" :sm="12">
              <el-form-item label="服务类型" prop="serviceType">
                <el-select v-model="contractForm.serviceType" placeholder="请选择服务类型" style="width: 100%">
                  <el-option label="需求响应" value="demand_response" />
                  <el-option label="能源管理" value="energy_management" />
                  <el-option label="节能服务" value="energy_saving" />
                  <el-option label="碳资产管理" value="carbon_asset" />
                  <el-option label="其他服务" value="other" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="有效期" prop="dateRange">
                <el-date-picker
                  v-model="contractForm.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :xs="24" :sm="12">
              <el-form-item label="分成比例" prop="profitRatio">
                <div class="profit-slider-container">
                  <el-slider 
                    v-model="contractForm.profitRatio" 
                    :min="0" 
                    :max="100" 
                    :step="1"
                    show-input
                    :format-tooltip="val => val + '%'"
                    :marks="{0: '0%', 30: '30%', 50: '50%', 70: '70%', 100: '100%'}"
                  />
                </div>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="结算方式" prop="settlementType">
                <el-radio-group v-model="contractForm.settlementType">
                  <el-radio label="monthly">月结</el-radio>
                  <el-radio label="quarterly">季结</el-radio>
                  <el-radio label="yearly">年结</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :xs="24" :sm="12">
              <el-form-item label="客户基础费用" prop="baseAmount">
                <el-input-number 
                  v-model="contractForm.baseAmount" 
                  :precision="2" 
                  :step="1000" 
                  :min="0" 
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="预计年收益" prop="yearlyProfit">
                <el-input-number 
                  v-model="contractForm.yearlyProfit" 
                  :precision="2" 
                  :step="10000" 
                  :min="0" 
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="服务内容详情" prop="serviceDetail">
                <el-input 
                  v-model="contractForm.serviceDetail" 
                  type="textarea" 
                  rows="3" 
                  placeholder="请输入服务内容详情"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="备注">
                <el-input 
                  v-model="contractForm.remarks" 
                  type="textarea" 
                  rows="3" 
                  placeholder="请输入备注信息"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="contractDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitContractForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialog.visible"
      title="确认删除"
      width="30%"
    >
      <div>确定要删除该合同吗？此操作不可恢复。</div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialog.visible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, InfoFilled } from '@element-plus/icons-vue'

export default {
  name: 'CustomerServiceContract',
  components: {
    Plus,
    Download,
    InfoFilled
  },
  data() {
    return {
      // 查询表单
      queryForm: {
        customerName: '',
        serviceType: '',
        status: '',
        dateRange: null,
        profitRatio: ''
      },
      
      // 表格数据相关
      tableLoading: false,
      contractsData: [],
      currentPage: 1,
      pageSize: 10,
      total: 0,
      
      // 合同表单对话框
      contractDialog: {
        visible: false,
        title: '',
        type: 'add', // add or edit
        loading: false
      },
      
      // 合同表单
      contractForm: {
        id: '',
        customerName: '',
        contractNumber: '',
        serviceType: 'energy_management',
        serviceTypeName: '',
        profitRatio: 50,
        settlementType: 'monthly',
        baseAmount: 5000,
        yearlyProfit: 100000,
        dateRange: [],
        effectiveDate: '',
        expiryDate: '',
        serviceDetail: '',
        status: 'pending',
        remarks: ''
      },
      
      // 表单校验规则
      contractRules: {
        customerName: [
          { required: true, message: '请选择客户名称', trigger: 'change' }
        ],
        contractNumber: [
          { required: true, message: '请输入合同编号', trigger: 'blur' }
        ],
        serviceType: [
          { required: true, message: '请选择服务类型', trigger: 'change' }
        ],
        profitRatio: [
          { required: true, message: '请设置分成比例', trigger: 'change' }
        ],
        settlementType: [
          { required: true, message: '请选择结算方式', trigger: 'change' }
        ],
        baseAmount: [
          { required: true, message: '请输入客户基础费用', trigger: 'blur' }
        ],
        yearlyProfit: [
          { required: true, message: '请输入预计年收益', trigger: 'blur' }
        ],
        dateRange: [
          { required: true, message: '请选择有效期', trigger: 'change' }
        ],
        serviceDetail: [
          { required: true, message: '请输入服务内容详情', trigger: 'blur' }
        ]
      },
      
      // 客户选择
      customerOptions: [],
      customersLoading: false,
      
      // 删除对话框
      deleteDialog: {
        visible: false,
        id: null
      }
    }
  },
  mounted() {
    this.searchContracts()
  },
  methods: {
    // 获取状态类型
    getStatusType(status) {
      switch (status) {
        case 'active':
          return 'success'
        case 'expired':
          return 'danger'
        case 'pending':
          return 'warning'
        default:
          return 'info'
      }
    },

    // 获取分成比例的颜色
    getProfitColor(ratio) {
      if (ratio >= 70) {
        return '#F56C6C' // 红色
      } else if (ratio >= 50) {
        return '#E6A23C' // 橙色
      } else if (ratio >= 30) {
        return '#67C23A' // 绿色
      } else {
        return '#909399' // 灰色
      }
    },
    
    // 查询合同数据
    async searchContracts() {
      this.tableLoading = true
      try {
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 模拟数据
        const mockData = this.generateMockData()
        this.contractsData = mockData.slice(
          (this.currentPage - 1) * this.pageSize, 
          this.currentPage * this.pageSize
        )
        this.total = mockData.length
      } catch (error) {
        console.error('获取合同数据失败', error)
        ElMessage.error('获取合同数据失败')
      } finally {
        this.tableLoading = false
      }
    },
    
    // 重置查询条件
    resetQuery() {
      Object.keys(this.queryForm).forEach(key => {
        this.queryForm[key] = ''
      })
      this.queryForm.dateRange = null
      this.searchContracts()
    },
    
    // 处理分页变化
    handleSizeChange(size) {
      this.pageSize = size
      this.searchContracts()
    },
    
    handleCurrentChange(page) {
      this.currentPage = page
      this.searchContracts()
    },
    
    // 搜索客户
    async searchCustomers(query) {
      if (query) {
        this.customersLoading = true
        try {
          // 模拟API请求
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // 模拟客户数据
          this.customerOptions = [
            { value: '立信电力有限公司', label: '立信电力有限公司' },
            { value: '恒大能源集团', label: '恒大能源集团' },
            { value: '明辉电气股份公司', label: '明辉电气股份公司' },
            { value: '新晋光电科技', label: '新晋光电科技' },
            { value: '德信工业用电管理', label: '德信工业用电管理' }
          ].filter(item => item.label.includes(query))
        } finally {
          this.customersLoading = false
        }
      } else {
        this.customerOptions = []
      }
    },
    
    // 添加新合同
    addContract() {
      this.contractDialog.title = '新增服务合同'
      this.contractDialog.type = 'add'
      this.resetContractForm()
      this.contractDialog.visible = true
    },
    
    // 查看详情
    viewDetails(row) {
      this.contractDialog.title = '查看服务合同'
      this.contractDialog.type = 'view'
      Object.keys(this.contractForm).forEach(key => {
        if (key !== 'dateRange') {
          this.contractForm[key] = row[key]
        }
      })
      this.contractForm.dateRange = [row.effectiveDate, row.expiryDate]
      this.contractDialog.visible = true
    },
    
    // 编辑合同
    editContract(row) {
      this.contractDialog.title = '编辑服务合同'
      this.contractDialog.type = 'edit'
      Object.keys(this.contractForm).forEach(key => {
        if (key !== 'dateRange') {
          this.contractForm[key] = row[key]
        }
      })
      this.contractForm.dateRange = [row.effectiveDate, row.expiryDate]
      this.contractDialog.visible = true
    },
    
    // 删除合同
    deleteContract(row) {
      this.deleteDialog.id = row.id
      this.deleteDialog.visible = true
    },
    
    // 确认删除
    async confirmDelete() {
      try {
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 800))
        
        ElMessage.success('删除成功')
        this.deleteDialog.visible = false
        this.searchContracts()
      } catch (error) {
        console.error('删除失败', error)
        ElMessage.error('删除失败')
      }
    },
    
    // 重置合同表单
    resetContractForm() {
      this.contractForm = {
        id: '',
        customerName: '',
        contractNumber: '',
        serviceType: 'energy_management',
        serviceTypeName: '',
        profitRatio: 50,
        settlementType: 'monthly',
        baseAmount: 5000,
        yearlyProfit: 100000,
        dateRange: [],
        effectiveDate: '',
        expiryDate: '',
        serviceDetail: '',
        status: 'pending',
        remarks: ''
      }
    },
    
    // 提交合同表单
    submitContractForm() {
      this.$refs.contractFormRef.validate(async (valid) => {
        if (valid) {
          this.contractDialog.loading = true
          try {
            // 处理日期范围
            if (this.contractForm.dateRange && this.contractForm.dateRange.length === 2) {
              this.contractForm.effectiveDate = this.contractForm.dateRange[0]
              this.contractForm.expiryDate = this.contractForm.dateRange[1]
            }
            
            // 模拟API请求
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            ElMessage.success(this.contractDialog.type === 'add' ? '添加成功' : '更新成功')
            this.contractDialog.visible = false
            this.searchContracts()
          } catch (error) {
            console.error('操作失败', error)
            ElMessage.error('操作失败')
          } finally {
            this.contractDialog.loading = false
          }
        } else {
          return false
        }
      })
    },
    
    // 导出数据
    exportData() {
      ElMessageBox.alert('导出功能开发中', '提示', {
        confirmButtonText: '确定'
      })
    },
    
    // 生成模拟数据
    generateMockData() {
      const serviceTypeMap = {
        'demand_response': '需求响应',
        'energy_management': '能源管理',
        'energy_saving': '节能服务',
        'carbon_asset': '碳资产管理',
        'other': '其他服务'
      }
      
      const settlementTypeMap = {
        'monthly': '月结',
        'quarterly': '季结',
        'yearly': '年结'
      }
      
      const statusMap = {
        'active': '生效中',
        'expired': '已到期',
        'pending': '未生效'
      }
      
      const customers = [
        '立信电力有限公司',
        '恒大能源集团',
        '明辉电气股份公司',
        '新晋光电科技',
        '德信工业用电管理',
        '天润半导体',
        '星光商业广场',
        '海晨化工集团',
        '兴泰冶金厂',
        '富峰电子科技'
      ]
      
      const getRandomDate = (start, end) => {
        const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
        return date.toISOString().split('T')[0]
      }
      
      const getRandomStatus = () => {
        const statuses = ['active', 'expired', 'pending']
        return statuses[Math.floor(Math.random() * statuses.length)]
      }
      
      const data = []
      
      for (let i = 0; i < 42; i++) {
        const serviceType = ['demand_response', 'energy_management', 'energy_saving', 'carbon_asset', 'other'][Math.floor(Math.random() * 5)]
        const settlementType = ['monthly', 'quarterly', 'yearly'][Math.floor(Math.random() * 3)]
        const status = getRandomStatus()
        const effectiveDate = getRandomDate(new Date(2023, 0, 1), new Date(2023, 11, 31))
        const expiryDate = getRandomDate(new Date(2024, 0, 1), new Date(2025, 11, 31))
        
        // 生成基础费用和分成比例
        const baseAmount = Math.round((Math.random() * 10000 + 2000) * 100) / 100 // 2000 到 12000 之间
        const profitRatio = Math.round(Math.random() * 80 + 10) // 10% 到 90% 之间
        
        // 计算年收益
        let yearlyProfit = 0
        if (serviceType === 'demand_response') {
          yearlyProfit = baseAmount * 12 * (1 + Math.random() * 0.5) // 基础费用的1-1.5倍
        } else if (serviceType === 'energy_management') {
          yearlyProfit = baseAmount * 12 * (1 + Math.random() * 1) // 基础费用的1-2倍
        } else if (serviceType === 'energy_saving') {
          yearlyProfit = baseAmount * 12 * (1.5 + Math.random() * 1.5) // 基础费用的1.5-3倍
        } else if (serviceType === 'carbon_asset') {
          yearlyProfit = baseAmount * 12 * (2 + Math.random() * 2) // 基础费用的2-4倍
        } else {
          yearlyProfit = baseAmount * 12 * (1 + Math.random() * 1) // 基础费用的1-2倍
        }
        
        yearlyProfit = Math.round(yearlyProfit * 100) / 100
        
        data.push({
          id: `SC${String(i + 1).padStart(4, '0')}`,
          customerName: customers[Math.floor(Math.random() * customers.length)],
          contractNumber: `VSC-${2023 + Math.floor(Math.random() * 3)}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          serviceType,
          serviceTypeName: serviceTypeMap[serviceType],
          profitRatio,
          settlementType,
          settlementTypeName: settlementTypeMap[settlementType],
          baseAmount,
          yearlyProfit,
          effectiveDate,
          expiryDate,
          serviceDetail: `提供${serviceTypeMap[serviceType]}相关的专业咨询和技术支持，为客户创造更高的能源效益。`,
          status,
          statusName: statusMap[status],
          remarks: `这是一份${serviceTypeMap[serviceType]}服务合同，分成比例为${profitRatio}%。`
        })
      }
      
      return data
    }
  }
}
</script>

<style scoped>
.customer-service-contract {
  padding: 0 10px;
}

.service-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.query-form {
  margin-bottom: 20px;
}

.query-buttons {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  gap: 10px;
}

.table-container {
  width: 100%;
}

.table-operations {
  margin-bottom: 15px;
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 分成比例相关样式 */
.profit-ratio-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.profit-ratio-bar {
  width: 100px;
  height: 12px;
  background-color: #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
}

.profit-ratio-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s ease-in-out;
}

.profit-ratio-text {
  font-weight: bold;
  min-width: 40px;
}

.profit-slider-container {
  width: 100%;
  padding: 10px 0;
}

@media (max-width: 768px) {
  .query-buttons {
    justify-content: center;
    margin-top: 10px;
  }
  
  .el-form-item {
    margin-bottom: 12px;
  }
  
  .profit-ratio-bar {
    width: 80px;
  }
}
</style> 