<template>
    <div class="menu-page-container">
      <!-- 根据路由渲染对应组件 -->
      <component-container :route-name="route.name?.toString()" />
    </div>
  </template>
  
  <script setup lang="ts">
  import { useRoute, onBeforeRouteUpdate } from 'vue-router'
  import { ref, watch } from 'vue'
  // 使用标准相对路径导入
  import ComponentContainer from './components/ComponentContainer.vue'
  
  const route = useRoute()
  const currentRouteName = ref(route.name?.toString())
  
  // 监听路由变化
  watch(() => route.name, (newRouteName) => {
    currentRouteName.value = newRouteName?.toString()
    console.log('路由变化为:', currentRouteName.value)
  })
  
  // 路由更新前
  onBeforeRouteUpdate((to) => {
    currentRouteName.value = to.name?.toString()
    console.log('路由即将更新为:', currentRouteName.value)
  })
  </script>
  
  <style scoped>
  .menu-page-container {
    padding: 15px;
    height: 100%;
    overflow: auto;
  }
  </style> 