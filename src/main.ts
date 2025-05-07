import './assets/main.css'

import { createApp } from 'vue'
import type { Component } from 'vue'
import App from './App.vue'
// @ts-ignore
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// @ts-ignore
import router from './router'

// Element Plus 中文语言包
// @ts-ignore
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

// 导入dayjs及其中文语言包
// @ts-ignore
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

// dayjs设置为中文
dayjs.locale('zh-cn')

// 导入所有图标
// @ts-ignore
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component as Component)
}

// 使用ElementPlus并设置为中文
app.use(ElementPlus, {
  locale: zhCn
})
app.use(router)
app.mount('#app')
