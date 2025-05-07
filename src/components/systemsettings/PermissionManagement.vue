<template>
  <div class="permission-management-container">
    <el-card class="permission-card">
      <template #header>
        <div class="card-header">
          <span>权限管理</span>
        </div>
      </template>

      <div class="filter-container">
        <div class="filter-row">
          <el-input
            v-model="searchText"
            placeholder="搜索用户"
            prefix-icon="Search"
            clearable
            style="width: 220px;"
            @input="handleSearch"
          />
          <el-select v-model="userRole" placeholder="用户角色" style="width: 150px;" @change="handleRoleChange">
            <el-option v-for="item in roleOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-select v-model="userStatus" placeholder="账号状态" style="width: 150px;" @change="handleStatusChange">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <div class="filter-buttons">
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button type="success" @click="batchAssign">批量授权</el-button>
          </div>
        </div>
      </div>

      <div class="main-content">
        <div class="user-list">
          <div class="section-title">用户列表</div>
          <el-scrollbar>
            <div 
              v-for="user in filteredUsers" 
              :key="user.id" 
              class="user-item" 
              :class="{ 'selected': selectedUser && selectedUser.id === user.id }"
              @click="selectUser(user)"
            >
              <el-avatar :size="32" :src="user.avatar">{{ user.name.substring(0, 1) }}</el-avatar>
              <div class="user-info">
                <div class="user-name">{{ user.name }}</div>
                <div class="user-role">{{ user.role }}</div>
              </div>
              <el-tag 
                size="small" 
                :type="user.status === '激活' ? 'success' : 'danger'"
              >
                {{ user.status }}
              </el-tag>
            </div>
          </el-scrollbar>
        </div>

        <div class="permission-panel">
          <div v-if="selectedUser" class="permission-content">
            <div class="permission-header">
              <div class="user-detail">
                <span class="detail-title">{{ selectedUser.name }}</span>
                <span class="detail-role">{{ selectedUser.role }}</span>
              </div>
              <el-button type="primary" size="small" @click="savePermissions">保存更改</el-button>
            </div>

            <el-tree
              ref="permissionTree"
              :data="permissionData"
              show-checkbox
              node-key="id"
              default-expand-all
              :default-checked-keys="selectedUserPermissions"
              :props="{ label: 'name', children: 'children' }"
              @check="handlePermissionChange"
            />
          </div>
          <div v-else class="empty-permission">
            <el-empty description="请从左侧选择用户" />
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 角色选项
const roleOptions = [
  { value: 'all', label: '全部' },
  { value: 'admin', label: '系统管理员' },
  { value: 'manager', label: '部门经理' },
  { value: 'operator', label: '普通操作员' },
  { value: 'viewer', label: '只读用户' }
]

// 状态选项
const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '激活' },
  { value: 'inactive', label: '未激活' },
  { value: 'locked', label: '已锁定' }
]

// 权限树数据
const permissionData = [
  {
    id: '1',
    name: '系统管理',
    children: [
      { id: '1-1', name: '用户管理' },
      { id: '1-2', name: '角色管理' },
      { id: '1-3', name: '权限管理' },
      { id: '1-4', name: '系统设置' },
      { id: '1-5', name: '系统日志' }
    ]
  },
  {
    id: '2',
    name: '数据管理',
    children: [
      { id: '2-1', name: '数据查询' },
      { id: '2-2', name: '数据分析' },
      { id: '2-3', name: '数据导出' },
      { id: '2-4', name: '数据导入' }
    ]
  },
  {
    id: '3',
    name: '业务管理',
    children: [
      { id: '3-1', name: '电力交易' },
      { id: '3-2', name: '合同管理' },
      { id: '3-3', name: '客户管理' },
      { id: '3-4', name: '统计报表' }
    ]
  }
]

// 响应式变量
const searchText = ref('')
const userRole = ref('all')
const userStatus = ref('all')
const selectedUser = ref(null)
const permissionTree = ref(null)
const selectedUserPermissions = ref([])

// 模拟用户数据
const users = ref([
  { 
    id: '1', 
    name: '管理员', 
    role: '系统管理员', 
    status: '激活',
    avatar: '',
    permissions: ['1', '1-1', '1-2', '1-3', '1-4', '1-5', '2', '2-1', '2-2', '2-3', '2-4', '3', '3-1', '3-2', '3-3', '3-4']
  },
  { 
    id: '2', 
    name: '张经理', 
    role: '部门经理', 
    status: '激活',
    avatar: '',
    permissions: ['1-1', '1-5', '2', '2-1', '2-2', '2-3', '3', '3-1', '3-2', '3-3', '3-4']
  },
  { 
    id: '3', 
    name: '李操作员', 
    role: '普通操作员', 
    status: '激活',
    avatar: '',
    permissions: ['2-1', '2-3', '3-1', '3-3']
  },
  { 
    id: '4', 
    name: '王查看员', 
    role: '只读用户', 
    status: '激活',
    avatar: '',
    permissions: ['2-1', '3-1', '3-3']
  },
  { 
    id: '5', 
    name: '刘测试员', 
    role: '普通操作员', 
    status: '未激活',
    avatar: '',
    permissions: []
  }
])

// 筛选用户列表
const filteredUsers = computed(() => {
  return users.value.filter(user => {
    const matchSearch = user.name.includes(searchText.value) || 
                        user.role.includes(searchText.value);
    const matchRole = userRole.value === 'all' || user.role === roleOptions.find(r => r.value === userRole.value)?.label;
    const matchStatus = userStatus.value === 'all' || 
                        (userStatus.value === 'active' && user.status === '激活') ||
                        (userStatus.value === 'inactive' && user.status === '未激活') ||
                        (userStatus.value === 'locked' && user.status === '已锁定');
    
    return matchSearch && matchRole && matchStatus;
  });
});

// 初始化加载
onMounted(() => {
  // 初始化数据，在实际应用中可能需要从API获取
});

// 处理搜索
const handleSearch = () => {
  // 搜索已通过计算属性实现
};

// 处理角色变化
const handleRoleChange = () => {
  // 角色筛选已通过计算属性实现
};

// 处理状态变化
const handleStatusChange = () => {
  // 状态筛选已通过计算属性实现
};

// 选择用户
const selectUser = (user) => {
  selectedUser.value = user;
  selectedUserPermissions.value = [...user.permissions];
};

// 处理权限变化
const handlePermissionChange = (node, checkedNodes) => {
  // 实际应用中可能需要更复杂的逻辑处理父子节点关联关系
};

// 保存权限
const savePermissions = () => {
  if (!selectedUser.value) return;
  
  // 获取当前选中的权限
  const checkedKeys = permissionTree.value.getCheckedKeys();
  const halfCheckedKeys = permissionTree.value.getHalfCheckedKeys();
  const allCheckedKeys = [...checkedKeys, ...halfCheckedKeys];
  
  // 更新用户权限
  const userIndex = users.value.findIndex(u => u.id === selectedUser.value.id);
  if (userIndex !== -1) {
    users.value[userIndex].permissions = allCheckedKeys;
    selectedUserPermissions.value = allCheckedKeys;
    ElMessage.success('权限更新成功');
  }
};

// 批量授权
const batchAssign = () => {
  ElMessage.info('批量授权功能开发中...');
};
</script>

<style scoped>
.permission-management-container {
  width: 100%;
  height: 100%;
}

.permission-card {
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

.main-content {
  display: flex;
  height: calc(100vh - 240px);
  gap: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #303133;
}

.user-list {
  width: 280px;
  border-right: 1px solid #ebeef5;
  padding-right: 15px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 10px;
  margin-bottom: 5px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.user-item:hover {
  background-color: #f5f7fa;
}

.user-item.selected {
  background-color: #ecf5ff;
}

.user-info {
  margin-left: 10px;
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
}

.user-role {
  font-size: 12px;
  color: #909399;
}

.permission-panel {
  flex: 1;
  overflow: hidden;
}

.permission-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.permission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.user-detail {
  display: flex;
  align-items: center;
}

.detail-title {
  font-size: 16px;
  font-weight: bold;
  margin-right: 10px;
}

.detail-role {
  font-size: 13px;
  color: #606266;
  background-color: #f0f2f5;
  padding: 2px 8px;
  border-radius: 10px;
}

.empty-permission {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-tree-node__content) {
  height: 36px;
}

:deep(.el-card__body) {
  padding: 15px;
  height: calc(100% - 60px);
  overflow: hidden;
}
</style> 