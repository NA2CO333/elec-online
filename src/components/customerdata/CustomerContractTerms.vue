<template>
  <div class="customer-contract-terms">
    <el-card class="terms-card">
      <template #header>
        <div class="card-header">
          <span>客户购电合同条款</span>
          <el-tooltip content="查看和管理客户购电合同的价格条款" placement="top">
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
                @keyup.enter="searchTerms"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="8" :lg="8">
            <el-form-item label="合同编号">
              <el-input 
                v-model="queryForm.contractNumber" 
                placeholder="请输入合同编号" 
                clearable 
                @keyup.enter="searchTerms"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="8" :lg="8">
            <el-form-item label="价格类型">
              <el-select v-model="queryForm.priceType" placeholder="请选择价格类型" clearable style="width: 100%">
                <el-option label="固定价" value="fixed" />
                <el-option label="联动价" value="linked" />
                <el-option label="混合价" value="mixed" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="24" :md="8" :lg="8">
            <el-form-item label="生效日期">
              <el-date-picker
                v-model="queryForm.effectiveDate"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="8" :lg="8">
            <el-form-item label="状态">
              <el-select v-model="queryForm.status" placeholder="请选择合同状态" clearable style="width: 100%">
                <el-option label="生效中" value="active" />
                <el-option label="已到期" value="expired" />
                <el-option label="未生效" value="pending" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="8" :lg="8" class="query-buttons">
            <el-button type="primary" @click="searchTerms">查询</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-col>
        </el-row>
      </el-form>

      <!-- 表格展示 -->
      <div class="table-container">
        <div class="table-operations">
          <el-button type="primary" size="small" @click="addNewTerm">
            <el-icon><Plus /></el-icon>新增条款
          </el-button>
          <el-button type="success" size="small" @click="exportData">
            <el-icon><Download /></el-icon>导出
          </el-button>
        </div>

        <el-table
          v-loading="tableLoading"
          :data="termsData"
          border
          stripe
          style="width: 100%"
        >
          <el-table-column prop="customerName" label="客户名称" min-width="120" show-overflow-tooltip />
          <el-table-column prop="contractNumber" label="合同编号" min-width="120" show-overflow-tooltip />
          <el-table-column prop="priceTypeName" label="价格类型" width="100" />
          <el-table-column label="固定价(元/度)" min-width="110">
            <template #default="scope">
              <span v-if="scope.row.fixedPrice !== null">{{ scope.row.fixedPrice.toFixed(4) }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="联动价(元/度)" min-width="110">
            <template #default="scope">
              <span v-if="scope.row.linkedPrice !== null">{{ scope.row.linkedPrice.toFixed(4) }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="联动比例(%)" min-width="110">
            <template #default="scope">
              <span v-if="scope.row.linkageRatio !== null">{{ scope.row.linkageRatio.toFixed(2) }}%</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="上浮费用(元/度)" min-width="120">
            <template #default="scope">
              <span v-if="scope.row.additionalFee !== null">{{ scope.row.additionalFee.toFixed(4) }}</span>
              <span v-else>-</span>
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
              <el-button type="success" size="small" text @click="editTerm(scope.row)">编辑</el-button>
              <el-button type="danger" size="small" text @click="deleteTerm(scope.row)">删除</el-button>
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

    <!-- 条款详情对话框 -->
    <el-dialog
      v-model="termDialog.visible"
      :title="termDialog.title"
      width="70%"
      destroy-on-close
    >
      <div v-loading="termDialog.loading">
        <el-form
          ref="termFormRef"
          :model="termForm"
          :rules="termRules"
          label-width="120px"
          status-icon
        >
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12">
              <el-form-item label="客户名称" prop="customerName">
                <el-select
                  v-model="termForm.customerName"
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
                <el-input v-model="termForm.contractNumber" placeholder="请输入合同编号" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :xs="24" :sm="12">
              <el-form-item label="价格类型" prop="priceType">
                <el-radio-group v-model="termForm.priceType">
                  <el-radio label="fixed">固定价</el-radio>
                  <el-radio label="linked">联动价</el-radio>
                  <el-radio label="mixed">混合价</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="有效期" prop="dateRange">
                <el-date-picker
                  v-model="termForm.dateRange"
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

          <!-- 固定价 -->
          <el-row v-if="termForm.priceType === 'fixed' || termForm.priceType === 'mixed'" :gutter="20">
            <el-col :xs="24" :sm="12">
              <el-form-item 
                label="固定价(元/度)" 
                :prop="termForm.priceType === 'fixed' ? 'fixedPrice' : ''"
              >
                <el-input-number 
                  v-model="termForm.fixedPrice" 
                  :precision="4" 
                  :step="0.0001" 
                  :min="0" 
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 联动价 -->
          <template v-if="termForm.priceType === 'linked' || termForm.priceType === 'mixed'">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12">
                <el-form-item 
                  label="联动价(元/度)" 
                  :prop="termForm.priceType === 'linked' ? 'linkedPrice' : ''"
                >
                  <el-input-number 
                    v-model="termForm.linkedPrice" 
                    :precision="4" 
                    :step="0.0001" 
                    :min="0" 
                    controls-position="right"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item 
                  label="联动比例(%)" 
                  :prop="termForm.priceType === 'linked' ? 'linkageRatio' : ''"
                >
                  <el-input-number 
                    v-model="termForm.linkageRatio" 
                    :precision="2" 
                    :step="0.01" 
                    :min="0" 
                    :max="100"
                    controls-position="right"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </template>

          <el-row :gutter="20">
            <el-col :xs="24" :sm="12">
              <el-form-item label="上浮费用(元/度)">
                <el-input-number 
                  v-model="termForm.additionalFee" 
                  :precision="4" 
                  :step="0.0001" 
                  :min="0" 
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="备注">
                <el-input 
                  v-model="termForm.remarks" 
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
          <el-button @click="termDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitTermForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialog.visible"
      title="确认删除"
      width="30%"
    >
      <div>确定要删除该条款吗？此操作不可恢复。</div>
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
  name: 'CustomerContractTerms',
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
        contractNumber: '',
        priceType: '',
        effectiveDate: null,
        status: ''
      },
      
      // 表格数据相关
      tableLoading: false,
      termsData: [],
      currentPage: 1,
      pageSize: 10,
      total: 0,
      
      // 条款表单对话框
      termDialog: {
        visible: false,
        title: '',
        type: 'add', // add or edit
        loading: false
      },
      
      // 条款表单
      termForm: {
        id: '',
        customerName: '',
        contractNumber: '',
        priceType: 'fixed',
        fixedPrice: 0,
        linkedPrice: 0,
        linkageRatio: 0,
        additionalFee: 0,
        dateRange: [],
        effectiveDate: '',
        expiryDate: '',
        status: 'pending',
        remarks: ''
      },
      
      // 表单校验规则
      termRules: {
        customerName: [
          { required: true, message: '请选择客户名称', trigger: 'change' }
        ],
        contractNumber: [
          { required: true, message: '请输入合同编号', trigger: 'blur' }
        ],
        priceType: [
          { required: true, message: '请选择价格类型', trigger: 'change' }
        ],
        dateRange: [
          { required: true, message: '请选择有效期', trigger: 'change' }
        ],
        fixedPrice: [
          { required: true, message: '请输入固定价', trigger: 'blur' }
        ],
        linkedPrice: [
          { required: true, message: '请输入联动价', trigger: 'blur' }
        ],
        linkageRatio: [
          { required: true, message: '请输入联动比例', trigger: 'blur' }
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
    this.searchTerms()
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
    
    // 查询条款数据
    async searchTerms() {
      this.tableLoading = true
      try {
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 模拟数据
        const mockData = this.generateMockData()
        this.termsData = mockData.slice(
          (this.currentPage - 1) * this.pageSize, 
          this.currentPage * this.pageSize
        )
        this.total = mockData.length
      } catch (error) {
        console.error('获取条款数据失败', error)
        ElMessage.error('获取条款数据失败')
      } finally {
        this.tableLoading = false
      }
    },
    
    // 重置查询条件
    resetQuery() {
      Object.keys(this.queryForm).forEach(key => {
        this.queryForm[key] = ''
      })
      this.queryForm.effectiveDate = null
      this.searchTerms()
    },
    
    // 处理分页变化
    handleSizeChange(size) {
      this.pageSize = size
      this.searchTerms()
    },
    
    handleCurrentChange(page) {
      this.currentPage = page
      this.searchTerms()
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
    
    // 添加新条款
    addNewTerm() {
      this.termDialog.title = '新增合同条款'
      this.termDialog.type = 'add'
      this.resetTermForm()
      this.termDialog.visible = true
    },
    
    // 查看详情
    viewDetails(row) {
      this.termDialog.title = '查看合同条款'
      this.termDialog.type = 'view'
      Object.keys(this.termForm).forEach(key => {
        if (key !== 'dateRange') {
          this.termForm[key] = row[key]
        }
      })
      this.termForm.dateRange = [row.effectiveDate, row.expiryDate]
      this.termDialog.visible = true
    },
    
    // 编辑条款
    editTerm(row) {
      this.termDialog.title = '编辑合同条款'
      this.termDialog.type = 'edit'
      Object.keys(this.termForm).forEach(key => {
        if (key !== 'dateRange') {
          this.termForm[key] = row[key]
        }
      })
      this.termForm.dateRange = [row.effectiveDate, row.expiryDate]
      this.termDialog.visible = true
    },
    
    // 删除条款
    deleteTerm(row) {
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
        this.searchTerms()
      } catch (error) {
        console.error('删除失败', error)
        ElMessage.error('删除失败')
      }
    },
    
    // 重置条款表单
    resetTermForm() {
      Object.keys(this.termForm).forEach(key => {
        if (key === 'priceType') {
          this.termForm[key] = 'fixed'
        } else if (key === 'fixedPrice' || key === 'linkedPrice' || key === 'linkageRatio' || key === 'additionalFee') {
          this.termForm[key] = 0
        } else if (key === 'status') {
          this.termForm[key] = 'pending'
        } else if (key === 'dateRange') {
          this.termForm[key] = []
        } else {
          this.termForm[key] = ''
        }
      })
    },
    
    // 提交条款表单
    submitTermForm() {
      this.$refs.termFormRef.validate(async (valid) => {
        if (valid) {
          this.termDialog.loading = true
          try {
            // 处理日期范围
            if (this.termForm.dateRange && this.termForm.dateRange.length === 2) {
              this.termForm.effectiveDate = this.termForm.dateRange[0]
              this.termForm.expiryDate = this.termForm.dateRange[1]
            }
            
            // 模拟API请求
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            ElMessage.success(this.termDialog.type === 'add' ? '添加成功' : '更新成功')
            this.termDialog.visible = false
            this.searchTerms()
          } catch (error) {
            console.error('操作失败', error)
            ElMessage.error('操作失败')
          } finally {
            this.termDialog.loading = false
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
      const priceTypeMap = {
        'fixed': '固定价',
        'linked': '联动价',
        'mixed': '混合价'
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
      
      for (let i = 0; i < 52; i++) {
        const priceType = ['fixed', 'linked', 'mixed'][Math.floor(Math.random() * 3)]
        const status = getRandomStatus()
        const effectiveDate = getRandomDate(new Date(2023, 0, 1), new Date(2023, 11, 31))
        const expiryDate = getRandomDate(new Date(2024, 0, 1), new Date(2025, 11, 31))
        
        let fixedPrice = null
        let linkedPrice = null
        let linkageRatio = null
        
        if (priceType === 'fixed' || priceType === 'mixed') {
          fixedPrice = Math.random() * 0.5 + 0.3 // 0.3 到 0.8 之间
        }
        
        if (priceType === 'linked' || priceType === 'mixed') {
          linkedPrice = Math.random() * 0.4 + 0.25 // 0.25 到 0.65 之间
          linkageRatio = Math.random() * 50 + 50 // 50% 到 100% 之间
        }
        
        data.push({
          id: `CT${String(i + 1).padStart(4, '0')}`,
          customerName: customers[Math.floor(Math.random() * customers.length)],
          contractNumber: `PPC-${2023 + Math.floor(Math.random() * 3)}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          priceType,
          priceTypeName: priceTypeMap[priceType],
          fixedPrice,
          linkedPrice,
          linkageRatio,
          additionalFee: Math.random() * 0.1, // 0 到 0.1 之间
          effectiveDate,
          expiryDate,
          status,
          statusName: statusMap[status],
          remarks: `这是${customers[Math.floor(Math.random() * customers.length)]}的购电合同条款`
        })
      }
      
      return data
    }
  }
}
</script>

<style scoped>
.customer-contract-terms {
  padding: 0 10px;
}

.terms-card {
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

@media (max-width: 768px) {
  .query-buttons {
    justify-content: center;
    margin-top: 10px;
  }
  
  .el-form-item {
    margin-bottom: 12px;
  }
}
</style> 