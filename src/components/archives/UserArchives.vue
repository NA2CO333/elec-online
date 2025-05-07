<template>
  <div class="user-archives-container">
    <!-- 操作栏 -->
    <el-card class="operations-card">
      <div class="operations-bar">
        <div class="left-operations">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索企业编号或企业名称"
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
        
        <div class="right-operations">
          <el-button :disabled="selectedUsers.length === 0" type="danger" @click="handleBatchDelete" class="delete-btn">
            <el-icon><Delete /></el-icon>批量删除
          </el-button>
          <el-button type="primary" @click="handleAdd" class="add-btn">
            <el-icon><Plus /></el-icon>添加企业
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
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="企业编号" width="130" fixed="left" />
        <el-table-column prop="company" label="企业名称" min-width="180" show-overflow-tooltip fixed="left" />
        <el-table-column prop="industry" label="行业分类" width="100" />
        <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip />
        <el-table-column prop="contactPerson" label="联系人" width="100" />
        <el-table-column prop="contactPhone" label="联系电话" width="130" />
        <el-table-column prop="powerLevel" label="官方电力用户分级" width="140">
          <template #default="scope">
            <el-tag :type="getPowerLevelTag(scope.row.powerLevel)">{{ scope.row.powerLevel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="contractStatus" label="签约状态" width="100">
          <template #default="scope">
            <el-tag :type="getContractStatusTag(scope.row.contractStatus)">{{ scope.row.contractStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="pvStatus" label="光伏配置状态" width="120">
          <template #default="scope">
            <el-tag :type="getConfigStatusTag(scope.row.pvStatus)">{{ scope.row.pvStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="pvCapacity" label="光伏配置容量" width="120" />
        <el-table-column prop="storageStatus" label="储能配置状态" width="120">
          <template #default="scope">
            <el-tag :type="getConfigStatusTag(scope.row.storageStatus)">{{ scope.row.storageStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="storageCapacity" label="储能配置容量" width="120" />
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="scope">
            <div class="action-buttons">
              <el-button size="small" type="primary" @click="handleEdit(scope.row)">
                <el-icon><Edit /></el-icon>编辑
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(scope.row)">
                <el-icon><Delete /></el-icon>删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页控件 -->
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
          :total="filteredUserData.length"
          @current-change="handleCurrentChange"
          :pager-count="5"
          background
          class="enhanced-pagination"
        />
      </div>
    </el-card>

    <!-- 用户表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加企业' : (dialogType === 'edit' ? '编辑企业' : '企业详情')"
      width="650px"
    >
      <el-form 
        :model="userForm" 
        :rules="rules" 
        ref="userFormRef" 
        label-width="120px"
        :disabled="dialogType === 'view'"
      >
        <el-form-item label="企业编号" prop="id">
          <el-input v-model="userForm.id" placeholder="请输入企业编号" />
        </el-form-item>
        <el-form-item label="企业名称" prop="company">
          <el-input v-model="userForm.company" placeholder="请输入企业名称" />
        </el-form-item>
        <el-form-item label="行业分类" prop="industry">
          <el-select v-model="userForm.industry" placeholder="请选择行业分类" style="width: 100%">
            <el-option label="制造业" value="制造业" />
            <el-option label="建筑业" value="建筑业" />
            <el-option label="服务业" value="服务业" />
            <el-option label="电子信息" value="电子信息" />
            <el-option label="农业" value="农业" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="userForm.address" placeholder="请输入企业地址" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactPerson">
          <el-input v-model="userForm.contactPerson" placeholder="请输入联系人姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="userForm.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="电力用户分级" prop="powerLevel">
          <el-select v-model="userForm.powerLevel" placeholder="请选择用户分级" style="width: 100%">
            <el-option label="大型用户" value="大型用户" />
            <el-option label="中型用户" value="中型用户" />
            <el-option label="小型用户" value="小型用户" />
          </el-select>
        </el-form-item>
        <el-form-item label="签约状态" prop="contractStatus">
          <el-select v-model="userForm.contractStatus" placeholder="请选择签约状态" style="width: 100%">
            <el-option label="已签约" value="已签约" />
            <el-option label="洽谈中" value="洽谈中" />
            <el-option label="未签约" value="未签约" />
          </el-select>
        </el-form-item>
        <el-form-item label="光伏配置状态" prop="pvStatus">
          <el-select v-model="userForm.pvStatus" placeholder="请选择配置状态" style="width: 100%">
            <el-option label="已配置" value="已配置" />
            <el-option label="规划中" value="规划中" />
            <el-option label="未配置" value="未配置" />
          </el-select>
        </el-form-item>
        <el-form-item label="光伏配置容量" prop="pvCapacity">
          <el-input v-model="userForm.pvCapacity" placeholder="请输入配置容量，例如: 500kW" />
        </el-form-item>
        <el-form-item label="储能配置状态" prop="storageStatus">
          <el-select v-model="userForm.storageStatus" placeholder="请选择配置状态" style="width: 100%">
            <el-option label="已配置" value="已配置" />
            <el-option label="规划中" value="规划中" />
            <el-option label="未配置" value="未配置" />
          </el-select>
        </el-form-item>
        <el-form-item label="储能配置容量" prop="storageCapacity">
          <el-input v-model="userForm.storageCapacity" placeholder="请输入配置容量，例如: 200kWh" />
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
      <p>确定删除企业 <strong>{{ currentUser?.company }}</strong> 的档案吗？此操作不可恢复。</p>
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
      <p>确定删除选中的 <strong>{{ selectedUsers.length }}</strong> 家企业档案吗？此操作不可恢复。</p>
      <ul class="selected-users-list">
        <li v-for="user in selectedUsers.slice(0, 3)" :key="user.id">
          {{ user.company }}
        </li>
        <li v-if="selectedUsers.length > 3">...</li>
      </ul>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDeleteVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmBatchDelete">确认删除</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Plus, View, Edit, Delete, Search, RefreshRight } from '@element-plus/icons-vue'

interface UserData {
  id: string;
  company: string;
  industry: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  powerLevel: string;
  contractStatus: string;
  pvStatus: string;
  pvCapacity: string;
  storageStatus: string;
  storageCapacity: string;
  createTime: string;
}

// 用户数据列表
const userData = ref<UserData[]>([
  {
    id: 'ENT20230001',
    company: '江苏三河电力有限公司',
    industry: '制造业',
    address: '江苏省南京市江宁区科学园科建路18号',
    contactPerson: '李明',
    contactPhone: '13812345678',
    powerLevel: '大型用户',
    contractStatus: '已签约',
    pvStatus: '已配置',
    pvCapacity: '500kW',
    storageStatus: '已配置',
    storageCapacity: '200kWh',
    createTime: '2023-01-15'
  },
  {
    id: 'ENT20230002',
    company: '南京亿联科技有限公司',
    industry: '电子信息',
    address: '江苏省南京市雨花台区软件大道168号',
    contactPerson: '王芳',
    contactPhone: '13998765432',
    powerLevel: '中型用户',
    contractStatus: '已签约',
    pvStatus: '未配置',
    pvCapacity: '0kW',
    storageStatus: '未配置',
    storageCapacity: '0kWh',
    createTime: '2023-02-22'
  },
  {
    id: 'ENT20230003',
    company: '苏州绿能环保科技有限公司',
    industry: '制造业',
    address: '江苏省苏州市工业园区星湖街328号',
    contactPerson: '张伟',
    contactPhone: '13587654321',
    powerLevel: '中型用户',
    contractStatus: '洽谈中',
    pvStatus: '规划中',
    pvCapacity: '300kW',
    storageStatus: '未配置',
    storageCapacity: '0kWh',
    createTime: '2023-03-10'
  },
  {
    id: 'ENT20230004',
    company: '无锡远景智能技术有限公司',
    industry: '电子信息',
    address: '江苏省无锡市新吴区菱湖大道200号',
    contactPerson: '刘强',
    contactPhone: '13612345678',
    powerLevel: '大型用户',
    contractStatus: '已签约',
    pvStatus: '已配置',
    pvCapacity: '1000kW',
    storageStatus: '已配置',
    storageCapacity: '500kWh',
    createTime: '2023-04-05'
  },
  {
    id: 'ENT20230005',
    company: '徐州丰收农业科技有限公司',
    industry: '农业',
    address: '江苏省徐州市铜山区华山路89号',
    contactPerson: '周丽',
    contactPhone: '13712345678',
    powerLevel: '小型用户',
    contractStatus: '已签约',
    pvStatus: '已配置',
    pvCapacity: '100kW',
    storageStatus: '未配置',
    storageCapacity: '0kWh',
    createTime: '2023-05-18'
  },
  {
    id: 'ENT20230006',
    company: '常州蓝天新能源有限公司',
    industry: '制造业',
    address: '江苏省常州市武进区长虹路25号',
    contactPerson: '陈勇',
    contactPhone: '13612349876',
    powerLevel: '中型用户',
    contractStatus: '已签约',
    pvStatus: '已配置',
    pvCapacity: '600kW',
    storageStatus: '规划中',
    storageCapacity: '300kWh',
    createTime: '2023-06-12'
  },
  {
    id: 'ENT20230007',
    company: '南通明华商贸有限公司',
    industry: '服务业',
    address: '江苏省南通市崇川区工农路128号',
    contactPerson: '杨燕',
    contactPhone: '13798765432',
    powerLevel: '小型用户',
    contractStatus: '已签约',
    pvStatus: '未配置',
    pvCapacity: '0kW',
    storageStatus: '未配置',
    storageCapacity: '0kWh',
    createTime: '2023-07-05'
  },
  {
    id: 'ENT20230008',
    company: '盐城佳禾农产品有限公司',
    industry: '农业',
    address: '江苏省盐城市亭湖区黄海大道18号',
    contactPerson: '赵健',
    contactPhone: '13887654321',
    powerLevel: '小型用户',
    contractStatus: '洽谈中',
    pvStatus: '规划中',
    pvCapacity: '150kW',
    storageStatus: '规划中',
    storageCapacity: '100kWh',
    createTime: '2023-07-20'
  },
  {
    id: 'ENT20230009',
    company: '宿迁家和物业有限公司',
    industry: '服务业',
    address: '江苏省宿迁市宿城区发展大道102号',
    contactPerson: '孙梅',
    contactPhone: '13512345678',
    powerLevel: '小型用户',
    contractStatus: '已签约',
    pvStatus: '已配置',
    pvCapacity: '80kW',
    storageStatus: '未配置',
    storageCapacity: '0kWh',
    createTime: '2023-08-15'
  },
  {
    id: 'ENT20230010',
    company: '镇江恒力建筑工程有限公司',
    industry: '建筑业',
    address: '江苏省镇江市京口区解放路56号',
    contactPerson: '李强',
    contactPhone: '13623456789',
    powerLevel: '中型用户',
    contractStatus: '已签约',
    pvStatus: '已配置',
    pvCapacity: '250kW',
    storageStatus: '已配置',
    storageCapacity: '120kWh',
    createTime: '2023-09-22'
  },
  {
    id: 'ENT20230011',
    company: '苏州绿能光电科技有限公司',
    industry: '制造业',
    address: '江苏省苏州市相城区阳澄湖大道88号',
    contactPerson: '张明',
    contactPhone: '13567891234',
    powerLevel: '中型用户',
    contractStatus: '已签约',
    pvStatus: '已配置',
    pvCapacity: '450kW',
    storageStatus: '规划中',
    storageCapacity: '200kWh',
    createTime: '2023-10-05'
  },
  {
    id: 'ENT20230012',
    company: '南京东方电力设备有限公司',
    industry: '制造业',
    address: '江苏省南京市江宁区胜太路29号',
    contactPerson: '刘伟',
    contactPhone: '13812349876',
    powerLevel: '大型用户',
    contractStatus: '已签约',
    pvStatus: '已配置',
    pvCapacity: '800kW',
    storageStatus: '已配置',
    storageCapacity: '350kWh',
    createTime: '2023-10-18'
  },
  {
    id: 'ENT20230013',
    company: '常州新能源技术研究所',
    industry: '电子信息',
    address: '江苏省常州市钟楼区新龙路58号',
    contactPerson: '王丽',
    contactPhone: '13765432187',
    powerLevel: '中型用户',
    contractStatus: '洽谈中',
    pvStatus: '规划中',
    pvCapacity: '350kW',
    storageStatus: '未配置',
    storageCapacity: '0kWh',
    createTime: '2023-11-02'
  },
  {
    id: 'ENT20230014',
    company: '无锡智能电网有限公司',
    industry: '电子信息',
    address: '江苏省无锡市滨湖区太湖大道1788号',
    contactPerson: '周强',
    contactPhone: '13698765432',
    powerLevel: '大型用户',
    contractStatus: '已签约',
    pvStatus: '已配置',
    pvCapacity: '1200kW',
    storageStatus: '已配置',
    storageCapacity: '600kWh',
    createTime: '2023-11-15'
  },
  {
    id: 'ENT20230015',
    company: '徐州农业科技发展有限公司',
    industry: '农业',
    address: '江苏省徐州市云龙区民主路120号',
    contactPerson: '赵芳',
    contactPhone: '13512345678',
    powerLevel: '小型用户',
    contractStatus: '已签约',
    pvStatus: '已配置',
    pvCapacity: '120kW',
    storageStatus: '未配置',
    storageCapacity: '0kWh',
    createTime: '2023-11-28'
  },
  {
    id: 'ENT20230016',
    company: '泰州医药产业园管理有限公司',
    industry: '服务业',
    address: '江苏省泰州市医药高新区药城大道1号',
    contactPerson: '孙健',
    contactPhone: '13856789012',
    powerLevel: '中型用户',
    contractStatus: '已签约',
    pvStatus: '规划中',
    pvCapacity: '300kW',
    storageStatus: '规划中',
    storageCapacity: '150kWh',
    createTime: '2023-12-10'
  },
  {
    id: 'ENT20230017',
    company: '连云港海洋渔业有限公司',
    industry: '农业',
    address: '江苏省连云港市连云区连云大道238号',
    contactPerson: '李海',
    contactPhone: '13987654321',
    powerLevel: '小型用户',
    contractStatus: '已签约',
    pvStatus: '未配置',
    pvCapacity: '0kW',
    storageStatus: '未配置',
    storageCapacity: '0kWh',
    createTime: '2023-12-25'
  },
  {
    id: 'ENT20230018',
    company: '淮安食品加工有限公司',
    industry: '制造业',
    address: '江苏省淮安市清江浦区深圳路18号',
    contactPerson: '陈红',
    contactPhone: '13623456789',
    powerLevel: '中型用户',
    contractStatus: '洽谈中',
    pvStatus: '规划中',
    pvCapacity: '220kW',
    storageStatus: '未配置',
    storageCapacity: '0kWh',
    createTime: '2024-01-08'
  },
  {
    id: 'ENT20230019',
    company: '盐城绿色能源开发有限公司',
    industry: '制造业',
    address: '江苏省盐城市亭湖区解放南路168号',
    contactPerson: '高明',
    contactPhone: '13712345670',
    powerLevel: '中型用户',
    contractStatus: '已签约',
    pvStatus: '已配置',
    pvCapacity: '400kW',
    storageStatus: '已配置',
    storageCapacity: '180kWh',
    createTime: '2024-01-22'
  },
  {
    id: 'ENT20230020',
    company: '扬州照明电器有限公司',
    industry: '制造业',
    address: '江苏省扬州市邗江区扬子江北路98号',
    contactPerson: '吴强',
    contactPhone: '13898765432',
    powerLevel: '大型用户',
    contractStatus: '已签约',
    pvStatus: '已配置',
    pvCapacity: '700kW',
    storageStatus: '已配置',
    storageCapacity: '300kWh',
    createTime: '2024-02-05'
  }
])

// 搜索和筛选
const searchKeyword = ref('')
const selectedUsers = ref<UserData[]>([])

// 表格加载状态
const loading = ref(false)

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

// 过滤后的用户数据
const filteredUserData = computed(() => {
  let result = userData.value
  
  // 关键字搜索
  const keyword = searchKeyword.value.toLowerCase().trim()
  if (keyword) {
    result = result.filter(user => 
      user.id.toLowerCase().includes(keyword) ||
      user.company.toLowerCase().includes(keyword)
    )
  }
  
  return result
})

// 当前页的数据
const currentPageData = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredUserData.value.slice(startIndex, endIndex)
})

// 对话框相关
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit' | 'view'>('add')
const deleteConfirmVisible = ref(false)
const batchDeleteVisible = ref(false)
const currentUser = ref<UserData | null>(null)
const userFormRef = ref<FormInstance>()

// 用户表单
const userForm = reactive({
  id: '',
  company: '',
  industry: '',
  address: '',
  contactPerson: '',
  contactPhone: '',
  powerLevel: '',
  contractStatus: '',
  pvStatus: '',
  pvCapacity: '',
  storageStatus: '',
  storageCapacity: '',
})

// 表单验证规则
const rules = {
  id: [{ required: true, message: '请输入企业编号', trigger: 'blur' }],
  company: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
  industry: [{ required: true, message: '请选择行业分类', trigger: 'change' }],
  address: [{ required: true, message: '请输入企业地址', trigger: 'blur' }],
  contactPerson: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  powerLevel: [{ required: true, message: '请选择电力用户分级', trigger: 'change' }],
  contractStatus: [{ required: true, message: '请选择签约状态', trigger: 'change' }],
  pvStatus: [{ required: true, message: '请选择光伏配置状态', trigger: 'change' }],
  pvCapacity: [{ required: true, message: '请输入光伏配置容量', trigger: 'blur' }],
  storageStatus: [{ required: true, message: '请选择储能配置状态', trigger: 'change' }],
  storageCapacity: [{ required: true, message: '请输入储能配置容量', trigger: 'blur' }]
}

// 处理表格选择变化
const handleSelectionChange = (selection: UserData[]) => {
  selectedUsers.value = selection
}

// 处理页码改变
const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// 处理每页条数改变
const handleSizeChange = (val: number) => {
  pageSize.value = val
}

// 处理搜索
const handleSearch = () => {
  // 可以添加额外的搜索逻辑
  currentPage.value = 1 // 搜索后重置到第一页
}

// 重置筛选条件
const resetFilters = () => {
  searchKeyword.value = ''
  currentPage.value = 1
}

// 根据用户类型返回标签类型
const getPowerLevelTag = (level: string) => {
  switch (level) {
    case '大型用户':
      return 'danger'
    case '中型用户':
      return 'warning'
    case '小型用户':
      return 'info'
    default:
      return ''
  }
}

const getContractStatusTag = (status: string) => {
  switch (status) {
    case '已签约':
      return 'success'
    case '洽谈中':
      return 'warning'
    case '未签约':
      return 'info'
    default:
      return ''
  }
}

const getConfigStatusTag = (status: string) => {
  switch (status) {
    case '已配置':
      return 'success'
    case '规划中':
      return 'warning'
    case '未配置':
      return 'info'
    default:
      return ''
  }
}

// 添加用户
const handleAdd = () => {
  dialogType.value = 'add'
  resetForm()
  dialogVisible.value = true
}

// 查看用户详情
const handleView = (row: UserData) => {
  dialogType.value = 'view'
  currentUser.value = row
  Object.assign(userForm, row)
  dialogVisible.value = true
}

// 编辑用户
const handleEdit = (row: UserData) => {
  dialogType.value = 'edit'
  currentUser.value = row
  Object.assign(userForm, row)
  dialogVisible.value = true
}

// 删除用户
const handleDelete = (row: UserData) => {
  currentUser.value = row
  deleteConfirmVisible.value = true
}

// 批量删除
const handleBatchDelete = () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请选择要删除的用户')
    return
  }
  batchDeleteVisible.value = true
}

// 确认删除
const confirmDelete = () => {
  if (currentUser.value) {
    loading.value = true
    
    // 模拟删除操作
    setTimeout(() => {
      userData.value = userData.value.filter(user => user.id !== currentUser.value?.id)
      ElMessage.success('删除成功')
      deleteConfirmVisible.value = false
      loading.value = false
    }, 600)
  }
}

// 确认批量删除
const confirmBatchDelete = () => {
  if (selectedUsers.value.length > 0) {
    loading.value = true
    
    // 模拟批量删除操作
    setTimeout(() => {
      const selectedIds = selectedUsers.value.map(user => user.id)
      userData.value = userData.value.filter(user => !selectedIds.includes(user.id))
      ElMessage.success(`成功删除 ${selectedIds.length} 名用户`)
      batchDeleteVisible.value = false
      loading.value = false
    }, 800)
  }
}

// 重置表单
const resetForm = () => {
  if (userFormRef.value) {
    userFormRef.value.resetFields()
  }
  
  Object.assign(userForm, {
    id: 'ENT' + new Date().getFullYear() + String(userData.value.length + 1).padStart(4, '0'),
    company: '',
    industry: '',
    address: '',
    contactPerson: '',
    contactPhone: '',
    powerLevel: '',
    contractStatus: '',
    pvStatus: '',
    pvCapacity: '',
    storageStatus: '',
    storageCapacity: '',
  })
}

// 提交表单
const submitForm = async () => {
  if (!userFormRef.value) return
  
  await userFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      
      try {
        // 模拟提交操作
        await new Promise(resolve => setTimeout(resolve, 800))
        
        if (dialogType.value === 'add') {
          // 添加用户
          const newUser: UserData = {
            ...userForm,
            createTime: new Date().toISOString().split('T')[0]
          }
          userData.value.unshift(newUser)
          ElMessage.success('添加用户成功')
        } else if (dialogType.value === 'edit') {
          // 更新用户
          const index = userData.value.findIndex(user => user.id === currentUser.value?.id)
          if (index !== -1) {
            userData.value[index] = {
              ...userForm,
              createTime: userData.value[index].createTime
            }
            ElMessage.success('更新用户成功')
          }
        }
        
        dialogVisible.value = false
      } finally {
        loading.value = false
      }
    }
  })
}

// 页面加载
onMounted(() => {
  // 模拟加载数据
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 800)
})
</script>

<style>
/* 全局样式，确保选择器内容在任何情况下都显示正确 */
.el-select-dropdown__item {
  width: auto !important;
  min-width: 90px !important;
  text-align: left !important;
  padding: 0 10px !important;
}
</style>

<style scoped>
.user-archives-container {
  width: 100%;
}

.operations-card {
  margin-bottom: 16px;
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

.search-input {
  width: 280px;
  background-color: #fff;
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

.add-btn {
  background-color: #409EFF;
  border-color: #409EFF;
  font-weight: 500;
  height: 36px;
}

.delete-btn {
  height: 36px;
}

.right-operations {
  display: flex;
  align-items: center;
  gap: 10px;
}

.data-card {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.enhanced-pagination {
  --el-pagination-button-width: 36px;
  --el-pagination-button-height: 36px;
  --el-pagination-button-font-size: 14px;
  --el-pagination-button-margin: 0 8px;
  display: flex;
  align-items: center;
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
}

.enhanced-pagination :deep(.el-pagination__sizes) {
  margin-right: 16px;
  min-width: 110px;
}

.enhanced-pagination :deep(.el-pagination__sizes .el-select) {
  width: 110px !important;
}

.enhanced-pagination :deep(.el-pagination__sizes .el-select .el-input) {
  width: 110px !important;
}

.enhanced-pagination :deep(.el-pagination__sizes .el-select .el-input__wrapper) {
  width: 110px !important;
  background-color: white;
}

.enhanced-pagination :deep(.el-pagination__sizes .el-select .el-input__inner) {
  width: 100px !important;
  font-size: 14px;
  padding-right: 25px !important;
  text-overflow: ellipsis;
  text-align: left;
}

.enhanced-pagination :deep(.el-select .el-select__popper) {
  min-width: 110px !important;
}

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

.selected-users-list {
  margin-top: 10px;
  padding-left: 20px;
  color: #606266;
  font-size: 14px;
}

.selected-users-list li {
  margin-bottom: 5px;
}

@media (max-width: 1200px) {
  .operations-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .right-operations {
    align-self: flex-end;
    margin-top: 10px;
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
  
  .search-input,
  .filter-select {
    width: 100%;
  }
  
  .right-operations {
    align-self: stretch;
    margin-top: 10px;
  }
}

/* 确保表单输入框样式正确 */
:deep(.el-input__wrapper) {
  background-color: #fff;
  box-shadow: 0 0 0 1px #dcdfe6 inset !important;
  border-radius: 4px;
  display: block;
  width: 100%;
}

:deep(.el-input__inner) {
  color: #606266;
  height: 40px;
  line-height: 40px;
  padding: 0 15px;
  width: 100%;
  text-align: left;
  box-sizing: border-box;
}

:deep(.el-form-item) {
  margin-bottom: 22px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
}

:deep(.el-form-item__content) {
  min-height: 40px;
  line-height: 40px;
}

:deep(.el-select) {
  width: 100%;
}

/* 输入框悬停和焦点样式 */
:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset !important;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409EFF inset !important;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  gap: 10px;
}

.action-buttons {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 5px;
}

.action-buttons .el-button {
  margin-left: 0;
  padding: 5px 10px;
}
</style> 