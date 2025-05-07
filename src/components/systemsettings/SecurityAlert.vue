<template>
  <div class="security-alert-container">
    <el-card class="security-card">
      <template #header>
        <div class="card-header">
          <span>安全提醒</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="数据修改提醒" name="modifications">
          <div class="alert-content">
            <div class="section-header">
              <div class="section-title">重要数据修改提醒</div>
              <div class="section-actions">
                <el-switch
                  v-model="notificationEnabled"
                  active-text="开启提醒"
                  inactive-text="关闭提醒"
                  @change="handleNotificationChange"
                />
                <el-tooltip content="设置提醒方式" placement="top">
                  <el-button type="primary" :icon="Setting" circle size="small" @click="showNotificationSettings = true"></el-button>
                </el-tooltip>
              </div>
            </div>
            
            <el-divider />
            
            <div class="alert-list">
              <el-table :data="modificationAlerts" style="width: 100%" v-loading="loading" border>
                <el-table-column type="expand">
                  <template #default="props">
                    <div class="detail-box">
                      <div class="detail-item">
                        <span class="detail-label">修改内容：</span>
                        <div class="detail-changes">
                          <div v-for="(change, index) in props.row.changes" :key="index" class="change-item">
                            <span class="field-name">{{ change.field }}：</span>
                            <span class="old-value">{{ change.oldValue }}</span>
                            <el-icon><ArrowRight /></el-icon>
                            <span class="new-value">{{ change.newValue }}</span>
                          </div>
                        </div>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">修改原因：</span>
                        <span>{{ props.row.reason }}</span>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="time" label="时间" width="160" sortable />
                <el-table-column prop="module" label="修改模块" width="120" />
                <el-table-column prop="operator" label="操作人" width="120" />
                <el-table-column prop="type" label="修改类型" width="100">
                  <template #default="scope">
                    <el-tag :type="getTypeTagType(scope.row.type)">{{ scope.row.type }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="提醒状态" width="100">
                  <template #default="scope">
                    <el-tag :type="scope.row.status === '已提醒' ? 'success' : 'warning'">
                      {{ scope.row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="150">
                  <template #default="scope">
                    <el-button 
                      type="primary" 
                      size="small" 
                      :disabled="scope.row.status === '已提醒'"
                      @click="markAsNotified(scope.row)"
                    >
                      标记为已提醒
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              
              <div class="pagination-container">
                <el-pagination
                  background
                  layout="total, prev, pager, next"
                  :total="totalAlerts"
                  :page-size="10"
                  @current-change="handleCurrentChange"
                />
              </div>
            </div>

            <!-- 提醒设置对话框 -->
            <el-dialog
              v-model="showNotificationSettings"
              title="提醒设置"
              width="500px"
            >
              <el-form :model="notificationSettings" label-width="120px">
                <el-form-item label="提醒方式">
                  <el-checkbox-group v-model="notificationSettings.methods">
                    <el-checkbox label="email">邮件提醒</el-checkbox>
                    <el-checkbox label="sms">短信提醒</el-checkbox>
                    <el-checkbox label="system">系统内提醒</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                <el-form-item label="提醒级别">
                  <el-radio-group v-model="notificationSettings.level">
                    <el-radio label="all">所有修改</el-radio>
                    <el-radio label="important">重要修改</el-radio>
                    <el-radio label="critical">关键修改</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="接收人员">
                  <el-select v-model="notificationSettings.recipients" multiple placeholder="请选择接收人员">
                    <el-option
                      v-for="item in recipientOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-form>
              <template #footer>
                <span class="dialog-footer">
                  <el-button @click="showNotificationSettings = false">取消</el-button>
                  <el-button type="primary" @click="saveNotificationSettings">保存</el-button>
                </span>
              </template>
            </el-dialog>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="数据备份" name="backup">
          <div class="alert-content">
            <div class="section-header">
              <div class="section-title">数据备份管理</div>
              <div class="section-actions">
                <el-button type="primary" @click="createBackup">创建备份</el-button>
                <el-button type="success" @click="setupAutoBackup">设置自动备份</el-button>
              </div>
            </div>
            
            <el-divider />
            
            <div class="alert-list">
              <el-table :data="backupRecords" style="width: 100%" v-loading="backupLoading" border>
                <el-table-column prop="time" label="备份时间" width="160" sortable />
                <el-table-column prop="name" label="备份名称" />
                <el-table-column prop="type" label="备份类型" width="100">
                  <template #default="scope">
                    <el-tag :type="scope.row.type === '自动' ? 'info' : 'success'">
                      {{ scope.row.type }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="size" label="备份大小" width="100" />
                <el-table-column prop="modules" label="备份模块" width="180">
                  <template #default="scope">
                    <el-tag 
                      v-for="module in scope.row.modules" 
                      :key="module" 
                      class="module-tag"
                      size="small"
                    >
                      {{ module }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="scope">
                    <el-tag :type="getBackupStatusType(scope.row.status)">
                      {{ scope.row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="200">
                  <template #default="scope">
                    <el-button type="success" size="small" @click="downloadBackup(scope.row)">下载</el-button>
                    <el-button type="danger" size="small" @click="deleteBackup(scope.row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              
              <div class="pagination-container">
                <el-pagination
                  background
                  layout="total, prev, pager, next"
                  :total="totalBackups"
                  :page-size="10"
                  @current-change="handleBackupPageChange"
                />
              </div>
            </div>

            <!-- 创建备份对话框 -->
            <el-dialog
              v-model="showCreateBackup"
              title="创建数据备份"
              width="550px"
            >
              <el-form :model="backupForm" label-width="100px">
                <el-form-item label="备份名称">
                  <el-input v-model="backupForm.name" placeholder="请输入备份名称" />
                </el-form-item>
                <el-form-item label="备份模块">
                  <el-checkbox-group v-model="backupForm.modules">
                    <el-checkbox label="用户数据">用户数据</el-checkbox>
                    <el-checkbox label="交易数据">交易数据</el-checkbox>
                    <el-checkbox label="合同数据">合同数据</el-checkbox>
                    <el-checkbox label="系统配置">系统配置</el-checkbox>
                    <el-checkbox label="日志数据">日志数据</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                <el-form-item label="备份描述">
                  <el-input v-model="backupForm.description" type="textarea" rows="3" placeholder="请输入备份描述" />
                </el-form-item>
              </el-form>
              <template #footer>
                <span class="dialog-footer">
                  <el-button @click="showCreateBackup = false">取消</el-button>
                  <el-button type="primary" @click="confirmCreateBackup" :loading="backupCreating">
                    {{ backupCreating ? '备份中...' : '开始备份' }}
                  </el-button>
                </span>
              </template>
            </el-dialog>

            <!-- 自动备份设置对话框 -->
            <el-dialog
              v-model="showAutoBackupSettings"
              title="自动备份设置"
              width="550px"
            >
              <el-form :model="autoBackupSettings" label-width="120px">
                <el-form-item label="启用自动备份">
                  <el-switch v-model="autoBackupSettings.enabled" />
                </el-form-item>
                <el-form-item label="备份频率">
                  <el-select v-model="autoBackupSettings.frequency" style="width: 100%">
                    <el-option label="每天" value="daily" />
                    <el-option label="每周" value="weekly" />
                    <el-option label="每月" value="monthly" />
                  </el-select>
                </el-form-item>
                <el-form-item label="备份时间" v-if="autoBackupSettings.frequency === 'daily'">
                  <el-time-picker v-model="autoBackupSettings.time" format="HH:mm" style="width: 100%" />
                </el-form-item>
                <el-form-item label="备份日期" v-if="autoBackupSettings.frequency === 'weekly'">
                  <el-select v-model="autoBackupSettings.day" style="width: 100%">
                    <el-option label="星期一" value="1" />
                    <el-option label="星期二" value="2" />
                    <el-option label="星期三" value="3" />
                    <el-option label="星期四" value="4" />
                    <el-option label="星期五" value="5" />
                    <el-option label="星期六" value="6" />
                    <el-option label="星期日" value="0" />
                  </el-select>
                </el-form-item>
                <el-form-item label="备份日期" v-if="autoBackupSettings.frequency === 'monthly'">
                  <el-select v-model="autoBackupSettings.date" style="width: 100%">
                    <el-option v-for="i in 28" :key="i" :label="`${i}日`" :value="i" />
                  </el-select>
                </el-form-item>
                <el-form-item label="保留备份数量">
                  <el-input-number v-model="autoBackupSettings.keepCount" :min="1" :max="30" style="width: 100%" />
                </el-form-item>
                <el-form-item label="备份模块">
                  <el-checkbox-group v-model="autoBackupSettings.modules">
                    <el-checkbox label="用户数据">用户数据</el-checkbox>
                    <el-checkbox label="交易数据">交易数据</el-checkbox>
                    <el-checkbox label="合同数据">合同数据</el-checkbox>
                    <el-checkbox label="系统配置">系统配置</el-checkbox>
                    <el-checkbox label="日志数据">日志数据</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
              </el-form>
              <template #footer>
                <span class="dialog-footer">
                  <el-button @click="showAutoBackupSettings = false">取消</el-button>
                  <el-button type="primary" @click="saveAutoBackupSettings">保存</el-button>
                </span>
              </template>
            </el-dialog>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="版本回滚" name="rollback">
          <div class="alert-content">
            <div class="section-header">
              <div class="section-title">系统版本管理</div>
              <div class="section-actions">
                <el-select v-model="selectedModule" placeholder="选择模块" style="width: 150px;">
                  <el-option
                    v-for="item in moduleOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <el-button type="primary" @click="checkSystemVersions">刷新版本</el-button>
              </div>
            </div>
            
            <el-divider />
            
            <div class="alert-list">
              <el-timeline>
                <el-timeline-item
                  v-for="version in filteredVersions"
                  :key="version.id"
                  :timestamp="version.time"
                  :type="getVersionTimelineType(version)"
                  :color="getVersionTimelineColor(version)"
                  size="large"
                >
                  <div class="version-item">
                    <div class="version-header">
                      <span class="version-name">{{ version.name }}</span>
                      <el-tag size="small" :type="version.current ? 'success' : ''">
                        {{ version.current ? '当前版本' : `V${version.version}` }}
                      </el-tag>
                    </div>
                    
                    <div class="version-info">
                      <div class="version-operator">操作人: {{ version.operator }}</div>
                      <div class="version-desc">{{ version.description }}</div>
                      
                      <div class="version-changes" v-if="version.changes && version.changes.length">
                        <div class="change-title">变更内容:</div>
                        <div class="change-list">
                          <div v-for="(change, index) in version.changes" :key="index" class="change-item">
                            <el-tag size="small" :type="getChangeTypeColor(change.type)" class="change-tag">
                              {{ change.type }}
                            </el-tag>
                            {{ change.content }}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div class="version-actions">
                      <el-tooltip content="查看详情" placement="top">
                        <el-button
                          type="info"
                          size="small"
                          circle
                          :icon="Document"
                          @click="viewVersionDetail(version)"
                        ></el-button>
                      </el-tooltip>
                      <el-tooltip content="回滚到此版本" placement="top">
                        <el-button
                          type="warning"
                          size="small"
                          circle
                          :icon="RefreshLeft"
                          :disabled="version.current"
                          @click="confirmRollback(version)"
                        ></el-button>
                      </el-tooltip>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
              
              <div v-if="filteredVersions.length === 0" class="empty-versions">
                <el-empty description="暂无版本历史记录" />
              </div>
            </div>

            <!-- 版本详情对话框 -->
            <el-dialog
              v-model="showVersionDetail"
              title="版本详情"
              width="650px"
            >
              <div v-if="currentDetailVersion" class="version-detail">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="版本名称" :span="2">
                    {{ currentDetailVersion.name }}
                  </el-descriptions-item>
                  <el-descriptions-item label="版本号">
                    V{{ currentDetailVersion.version }}
                  </el-descriptions-item>
                  <el-descriptions-item label="发布时间">
                    {{ currentDetailVersion.time }}
                  </el-descriptions-item>
                  <el-descriptions-item label="操作人">
                    {{ currentDetailVersion.operator }}
                  </el-descriptions-item>
                  <el-descriptions-item label="状态">
                    <el-tag :type="currentDetailVersion.current ? 'success' : 'info'">
                      {{ currentDetailVersion.current ? '当前版本' : '历史版本' }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="描述" :span="2">
                    {{ currentDetailVersion.description }}
                  </el-descriptions-item>
                </el-descriptions>
                
                <div class="detail-section" v-if="currentDetailVersion.changes && currentDetailVersion.changes.length">
                  <div class="detail-title">变更列表</div>
                  <el-table :data="currentDetailVersion.changes" style="width: 100%" border>
                    <el-table-column prop="type" label="变更类型" width="100">
                      <template #default="scope">
                        <el-tag :type="getChangeTypeColor(scope.row.type)">
                          {{ scope.row.type }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="content" label="变更内容" />
                    <el-table-column prop="module" label="所属模块" width="120" />
                  </el-table>
                </div>
                
                <div class="detail-section" v-if="currentDetailVersion.files && currentDetailVersion.files.length">
                  <div class="detail-title">变更文件</div>
                  <el-table :data="currentDetailVersion.files" style="width: 100%" border>
                    <el-table-column prop="name" label="文件名称" />
                    <el-table-column prop="path" label="文件路径" show-overflow-tooltip />
                    <el-table-column prop="type" label="变更类型" width="100">
                      <template #default="scope">
                        <el-tag :type="getChangeTypeColor(scope.row.type)">
                          {{ scope.row.type }}
                        </el-tag>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </el-dialog>

            <!-- 回滚确认对话框 -->
            <el-dialog
              v-model="showRollbackConfirm"
              title="版本回滚确认"
              width="550px"
            >
              <div v-if="rollbackTarget" class="rollback-confirm">
                <el-alert
                  title="警告：回滚操作将会改变系统当前状态，请谨慎操作！"
                  type="warning"
                  :closable="false"
                  show-icon
                ></el-alert>
                
                <div class="rollback-info">
                  <p>您即将将系统回滚到以下版本：</p>
                  <div class="version-tag">{{ rollbackTarget.name }} (V{{ rollbackTarget.version }})</div>
                  <p>发布时间：{{ rollbackTarget.time }}</p>
                  <p>操作人：{{ rollbackTarget.operator }}</p>
                </div>
                
                <el-form :model="rollbackForm" label-width="100px">
                  <el-form-item label="回滚原因" required>
                    <el-input
                      v-model="rollbackForm.reason"
                      type="textarea"
                      rows="3"
                      placeholder="请输入回滚原因"
                    ></el-input>
                  </el-form-item>
                  <el-form-item label="是否备份">
                    <el-switch v-model="rollbackForm.backup" />
                    <span class="form-tip">建议在回滚前创建当前版本的备份</span>
                  </el-form-item>
                </el-form>
              </div>
              <template #footer>
                <span class="dialog-footer">
                  <el-button @click="showRollbackConfirm = false">取消</el-button>
                  <el-button type="warning" @click="executeRollback" :loading="rollingBack">
                    {{ rollingBack ? '回滚中...' : '确认回滚' }}
                  </el-button>
                </span>
              </template>
            </el-dialog>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting, ArrowRight, Document, RefreshLeft } from '@element-plus/icons-vue'

// 设置组件名，以匹配路由
defineOptions({
  name: 'SecurityAlerts'
})

// 当前活动标签页
const activeTab = ref('modifications')

// 加载状态
const loading = ref(false)
const backupLoading = ref(false)

// 数据修改提醒相关
const notificationEnabled = ref(true)
const showNotificationSettings = ref(false)
const totalAlerts = ref(32)

// 版本回滚相关
const versionsLoading = ref(false)
const selectedModule = ref('all')
const showVersionDetail = ref(false)
const showRollbackConfirm = ref(false)
const currentDetailVersion = ref(null)
const rollbackTarget = ref(null)
const rollingBack = ref(false)

// 回滚表单
const rollbackForm = ref({
  reason: '',
  backup: true
})

// 模块选项
const moduleOptions = [
  { value: 'all', label: '全部模块' },
  { value: 'user', label: '用户管理' },
  { value: 'trade', label: '交易管理' },
  { value: 'contract', label: '合同管理' },
  { value: 'config', label: '系统配置' }
]

// 版本历史数据
const versionHistory = ref([
  {
    id: '1',
    version: '1.5.2',
    name: '功能更新版本',
    time: '2024-06-10 14:30:00',
    operator: '系统管理员',
    description: '添加数据分析模块和权限优化',
    current: true,
    module: 'all',
    changes: [
      { type: '新增', content: '添加数据分析模块', module: '数据分析' },
      { type: '优化', content: '优化权限管理界面', module: '权限管理' },
      { type: '修复', content: '修复数据导出功能的BUG', module: '数据导出' }
    ],
    files: [
      { name: 'DataAnalysis.vue', path: '/src/components/analysis/DataAnalysis.vue', type: '新增' },
      { name: 'PermissionManagement.vue', path: '/src/components/system/PermissionManagement.vue', type: '修改' },
      { name: 'DataExport.js', path: '/src/utils/DataExport.js', type: '修改' }
    ]
  },
  {
    id: '2',
    version: '1.5.1',
    name: '安全补丁版本',
    time: '2024-06-05 10:15:00',
    operator: '安全管理员',
    description: '修复安全漏洞和性能优化',
    current: false,
    module: 'config',
    changes: [
      { type: '修复', content: '修复登录模块的安全漏洞', module: '用户管理' },
      { type: '优化', content: '提升数据加载性能', module: '系统配置' }
    ],
    files: [
      { name: 'Login.vue', path: '/src/components/Login.vue', type: '修改' },
      { name: 'DataLoader.js', path: '/src/utils/DataLoader.js', type: '修改' }
    ]
  },
  {
    id: '3',
    version: '1.5.0',
    name: '电价规则更新版本',
    time: '2024-05-28 15:40:00',
    operator: '业务主管',
    description: '更新电价规则和计算逻辑',
    current: false,
    module: 'trade',
    changes: [
      { type: '更新', content: '更新峰谷电价计算规则', module: '交易管理' },
      { type: '新增', content: '添加电价预测功能', module: '交易管理' },
      { type: '修复', content: '修复结算计算错误', module: '交易管理' }
    ],
    files: [
      { name: 'PriceCalculator.js', path: '/src/utils/PriceCalculator.js', type: '修改' },
      { name: 'PriceForecast.vue', path: '/src/components/trade/PriceForecast.vue', type: '新增' },
      { name: 'Settlement.js', path: '/src/utils/Settlement.js', type: '修改' }
    ]
  },
  {
    id: '4',
    version: '1.4.2',
    name: '合同管理更新版本',
    time: '2024-05-15 09:20:00',
    operator: '产品经理',
    description: '优化合同管理功能和界面',
    current: false,
    module: 'contract',
    changes: [
      { type: '优化', content: '优化合同审批流程', module: '合同管理' },
      { type: '新增', content: '添加合同模板功能', module: '合同管理' },
      { type: '修复', content: '修复合同导出格式错误', module: '合同管理' }
    ],
    files: [
      { name: 'ContractApproval.vue', path: '/src/components/contract/ContractApproval.vue', type: '修改' },
      { name: 'ContractTemplate.vue', path: '/src/components/contract/ContractTemplate.vue', type: '新增' },
      { name: 'ContractExport.js', path: '/src/utils/ContractExport.js', type: '修改' }
    ]
  },
  {
    id: '5',
    version: '1.4.1',
    name: '用户管理更新版本',
    time: '2024-05-02 16:35:00',
    operator: '系统管理员',
    description: '完善用户管理和权限控制',
    current: false,
    module: 'user',
    changes: [
      { type: '新增', content: '添加用户分组功能', module: '用户管理' },
      { type: '优化', content: '优化权限分配界面', module: '用户管理' },
      { type: '修复', content: '修复用户检索功能', module: '用户管理' }
    ],
    files: [
      { name: 'UserGroups.vue', path: '/src/components/user/UserGroups.vue', type: '新增' },
      { name: 'PermissionAssign.vue', path: '/src/components/user/PermissionAssign.vue', type: '修改' },
      { name: 'UserSearch.js', path: '/src/utils/UserSearch.js', type: '修改' }
    ]
  }
])

// 筛选版本历史
const filteredVersions = computed(() => {
  if (selectedModule.value === 'all') {
    return versionHistory.value
  } else {
    return versionHistory.value.filter(v => v.module === selectedModule.value)
  }
})

// 数据备份相关
const totalBackups = ref(18)

// 备份表单
const backupForm = ref({
  name: '',
  modules: ['用户数据', '系统配置'],
  description: ''
})

// 自动备份设置
const autoBackupSettings = ref({
  enabled: true,
  frequency: 'daily',
  time: new Date(2024, 5, 1, 2, 0),
  day: '1',
  date: 1,
  keepCount: 7,
  modules: ['用户数据', '交易数据', '系统配置']
})

// 备份记录数据
const backupRecords = ref([
  {
    id: '1',
    time: '2024-06-11 02:00:00',
    name: '系统自动备份_20240611',
    type: '自动',
    size: '856MB',
    modules: ['用户数据', '交易数据', '系统配置'],
    status: '完成'
  },
  {
    id: '2',
    time: '2024-06-10 15:32:18',
    name: '系统发布前备份',
    type: '手动',
    size: '1.2GB',
    modules: ['用户数据', '交易数据', '合同数据', '系统配置', '日志数据'],
    status: '完成'
  },
  {
    id: '3',
    time: '2024-06-10 02:00:00',
    name: '系统自动备份_20240610',
    type: '自动',
    size: '845MB',
    modules: ['用户数据', '交易数据', '系统配置'],
    status: '完成'
  },
  {
    id: '4',
    time: '2024-06-09 02:00:00',
    name: '系统自动备份_20240609',
    type: '自动',
    size: '842MB',
    modules: ['用户数据', '交易数据', '系统配置'],
    status: '完成'
  },
  {
    id: '5',
    time: '2024-06-08 10:15:43',
    name: '电价规则更新前备份',
    type: '手动',
    size: '780MB',
    modules: ['交易数据', '系统配置'],
    status: '完成'
  }
])

// 接收人员选项
const recipientOptions = [
  { value: 'admin', label: '系统管理员' },
  { value: 'security', label: '安全管理员' },
  { value: 'manager', label: '部门经理' },
  { value: 'operator', label: '普通操作员' }
]

// 模拟数据修改提醒数据
const modificationAlerts = ref([
  {
    id: '1',
    time: '2024-06-11 10:25:36',
    module: '用户管理',
    operator: '系统管理员',
    type: '修改',
    status: '已提醒',
    reason: '用户角色更新，根据部门调整',
    changes: [
      { field: '用户角色', oldValue: '普通用户', newValue: '管理员' },
      { field: '权限状态', oldValue: '只读', newValue: '读写' }
    ]
  },
  {
    id: '2',
    time: '2024-06-10 16:42:18',
    module: '电价规则',
    operator: '审计员',
    type: '修改',
    status: '未提醒',
    reason: '基于最新政策调整峰谷电价',
    changes: [
      { field: '峰时电价', oldValue: '0.85元/kWh', newValue: '0.92元/kWh' },
      { field: '谷时电价', oldValue: '0.42元/kWh', newValue: '0.45元/kWh' }
    ]
  },
  {
    id: '3',
    time: '2024-06-09 14:15:22',
    module: '系统配置',
    operator: '系统管理员',
    type: '新增',
    status: '已提醒',
    reason: '添加新的安全策略',
    changes: [
      { field: '密码策略', oldValue: '无', newValue: '复杂度要求：高' },
      { field: '锁定策略', oldValue: '无', newValue: '失败5次后锁定' }
    ]
  },
  {
    id: '4',
    time: '2024-06-08 09:33:45',
    module: '合同管理',
    operator: '业务专员',
    type: '删除',
    status: '未提醒',
    reason: '合同到期自动归档',
    changes: [
      { field: '合同状态', oldValue: '有效', newValue: '已归档' }
    ]
  },
  {
    id: '5',
    time: '2024-06-07 11:20:31',
    module: '权限管理',
    operator: '系统管理员',
    type: '修改',
    status: '已提醒',
    reason: '安全审计要求调整权限',
    changes: [
      { field: '数据导出权限', oldValue: '允许', newValue: '需审批' },
      { field: '敏感数据查看', oldValue: '允许', newValue: '需审批' }
    ]
  }
])

// 页面加载时初始化
onMounted(() => {
  // 这里可以加载初始数据
})

// 获取修改类型对应的标签样式
const getTypeTagType = (type) => {
  switch (type) {
    case '新增':
      return 'success'
    case '修改':
      return 'warning'
    case '删除':
      return 'danger'
    default:
      return 'info'
  }
}

// 处理提醒开关变化
const handleNotificationChange = (value) => {
  ElMessage.success(`数据修改提醒已${value ? '开启' : '关闭'}`)
}

// 保存提醒设置
const saveNotificationSettings = () => {
  showNotificationSettings.value = false
  ElMessage.success('提醒设置已保存')
}

// 标记为已提醒
const markAsNotified = (row) => {
  row.status = '已提醒'
  ElMessage.success('已标记为已提醒')
}

// 处理分页变化
const handleCurrentChange = (page) => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 300)
}

// 获取备份状态对应的标签样式
const getBackupStatusType = (status) => {
  switch (status) {
    case '完成':
      return 'success'
    case '进行中':
      return 'warning'
    case '失败':
      return 'danger'
    default:
      return 'info'
  }
}

// 处理分页变化 - 备份列表
const handleBackupPageChange = (page) => {
  backupLoading.value = true
  setTimeout(() => {
    backupLoading.value = false
  }, 300)
}

// 创建备份
const createBackup = () => {
  backupForm.value = {
    name: `手动备份_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
    modules: ['用户数据', '系统配置'],
    description: ''
  }
  showCreateBackup.value = true
}

// 确认创建备份
const confirmCreateBackup = () => {
  if (!backupForm.value.name) {
    ElMessage.warning('请输入备份名称')
    return
  }
  if (backupForm.value.modules.length === 0) {
    ElMessage.warning('请选择至少一个备份模块')
    return
  }
  
  backupCreating.value = true
  
  // 模拟备份过程
  setTimeout(() => {
    backupCreating.value = false
    showCreateBackup.value = false
    
    // 添加新备份记录
    const newBackup = {
      id: Date.now().toString(),
      time: new Date().toLocaleString('zh-CN', { hour12: false }),
      name: backupForm.value.name,
      type: '手动',
      size: `${Math.floor(Math.random() * 500 + 500)}MB`,
      modules: [...backupForm.value.modules],
      status: '完成'
    }
    
    backupRecords.value.unshift(newBackup)
    ElMessage.success('数据备份创建成功')
    
  }, 2000)
}

// 设置自动备份
const setupAutoBackup = () => {
  showAutoBackupSettings.value = true
}

// 保存自动备份设置
const saveAutoBackupSettings = () => {
  if (autoBackupSettings.value.modules.length === 0) {
    ElMessage.warning('请选择至少一个备份模块')
    return
  }
  
  showAutoBackupSettings.value = false
  ElMessage.success('自动备份设置已保存')
}

// 下载备份
const downloadBackup = (backup) => {
  ElMessage.success(`正在下载备份: ${backup.name}`)
}

// 删除备份
const deleteBackup = (backup) => {
  ElMessageBox.confirm(
    `确定要删除备份"${backup.name}"吗？此操作不可恢复。`,
    '删除备份',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      backupLoading.value = true
      setTimeout(() => {
        backupRecords.value = backupRecords.value.filter(item => item.id !== backup.id)
        backupLoading.value = false
        ElMessage.success('备份已删除')
      }, 500)
    })
    .catch(() => {})
}

// 获取版本时间线类型
const getVersionTimelineType = (version) => {
  return version.current ? 'primary' : ''
}

// 获取版本时间线颜色
const getVersionTimelineColor = (version) => {
  return version.current ? '#409EFF' : ''
}

// 获取变更类型对应的颜色
const getChangeTypeColor = (type) => {
  switch (type) {
    case '新增':
      return 'success'
    case '修改':
    case '更新':
      return 'warning'
    case '删除':
      return 'danger'
    case '优化':
      return 'info'
    case '修复':
      return ''
    default:
      return 'info'
  }
}

// 检查系统版本
const checkSystemVersions = () => {
  versionsLoading.value = true
  setTimeout(() => {
    versionsLoading.value = false
    ElMessage.success('版本信息已更新')
  }, 800)
}

// 查看版本详情
const viewVersionDetail = (version) => {
  currentDetailVersion.value = version
  showVersionDetail.value = true
}

// 确认回滚
const confirmRollback = (version) => {
  rollbackTarget.value = version
  rollbackForm.value = {
    reason: '',
    backup: true
  }
  showRollbackConfirm.value = true
}

// 执行回滚
const executeRollback = () => {
  if (!rollbackForm.value.reason) {
    ElMessage.warning('请输入回滚原因')
    return
  }
  
  rollingBack.value = true
  
  // 模拟回滚过程
  setTimeout(() => {
    // 创建备份
    if (rollbackForm.value.backup) {
      const backupName = `回滚前备份_V${versionHistory.value.find(v => v.current).version}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
      // 这里可以调用创建备份的逻辑
    }
    
    // 更新当前版本标记
    versionHistory.value.forEach(v => {
      v.current = v.id === rollbackTarget.value.id
    })
    
    rollingBack.value = false
    showRollbackConfirm.value = false
    ElMessage.success(`系统已成功回滚到版本 ${rollbackTarget.value.name}`)
  }, 2000)
}
</script>

<style scoped>
.security-alert-container {
  width: 100%;
  height: 100%;
}

.security-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.section-actions {
  display: flex;
  gap: 10px;
}

.alert-content {
  min-height: 400px;
}

.alert-list {
  margin-top: 15px;
}

.detail-box {
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.detail-item {
  margin-bottom: 10px;
}

.detail-label {
  font-weight: bold;
  color: #606266;
  margin-right: 5px;
}

.detail-changes {
  margin-top: 5px;
  padding-left: 10px;
}

.change-item {
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.field-name {
  font-weight: bold;
  color: #606266;
}

.old-value {
  text-decoration: line-through;
  color: #f56c6c;
}

.new-value {
  color: #67c23a;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 数据备份模块样式 */
.module-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

/* 版本回滚模块样式 */
.version-item {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 10px;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.version-name {
  font-size: 15px;
  font-weight: bold;
}

.version-info {
  margin-bottom: 10px;
}

.version-operator {
  font-size: 13px;
  color: #606266;
  margin-bottom: 5px;
}

.version-desc {
  color: #303133;
  margin-bottom: 8px;
}

.version-changes {
  margin-top: 8px;
}

.change-title {
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 5px;
}

.change-list {
  padding-left: 5px;
}

.change-tag {
  margin-right: 5px;
}

.version-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.version-detail {
  padding: 5px;
}

.detail-section {
  margin-top: 20px;
}

.detail-title {
  font-size: 15px;
  font-weight: bold;
  margin-bottom: 10px;
  padding-left: 5px;
  border-left: 3px solid #409EFF;
}

.rollback-confirm {
  padding: 5px;
}

.rollback-info {
  margin: 15px 0;
}

.version-tag {
  font-size: 16px;
  font-weight: bold;
  color: #f56c6c;
  padding: 5px 0;
}

.form-tip {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}

.empty-versions {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

:deep(.el-card__body) {
  padding: 15px;
  height: calc(100% - 60px);
  overflow: auto;
}
</style> 