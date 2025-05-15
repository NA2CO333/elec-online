<template>
    <div class="component-container">
      <!-- 客户档案 -->
      <component :is="UserArchives" v-if="routeName === 'UserArchives'" />
      
      <!-- 经纪人档案 -->
      <component :is="BrokerArchives" v-if="routeName === 'BrokerArchives'" />
      
      <!--客户电量管理 -->
      <component :is="UserElectricity" v-if="routeName === 'UserElectricity'" />
      
      <!-- 电量偏差：预测vs实际 -->
      <component :is="ConsumptionDeviation" v-if="routeName === 'ConsumptionDeviation'" />
  
      <!-- 电量变化：现在vs从前 -->
      <component :is="ConsumptionVariation" v-if="routeName === 'ConsumptionVariation'" />
      
      <!-- 价格偏差：日前vs实时 -->
      <component :is="PriceDeviation" v-if="routeName === 'PriceDeviation'" />
      
      <!-- 价格变化：现在vs从前 -->
      <component :is="PriceVariation" v-if="routeName === 'PriceVariation'" />
      
      <!-- 日电力预测 -->
      <component :is="DailyForecast" v-if="routeName === 'DailyForecast'" />
      
      <!-- 小时电力预测 -->
      <component :is="HourlyForecast" v-if="routeName === 'HourlyForecast'" />
      
      <!-- 日前博弈套利 -->
      <component :is="DayAheadArbitrage" v-if="routeName === 'DayAheadArbitrage'" />
      
      <!-- 合约统计(按月) -->
      <component :is="ContractStatisticsMonth" v-if="routeName === 'ContractStatisticsMonth'" />
      
      <!-- 合约统计(按时) -->
      <component :is="ContractStatisticsHour" v-if="routeName === 'ContractStatisticsHour'" />
      
      <!-- 曲线分解 -->
      <component :is="CurveDecomposition" v-if="routeName === 'CurveDecomposition'" />
      
      <!-- 批发交易复盘 -->
      <component :is="WholesaleReview" v-if="routeName === 'WholesaleReview'" />
      
      <!-- 每日盈利、价格趋势 -->
      <component :is="Dailyprofit" v-if="routeName === 'Dailyprofit'" />
      
      <!-- 月度核心指标 -->
      <component :is="MonthlyCoreIndicators" v-if="routeName === 'MonthlyCoreIndicators'" />
      
      <!-- 月度成本构成与利润分析 -->
      <component :is="MonthlyProfit" v-if="routeName === 'MonthlyProfit'" />
      
      <!-- 客户关联指标 -->
      <component :is="UserRelatedMetrics" v-if="routeName === 'UserRelatedMetrics'" />
      
      <!-- 客户购电合同条款 -->
      <component :is="CustomerContractTerms" v-if="routeName === 'CustomerPurchaseContract'" />
      
      <!-- 客户增值服务合同条款 -->
      <component :is="CustomerServiceContract" v-if="routeName === 'CustomerServiceContract'" />
      
      <!-- 客户电力数据 -->
      <component :is="CustomerElectricityData" v-if="routeName === 'CustomerElectricityData'" />
      
      <!-- 市场数据 -->
      <component :is="MarketData" v-if="routeName === 'MarketData'" />
      
      <!-- 气象数据 -->
      <component :is="WeatherData" v-if="routeName === 'WeatherData'" />
      
      <!-- 系统日志 -->
      <component :is="SystemLog" v-if="routeName === 'SystemLog'" />
      
      <!-- 权限管理 -->
      <component :is="PermissionManagement" v-if="routeName === 'PermissionManagement'" />
      
      <!-- 安全提醒 -->
      <component :is="SecurityAlert" v-if="routeName === 'SecurityAlerts'" />
      
      <!-- 日程管理 -->
      <component :is="ScheduleManagement" v-if="routeName === 'ScheduleManagement'" />
      
      <!-- 其他模块默认显示 -->
      <el-card v-if="!hasComponent">
        <div class="placeholder-content">
          <el-empty description="模块开发中，敬请期待..." />
        </div>
      </el-card>
    </div>
  </template>
  
  <script setup>
  import { computed, defineAsyncComponent, ref, watch } from 'vue'
  
  const props = defineProps({
    routeName: {
      type: String,
      default: ''
    }
  })
  
  console.log('当前路由名称:', props.routeName)
  
  // 监听路由名称变化
  watch(() => props.routeName, (newRouteName) => {
    console.log('路由名称变化为:', newRouteName)
  })
  
  // 动态导入组件
  const UserArchives = defineAsyncComponent(() => import('../../components/archives/UserArchives.vue'))
  const BrokerArchives = defineAsyncComponent(() => import('../../components/archives/BrokerArchives.vue'))
  const UserElectricity = defineAsyncComponent(() => import('../../components/customeranalysis/UserElectricity.vue'))
  const ConsumptionDeviation = defineAsyncComponent(() => import('../../components/customeranalysis/ConsumptionDeviation.vue'))
  const ConsumptionVariation = defineAsyncComponent(() => import('../../components/customeranalysis/ConsumptionVariation.vue'))
  const PriceDeviation = defineAsyncComponent(() => import('../../components/customeranalysis/PriceDeviation.vue'))
  const PriceVariation = defineAsyncComponent(() => import('../../components/customeranalysis/PriceVariation.vue'))
  const DailyForecast = defineAsyncComponent(() => import('../../components/forecast/DailyForecast.vue'))
  const HourlyForecast = defineAsyncComponent(() => import('../../components/forecast/HourlyForecast.vue'))
  const DayAheadArbitrage = defineAsyncComponent(() => import('../../components/forecast/DayAheadArbitrage.vue'))
  const ContractStatisticsMonth = defineAsyncComponent(() => import('../../components/trade/ContractStatisticsMonth.vue'))
  const ContractStatisticsHour = defineAsyncComponent(() => import('../../components/trade/ContractStatisticsHour.vue'))
  const CurveDecomposition = defineAsyncComponent(() => import('../../components/trade/CurveDecomposition.vue'))
  const WholesaleReview = defineAsyncComponent(() => import('../../components/trade/WholesaleReview.vue'))
  const Dailyprofit = defineAsyncComponent(() => import('../../components/businessanalysis/Dailyprofit.vue'))
  const MonthlyProfit = defineAsyncComponent(() => import('../../components/businessanalysis/MonthlyProfit.vue'))
  const UserRelatedMetrics = defineAsyncComponent(() => import('../../components/businessanalysis/UserRelatedMetrics.vue'))
  const CustomerContractTerms = defineAsyncComponent(() => import('../../components/customerdata/CustomerContractTerms.vue'))
  const CustomerServiceContract = defineAsyncComponent(() => import('../../components/customerdata/CustomerServiceContract.vue'))
  const CustomerElectricityData = defineAsyncComponent(() => import('../../components/customerdata/CustomerElectricityData.vue'))
  const MarketData = defineAsyncComponent(() => import('../../components/businessdata/MarketData.vue'))
  const WeatherData = defineAsyncComponent(() => import('../../components/weatherdata/WeatherData.vue'))
  const SystemLog = defineAsyncComponent(() => import('../../components/systemsettings/SystemLog.vue'))
  const PermissionManagement = defineAsyncComponent(() => import('../../components/systemsettings/PermissionManagement.vue'))
  const SecurityAlert = defineAsyncComponent(() => import('../../components/systemsettings/SecurityAlert.vue'))
  const ScheduleManagement = defineAsyncComponent(() => import('../../components/schedule/ScheduleManagement.vue'))
  const MonthlyCoreIndicators = defineAsyncComponent(() => import('../../components/businessanalysis/MonthlyCoreIndicators.vue'))
  
  // 检查当前路由是否有对应的组件
  const hasComponent = computed(() => {
    const result = ['UserArchives', 'BrokerArchives', 'UserElectricity', 'ConsumptionDeviation', 'ConsumptionVariation',
            'DailyForecast', 'HourlyForecast', 'ContractStatisticsMonth', 'ContractStatisticsHour', 'CurveDecomposition',
            'WholesaleReview', 'DayAheadArbitrage', 'Dailyprofit', 'CustomerPurchaseContract',
            'CustomerServiceContract', 'CustomerElectricityData', 'MarketData', 'WeatherData',
            'SystemLog', 'PermissionManagement', 'SecurityAlerts', 'ScheduleManagement', 
            'MonthlyCoreIndicators', 'MonthlyProfit', 'UserRelatedMetrics', 'PriceDeviation', 'PriceVariation'].includes(props.routeName)
    
    // 特别检查ConsumptionVariation
    if (props.routeName === 'ConsumptionVariation') {
      console.log('准备加载电量变化分析组件', props.routeName)
    }
    
    // 特别检查PriceVariation
    if (props.routeName === 'PriceVariation') {
      console.log('准备加载价格变化分析组件', props.routeName)
    }
    
    return result
  })
  
  console.log('路由名称:', props.routeName, '是否有对应组件:', hasComponent.value)
  </script>
  
  <style scoped>
  .component-container {
    width: 100%;
  }
  
  .placeholder-content {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
  }
  
  .error-component {
    background-color: #fef0f0;
    color: #f56c6c;
    padding: 20px;
    border-radius: 4px;
    text-align: center;
    margin: 20px 0;
  }
  
  @media (max-width: 768px) {
    .placeholder-content {
      min-height: 300px;
    }
  }
  
  @media (max-width: 576px) {
    .placeholder-content {
      min-height: 200px;
    }
  }
  </style> 