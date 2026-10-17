<template>
  <footer v-if="record" class="site-filing">
    <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">{{ record }}</a>
  </footer>
</template>

<script setup>
const record = import.meta.env.VITE_ICP_RECORD || ''
</script>

<style scoped>
.site-filing { margin-top: 24px; text-align: center; font-size: 12px; }
.site-filing a { color: #818795; text-decoration: none; }
@media print { .site-filing { display: none; } }
</style>
