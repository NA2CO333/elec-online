// @ts-ignore
import { createRouter, createWebHashHistory } from 'vue-router'
// @ts-ignore
import type { RouteRecordRaw } from 'vue-router'
import Home from '@/views/Home.vue'
import MenuView from '@/views/MenuView.vue'

// 菜单路由配置
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '首页' }
  },
  // 档案管理
  {
    path: '/user-archives',
    name: 'UserArchives',
    component: MenuView,
    meta: { title: '客户档案' }
  },
  {
    path: '/broker-archives',
    name: 'BrokerArchives',
    component: MenuView,
    meta: { title: '经纪人档案' }
  },
  // 客户分析
  {
    path: '/user-electricity',
    name: 'UserElectricity',
    component: MenuView,
    meta: { title: '客户电量管理' }
  },
  {
    path: '/consumption-deviation',
    name: 'ConsumptionDeviation',
    component: MenuView,
    meta: { title: '电量偏差：预测vs实际' }
  },
  {
    path: '/consumption-variation',
    name: 'ConsumptionVariation',
    component: MenuView,
    meta: { title: '电量变化：现在vs从前' }
  },
  {
    path: '/price-deviation',
    name: 'PriceDeviation',
    component: MenuView,
    meta: { title: '价格偏差：日前vs实时' }
  },
  {
    path: '/price-variation',
    name: 'PriceVariation',
    component: MenuView,
    meta: { title: '价格变化：现在vs从前' }
  },
  // 中长期交易
  {
    path: '/contract-statistics-month',
    name: 'ContractStatisticsMonth',
    component: MenuView,
    meta: { title: '合约统计(按月)' }
  },
  {
    path: '/contract-statistics-hour',
    name: 'ContractStatisticsHour',
    component: MenuView,
    meta: { title: '合约统计(按时)' }
  },
  {
    path: '/curve-decomposition',
    name: 'CurveDecomposition',
    component: MenuView,
    meta: { title: '曲线分解' }
  },
  {
    path: '/wholesale-review',
    name: 'WholesaleReview',
    component: MenuView,
    meta: { title: '批发交易复盘' }
  },
  // 现货交易
  {
    path: '/daily-forecast',
    name: 'DailyForecast',
    component: MenuView,
    meta: { title: '日总电量预测' }
  },
  {
    path: '/hourly-forecast',
    name: 'HourlyForecast',
    component: MenuView,
    meta: { title: '分时电量预测' }
  },
  {
    path: '/day-ahead-arbitrage',
    name: 'DayAheadArbitrage',
    component: MenuView,
    meta: { title: '日前博弈套利' }
  },
  // 经营分析
  {
    path: '/dailyprofit',
    name: 'Dailyprofit',
    component: MenuView,
    meta: { title: '每日盈利、价格趋势' }
  },
  {
    path: '/monthly-core-indicators',
    name: 'MonthlyCoreIndicators',
    component: MenuView,
    meta: { title: '月度核心指标概览' }
  },
  {
    path: '/monthly-profit',
    name: 'MonthlyProfit',
    component: MenuView,
    meta: { title: '月度利润统计' }
  },
  {
    path: '/user-related-metrics',
    name: 'UserRelatedMetrics',
    component: MenuView,
    meta: { title: '客户关联指标' }
  },
  // 客户数据
  {
    path: '/customer-purchase-contract',
    name: 'CustomerPurchaseContract',
    component: MenuView,
    meta: { title: '客户购电合同条款' }
  },
  {
    path: '/customer-service-contract',
    name: 'CustomerServiceContract',
    component: MenuView,
    meta: { title: '客户增值服务合同条款' }
  },
  {
    path: '/customer-electricity-data',
    name: 'CustomerElectricityData',
    component: MenuView,
    meta: { title: '客户电量数据' }
  },
  // 市场数据
  {
    path: '/market-data',
    name: 'MarketData',
    component: MenuView,
    meta: { title: '市场数据' }
  },
  // 气象数据
  {
    path: '/weather-data',
    name: 'WeatherData',
    component: MenuView,
    meta: { title: '气象数据' }
  },
  // 系统管理
  {
    path: '/system-log',
    name: 'SystemLog',
    component: MenuView,
    meta: { title: '系统日志' }
  },
  {
    path: '/permission-management',
    name: 'PermissionManagement',
    component: MenuView,
    meta: { title: '权限管理' }
  },
  {
    path: '/security-alerts',
    name: 'SecurityAlerts',
    component: MenuView,
    meta: { title: '安全提醒' }
  },
  // 日程管理
  {
    path: '/schedule-management',
    name: 'ScheduleManagement',
    component: MenuView,
    meta: { title: '日程管理' }
  },
  
  // 直接处理"/price-variation"路径的特殊情况
  {
    path: '/price-variation',
    redirect: '/#/price-variation'
  },
  
  // 通配符路由，捕获所有不匹配的URL
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router 