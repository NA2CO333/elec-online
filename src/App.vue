<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Calendar, Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

// 确保dayjs使用中文
dayjs.locale('zh-cn')

// 定义标签页接口
interface TabItem {
  title: string;
  name: string;
  path: string;
}

// 定义搜索菜单项接口
interface SearchMenuItem {
  value: string;
  menuId: string;
  path: string;
}

const router = useRouter()
const route = useRoute()

// 搜索相关
const searchText = ref('')
const searchResults = ref<SearchMenuItem[]>([])

// 侧边栏折叠状态
const isCollapse = ref(false)

// 标签页列表
const tabsList = ref<TabItem[]>([])
const activeTabName = ref('')

// 定义菜单项接口
interface MenuItem {
  id: string;
  title: string;
  icon?: string;
  children?: MenuItem[];
}

// 顶部导航菜单
const topNavItems: MenuItem[] = [
  { id: '1', title: '业务关系' },
  { id: '2', title: '交易辅助' },
  { id: '3', title: '数据汇报' },
  { id: '4', title: '数据仓库' },
  { id: '5', title: '系统管理' }
]

// 当前激活的顶部导航
const activeTopNav = ref('1')

// 菜单标题和路由映射
const menuTitleMap: Record<string, string> = {
  // 侧边栏一级菜单
  '1': '客户档案',
  '2': '经纪人档案',
  '3': '客户分析',
  '4': '中长期交易',
  '5': '现货交易',
  '6': '客户数据',
  '7': '市场数据',
  '8': '气象数据',
  '9': '系统设置',
  
  // 档案管理
  '1-1': '客户档案',
  '1-2': '经纪人档案',
  
  // 客户分析
  '2-1': '客户电量管理',
  '2-2': '电量偏差：预测vs实际',
  '2-3': '电量变化：现在vs从前',
  '2-4': '价格偏差：日前vs实时',
  '2-5': '价格变化：现在vs从前',

  // 中长期交易
  '3-1': '合约统计(按月)',
  '3-2': '合约统计(按时)',
  '3-3': '曲线分解',
  '3-4': '批发交易复盘',
  
  // 现货交易
  '4-1': '日总电量预测',
  '4-2': '分时电量预测',
  '4-3': '日前博弈套利',
  
  // 经营分析
  '5-1': '每日盈利、价格趋势',
  '5-2': '月度核心指标',
  '5-3': '月度成本构成与利润',
  '5-4': '客户关联指标',
  
  // 客户数据
  '6-1': '客户购电合同条款',
  '6-2': '客户增值服务合同条款',
  '6-3': '客户电量数据',
  
  // 系统设置
  '9-1': '系统日志',
  '9-2': '权限管理',
  '9-3': '安全提醒',
  
  // 日程管理
  'schedule': '日程管理'
}

// 菜单对应路由
const menuRouteMap: Record<string, string> = {
  // 档案管理
  '1-1': '/user-archives',
  '1-2': '/broker-archives',
  
  // 客户分析
  '2-1': '/user-electricity',
  '2-2': '/consumption-deviation',
  '2-3': '/consumption-variation',
  '2-4': '/price-deviation',
  '2-5': '/price-variation',

  // 中长期交易
  '3-1': '/contract-statistics-month',
  '3-2': '/contract-statistics-hour',
  '3-3': '/curve-decomposition',
  '3-4': '/wholesale-review',
  
  // 现货交易
  '4-1': '/daily-forecast',
  '4-2': '/hourly-forecast',
  '4-3': '/day-ahead-arbitrage',
  
  // 经营分析
  '5-1': '/dailyprofit',
  '5-2': '/monthly-core-indicators',
  '5-3': '/monthly-profit',
  '5-4': '/user-related-metrics',
  
  // 客户数据
  '6-1': '/customer-purchase-contract',
  '6-2': '/customer-service-contract',
  '6-3': '/customer-electricity-data',
  
  // 市场数据
  '7': '/market-data',
  
  // 气象数据
  '8': '/weather-data',
  
  // 系统设置
  '9-1': '/system-log',
  '9-2': '/permission-management',
  '9-3': '/security-alerts',
  
  // 日程管理
  'schedule': '/schedule-management'
}

// 侧边栏菜单数据
const allMenuItems: Record<string, MenuItem[]> = {
  // 业务关系
  '1': [
    {
      id: '1',
      title: '档案管理',
      icon: 'Folder',
      children: [
        { id: '1-1', title: '客户档案' },
        { id: '1-2', title: '经纪人档案' }
      ]
    }
  ],
  // 交易辅助
  '2': [
    {
      id: '2',
      title: '客户分析',
      icon: 'DataAnalysis',
      children: [
        { id: '2-1', title: '客户电量管理' },
        { id: '2-2', title: '电量偏差：预测vs实际' },
        { id: '2-3', title: '电量变化：现在vs从前' },
        { id: '2-4', title: '价格偏差：日前vs实时' },
        { id: '2-5', title: '价格变化：现在vs从前' }
      ]
    },
    {
      id: '3',
      title: '中长期交易',
      icon: 'Operation',
      children: [
        { id: '3-1', title: '合约统计(按月)' },
        { id: '3-2', title: '合约统计(按时)' },
        { id: '3-3', title: '曲线分解' },
        { id: '3-4', title: '批发交易复盘' }
      ]
    },
    {
      id: '4',
      title: '现货交易',
      icon: 'Money',
      children: [
        { id: '4-1', title: '日总电量预测' },
        { id: '4-2', title: '分时电量预测' },
        { id: '4-3', title: '日前博弈套利' }
      ]
    }
  ],
  // 数据汇报
  '3': [
    {
      id: '5',
      title: '经营分析',
      icon: 'TrendCharts',
      children: [
        { id: '5-1', title: '每日盈利、价格趋势' },
        { id: '5-2', title: '月度核心指标' },
        { id: '5-3', title: '月度成本构成与利润' },
        { id: '5-4', title: '客户关联指标' }
      ]
    }
  ],
  // 数据仓库
  '4': [
    {
      id: '6',
      title: '客户数据',
      icon: 'User',
      children: [
        { id: '6-1', title: '客户购电合同条款' },
        { id: '6-2', title: '客户增值服务合同条款' },
        { id: '6-3', title: '客户电量数据' }
      ]
    },
    {
      id: '7',
      title: '市场数据',
      icon: 'PieChart',
      children: []
    },
    {
      id: '8',
      title: '气象数据',
      icon: 'Cloudy',
      children: []
    }
  ],
  // 系统管理
  '5': [
    {
      id: '9',
      title: '系统设置',
      icon: 'Setting',
      children: [
        { id: '9-1', title: '系统日志' },
        { id: '9-2', title: '权限管理' },
        { id: '9-3', title: '安全提醒' }
      ]
    }
  ]
}

// 当前显示的侧边栏菜单
const menuItems = ref<MenuItem[]>(allMenuItems['1'])

// 单独的菜单项（没有子菜单）
const singleMenuItems = ref<MenuItem[]>([])

// 构建所有可搜索的菜单项
const allSearchableMenuItems = computed(() => {
  const items: SearchMenuItem[] = []
  
  // 添加所有菜单项
  Object.entries(menuTitleMap).forEach(([id, title]) => {
    // 构建菜单路径描述
    let path = ''
    if (id.includes('-')) {
      const [parentId, _] = id.split('-')
      const topNavId = Object.keys(allMenuItems).find(key => {
        return allMenuItems[key].some(menu => {
          return menu.children?.some(subMenu => subMenu.id === id)
        })
      }) || ''
      
      if (topNavId) {
        const topNavTitle = topNavItems.find(item => item.id === topNavId)?.title || ''
        const parentMenu = allMenuItems[topNavId].find(menu => menu.children?.some(subMenu => subMenu.id === id))
        if (parentMenu) {
          path = `${topNavTitle} > ${parentMenu.title} > ${title}`
        }
      }
    } else {
      // 处理单独的菜单项（市场数据、气象数据等）
      const topNavId = '4' // 它们在数据仓库下
      const topNavTitle = topNavItems.find(item => item.id === topNavId)?.title || ''
      path = `${topNavTitle} > ${title}`
    }
    
    items.push({
      value: title,
      menuId: id,
      path
    })
  })
  
  return items
})

// 搜索菜单项方法
const queryMenuItems = (queryString: string, callback: (arg: SearchMenuItem[]) => void) => {
  if (queryString) {
    const results = allSearchableMenuItems.value.filter(item => {
      return item.value.toLowerCase().includes(queryString.toLowerCase()) ||
             item.path.toLowerCase().includes(queryString.toLowerCase())
    })
    callback(results)
  } else {
    callback([])
  }
}

// 处理搜索选择
const handleSearchSelect = (item: SearchMenuItem) => {
  const menuId = item.menuId
  const path = menuRouteMap[menuId]
  
  if (path) {
    // 找到对应的顶部导航并切换
    const topNavId = findTopNavForMenu(menuId)
      if (topNavId && topNavId !== activeTopNav.value) {
      // 切换顶部导航，这会触发侧边栏菜单的更新
        handleTopNavClick(topNavId)
      }
    
    // 设置激活的菜单
    activeMenu.value = menuId
    
    // 添加标签并导航
    addTab(menuId)
    router.push(path)
    searchText.value = '' // 清空搜索框
  }
}

// 处理顶部导航菜单点击
const handleTopNavClick = (index: string): void => {
  activeTopNav.value = index
  
  // 更新侧边栏菜单
  menuItems.value = allMenuItems[index]
  
  // 过滤出单独的菜单项
  updateSingleMenuItems()
  
  // 更新默认展开的菜单
  updateDefaultOpeneds()
  
  // 如果不是从子菜单点击过来的，可以重置当前激活的菜单项
  // 如果是从子菜单点击过来的，则保持该子菜单激活状态
  if (!activeMenu.value || !findMenuInTopNav(activeMenu.value, index)) {
  activeMenu.value = ''
  }
}

// 检查菜单项是否在指定的顶部导航下
const findMenuInTopNav = (menuId: string, topNavId: string): boolean => {
  // 检查单独的菜单项
  if (topNavId === '4' && ['7', '8'].includes(menuId)) {
    return true
  }
  
  // 检查带子菜单的菜单项
  return allMenuItems[topNavId].some(menu => {
    return menu.id === menuId || (menu.children && menu.children.some(subMenu => subMenu.id === menuId))
  })
}

// 处理子菜单点击
const handleSubMenuClick = (menuId: string): void => {
  // 根据菜单ID找到对应的顶部导航
  const topNavId = findTopNavForMenu(menuId)
  
  // 如果找到了顶部导航且与当前激活的不同，则切换顶部导航
  if (topNavId && topNavId !== activeTopNav.value) {
    handleTopNavClick(topNavId)
  }
  
  // 设置activeMenu，以便高亮显示
  activeMenu.value = menuId
  
  // 根据菜单ID导航到对应路由
  const route = menuRouteMap[menuId]
  if (route) {
    addTab(menuId)
    router.push(route)
  }
}

// 根据菜单ID找到对应的顶部导航
const findTopNavForMenu = (menuId: string): string | null => {
  // 处理特殊情况：市场数据和气象数据
  if (['7', '8'].includes(menuId)) {
    return '4' // 数据仓库
  }
  
  // 对于其他菜单项，查找对应的顶部导航
  for (const [navId, menus] of Object.entries(allMenuItems)) {
    for (const menu of menus) {
      // 检查一级菜单
      if (menu.id === menuId) {
        return navId
      }
      
      // 检查二级菜单
      if (menu.children) {
        for (const subMenu of menu.children) {
          if (subMenu.id === menuId) {
            return navId
          }
        }
      }
    }
  }
  
  return null
}

// 定义日程事件接口
interface ScheduleEvent {
  id: string;
  title: string;
  time: Date;
  type: string;
  location: string;
  description?: string;
}

// 引用日程组件
const scheduleRef = ref(null)

// 获取最新日程
const latestSchedule = ref<ScheduleEvent | null>(null)

// 打开添加日程对话框
const openAddSchedule = () => {
  // 添加标签并导航到日程管理
  const menuId = 'schedule'
  addTab(menuId)
  router.push('/schedule-management')
}

// 从本地存储加载最新日程
const loadLatestSchedule = () => {
  const savedSchedules = localStorage.getItem('schedules')
  if (savedSchedules) {
    try {
      const schedules = JSON.parse(savedSchedules).map((s: any) => ({
        ...s,
        time: new Date(s.time)
      }))
      
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const endOfDay = new Date(today)
      endOfDay.setHours(23, 59, 59, 999)
      
      // 优先获取今天的日程
      const todayEvents = schedules
        .filter((event: any) => {
          const eventTime = new Date(event.time)
          return eventTime >= today && eventTime <= endOfDay
        })
        .sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime())
      
      // 如果今天没有日程，则获取未来最近的日程
      if (todayEvents.length > 0) {
        // 获取今天最早的未开始日程，如果没有则获取最晚的已开始日程
        const currentTime = new Date()
        const upcomingTodayEvents = todayEvents.filter((e: any) => new Date(e.time) >= currentTime)
        const latestEvent = upcomingTodayEvents.length > 0 ? 
          upcomingTodayEvents[0] : 
          todayEvents[todayEvents.length - 1]
          
        latestSchedule.value = latestEvent as ScheduleEvent
      } else {
        // 如果今天没有日程，获取未来最近的日程
        const futureEvents = schedules
          .filter((event: any) => new Date(event.time) > endOfDay)
          .sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime())
        
        if (futureEvents.length > 0) {
          latestSchedule.value = futureEvents[0] as ScheduleEvent
        } else {
          latestSchedule.value = null
        }
      }
    } catch (error) {
      console.error('Error loading schedules:', error)
    }
  }
}

// 格式化日期时间
const formatScheduleTime = (date: Date) => {
  const today = new Date()
  const scheduleDate = new Date(date)
  
  // 判断是否是今天
  if (scheduleDate.getDate() === today.getDate() && 
      scheduleDate.getMonth() === today.getMonth() && 
      scheduleDate.getFullYear() === today.getFullYear()) {
    // 今天的日程只显示时间
    return `今天 ${dayjs(date).format('HH:mm')}`
  } else {
    // 未来日程显示日期和时间
    return dayjs(date).format('MM/DD HH:mm')
  }
}

// 更新单独的菜单项
const updateSingleMenuItems = (): void => {
  singleMenuItems.value = []
  
  if (activeTopNav.value === '4') {
    singleMenuItems.value = [
      { id: '7', title: '市场数据', icon: 'PieChart' },
      { id: '8', title: '气象数据', icon: 'Cloudy' }
    ]
    
    // 从主菜单中移除
    menuItems.value = menuItems.value.filter(item => !['7', '8'].includes(item.id))
  }
}

// 当前激活的菜单项
const activeMenu = ref('')
const defaultOpeneds = ref(['1', '2', '3', '4', '5', '6', '9'])

// 更新默认展开的菜单
const updateDefaultOpeneds = (): void => {
  const ids = menuItems.value.map(item => item.id)
  defaultOpeneds.value = ids
}

// 处理侧边菜单点击
const handleMenuClick = (index: string): void => {
  activeMenu.value = index
  
  // 对于一级菜单，更新顶部导航
  const topNavId = findTopNavForMenu(index)
  if (topNavId && topNavId !== activeTopNav.value) {
    // 不调用handleTopNavClick以避免循环，直接更新activeTopNav
    activeTopNav.value = topNavId
  }
  
  // 根据菜单ID导航到对应路由
  const route = menuRouteMap[index]
  if (route) {
    addTab(index)
    router.push(route)
  } else if (index === '0') {
    // 首页
    router.push('/')
  }
}

// 添加标签页
const addTab = (menuId: string): void => {
  const title = menuTitleMap[menuId]
  const path = menuRouteMap[menuId]
  
  if (!title || !path) return
  
  // 检查标签是否已存在
  const existingTab = tabsList.value.find(tab => tab.name === menuId)
  if (!existingTab) {
    tabsList.value.push({
      title,
      name: menuId,
      path
    })
  }
  
  // 设置当前激活的标签
  activeTabName.value = menuId
}

// 移除标签页
const removeTab = (targetName: string): void => {
  // 获取标签列表
  const tabs = tabsList.value
  let activeName = activeTabName.value
  
  // 如果关闭的是当前激活的标签
  if (activeName === targetName) {
    // 找到下一个要激活的标签
    tabs.forEach((tab, index) => {
      if (tab.name === targetName) {
        const nextTab = tabs[index + 1] || tabs[index - 1]
        if (nextTab) {
          activeName = nextTab.name
        }
      }
    })
  }
  
  // 更新激活的标签
  activeTabName.value = activeName
  tabsList.value = tabs.filter(tab => tab.name !== targetName)
  
  // 如果还有标签，则导航到当前激活的标签
  if (activeName && tabsList.value.length > 0) {
    const activeTab = tabsList.value.find(tab => tab.name === activeName)
    if (activeTab) {
      router.push(activeTab.path)
    }
  } else {
    // 如果没有标签了，则导航到首页
    router.push('/')
  }
}

// 点击标签页
const clickTab = (tab: any): void => {
  const targetTab = tabsList.value.find(item => item.name === tab.props.name)
  if (targetTab) {
    router.push(targetTab.path)
  }
}

// 处理首页点击
const goHome = (): void => {
  activeMenu.value = '0'
  activeTopNav.value = '1' // 默认选中"业务关系"顶部导航
  
  // 更新侧边栏菜单
  menuItems.value = allMenuItems['1']
  updateSingleMenuItems()
  updateDefaultOpeneds()
  
  // 清除标签页列表中的激活状态
  activeTabName.value = ''
  
  // 导航到首页
  router.push('/')
}

// 处理退出登录
const handleLogout = (): void => {
  // 这里添加退出登录逻辑
  alert('退出登录功能开发中')
}

// 侧边栏折叠切换
const toggleCollapse = (): void => {
  isCollapse.value = !isCollapse.value
}

// 监听路由变化，添加标签页并更新导航状态
watch(() => route.path, (newPath) => {
  // 找到当前路径对应的菜单ID
  let currentMenuId = '';
  
  for (const [key, path] of Object.entries(menuRouteMap)) {
    if (path === newPath) {
      currentMenuId = key;
      addTab(key);
      
      // 设置激活的菜单
      activeMenu.value = key;
      
      // 找到对应的顶部导航并设置
      const topNavId = findTopNavForMenu(key);
      if (topNavId && topNavId !== activeTopNav.value) {
        activeTopNav.value = topNavId;
        menuItems.value = allMenuItems[topNavId];
        updateSingleMenuItems();
        updateDefaultOpeneds();
      }
      
      break;
    }
  }
  
  // 如果是首页
  if (newPath === '/' && !currentMenuId) {
    activeMenu.value = '0';
    if (activeTopNav.value !== '1') {
      activeTopNav.value = '1';
      menuItems.value = allMenuItems['1'];
      updateSingleMenuItems();
      updateDefaultOpeneds();
    }
  }
}, { immediate: true })

// 初始化
onMounted(() => {
  updateSingleMenuItems()
  loadLatestSchedule()
  
  // 每分钟更新一次最新日程
  setInterval(() => {
    loadLatestSchedule()
  }, 60000)
})

// 获取单独的菜单项（没有子菜单的二级菜单）
const getSingleMenuItems = (topNavId: string): MenuItem[] => {
  if (topNavId === '4') {
    return [
      { id: '7', title: '市场数据', icon: 'PieChart' },
      { id: '8', title: '气象数据', icon: 'Cloudy' }
    ]
  }
  return []
}
</script>

<template>
  <el-container class="layout-container">
    <!-- 左侧菜单 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="aside">
      <!-- 系统标题 -->
      <div class="system-title" :class="{ 'collapsed-title': isCollapse }" @click="goHome">
        <span v-if="!isCollapse">九州能源售电系统</span>
        <span v-else>九州</span>
      </div>
      
      <el-scrollbar class="menu-scrollbar">
        <el-menu
          :default-openeds="defaultOpeneds"
          :default-active="activeMenu"
          class="menu"
          @select="handleMenuClick"
          :collapse="isCollapse"
        >
          <!-- 有子菜单的项目 -->
          <el-sub-menu v-for="menu in menuItems" :key="menu.id" :index="menu.id">
            <template #title>
              <el-icon><component :is="menu.icon" /></el-icon>
              <span>{{ menu.title }}</span>
            </template>
            <el-menu-item 
              v-for="subMenu in menu.children" 
              :key="subMenu.id" 
              :index="subMenu.id"
            >
              {{ subMenu.title }}
            </el-menu-item>
          </el-sub-menu>
          
          <!-- 没有子菜单的项目 -->
          <el-menu-item 
            v-for="menu in singleMenuItems" 
            :key="menu.id" 
            :index="menu.id"
          >
            <el-icon><component :is="menu.icon" /></el-icon>
            <span>{{ menu.title }}</span>
          </el-menu-item>
        </el-menu>
      </el-scrollbar>
      
      <!-- 收缩按钮 -->
      <div class="collapse-btn" @click="toggleCollapse">
        <el-icon :size="20" v-if="!isCollapse"><Fold /></el-icon>
        <el-icon :size="20" v-else><Expand /></el-icon>
      </div>
    </el-aside>
    
    <el-container>
      <!-- 顶部标题栏 -->
      <el-header class="header">
        <div class="header-container">
          <!-- 导航菜单下拉图标 -->
          <div class="left-header-section">
            <div class="menu-dropdown" tabindex="-1">
              <el-dropdown trigger="hover" @command="handleTopNavClick" placement="bottom-start" tabindex="-1">
                <div class="menu-icon" tabindex="-1">
                  <el-icon :size="24"><Menu /></el-icon>
                </div>
                <template #dropdown>
                  <el-dropdown-menu class="full-menu-dropdown">
                    <div class="menu-container">
                      <!-- 一级菜单 -->
                      <div class="menu-column">
                        <!-- 业务关系 -->
                        <div class="top-menu-item" :class="{'active-menu': activeTopNav === '1'}" @click="handleTopNavClick('1')">
                          <div class="menu-border"></div>
                          <div class="menu-text">业务关系</div>
                        </div>
                        
                        <!-- 档案管理 -->
                        <div class="secondary-menu-group">
                          <div class="folder-icon">
                            <el-icon><Folder /></el-icon>
                            档案管理
                          </div>
                          <div class="third-menu-item" @click="handleSubMenuClick('1-1')">客户档案</div>
                          <div class="third-menu-item" @click="handleSubMenuClick('1-2')">经纪人档案</div>
                        </div>
                      </div>
                      
                      <!-- 交易辅助 -->
                      <div class="menu-column">
                        <div class="top-menu-item" :class="{'active-menu': activeTopNav === '2'}" @click="handleTopNavClick('2')">
                          <div class="menu-border"></div>
                          <div class="menu-text">交易辅助</div>
                        </div>
                        
                        <!-- 客户分析 -->
                        <div class="secondary-menu-group">
                          <div class="folder-icon">
                            <el-icon><DataAnalysis /></el-icon>
                            客户分析
                          </div>
                          <div class="third-menu-item" @click="handleSubMenuClick('2-1')">客户电量管理</div>
                          <div class="third-menu-item" @click="handleSubMenuClick('2-2')">电量偏差：预测vs实际</div>
                          <div class="third-menu-item" @click="handleSubMenuClick('2-3')">电量变化：现在vs从前</div>
                          <div class="third-menu-item" @click="handleSubMenuClick('2-4')">价格偏差：日前vs实时</div>
                          <div class="third-menu-item" @click="handleSubMenuClick('2-5')">价格变化：现在vs从前</div>
                        </div>
                        
                        <!-- 中长期交易 -->
                        <div class="secondary-menu-group">
                          <div class="folder-icon">
                            <el-icon><Operation /></el-icon>
                            中长期交易
                          </div>
                          <div class="third-menu-item" @click="handleSubMenuClick('3-1')">合约统计(按月)</div>
                          <div class="third-menu-item" @click="handleSubMenuClick('3-2')">合约统计(按时)</div>
                          <div class="third-menu-item" @click="handleSubMenuClick('3-3')">曲线分解</div>
                          <div class="third-menu-item" @click="handleSubMenuClick('3-4')">批发交易复盘</div>
                        </div>
                        
                        <!-- 现货交易 -->
                        <div class="secondary-menu-group">
                          <div class="folder-icon">
                            <el-icon><Money /></el-icon>
                            现货交易
                          </div>
                          <div class="third-menu-item" @click="handleSubMenuClick('4-1')">日总电量预测</div>
                          <div class="third-menu-item" @click="handleSubMenuClick('4-2')">分时电量预测</div>
                          <div class="third-menu-item" @click="handleSubMenuClick('4-3')">日前博弈套利</div>
                        </div>
                      </div>
                      
                      <!-- 数据汇报 -->
                      <div class="menu-column">
                        <div class="top-menu-item" :class="{'active-menu': activeTopNav === '3'}" @click="handleTopNavClick('3')">
                          <div class="menu-border"></div>
                          <div class="menu-text">数据汇报</div>
                        </div>
                        
                        <!-- 经营分析 -->
                        <div class="secondary-menu-group">
                          <div class="folder-icon">
                            <el-icon><TrendCharts /></el-icon>
                            经营分析
                          </div>
                          <div class="third-menu-item" @click="handleSubMenuClick('5-1')">每日盈利、价格趋势</div>
                          <div class="third-menu-item" @click="handleSubMenuClick('5-2')">月度核心指标</div>
                          <div class="third-menu-item" @click="handleSubMenuClick('5-3')">月度成本构成与利润</div>
                          <div class="third-menu-item" @click="handleSubMenuClick('5-4')">客户关联指标</div>
                        </div>
                      </div>
                      
                      <!-- 数据仓库 -->
                      <div class="menu-column">
                        <div class="top-menu-item" :class="{'active-menu': activeTopNav === '4'}" @click="handleTopNavClick('4')">
                          <div class="menu-border"></div>
                          <div class="menu-text">数据仓库</div>
                        </div>
                        
                        <!-- 客户数据 -->
                        <div class="secondary-menu-group">
                          <div class="folder-icon">
                            <el-icon><User /></el-icon>
                            客户数据
                          </div>
                          <div class="third-menu-item" @click="handleSubMenuClick('6-1')">客户购电合同条款</div>
                          <div class="third-menu-item" @click="handleSubMenuClick('6-2')">客户增值服务合同条款</div>
                          <div class="third-menu-item" @click="handleSubMenuClick('6-3')">客户电量数据</div>
                        </div>
                        
                        <!-- 市场数据 -->
                        <div class="secondary-menu-group">
                          <div class="folder-icon">
                            <el-icon><PieChart /></el-icon>
                            市场数据
                          </div>
                          <div class="third-menu-item" @click="handleMenuClick('7')">市场数据概览</div>
                        </div>
                        
                        <!-- 气象数据 -->
                        <div class="secondary-menu-group">
                          <div class="folder-icon">
                            <el-icon><Cloudy /></el-icon>
                            气象数据
                          </div>
                          <div class="third-menu-item" @click="handleMenuClick('8')">气象数据概览</div>
                        </div>
                      </div>
                      
                      <!-- 系统管理 -->
                      <div class="menu-column">
                        <div class="top-menu-item" :class="{'active-menu': activeTopNav === '5'}" @click="handleTopNavClick('5')">
                          <div class="menu-border"></div>
                          <div class="menu-text">系统管理</div>
                        </div>
                        
                        <!-- 系统设置 -->
                        <div class="secondary-menu-group">
                          <div class="folder-icon">
                            <el-icon><Setting /></el-icon>
                            系统设置
                          </div>
                          <div class="third-menu-item" @click="handleSubMenuClick('9-1')">系统日志</div>
                          <div class="third-menu-item" @click="handleSubMenuClick('9-2')">权限管理</div>
                          <div class="third-menu-item" @click="handleSubMenuClick('9-3')">安全提醒</div>
                        </div>
                      </div>
                    </div>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            
            <!-- 菜单搜索框 -->
            <div class="search-container">
              <el-autocomplete
                v-model="searchText"
                :fetch-suggestions="queryMenuItems"
                placeholder="搜索菜单..."
                @select="handleSearchSelect"
                class="menu-search"
                :trigger-on-focus="false"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
                <template #default="{ item }">
                  <div class="search-suggestion">
                    <span>{{ item.value }}</span>
                    <span class="search-path">{{ item.path }}</span>
                  </div>
                </template>
              </el-autocomplete>
            </div>
          </div>
          
          <div class="right-header-section">
            <!-- 最新日程显示 -->
            <div v-if="latestSchedule" class="latest-schedule" @click="openAddSchedule">
              <span>{{ formatScheduleTime(latestSchedule.time) }} {{ latestSchedule.title }}</span>
            </div>
            
            <!-- 添加日程按钮 -->
            <div class="schedule-btn-wrapper">
              <el-button 
                type="primary" 
                circle
                @click="openAddSchedule" 
                class="add-schedule-btn"
                title="添加日程"
              >
                <el-icon :size="18"><Calendar /></el-icon>
              </el-button>
            </div>
            
            <div class="user-info">
              <button class="logout-link" @click="handleLogout">
                <el-icon><SwitchButton /></el-icon>
                退出登录【管理员】
              </button>
            </div>
          </div>
        </div>
      </el-header>
      
      <!-- 标签页和主内容区 -->
      <el-main class="main">
        <!-- 标签页组件 -->
        <div class="tabs-container" v-if="tabsList.length > 0">
          <el-tabs 
            v-model="activeTabName" 
            type="card" 
            closable 
            @tab-remove="removeTab"
            @tab-click="clickTab"
          >
            <el-tab-pane
              v-for="tab in tabsList"
              :key="tab.name"
              :label="tab.title"
              :name="tab.name"
            >
            </el-tab-pane>
          </el-tabs>
    </div>
        
        <!-- 内容区域 -->
        <div class="content-container">
          <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </router-view>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  box-sizing: border-box;
  position: relative;
}

.aside {
  position: relative;
  background-color: #f5f7fa;
  box-shadow: none;
  height: 100%;
  overflow: hidden;
  transition: width 0.3s;
  display: flex;
  flex-direction: column;
  z-index: 5;
}

.system-title {
  height: 60px;
  line-height: 60px;
  background-color: #409EFF;
  color: white;
  font-size: 18px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  border-bottom: none;
  z-index: 6;
  letter-spacing: 1px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  padding: 0 10px;
}

.collapsed-title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
}

.menu-scrollbar {
  height: calc(100% - 60px);
  overflow: hidden;
}

.menu {
  border-right: none;
}

.el-menu-item, .el-sub-menu__title {
  display: flex;
  align-items: center;
}

.el-menu-item .el-icon, .el-sub-menu__title .el-icon {
  margin-right: 5px;
  width: 24px;
  text-align: center;
}

.collapse-btn {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f0f2f5;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 2;
}

.header {
  background-color: #409EFF;
  color: white;
  padding: 0;
  height: 60px !important;
  line-height: 60px;
  min-height: 60px;
  position: relative;
  border-bottom: none;
}

/* 顶部和左侧统一的分隔线 */
.layout-container::after {
  content: "";
  position: absolute;
  top: 60px; /* 与header高度一致 */
  left: 0;
  right: 0;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.2);
  z-index: 10;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  width: 100%;
  max-width: 100%;
}

.left-header-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.right-header-section {
  display: flex;
  align-items: center;
  gap: 15px;
  height: 100%;
}

.latest-schedule {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: white;
  padding: 8px 15px;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
  cursor: pointer;
  transition: color 0.3s;
}

.latest-schedule:hover {
  color: rgba(255, 255, 255, 0.8);
}

.schedule-btn-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.add-schedule-btn {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 36px !important;
  height: 36px !important;
  min-height: 36px !important;
  padding: 0 !important;
  border-radius: 50% !important;
  overflow: hidden !important;
}

/* 覆盖所有状态下的边框半径 */
:deep(.add-schedule-btn),
:deep(.add-schedule-btn.is-round),
:deep(.add-schedule-btn.is-circle),
:deep(.add-schedule-btn:hover),
:deep(.add-schedule-btn:focus),
:deep(.add-schedule-btn:active),
:deep(.add-schedule-btn.hover),
:deep(.add-schedule-btn.active) {
  border-radius: 50% !important;
}

/* 覆盖wave effect的样式 */
:deep(.add-schedule-btn .el-button__wave-effect),
:deep(.add-schedule-btn::before),
:deep(.add-schedule-btn::after) {
  border-radius: 50% !important;
  width: 36px !important;
  height: 36px !important;
}

:deep(.add-schedule-btn .el-icon) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  height: 100% !important;
}

.menu-dropdown {
  cursor: pointer;
  display: flex;
  align-items: center;
  height: 100%;
  margin-right: 15px;
  outline: none;
}

.menu-icon {
  color: white;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none !important;
}

.menu-icon:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.menu-icon:focus {
  box-shadow: none !important;
}

:deep(.el-dropdown) {
  outline: none !important;
}

:deep(.el-dropdown:focus) {
  outline: none !important;
}

:deep(.el-dropdown:focus-visible) {
  outline: none !important;
  box-shadow: none !important;
}

:deep(.el-dropdown__popper) {
  margin-top: 5px !important;
}

.search-container {
  flex: 0 1 400px;
  display: flex;
  justify-content: flex-start;
  margin-right: 15px;
  min-width: 200px;
  align-items: center;
  height: 100%;
}

.menu-search {
  width: 100%;
}

:deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
  box-shadow: none !important;
  width: 100%;
  height: 36px;
  line-height: 36px;
}

:deep(.el-autocomplete) {
  width: 100%;
  display: flex;
  align-items: center;
}

:deep(.el-input) {
  height: 36px;
  display: flex;
  align-items: center;
}

.search-suggestion {
  display: flex;
  flex-direction: column;
}

.search-path {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.active-dropdown-item {
  background-color: #ecf5ff;
  color: #409EFF;
  font-weight: bold;
}

/* 加粗所有顶部导航菜单项字体 */
:deep(.el-dropdown-menu__item) {
  font-weight: bold;
  font-size: 15px;
}

/* 特别加粗主菜单项 */
:deep(.main-menu-item) {
  font-weight: 800 !important;
  font-size: 16px !important;
  padding: 12px 20px !important;
  color: #303133 !important;
}

/* 水平排列的下拉菜单 */
:deep(.horizontal-dropdown-menu) {
  min-width: auto !important;
  width: auto !important;
  padding: 10px !important;
}

:deep(.horizontal-menu-container) {
  display: flex !important;
  flex-direction: row !important;
  width: max-content !important;
}

:deep(.horizontal-menu-container .el-dropdown-menu__item) {
  display: inline-flex !important;
  justify-content: center !important;
  border-bottom: 3px solid transparent !important;
  margin: 0 5px !important;
  min-width: 100px !important;
  text-align: center !important;
}

:deep(.horizontal-menu-container .el-dropdown-menu__item:hover), 
:deep(.horizontal-menu-container .active-dropdown-item) {
  background-color: #ecf5ff !important;
  color: #409EFF !important;
  border-bottom-color: #409EFF !important;
}

.user-info {
  min-width: 160px;
  display: flex;
  justify-content: flex-end;
}

.logout-link {
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  white-space: nowrap;
  outline: none !important;
  -webkit-tap-highlight-color: transparent;
  background-color: transparent !important;
  border: none !important;
  user-select: none;
  cursor: pointer;
  padding: 0;
  font: inherit;
  margin: 0;
  appearance: none;
}

.logout-link:active,
.logout-link:focus,
.logout-link:visited {
  outline: none !important;
  background-color: transparent !important;
  box-shadow: none !important;
  border: none !important;
  color: white;
}

.logout-link .el-icon {
  margin-right: 5px;
}

.logout-link:hover {
  text-decoration: underline;
  background-color: transparent !important;
}

.main {
  background-color: #f0f2f5;
  padding: 0;
  overflow: hidden;
  height: 100%;
    display: flex;
  flex-direction: column;
}

.tabs-container {
  padding: 5px 10px 0;
  background-color: white;
  border-bottom: 1px solid #e4e7ed;
}

.content-container {
  flex: 1;
  overflow: auto;
  padding: 15px;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .header-container {
    padding: 0 10px;
  }
  
  .system-title {
    font-size: 16px;
  }
  
  .search-container {
    max-width: 300px;
    margin: 0 10px;
  }
}

@media (max-width: 768px) {
  .system-title {
    padding: 0 5px;
    font-size: 14px;
  }
  
  .collapse-btn {
    width: 30px;
    height: 30px;
  }
  
  .search-container {
    max-width: 200px;
    margin: 0 5px;
  }
}

@media (max-width: 576px) {
  .system-title {
    font-size: 12px;
  }
  
  .user-info {
    min-width: 120px;
  }
  
  .search-container {
    max-width: 150px;
  }
}

:deep(.el-input__inner) {
  color: white;
  background-color: transparent;
  height: 36px;
}

:deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.7);
}

:deep(.el-input__prefix) {
  color: rgba(255, 255, 255, 0.7);
}

/* 完整菜单下拉样式 */
:deep(.full-menu-dropdown) {
  min-width: 600px !important;
  padding: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  overflow: visible !important;
  border: 1px solid #ebeef5 !important;
}

.menu-container {
  display: flex;
  flex-direction: row;
  background-color: white;
}

.menu-column {
  min-width: 200px;
  border-right: none;
}

.menu-column:last-child {
  border-right: none;
}

.top-menu-item {
  padding: 15px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  cursor: pointer;
  position: relative;
  border-bottom: none;
  display: flex;
  align-items: center;
  background-color: #f8f8f8;
}

.menu-border {
  display: none;
}

.active-menu .menu-border {
  background-color: transparent;
}

.menu-text {
  margin-left: 6px;
}

.secondary-menu-group {
  padding: 10px 0;
  background-color: white;
  border-bottom: none;
}

.folder-icon {
  display: flex;
  align-items: center;
  padding: 8px 15px;
  font-weight: 500;
  color: #606266;
  font-size: 14px;
}

.folder-icon .el-icon {
  margin-right: 8px;
}

.third-menu-item {
  padding: 8px 15px 8px 38px;
  color: #606266;
  cursor: pointer;
  font-size: 14px;
  border-bottom: none;
}

.third-menu-item:hover {
  color: #409EFF;
  background-color: transparent;
}

/* 去掉下拉菜单的箭头 */
:deep(.el-popper__arrow) {
  display: none !important;
}
</style>
