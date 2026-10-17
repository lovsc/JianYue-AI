<script setup>
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>

<template>
  <ElConfigProvider :locale="zhCn"><router-view :key="$route.path" /></ElConfigProvider>
</template>

<style scoped></style>
