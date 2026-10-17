<template>
  <svg
    class="app-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.65"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="(path, index) in paths" :key="index" :d="path" />
  </svg>
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({ name: { type: String, default: 'resume' } })
const icons = {
  home: ['M3 10.5 12 3l9 7.5', 'M5.5 9v11h5v-6h3v6h5V9'],
  dashboard: ['M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z'],
  resume: ['M14 2H5v20h14V7z', 'M14 2v5h5M8 11h8M8 15h8M8 18h5'],
  match: ['M9 3H4v5M15 3h5v5M9 21H4v-5M15 21h5v-5', 'm8 12 3 3 5-6'],
  export: ['M12 3v12m-4-4 4 4 4-4', 'M4 16v5h16v-5'],
  chat: ['M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l1.5-4A8.5 8.5 0 1 1 21 11.5Z', 'M8 10h8M8 14h5'],
  user: ['M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2'],
  education: ['m2 8 10-5 10 5-10 5z', 'M6 10v6c3 3 9 3 12 0v-6M22 8v8'],
  experience: ['M3 7h18v14H3zM8 7V3h8v4', 'M3 11c6 4 12 4 18 0M10 13h4'],
  projects: ['M2 6h8l2 3h10l-2 12H2zM2 6V3h7l3 3h8v3'],
  skills: ['m8 5-6 7 6 7m8-14 6 7-6 7M14 3l-4 18'],
  summary: ['M7 4h13v17H4V7M4 3h7v5H4z', 'M9 12h7M9 16h7'],
  intention: ['M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM5 21v-2a7 7 0 0 1 14 0v2M12 14v7m-2-5 2 2 2-2'],
  arrow: ['M4 12h16m-6-6 6 6-6 6'],
  check: ['m5 12 4 4L19 6'],
  shield: ['M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6z', 'm8 12 3 3 5-6'],
  spark: ['m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z'],
}
const paths = computed(() => icons[props.name] || icons.resume)
</script>
<style scoped>
.app-icon {
  display: inline-block;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
