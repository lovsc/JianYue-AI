<template>
  <div ref="frame" class="preview-frame" :style="{ height: height + 'px' }">
    <div ref="paper" class="preview-paper" :style="{ transform: `scale(${scale})` }">
      <ResumeDocument :content="content" :template="template" />
    </div>
  </div>
</template>
<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import ResumeDocument from './ResumeDocument.vue'
defineProps({
  content: { type: Object, required: true },
  template: { type: String, default: 'classic' },
})
const frame = ref(),
  paper = ref(),
  scale = ref(1),
  height = ref(1123)
let observer
onMounted(() => {
  observer = new ResizeObserver(() => {
    if (!frame.value || !paper.value) return
    scale.value = frame.value.clientWidth / paper.value.offsetWidth
    height.value = paper.value.offsetHeight * scale.value
  })
  observer.observe(frame.value)
  observer.observe(paper.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>
<style scoped>
.preview-frame {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: white;
  box-shadow: 0 12px 36px #25203912;
}
.preview-paper {
  position: absolute;
  top: 0;
  left: 0;
  width: 210mm;
  transform-origin: top left;
}
</style>
