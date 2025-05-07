<template>
    <div class="page-container">
      <h1 class="page-title">欢迎使用九州能源售电系统</h1>
      
      <el-row :gutter="20">
        <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
          <el-card class="system-overview">
            <template #header>
              <div class="card-header">
                <h3>系统概览</h3>
              </div>
            </template>
            <div class="card-content">
              <p>九州能源售电系统提供全面的电力交易和能源管理解决方案，包含以下核心功能模块：</p>
              <ul>
                <li><strong>业务档案管理：</strong>高效管理用户档案与经纪人信息，支持批量导入与灵活查询</li>
                <li><strong>智能客户分析：</strong>多维度分析用户电量消耗模式和偏差情况，提供精准用电画像</li>
                <li><strong>中长期交易策略：</strong>合约统计分析、电力曲线精细化分解及批发交易复盘功能</li>
                <li><strong>现货交易优化：</strong>基于AI的日总/分时电量预测和套利策略分析，提升交易效率</li>
                <li><strong>经营数据分析：</strong>全方位盈利指标分析，支持多维度图表可视化展示</li>
                <li><strong>客户合同管理：</strong>一体化管理购电合同和增值服务合同，并集成电量数据分析</li>
                <li><strong>市场行情监测：</strong>实时获取市场价格波动与交易规则变化，辅助决策制定</li>
                <li><strong>环境因素分析：</strong>整合气象数据与用电需求关联性分析，提高预测准确度</li>
              </ul>
              <p class="update-info">系统版本: v1.0.0 | 最近更新: 2025年4月17日</p>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
          <el-card class="quick-stats">
            <template #header>
              <div class="card-header">
                <h3>数据概况</h3>
              </div>
            </template>
            <div class="stats-container">
              <div class="stat-item">
                <div class="stat-value">428</div>
                <div class="stat-label">用户总数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">43</div>
                <div class="stat-label">合约数量</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">10,567</div>
                <div class="stat-label">本月售电量(兆瓦时)</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">¥3.28M</div>
                <div class="stat-label">本月销售额</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" class="forecast-section">
        <el-col :span="24">
          <el-card class="quick-actions">
            <template #header>
              <div class="card-header">
                <h3>快捷功能</h3>
              </div>
            </template>
            <div class="actions-container">
              <div class="action-row">
                <el-button type="primary" class="action-btn" @click="navigateTo('4-1')">
                  <el-icon><Odometer /></el-icon>
                  日总电量预测
                </el-button>
                <el-button type="primary" class="action-btn" @click="navigateTo('4-2')">
                  <el-icon><Timer /></el-icon>
                  分时电量预测
                </el-button>
                <el-button type="primary" class="action-btn" @click="navigateTo('4-3')">
                  <el-icon><Money /></el-icon>
                  日前博弈套利
                </el-button>
                <el-button type="primary" class="action-btn" @click="navigateTo('2-2')">
                  <el-icon><DataAnalysis /></el-icon>
                  电量偏差：预测vs实际
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useRouter } from 'vue-router';
  
  const router = useRouter();
  
  // 菜单项对应的路由
  const routes = {
    '4-1': '/daily-forecast',
    '4-2': '/hourly-forecast',
    '4-3': '/day-ahead-arbitrage',
    '2-2': '/consumption-deviation'
  };
  
  // 导航函数
  const navigateTo = (menuId: string) => {
    const path = routes[menuId as keyof typeof routes];
    if (path) {
      router.push(path);
    }
  };
  </script>
  
  <style scoped>
  .page-container {
    padding: 15px;
    height: 100%;
    overflow: auto;
  }
  
  .page-title {
    font-size: 22px;
    margin-bottom: 20px;
  }
  
  .system-overview {
    width: 100%;
    margin-bottom: 20px;
    height: 100%;
  }
  
  .quick-stats {
    width: 100%;
    margin-bottom: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .card-content {
    font-size: 14px;
    line-height: 1.8;
  }
  
  ul {
    padding-left: 20px;
    margin-top: 10px;
  }
  
  li {
    margin-bottom: 8px;
  }
  
  .update-info {
    font-size: 12px;
    color: #909399;
    margin-top: 15px;
    text-align: right;
    font-style: italic;
  }
  
  .stats-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    padding: 20px 10px;
    flex: 1;
  }
  
  .stat-item {
    text-align: center;
    padding: 20px 0;
    background-color: #f9f9f9;
    border-radius: 4px;
    transition: all 0.3s ease;
  }
  
  .stat-item:hover {
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  
  .stat-value {
    font-size: 26px;
    font-weight: bold;
    color: #409EFF;
    line-height: 1.2;
    margin-bottom: 10px;
  }
  
  .stat-label {
    font-size: 13px;
    color: #606266;
  }
  
  .forecast-section {
    margin-top: 20px;
  }
  
  .actions-container {
    padding: 15px;
  }
  
  .action-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    width: 100%;
  }
  
  .action-btn {
    width: 100%;
    height: 60px;
    font-size: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .action-btn .el-icon {
    margin-right: 8px;
    font-size: 18px;
  }
  
  /* 响应式设计调整 */
  @media (max-width: 1200px) {
    .action-row {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (max-width: 768px) {
    .stats-container {
      gap: 10px;
      padding: 10px;
    }
    
    .stat-value {
      font-size: 22px;
    }
    
    .stat-item {
      padding: 15px 0;
    }
    
    .action-btn {
      height: 50px;
    }
  }
  
  @media (max-width: 576px) {
    .page-title {
      font-size: 18px;
      margin-bottom: 15px;
    }
    
    .stats-container {
      grid-template-columns: 1fr;
    }
    
    .action-row {
      grid-template-columns: 1fr;
    }
    
    .action-btn {
      height: 45px;
    }
  }
  </style> 