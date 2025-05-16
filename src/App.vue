<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Calendar, Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
// 导入新的菜单配置和辅助函数
import {
  type MenuItem as MenuConfigItem, // 类型重命名以避免与组件内的MenuItem冲突
  menuData, // <--- 确保 menuData 被导入，如果辅助函数内部需要直接访问它
  getTopNavItems,
  getSidebarMenuItems as getConfigSidebarMenuItems, // 重命名导入的函数以避免与本地方法冲突
  findMenuItemById,
  findTopNavItemForMenu,
  getAllSearchableMenuItems
} from './config/menu' // 确保路径正确

// 确保dayjs使用中文
dayjs.locale('zh-cn')

// 定义标签页接口
interface TabItem {
  title: string;
  name: string; // 使用菜单项的 id
  path: string;
}

// 定义搜索菜单项接口 (复用 getAllSearchableMenuItems 的返回类型)
type SearchMenuItem = ReturnType<typeof getAllSearchableMenuItems>[0];

const router = useRouter()
const route = useRoute()

// 搜索相关
const searchText = ref('')
// searchResults 将由 el-autocomplete 内部处理，我们主要提供 fetch-suggestions

// 侧边栏折叠状态
const isCollapse = ref(false)

// 标签页列表
const tabsList = ref<TabItem[]>([])
const activeTabName = ref('') // 对应菜单项的 id

// // 定义菜单项接口 (现在从 config/menu.ts 导入 MenuConfigItem)
// interface MenuItem { // 这个接口可以移除或保留，如果组件内部逻辑还需要特定结构
//   id: string;
//   title: string;
//   icon?: string;
//   children?: MenuItem[];
// }

// 顶部导航菜单项 (从配置生成)
const topNavItems = computed<MenuConfigItem[]>(() => getTopNavItems())

// 当前激活的顶部导航 (使用顶部导航项的 id)
const activeTopNav = ref<string>(topNavItems.value.length > 0 ? topNavItems.value[0].id : '')

// 这些函数直接在 <script setup> 的顶层作用域定义，它们会自动暴露给模板
function getSidebarGroupsForTopNav(topNavId: string): MenuConfigItem[] {
  return getConfigSidebarMenuItems(topNavId).filter(item => !item.isSingle && item.children && item.children.length > 0);
}

function getSingleSidebarItemsForTopNav(topNavId: string): MenuConfigItem[] {
  return getConfigSidebarMenuItems(topNavId).filter(item => item.isSingle);
}

// 当前显示的侧边栏菜单 (有子菜单的)
const sidebarPrimaryItems = computed<MenuConfigItem[]>(() => {
  if (!activeTopNav.value) return []
  return getSidebarGroupsForTopNav(activeTopNav.value)
})

// 当前显示的侧边栏单独菜单项 (没有子菜单的)
const sidebarSingleItems = computed<MenuConfigItem[]>(() => {
  if (!activeTopNav.value) return []
  return getSingleSidebarItemsForTopNav(activeTopNav.value)
})

// 构建所有可搜索的菜单项 (从配置生成)
const allSearchableMenuItems = computed(() => getAllSearchableMenuItems())

// 搜索菜单项方法
const queryMenuItems = (queryString: string, callback: (results: SearchMenuItem[]) => void) => {
  if (queryString) {
    const results = allSearchableMenuItems.value.filter(item => {
      return item.value.toLowerCase().includes(queryString.toLowerCase()) ||
             item.fullPathDescription.toLowerCase().includes(queryString.toLowerCase())
    })
    callback(results)
  } else {
    callback([])
  }
}

// 处理搜索选择
const handleSearchSelect = (selected: SearchMenuItem) => {
  const menuItem = findMenuItemById(selected.menuId)
  if (menuItem && menuItem.path) {
    const topNavItem = findTopNavItemForMenu(menuItem.id)
    if (topNavItem && topNavItem.id !== activeTopNav.value) {
      handleTopNavClick(topNavItem.id) // 会触发侧边栏更新
    }
    
    activeMenu.value = menuItem.id
    addTab(menuItem.id)
    router.push(menuItem.path)
    searchText.value = ''
  }
}

// 处理顶部导航菜单点击 (command 为顶部导航项的 id)
const handleTopNavClick = (navId: string): void => {
  activeTopNav.value = navId
  
  // 侧边栏菜单会通过 computed 属性自动更新
  // 更新默认展开的菜单
  updateDefaultOpeneds()
  
  // 如果当前激活的子菜单不属于新的 topNav，则清空
  if (activeMenu.value) {
    const currentActiveMenuItem = findMenuItemById(activeMenu.value)
    if (!currentActiveMenuItem || currentActiveMenuItem.topNavId !== navId) {
      // 尝试激活新 topNav 下的第一个可点击菜单，或清空
      const firstNavigableItem = getConfigSidebarMenuItems(navId).find(m => m.path || (m.children && m.children.find(sm => sm.path)));
      if (firstNavigableItem) {
          if (firstNavigableItem.path) {
              // activeMenu.value = firstNavigableItem.id; // 不立即设置，让路由守卫处理
          } else if (firstNavigableItem.children && firstNavigableItem.children[0]?.path) {
              // activeMenu.value = firstNavigableItem.children[0].id; // 不立即设置
          } else {
            activeMenu.value = '';
          }
      } else {
        activeMenu.value = ''
      }
    }
  }
}

// 检查菜单项是否在指定的顶部导航下 (已通过 findTopNavItemForMenu 替代部分逻辑)
// findMenuInTopNav 函数可以简化或移除，因为现在可以直接比较 menuItem.topNavId

// 处理子菜单点击 (menuId 是子菜单项的 id)
const handleSubMenuClick = (menuId: string): void => {
  const menuItem = findMenuItemById(menuId)
  if (menuItem && menuItem.path) {
    const topNavItem = findTopNavItemForMenu(menuItem.id)
    if (topNavItem && topNavItem.id !== activeTopNav.value) {
      // 如果顶部导航不一致，则切换，这会触发侧边栏等更新
      // 注意：这里不直接调用 handleTopNavClick，因为activeMenu的设置和路由跳转应该基于当前点击的子菜单
      activeTopNav.value = topNavItem.id; 
    }
    
    activeMenu.value = menuItem.id
    addTab(menuItem.id)
    router.push(menuItem.path)
  } else if (menuItem && !menuItem.path && menuItem.children && menuItem.children.length > 0) {
    // 如果是父菜单项且没有直接路径，可以考虑展开它，或者导航到第一个子项
    // 当前 el-menu 的行为是展开，所以这里可以不特殊处理导航
    activeMenu.value = menuItem.id; // 仅高亮父菜单
  }
}

// 定义日程事件接口 (保持不变)
interface ScheduleEvent {
  id: string;
  title: string;
  time: Date;
  type: string;
  location: string;
  description?: string;
}

// 引用日程组件 (保持不变)
const scheduleRef = ref(null)
const latestSchedule = ref<ScheduleEvent | null>(null)

const openAddSchedule = () => {
  const scheduleMenuItem = findMenuItemById('schedule');
  if (scheduleMenuItem && scheduleMenuItem.path) {
    addTab(scheduleMenuItem.id);
    router.push(scheduleMenuItem.path);
  }
}
// (loadLatestSchedule, formatScheduleTime 保持不变)
// ... (此处省略 loadLatestSchedule, formatScheduleTime 的代码，它们与菜单不直接相关)

// 当前激活的菜单项 (侧边栏中具体激活的菜单项 id)
const activeMenu = ref('') 
// 默认展开的菜单 (侧边栏一级菜单的 id 列表)
const defaultOpeneds = ref<string[]>([])

// 更新默认展开的菜单 (基于当前显示的侧边栏主菜单)
const updateDefaultOpeneds = (): void => {
  defaultOpeneds.value = sidebarPrimaryItems.value.map(item => item.id)
}

// 处理侧边菜单点击 (index 是菜单项的 id)
const handleMenuClick = (index: string): void => {
   const menuItem = findMenuItemById(index)
  if (menuItem) {
    activeMenu.value = menuItem.id

    // 如果点击的是父菜单项且它没有直接的 path，则不导航
    if (!menuItem.path && menuItem.children && menuItem.children.length > 0) {
        // el-menu 会自动处理展开/折叠，这里不需要额外操作
        return;
    }

    if (menuItem.path) {
      // 确保顶部导航栏也同步 (如果需要)
      const topNavItem = findTopNavItemForMenu(menuItem.id)
      if (topNavItem && topNavItem.id !== activeTopNav.value) {
        activeTopNav.value = topNavItem.id // 更新顶部导航，侧边栏会自动响应
      }
      addTab(menuItem.id)
      router.push(menuItem.path)
    } else if (index === '0' || index === '') { // 假设 '0' 或空字符串代表首页
      goHome();
    }
  }
}

// 添加标签页
const addTab = (menuId: string): void => {
  const menuItem = findMenuItemById(menuId)
  if (!menuItem || !menuItem.path || !menuItem.title) return
  
  const existingTab = tabsList.value.find(tab => tab.name === menuItem.id)
  if (!existingTab) {
    tabsList.value.push({
      title: menuItem.title,
      name: menuItem.id,
      path: menuItem.path
    })
  }
  activeTabName.value = menuItem.id
}

// 移除标签页 (逻辑基本不变，但确保路径来自 tab 对象)
const removeTab = (targetName: string): void => {
  const tabs = tabsList.value
  let newActiveName = activeTabName.value
  
  if (newActiveName === targetName) {
    tabs.forEach((tab, index) => {
      if (tab.name === targetName) {
        const nextTab = tabs[index + 1] || tabs[index - 1]
        if (nextTab) {
          newActiveName = nextTab.name
        } else {
          newActiveName = '' // 没有其他tab了
        }
      }
    })
  }
  
  tabsList.value = tabs.filter(tab => tab.name !== targetName)
  activeTabName.value = newActiveName
  
  if (newActiveName) {
    const activeTabInfo = tabsList.value.find(tab => tab.name === newActiveName)
    if (activeTabInfo) {
      router.push(activeTabInfo.path)
      activeMenu.value = newActiveName // 同步侧边栏激活状态
    }
  } else {
    goHome() // 如果没有标签了，导航到首页
  }
}

// 点击标签页 (逻辑不变)
const clickTab = (tab: any): void => { // tab 类型是 Element Plus 的 TabPaneProps
  const targetTab = tabsList.value.find(item => item.name === tab.props.name)
  if (targetTab) {
    router.push(targetTab.path)
    activeMenu.value = targetTab.name // 同步侧边栏
    // 可能需要同步顶部导航
    const menuItem = findMenuItemById(targetTab.name);
    if (menuItem) {
        const topNav = findTopNavItemForMenu(menuItem.id);
        if (topNav && topNav.id !== activeTopNav.value) {
            activeTopNav.value = topNav.id;
        }
    }
  }
}

// 处理首页点击
const goHome = (): void => {
  activeMenu.value = '' // 首页通常没有特定激活菜单，或者你可以定义一个 'home' id
  if (topNavItems.value.length > 0) {
    activeTopNav.value = topNavItems.value[0].id // 默认选中第一个顶部导航
  }
  // 侧边栏菜单会通过 computed 属性自动更新
  updateDefaultOpeneds()
  activeTabName.value = '' // 清除标签页列表中的激活状态
  tabsList.value = [] // 清空所有标签页
  router.push('/')
}

// 处理退出登录 (逻辑不变)
const handleLogout = (): void => {
  alert('退出登录功能开发中')
}

// 侧边栏折叠切换 (逻辑不变)
const toggleCollapse = (): void => {
  isCollapse.value = !isCollapse.value
}

// 监听路由变化，添加标签页并更新导航状态
watch(() => route.path, (newPath) => {
  if (newPath === '/') {
    goHome() // 如果是首页，执行 goHome 逻辑
    return;
  }

  let currentMenuId = '';
  let correspondingMenuItem: MenuConfigItem | undefined;

  // 尝试从所有可导航菜单中找到匹配当前路径的项
  // getAllSearchableMenuItems 包含了所有可导航的菜单项及其路径
  const searchableItems = getAllSearchableMenuItems(); // 使用辅助函数获取扁平化的菜单列表
  const matchedItemFromSearch = searchableItems.find(item => item.path === newPath);

  if (matchedItemFromSearch) {
      correspondingMenuItem = findMenuItemById(matchedItemFromSearch.menuId);
  } else {
      // Fallback: 如果在 searchableItems 中未直接找到，尝试遍历原始 menuData (可能包含未在搜索中配置的路径)
      function findByPath(items: MenuConfigItem[]): MenuConfigItem | undefined {
          for (const item of items) {
              if (item.path === newPath) return item;
              if (item.children) {
                  const found = findByPath(item.children);
                  if (found) return found;
              }
          }
          return undefined;
      }
      correspondingMenuItem = findByPath(menuData.filter(item => item.path || (item.children && item.children.some(c => c.path))));
  }


  if (correspondingMenuItem) {
    currentMenuId = correspondingMenuItem.id;
    addTab(currentMenuId);
    activeMenu.value = currentMenuId;

    const topNavItem = findTopNavItemForMenu(currentMenuId);
    if (topNavItem && topNavItem.id !== activeTopNav.value) {
      activeTopNav.value = topNavItem.id;
      // 侧边栏菜单 (sidebarPrimaryItems, sidebarSingleItems) 会自动更新
      updateDefaultOpeneds();
    } else if (!topNavItem && correspondingMenuItem.id === 'schedule' && activeTopNav.value) {
        // 如果是日程管理这类独立菜单，它可能不属于任何顶部导航
        // 此时可以不清空 activeTopNav，或者根据业务逻辑决定是否要切换到一个默认导航
    }
  } else {
    // 如果没有找到匹配的菜单项 (例如，直接访问了一个未在菜单中定义的路由)
    // 可以选择清空激活状态或保持不变，或导航到404
    // activeMenu.value = '';
    // activeTopNav.value = topNavItems.value.length > 0 ? topNavItems.value[0].id : ''; // 回到默认
  }
}, { immediate: true })


// 初始化
onMounted(() => {
  // updateSingleMenuItems() // 这个函数的功能已合并到 computed properties
  if (topNavItems.value.length > 0 && !activeTopNav.value) {
      activeTopNav.value = topNavItems.value[0].id;
  }
  updateDefaultOpeneds(); // 初始化时也需要设置默认展开
  loadLatestSchedule();
  
  setInterval(() => {
    loadLatestSchedule()
  }, 60000)
})

// // getSingleMenuItems 函数可以移除，其功能由 sidebarSingleItems 计算属性提供
// const getSingleMenuItems = (topNavId: string): MenuConfigItem[] => { ... }

// --- 原有的 menuTitleMap, menuRouteMap, allMenuItems, topNavItems(静态) 已被移除 ---
// --- 原有的 updateSingleMenuItems 函数逻辑已合并到 computed properties ---
// --- 原有的 findTopNavForMenu 函数已被新的辅助函数替代 ---
// --- 原有的 menuTitleMap 和 menuRouteMap 的使用已改为直接从 MenuItem 对象获取 title 和 path ---

// (此处省略 loadLatestSchedule, formatScheduleTime 的具体实现，假设它们保持不变)
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
      
      const todayEvents = schedules
        .filter((event: any) => {
          const eventTime = new Date(event.time)
          return eventTime >= today && eventTime <= endOfDay
        })
        .sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime())
      
      if (todayEvents.length > 0) {
        const currentTime = new Date()
        const upcomingTodayEvents = todayEvents.filter((e: any) => new Date(e.time) >= currentTime)
        const latestEvent = upcomingTodayEvents.length > 0 ? 
          upcomingTodayEvents[0] : 
          todayEvents[todayEvents.length - 1]
          
        latestSchedule.value = latestEvent as ScheduleEvent
      } else {
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

const formatScheduleTime = (date: Date) => {
  const today = new Date()
  const scheduleDate = new Date(date)
  
  if (scheduleDate.getDate() === today.getDate() && 
      scheduleDate.getMonth() === today.getMonth() && 
      scheduleDate.getFullYear() === today.getFullYear()) {
    return `今天 ${dayjs(date).format('HH:mm')}`
  } else {
    return dayjs(date).format('MM/DD HH:mm')
  }
}
</script>

<template>
  <el-container class="layout-container">
    <!-- 左侧菜单 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="aside">
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
          <el-sub-menu v-for="menu in sidebarPrimaryItems" :key="menu.id" :index="menu.id">
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
          <el-menu-item
            v-for="menu in sidebarSingleItems"
            :key="menu.id"
            :index="menu.id"
          >
            <el-icon><component :is="menu.icon" /></el-icon>
            <span>{{ menu.title }}</span>
          </el-menu-item>
        </el-menu>
      </el-scrollbar>
      <div class="collapse-btn" @click="toggleCollapse">
        <el-icon :size="20" v-if="!isCollapse"><Fold /></el-icon>
        <el-icon :size="20" v-else><Expand /></el-icon>
      </div>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-container">
          <div class="left-header-section">
            <div class="menu-dropdown" tabindex="-1">
              <el-dropdown trigger="hover" @command="handleTopNavClick" placement="bottom-start" tabindex="-1">
                <div class="menu-icon" tabindex="-1">
                  <el-icon :size="24"><Menu /></el-icon>
                </div>
                <template #dropdown>
                  <el-dropdown-menu class="full-menu-dropdown">
                    <div class="menu-container">
                      <div class="menu-column" v-for="topNav in topNavItems" :key="topNav.id">
                        <div
                          class="top-menu-item"
                          :class="{'active-menu': activeTopNav === topNav.id}"
                          @click="handleTopNavClick(topNav.id)"
                        >
                          <div class="menu-border"></div>
                          <div class="menu-text">{{ topNav.title }}</div>
                        </div>
                        <!-- 使用在 script setup 中定义的 getSidebarGroupsForTopNav -->
                        <div
                          class="secondary-menu-group"
                          v-for="sidebarGroup in getSidebarGroupsForTopNav(topNav.id)" 
                          :key="sidebarGroup.id"
                        >
                          <div class="folder-icon" v-if="sidebarGroup.icon || sidebarGroup.title">
                            <el-icon v-if="sidebarGroup.icon"><component :is="sidebarGroup.icon" /></el-icon>
                            {{ sidebarGroup.title }}
                          </div>
                          <div
                            class="third-menu-item"
                            v-for="subMenuItem in sidebarGroup.children"
                            :key="subMenuItem.id"
                            @click="handleSubMenuClick(subMenuItem.id)"
                          >
                            {{ subMenuItem.title }}
                          </div>
                        </div>
                        <!-- 使用在 script setup 中定义的 getSingleSidebarItemsForTopNav -->
                        <div
                          class="secondary-menu-group"
                          v-for="singleItem in getSingleSidebarItemsForTopNav(topNav.id)"
                          :key="singleItem.id"
                        >
                           <div class="folder-icon" v-if="singleItem.icon || singleItem.title">
                              <el-icon v-if="singleItem.icon"><component :is="singleItem.icon" /></el-icon>
                               {{ singleItem.title }}
                           </div>
                           <div
                            class="third-menu-item"
                            @click="handleMenuClick(singleItem.id)"
                           >
                             {{ singleItem.title }}概览
                           </div>
                        </div>
                      </div>
                    </div>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
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
                    <span class="search-path">{{ item.fullPathDescription }}</span>
                  </div>
                </template>
              </el-autocomplete>
            </div>
          </div>
          <div class="right-header-section">
            <div v-if="latestSchedule" class="latest-schedule" @click="openAddSchedule">
              <span>{{ formatScheduleTime(latestSchedule.time) }} {{ latestSchedule.title }}</span>
            </div>
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
      <el-main class="main">
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
