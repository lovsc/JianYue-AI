<template>
  <div class="template-thumb" :class="template" aria-hidden="true">
    <ResumePreview :content="content || sampleResume" :template="template" />
  </div>
</template>
<script setup>
import ResumePreview from './ResumePreview.vue'
import { sampleResume } from '@/utils/resume-sample'
defineProps({
  template: { type: String, default: 'classic' },
  content: { type: Object, default: null },
})
</script>
<style scoped>
.template-thumb {
  width: 100%;
  background: white;
  pointer-events: none;
  overflow: hidden;
  box-shadow: 0 5px 20px #24334c14;
  aspect-ratio: 210/297;
}
.template-thumb :deep(.preview-frame) {
  box-shadow: none;
}
</style>
