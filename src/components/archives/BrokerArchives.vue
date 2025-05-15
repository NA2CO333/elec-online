<template>
  <div class="broker-archives-container">
    <!-- 操作栏 -->
    <el-card class="operations-card">
      <div class="operations-bar">
        <div class="left-operations">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索经纪人姓名、编号或所属机构"
            class="search-input"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select
            v-model="levelFilter"
            clearable
            placeholder="经纪级别"
            class="filter-select"
          >
            <el-option label="高级经纪人" value="高级经纪人" />
            <el-option label="中级经纪人" value="中级经纪人" />
            <el-option label="初级经纪人" value="初级经纪人" />
            <el-option label="见习经纪人" value="见习经纪人" />
          </el-select>

          <el-select
            v-model="areaFilter"
            clearable
            placeholder="业务区域"
            class="filter-select"
          >
            <el-option label="华东" value="华东" />
            <el-option label="华南" value="华南" />
            <el-option label="华北" value="华北" />
            <el-option label="西南" value="西南" />
            <el-option label="华中" value="华中" />
          </el-select>

          <el-button type="primary" @click="handleSearch" class="search-btn">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetFilters" class="reset-btn">
            <el-icon><RefreshRight /></el-icon>重置
          </el-button>
        </div>
        
        <div class="right-operations">
          <el-button :disabled="selectedBrokers.length === 0" type="danger" @click="handleBatchDelete" class="delete-btn">
            <el-icon><Delete /></el-icon>批量删除
          </el-button>
          <el-button type="primary" @click="handleAdd" class="add-btn">
            <el-icon><Plus /></el-icon>添加经纪人
          </el-button>
          <el-button type="success" @click="handleBatchImport" class="batch-import-btn">
            <el-icon><Upload /></el-icon>批量导入
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="data-card">
      <el-table
        :data="currentPageData"
        border
        stripe
        style="width: 100%"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        @row-click="viewBrokerDetail"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="编号" width="110" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="organization" label="所属机构" min-width="180" show-overflow-tooltip />
        <el-table-column prop="level" label="经纪级别" width="120">
          <template #default="scope">
            <el-tag :type="getBrokerLevelTag(scope.row.level)">{{ scope.row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="businessArea" label="业务区域" width="100" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="email" label="电子邮箱" width="180" show-overflow-tooltip />
        <el-table-column prop="certificationTime" label="认证日期" width="120" />
        <el-table-column prop="transactionCount" label="交易量" width="100" sortable />
        <el-table-column prop="performance" label="业绩评级" width="100">
          <template #default="scope">
            <el-rate
              v-model="scope.row.performance"
              disabled
              text-color="#ff9900"
              score-template="{value}"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">
              <el-icon><View /></el-icon>查看
            </el-button>
            <el-button size="small" type="primary" @click="handleEdit(scope.row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 经纪人详细档案展示区域 -->
      <div v-if="selectedBrokers.length === 1" class="broker-detail-section">
        <el-divider content-position="center">经纪人详细档案</el-divider>
        
        <div class="broker-profile">
          <div class="broker-header">
            <div class="broker-avatar">
              <el-avatar :size="80" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
            </div>
            <div class="broker-basic-info">
              <h2>{{ selectedBrokers[0].name }} <el-tag :type="getBrokerLevelTag(selectedBrokers[0].level)">{{ selectedBrokers[0].level }}</el-tag></h2>
              <p><el-icon><OfficeBuilding /></el-icon> {{ selectedBrokers[0].organization }}</p>
              <p><el-icon><Location /></el-icon> {{ selectedBrokers[0].businessArea }}</p>
              <div class="contact-info">
                <p><el-icon><Phone /></el-icon> {{ selectedBrokers[0].phone }}</p>
                <p><el-icon><Message /></el-icon> {{ selectedBrokers[0].email }}</p>
              </div>
            </div>
            <div class="broker-performance">
              <div class="performance-item">
                <div class="performance-label">交易量</div>
                <div class="performance-value">{{ selectedBrokers[0].transactionCount }}</div>
              </div>
              <div class="performance-item">
                <div class="performance-label">业绩评级</div>
                <div class="performance-value">
                  <el-rate v-model="selectedBrokers[0].performance" disabled show-score text-color="#ff9900" />
                </div>
              </div>
            </div>
          </div>

          <el-divider />

          <div class="broker-details">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="经纪人编号">{{ selectedBrokers[0].id }}</el-descriptions-item>
              <el-descriptions-item label="认证日期">{{ selectedBrokers[0].certificationTime }}</el-descriptions-item>
              <el-descriptions-item label="专业领域" :span="2">
                <el-tag v-for="(area, index) in selectedBrokers[0].specialization" :key="index" class="specialization-tag">
                  {{ area }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="个人简介" :span="2">
                {{ selectedBrokers[0].introduction }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <el-divider />

          <div class="broker-statistics">
            <h3>交易统计</h3>
            <div class="statistics-charts">
              <div class="chart-container">
                <h4>近6个月交易量</h4>
                <div class="chart-placeholder">
                  <div class="bar-chart">
                    <div class="bar" style="height: 60%;">
                      <span class="bar-label">1月</span>
                    </div>
                    <div class="bar" style="height: 80%;">
                      <span class="bar-label">2月</span>
                    </div>
                    <div class="bar" style="height: 50%;">
                      <span class="bar-label">3月</span>
                    </div>
                    <div class="bar" style="height: 70%;">
                      <span class="bar-label">4月</span>
                    </div>
                    <div class="bar" style="height: 90%;">
                      <span class="bar-label">5月</span>
                    </div>
                    <div class="bar" style="height: 75%;">
                      <span class="bar-label">6月</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="chart-container">
                <h4>交易类型占比</h4>
                <div class="chart-placeholder">
                  <div class="pie-chart">
                    <div class="pie-segment" style="--percentage: 45%; --color: #409EFF;">
                      <span class="pie-label">长协</span>
                    </div>
                    <div class="pie-segment" style="--percentage: 25%; --color: #67C23A;">
                      <span class="pie-label">现货</span>
                    </div>
                    <div class="pie-segment" style="--percentage: 15%; --color: #E6A23C;">
                      <span class="pie-label">绿电</span>
                    </div>
                    <div class="pie-segment" style="--percentage: 15%; --color: #F56C6C;">
                      <span class="pie-label">其他</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <el-divider />

          <div class="broker-clients">
            <h3>主要客户</h3>
            <el-table :data="brokerClients" style="width: 100%" size="small">
              <el-table-column prop="name" label="客户名称" />
              <el-table-column prop="type" label="客户类型" />
              <el-table-column prop="cooperationTime" label="合作时间" />
              <el-table-column prop="tradingVolume" label="交易电量 (万kWh)" />
            </el-table>
          </div>

          <el-divider />

          <div class="broker-timeline">
            <h3>资质认证历程</h3>
            <el-timeline>
              <el-timeline-item
                v-for="(activity, index) in certificationTimeline"
                :key="index"
                :timestamp="activity.timestamp"
                :type="activity.type"
                :color="activity.color"
                :hollow="activity.hollow"
                :size="activity.size"
              >
                {{ activity.content }}
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
      </div>
      
      <!-- 未选中经纪人时的提示信息 -->
      <div v-else-if="filteredBrokerData.length > 0" class="empty-selection-tip">
        <el-empty description="请选择一名经纪人以查看详细档案">
          <el-button type="primary" @click="selectedBrokers = filteredBrokerData.length > 0 ? [filteredBrokerData[0]] : []">
            查看第一位经纪人
          </el-button>
        </el-empty>
      </div>

      <!-- 分页控件 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredBrokerData.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :pager-count="5"
          background
          class="enhanced-pagination"
        />
      </div>
    </el-card>

    <!-- 经纪人表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加经纪人' : (dialogType === 'edit' ? '编辑经纪人' : '经纪人详情')"
      width="600px"
    >
      <el-form 
        :model="brokerForm" 
        :rules="rules" 
        ref="brokerFormRef" 
        label-width="100px"
        :disabled="dialogType === 'view'"
      >
        <el-form-item label="编号" prop="id">
          <el-input v-model="brokerForm.id" placeholder="请输入经纪人编号" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="brokerForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="所属机构" prop="organization">
          <el-input v-model="brokerForm.organization" placeholder="请输入所属机构" />
        </el-form-item>
        <el-form-item label="经纪级别" prop="level">
          <el-select v-model="brokerForm.level" placeholder="请选择经纪级别" style="width: 100%">
            <el-option label="高级经纪人" value="高级经纪人" />
            <el-option label="中级经纪人" value="中级经纪人" />
            <el-option label="初级经纪人" value="初级经纪人" />
            <el-option label="见习经纪人" value="见习经纪人" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务区域" prop="businessArea">
          <el-select v-model="brokerForm.businessArea" placeholder="请选择业务区域" style="width: 100%">
            <el-option label="华东" value="华东" />
            <el-option label="华南" value="华南" />
            <el-option label="华北" value="华北" />
            <el-option label="西南" value="西南" />
            <el-option label="华中" value="华中" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="brokerForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="电子邮箱" prop="email">
          <el-input v-model="brokerForm.email" placeholder="请输入电子邮箱" />
        </el-form-item>
        <el-form-item label="认证日期" prop="certificationTime">
          <el-date-picker
            v-model="brokerForm.certificationTime"
            type="date"
            placeholder="选择认证日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="交易量" prop="transactionCount">
          <el-input-number v-model="brokerForm.transactionCount" :min="0" :max="1000" />
        </el-form-item>
        <el-form-item label="业绩评级" prop="performance">
          <el-rate v-model="brokerForm.performance" :max="5" />
        </el-form-item>
        <el-form-item label="专业领域" prop="specialization">
          <el-select
            v-model="brokerForm.specialization"
            multiple
            placeholder="请选择专业领域"
            style="width: 100%"
          >
            <el-option label="长协交易" value="长协交易" />
            <el-option label="现货交易" value="现货交易" />
            <el-option label="需求响应" value="需求响应" />
            <el-option label="绿色电力" value="绿色电力" />
            <el-option label="容量市场" value="容量市场" />
          </el-select>
        </el-form-item>
        <el-form-item label="资质证书" prop="certifications" v-if="dialogType !== 'view'">
          <el-upload
            action="#"
            list-type="picture-card"
            :auto-upload="false"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="简介" prop="introduction">
          <el-input
            v-model="brokerForm.introduction"
            type="textarea"
            :rows="3"
            placeholder="请输入个人简介"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" v-if="dialogType !== 'view'">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteConfirmVisible"
      title="删除确认"
      width="400px"
    >
      <p>确定删除经纪人 <strong>{{ currentBroker?.name }}</strong> 的档案吗？此操作不可恢复。</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteConfirmVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">确认删除</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量删除确认对话框 -->
    <el-dialog
      v-model="batchDeleteVisible"
      title="批量删除确认"
      width="450px"
    >
      <p>确定删除选中的 <strong>{{ selectedBrokers.length }}</strong> 名经纪人档案吗？此操作不可恢复。</p>
      <ul class="selected-brokers-list">
        <li v-for="broker in selectedBrokers.slice(0, 3)" :key="broker.id">
          {{ broker.name }} - {{ broker.organization }}
        </li>
        <li v-if="selectedBrokers.length > 3">...</li>
      </ul>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDeleteVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmBatchDelete">确认删除</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="batchImportVisible"
      title="批量导入经纪人"
      width="500px"
    >
      <div class="batch-import-content">
        <el-upload
          class="batch-import-upload"
          action="#"
          :auto-upload="false"
          :show-file-list="true"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          accept=".xlsx,.xls"
        >
          <template #trigger>
            <el-button type="primary">
              <el-icon><Upload /></el-icon>选择文件
            </el-button>
          </template>
          <template #tip>
            <div class="el-upload__tip">
              请上传Excel文件（.xlsx或.xls格式）
              <el-link type="primary" :underline="true" @click="downloadTemplate">下载模板</el-link>
            </div>
          </template>
        </el-upload>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchImportVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmBatchImport"
            :disabled="!importFile"
            :loading="importing"
          >
            开始导入
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { 
  Plus, 
  View, 
  Edit, 
  Delete, 
  Search, 
  RefreshRight, 
  OfficeBuilding, 
  Location, 
  Phone, 
  Message, 
  Upload 
} from '@element-plus/icons-vue'

interface BrokerData {
  id: string;
  name: string;
  organization: string;
  level: string;
  businessArea: string;
  phone: string;
  email: string;
  certificationTime: string;
  transactionCount: number;
  performance: number;
  specialization: string[];
  introduction: string;
}

// 经纪人数据列表
const brokerData = ref<BrokerData[]>([
  {
    id: 'BRK20230001',
    name: '王建国',
    organization: '江苏电力交易中心',
    level: '高级经纪人',
    businessArea: '华东',
    phone: '13812345678',
    email: 'wangjianguo@jstc.com',
    certificationTime: '2020-06-15',
    transactionCount: 156,
    performance: 5,
    specialization: ['长协交易', '现货交易'],
    introduction: '从业8年，专注于电力交易市场，擅长大型工业企业长协合同谈判与评估。'
  },
  {
    id: 'BRK20230002',
    name: '李梅',
    organization: '南方电网交易服务有限公司',
    level: '高级经纪人',
    businessArea: '华南',
    phone: '13998765432',
    email: 'limei@sgcc.com',
    certificationTime: '2021-03-22',
    transactionCount: 132,
    performance: 4.5,
    specialization: ['绿色电力', '现货交易'],
    introduction: '新能源交易专家，在绿色电力交易方面有丰富经验，曾促成多个大型新能源交易项目。'
  },
  {
    id: 'BRK20230003',
    name: '张伟',
    organization: '北京能源交易中心',
    level: '中级经纪人',
    businessArea: '华北',
    phone: '13765432198',
    email: 'zhangwei@bjetc.com',
    certificationTime: '2022-01-10',
    transactionCount: 87,
    performance: 4,
    specialization: ['需求响应', '容量市场'],
    introduction: '专注需求响应市场，熟悉电力需求侧管理政策与实践，擅长组织大规模需求响应项目。'
  },
  {
    id: 'BRK20230004',
    name: '赵丽',
    organization: '上海电力交易所',
    level: '中级经纪人',
    businessArea: '华东',
    phone: '13678901234',
    email: 'zhaoli@shpex.com',
    certificationTime: '2022-05-18',
    transactionCount: 65,
    performance: 3.5,
    specialization: ['现货交易', '容量市场'],
    introduction: '擅长日内现货交易策略制定，为客户提供精准的市场分析和交易建议。'
  },
  {
    id: 'BRK20230005',
    name: '陈明',
    organization: '广东电力交易中心',
    level: '初级经纪人',
    businessArea: '华南',
    phone: '13512345678',
    email: 'chenming@gdpex.com',
    certificationTime: '2022-09-05',
    transactionCount: 42,
    performance: 3,
    specialization: ['长协交易'],
    introduction: '年轻有为的交易员，专注于制造业客户的电力采购策略，服务态度良好。'
  },
  {
    id: 'BRK20230006',
    name: '刘强',
    organization: '四川电力交易中心',
    level: '初级经纪人',
    businessArea: '西南',
    phone: '13898765432',
    email: 'liuqiang@scpex.com',
    certificationTime: '2022-11-20',
    transactionCount: 36,
    performance: 3,
    specialization: ['长协交易', '绿色电力'],
    introduction: '水电交易领域的新秀，对西南地区水电资源与市场有独到见解。'
  },
  {
    id: 'BRK20230007',
    name: '杨帆',
    organization: '湖北电力交易中心',
    level: '见习经纪人',
    businessArea: '华中',
    phone: '13687654321',
    email: 'yangfan@hbpex.com',
    certificationTime: '2023-02-15',
    transactionCount: 18,
    performance: 2.5,
    specialization: ['现货交易'],
    introduction: '刚入行的交易员，有扎实的电力市场理论知识，正在积累实战经验。'
  }
])

// 搜索和筛选
const searchKeyword = ref('')
const levelFilter = ref('')
const areaFilter = ref('')
const loading = ref(false)
const selectedBrokers = ref<BrokerData[]>([])
const currentPage = ref(1)
const pageSize = ref(10)

// 批量导入相关
const batchImportVisible = ref(false)
const importing = ref(false)
const importFile = ref<File | null>(null)

// 根据筛选条件过滤数据
const filteredBrokerData = computed(() => {
  let result = brokerData.value
  
  // 关键词搜索
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase().trim()
    result = result.filter(item => 
      item.name.toLowerCase().includes(keyword) || 
      item.id.toLowerCase().includes(keyword) || 
      item.organization.toLowerCase().includes(keyword)
    )
  }
  
  // 级别筛选
  if (levelFilter.value) {
    result = result.filter(item => item.level === levelFilter.value)
  }
  
  // 区域筛选
  if (areaFilter.value) {
    result = result.filter(item => item.businessArea === areaFilter.value)
  }
  
  return result
})

// 当前页的数据
const currentPageData = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredBrokerData.value.slice(startIndex, endIndex)
})

// 获取经纪人级别标签类型
const getBrokerLevelTag = (level: string) => {
  switch (level) {
    case '高级经纪人':
      return 'success'
    case '中级经纪人':
      return 'warning'
    case '初级经纪人':
      return 'info'
    case '见习经纪人':
      return ''
    default:
      return ''
  }
}

// 对话框相关
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit' | 'view'>('add')
const deleteConfirmVisible = ref(false)
const batchDeleteVisible = ref(false)
const currentBroker = ref<BrokerData | null>(null)
const brokerFormRef = ref<FormInstance>()

// 表单数据
const brokerForm = reactive<BrokerData>({
  id: '',
  name: '',
  organization: '',
  level: '',
  businessArea: '',
  phone: '',
  email: '',
  certificationTime: '',
  transactionCount: 0,
  performance: 3,
  specialization: [],
  introduction: ''
})

// 表单验证规则
const rules = {
  id: [{ required: true, message: '请输入经纪人编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  organization: [{ required: true, message: '请输入所属机构', trigger: 'blur' }],
  level: [{ required: true, message: '请选择经纪级别', trigger: 'change' }],
  businessArea: [{ required: true, message: '请选择业务区域', trigger: 'change' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入电子邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  certificationTime: [{ required: true, message: '请选择认证日期', trigger: 'change' }]
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('查询完成')
  }, 500)
}

// 重置筛选条件
const resetFilters = () => {
  searchKeyword.value = ''
  levelFilter.value = ''
  areaFilter.value = ''
  currentPage.value = 1
}

// 表格选择变化
const handleSelectionChange = (selection: BrokerData[]) => {
  selectedBrokers.value = selection
}

// 添加经纪人
const handleAdd = () => {
  dialogType.value = 'add'
  // 重置表单
  Object.assign(brokerForm, {
    id: `BRK${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    organization: '',
    level: '',
    businessArea: '',
    phone: '',
    email: '',
    certificationTime: new Date().toISOString().split('T')[0],
    transactionCount: 0,
    performance: 3,
    specialization: [],
    introduction: ''
  })
  dialogVisible.value = true
}

// 查看经纪人详情
const handleView = (row: BrokerData) => {
  dialogType.value = 'view'
  currentBroker.value = row
  Object.assign(brokerForm, { ...row })
  dialogVisible.value = true
  
  // 确保选中当前查看的经纪人，以便显示详细档案
  // 先清空选择，然后只选中当前经纪人
  selectedBrokers.value = [row]
}

// 添加一个快捷查看详情的函数
const viewBrokerDetail = (row: BrokerData) => {
  // 设置当前选中的经纪人只有一个
  selectedBrokers.value = [row]
}

// 编辑经纪人
const handleEdit = (row: BrokerData) => {
  dialogType.value = 'edit'
  currentBroker.value = row
  Object.assign(brokerForm, { ...row })
  dialogVisible.value = true
}

// 删除经纪人
const handleDelete = (row: BrokerData) => {
  currentBroker.value = row
  deleteConfirmVisible.value = true
}

// 确认删除
const confirmDelete = () => {
  if (!currentBroker.value) return
  
  const index = brokerData.value.findIndex(item => item.id === currentBroker.value!.id)
  if (index !== -1) {
    brokerData.value.splice(index, 1)
    ElMessage.success(`已删除经纪人 ${currentBroker.value.name} 的档案`)
  }
  
  deleteConfirmVisible.value = false
  currentBroker.value = null
}

// 批量删除
const handleBatchDelete = () => {
  if (selectedBrokers.value.length === 0) return
  batchDeleteVisible.value = true
}

// 确认批量删除
const confirmBatchDelete = () => {
  const ids = selectedBrokers.value.map(item => item.id)
  brokerData.value = brokerData.value.filter(item => !ids.includes(item.id))
  
  ElMessage.success(`已删除 ${selectedBrokers.value.length} 名经纪人档案`)
  batchDeleteVisible.value = false
  selectedBrokers.value = []
}

// 提交表单
const submitForm = async () => {
  if (!brokerFormRef.value) return
  
  await brokerFormRef.value.validate((valid) => {
    if (valid) {
      if (dialogType.value === 'add') {
        // 添加新经纪人
        brokerData.value.unshift({ ...brokerForm })
        ElMessage.success('添加经纪人成功')
      } else if (dialogType.value === 'edit' && currentBroker.value) {
        // 更新经纪人信息
        const index = brokerData.value.findIndex(item => item.id === currentBroker.value!.id)
        if (index !== -1) {
          brokerData.value[index] = { ...brokerForm }
          ElMessage.success('更新经纪人信息成功')
        }
      }
      dialogVisible.value = false
    }
  })
}

// 处理页码改变
const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// 处理每页条数改变
const handleSizeChange = (val: number) => {
  pageSize.value = val
}

// 经纪人客户数据
const brokerClients = [
  { name: '江苏省电力公司', type: '电网企业', cooperationTime: '3年', tradingVolume: 5600 },
  { name: '南京钢铁集团', type: '工业用户', cooperationTime: '2年', tradingVolume: 3200 },
  { name: '华东石化有限公司', type: '工业用户', cooperationTime: '1.5年', tradingVolume: 2800 },
  { name: '苏州高新技术产业开发区', type: '产业园区', cooperationTime: '2.5年', tradingVolume: 1900 }
]

// 认证历程时间线
const certificationTimeline = [
  {
    content: '获得电力交易高级经纪人资质',
    timestamp: '2022-06-15',
    type: 'success',
    color: '#67C23A',
    hollow: false,
    size: 'large'
  },
  {
    content: '完成年度资质复审，评级优秀',
    timestamp: '2021-10-25',
    type: 'primary',
    color: '#409EFF',
    hollow: false,
    size: 'normal'
  },
  {
    content: '晋升为中级经纪人',
    timestamp: '2021-04-18',
    type: 'warning',
    color: '#E6A23C',
    hollow: false,
    size: 'normal'
  },
  {
    content: '通过电力交易实务考核',
    timestamp: '2020-11-30',
    type: 'info',
    color: '#909399',
    hollow: true,
    size: 'small'
  },
  {
    content: '获得初级经纪人资质',
    timestamp: '2020-06-15',
    type: 'info',
    color: '#909399',
    hollow: true,
    size: 'small'
  }
]

// 处理批量导入
const handleBatchImport = () => {
  batchImportVisible.value = true
}

// 处理文件变化
const handleFileChange = (file: any) => {
  importFile.value = file.raw
}

// 处理文件移除
const handleFileRemove = () => {
  importFile.value = null
}

// 下载模板
const downloadTemplate = () => {
  // 这里应该提供一个模板下载链接
  ElMessage.info('模板下载功能开发中...')
}

// 确认批量导入
const confirmBatchImport = async () => {
  if (!importFile.value) return
  
  importing.value = true
  try {
    // 这里应该处理Excel文件的解析和数据导入
    // 示例：模拟导入过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    ElMessage.success('批量导入成功')
    batchImportVisible.value = false
    importFile.value = null
    
    // 重新加载数据
    loading.value = true
    await new Promise(resolve => setTimeout(resolve, 500))
    loading.value = false
  } catch (error) {
    ElMessage.error('导入失败，请检查文件格式是否正确')
  } finally {
    importing.value = false
  }
}

// 页面加载
onMounted(() => {
  // 模拟数据加载
  loading.value = true
  setTimeout(() => {
    loading.value = false
    // 默认选中第一个经纪人以展示详情
    if (brokerData.value.length > 0) {
      selectedBrokers.value = [brokerData.value[0]]
    }
  }, 500)
})
</script>

<style scoped>
.broker-archives-container {
  width: 100%;
}

.operations-card {
  margin-bottom: 20px;
}

.operations-bar {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
}

.left-operations {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  flex: 1;
}

.right-operations {
  display: flex;
  gap: 10px;
}

.search-input {
  width: 300px;
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

.filter-select {
  width: 150px;
}

.filter-select :deep(.el-input__wrapper) {
  background-color: #fff;
  box-shadow: 0 0 0 1px #dcdfe6 inset !important;
  border: none;
  border-radius: 4px;
}

.filter-select :deep(.el-input__inner) {
  color: #606266;
}

.data-card {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.selected-brokers-list {
  margin-top: 10px;
  padding-left: 20px;
  color: #606266;
}

/* 经纪人详细档案样式 */
.broker-detail-section {
  margin-top: 20px;
  margin-bottom: 20px;
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.broker-profile {
  width: 100%;
}

.broker-header {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
}

.broker-avatar {
  flex-shrink: 0;
}

.broker-basic-info {
  flex: 1;
  min-width: 300px;
}

.broker-basic-info h2 {
  margin-top: 0;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.broker-basic-info p {
  margin: 5px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.contact-info {
  margin-top: 10px;
  display: flex;
  gap: 20px;
}

.broker-performance {
  display: flex;
  gap: 30px;
}

.performance-item {
  text-align: center;
  min-width: 100px;
}

.performance-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.performance-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.broker-details {
  margin: 20px 0;
}

.specialization-tag {
  margin-right: 5px;
}

.broker-statistics {
  margin: 20px 0;
}

.broker-statistics h3,
.broker-clients h3,
.broker-timeline h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-weight: 500;
  color: #303133;
}

.statistics-charts {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.chart-container {
  flex: 1;
  min-width: 300px;
}

.chart-container h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-weight: 400;
  color: #606266;
}

.chart-placeholder {
  height: 200px;
  background-color: #f7f9fc;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.bar-chart {
  width: 100%;
  height: 180px;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  padding: 0 20px;
}

.bar {
  position: relative;
  width: 30px;
  background-color: #409EFF;
  border-radius: 4px 4px 0 0;
  display: flex;
  justify-content: center;
}

.bar-label {
  position: absolute;
  bottom: -25px;
  font-size: 12px;
  color: #606266;
}

.pie-chart {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: conic-gradient(
    #409EFF 0% 45%, 
    #67C23A 45% 70%, 
    #E6A23C 70% 85%, 
    #F56C6C 85% 100%
  );
}

.pie-segment {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pie-label {
  font-size: 12px;
  color: #fff;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

.broker-clients {
  margin: 20px 0;
}

.broker-timeline {
  margin: 20px 0;
}

/* 添加未选中经纪人时的提示样式 */
.empty-selection-tip {
  margin: 30px 0;
  text-align: center;
}

@media (max-width: 768px) {
  .operations-bar {
    flex-direction: column;
  }
  
  .left-operations {
    flex-direction: column;
    width: 100%;
  }
  
  .right-operations {
    width: 100%;
    justify-content: flex-end;
  }
  
  .search-input,
  .filter-select {
    width: 100%;
  }
}

/* 分页样式增强 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.enhanced-pagination {
  --el-pagination-button-width: 36px;
  --el-pagination-button-height: 36px;
  --el-pagination-button-font-size: 14px;
  --el-pagination-button-margin: 0 8px;
}

.enhanced-pagination :deep(.el-pagination__jump) {
  margin-left: 16px;
  height: 36px;
  display: flex;
  align-items: center;
}

.enhanced-pagination :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #c0c4cc inset !important;
  background-color: #fff;
  border-radius: 4px;
  height: 36px;
  padding: 0 8px;
}

.enhanced-pagination :deep(.el-input__inner) {
  color: #606266;
  font-size: 14px;
  height: 100%;
  text-align: center;
  width: 50px;
}

.enhanced-pagination :deep(.el-pagination__total),
.enhanced-pagination :deep(.el-pagination__sizes) {
  margin-right: 16px;
}

.enhanced-pagination :deep(.btn-prev),
.enhanced-pagination :deep(.btn-next),
.enhanced-pagination :deep(.el-pager li) {
  background-color: #f4f4f5;
  min-width: 36px;
  height: 36px;
  line-height: 36px;
  border-radius: 4px;
  font-weight: 500;
  margin: 0 4px;
}

.enhanced-pagination :deep(.el-pager li.is-active) {
  background-color: #409EFF;
  color: white;
  font-weight: bold;
}

.enhanced-pagination :deep(.el-select .el-input .el-select__caret) {
  color: #606266;
}

/* 批量导入样式 */
.batch-import-content {
  padding: 20px;
}

.batch-import-upload {
  text-align: center;
}

.el-upload__tip {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.batch-import-btn {
  margin-left: 10px;
}
</style> 