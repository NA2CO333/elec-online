// src/config/menu.ts

export interface MenuItem {
  id: string; // 唯一ID，可以用于路由名或key
  title: string; // 菜单标题
  icon?: string; // Element Plus 图标名或自定义图标组件名
  path?: string; // 路由路径
  children?: MenuItem[]; // 子菜单
  topNavId?: string; // 仅用于侧边栏菜单，指示其所属的顶部导航ID
  isTopNav?: boolean; // 标记是否为顶部导航项
  isSingle?: boolean; // 标记是否为侧边栏的独立菜单项 (如市场数据、气象数据)
}

export const menuData: MenuItem[] = [
  // --- 顶部导航项 ---
  { id: 'top-1', title: '业务关系', isTopNav: true },
  { id: 'top-2', title: '交易辅助', isTopNav: true },
  { id: 'top-3', title: '数据汇报', isTopNav: true },
  { id: 'top-4', title: '数据仓库', isTopNav: true },
  { id: 'top-5', title: '系统管理', isTopNav: true },

  // --- 业务关系 (top-1) ---
  {
    id: 'menu-1', title: '档案管理', icon: 'Folder', topNavId: 'top-1', children: [
      { id: '1-1', title: '客户档案', path: '/user-archives', topNavId: 'top-1' },
      { id: '1-2', title: '经纪人档案', path: '/broker-archives', topNavId: 'top-1' },
    ],
  },

  // --- 交易辅助 (top-2) ---
  {
    id: 'menu-2', title: '客户分析', icon: 'DataAnalysis', topNavId: 'top-2', children: [
      { id: '2-1', title: '客户电量管理', path: '/user-electricity', topNavId: 'top-2' },
      { id: '2-2', title: '电量偏差：预测vs实际', path: '/consumption-deviation', topNavId: 'top-2' },
      { id: '2-3', title: '电量变化：现在vs从前', path: '/consumption-variation', topNavId: 'top-2' },
      { id: '2-4', title: '价格偏差：日前vs实时', path: '/price-deviation', topNavId: 'top-2' },
      { id: '2-5', title: '价格变化：现在vs从前', path: '/price-variation', topNavId: 'top-2' },
    ],
  },
  {
    id: 'menu-3', title: '中长期交易', icon: 'Operation', topNavId: 'top-2', children: [
      { id: '3-1', title: '合约统计(按月)', path: '/contract-statistics-month', topNavId: 'top-2' },
      { id: '3-2', title: '合约统计(按时)', path: '/contract-statistics-hour', topNavId: 'top-2' },
      { id: '3-3', title: '曲线分解', path: '/curve-decomposition', topNavId: 'top-2' },
      { id: '3-4', title: '批发交易复盘', path: '/wholesale-review', topNavId: 'top-2' },
    ],
  },
  {
    id: 'menu-4', title: '现货交易', icon: 'Money', topNavId: 'top-2', children: [
      { id: '4-1', title: '日总电量预测', path: '/daily-forecast', topNavId: 'top-2' },
      { id: '4-2', title: '分时电量预测', path: '/hourly-forecast', topNavId: 'top-2' },
      { id: '4-3', title: '日前博弈套利', path: '/day-ahead-arbitrage', topNavId: 'top-2' },
    ],
  },

  // --- 数据汇报 (top-3) ---
  {
    id: 'menu-5', title: '经营分析', icon: 'TrendCharts', topNavId: 'top-3', children: [
      { id: '5-1', title: '每日盈利、价格趋势', path: '/dailyprofit', topNavId: 'top-3' },
      { id: '5-2', title: '月度核心指标', path: '/monthly-core-indicators', topNavId: 'top-3' },
      { id: '5-3', title: '月度成本构成与利润', path: '/monthly-profit', topNavId: 'top-3' },
      { id: '5-4', title: '客户关联指标', path: '/user-related-metrics', topNavId: 'top-3' },
    ],
  },

  // --- 数据仓库 (top-4) ---
  {
    id: 'menu-6', title: '客户数据', icon: 'User', topNavId: 'top-4', children: [
      { id: '6-1', title: '客户购电合同条款', path: '/customer-purchase-contract', topNavId: 'top-4' },
      { id: '6-2', title: '客户增值服务合同条款', path: '/customer-service-contract', topNavId: 'top-4' },
      { id: '6-3', title: '客户电量数据', path: '/customer-electricity-data', topNavId: 'top-4' },
    ],
  },
  { id: 'menu-7', title: '市场数据', icon: 'PieChart', path: '/market-data', topNavId: 'top-4', isSingle: true },
  { id: 'menu-8', title: '气象数据', icon: 'Cloudy', path: '/weather-data', topNavId: 'top-4', isSingle: true },
  
  // --- 系统管理 (top-5) ---
  {
    id: 'menu-9', title: '系统设置', icon: 'Setting', topNavId: 'top-5', children: [
      { id: '9-1', title: '系统日志', path: '/system-log', topNavId: 'top-5' },
      { id: '9-2', title: '权限管理', path: '/permission-management', topNavId: 'top-5' },
      { id: '9-3', title: '安全提醒', path: '/security-alerts', topNavId: 'top-5' },
    ],
  },

  // --- 其他独立菜单 (如果需要，可以不指定topNavId，或有特殊处理逻辑) ---
  { id: 'schedule', title: '日程管理', path: '/schedule-management', icon: 'Calendar' }, // 日程管理可以看作一个独立的顶级功能
];

// --- 辅助函数，用于从menuData中派生其他需要的数据结构 ---

// 获取所有顶部导航项
export function getTopNavItems(): MenuItem[] {
  return menuData.filter(item => item.isTopNav);
}

// 根据顶部导航ID获取其下的侧边栏菜单 (包括有子菜单的 和 isSingle的)
export function getSidebarMenuItems(topNavId: string): MenuItem[] {
  return menuData.filter(item => item.topNavId === topNavId && !item.isTopNav);
}

// 根据ID查找菜单项 (深度优先)
export function findMenuItemById(id: string, searchList: MenuItem[] = menuData): MenuItem | undefined {
  for (const item of searchList) {
    if (item.id === id) {
      return item;
    }
    if (item.children) {
      const found = findMenuItemById(id, item.children);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

// 根据菜单ID查找其所属的顶部导航项
export function findTopNavItemForMenu(menuId: string): MenuItem | undefined {
  const menuItem = findMenuItemById(menuId);
  if (menuItem && menuItem.topNavId) {
    return findMenuItemById(menuItem.topNavId);
  }
  // 特殊处理日程管理，如果它被视为一个独立的功能区，可能没有topNavId
  // 或者，根据实际业务，它可能需要归属到某个默认的顶部导航下
  if (menuItem && menuItem.id === 'schedule') {
      // 假设日程管理在逻辑上可以不属于任何顶部导航，或者需要特殊处理
      // 如果需要，可以返回一个预设的顶部导航，或null
  }
  return undefined;
}

// 构建用于搜索的菜单列表
export function getAllSearchableMenuItems(): { value: string; menuId: string; path: string; fullPathDescription: string; }[] {
    const items: { value: string; menuId: string; path: string; fullPathDescription: string; }[] = [];
    
    function getPathDescription(item: MenuItem, currentPath: string[] = []): string {
        let description = [...currentPath, item.title].join(' > ');
        if (item.isTopNav) { // 如果是顶部导航，则它就是路径的起点
            description = item.title;
        } else if (!item.topNavId && !currentPath.length) { // 独立菜单项
             description = item.title;
        }
        return description;
    }

    function traverse(menuItems: MenuItem[], currentTopNavTitle?: string, parentMenuTitle?: string) {
        menuItems.forEach(item => {
            if (item.isTopNav) { // 遍历其子菜单项
                const childrenOfTopNav = menuData.filter(m => m.topNavId === item.id && !m.isTopNav);
                traverse(childrenOfTopNav, item.title);
            } else if (item.path) { // 可导航的菜单项
                let pathParts: string[] = [];
                if (currentTopNavTitle) pathParts.push(currentTopNavTitle);
                if (parentMenuTitle && item.topNavId) pathParts.push(parentMenuTitle);
                
                // 确保 title (value) 和 path (fullPathDescription) 正确
                items.push({
                    value: item.title,
                    menuId: item.id,
                    path: item.path,
                    fullPathDescription: getPathDescription(item, pathParts)
                });

                if (item.children) {
                    traverse(item.children, currentTopNavTitle, item.title); // 传递当前一级菜单名作为父级
                }
            } else if (item.children) { // 没有路径但有子菜单的父菜单项 (如侧边栏一级菜单)
                 traverse(item.children, currentTopNavTitle, item.title);
            }
        });
    }
    
    // 从顶部导航开始遍历
    const topNavs = getTopNavItems();
    topNavs.forEach(topNav => {
        // 添加顶部导航自身（如果可搜索/可导航）
        // items.push({ value: topNav.title, menuId: topNav.id, path: topNav.path || '', fullPathDescription: topNav.title });
        
        const sideMenuItems = getSidebarMenuItems(topNav.id);
        traverse(sideMenuItems, topNav.title);
    });

    // 添加独立菜单项，如日程管理
    const independentItems = menuData.filter(item => !item.isTopNav && !item.topNavId && item.path);
    independentItems.forEach(item => {
         items.push({
            value: item.title,
            menuId: item.id,
            path: item.path!,
            fullPathDescription: item.title
        });
    });

    return items;
} 