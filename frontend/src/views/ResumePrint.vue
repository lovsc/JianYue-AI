<template>
  <div class="print-page">
    <div class="toolbar">
      <router-link :to="{ path: '/exports', query: { resumeId: route.params.id, template } }"
        >← 返回导出中心</router-link
      >
      <div>
        <button class="reading-toggle" @click="actualSize = !actualSize" :aria-pressed="actualSize">
          {{ actualSize ? '适合屏幕' : '100% 阅读' }}
        </button>
        <span>A4 · 缩放 100% · 关闭浏览器页眉页脚</span
        ><el-button
          type="primary"
          :disabled="loading || !!error"
          :loading="printing"
          @click="printPdf"
          >打印 / 保存 PDF</el-button
        >
      </div>
    </div>
    <div v-if="loading" class="print-state">正在生成预览…</div>
    <div v-else-if="error" class="print-state">
      {{ error }}<el-button @click="load">重新加载</el-button>
    </div>
    <template v-else
      ><div class="paper-viewport">
        <div class="screen-paper" :class="{ 'actual-size': actualSize }">
          <ResumePreview :content="resume.content" :template="template" />
        </div>
      </div>
      <div class="print-paper">
        <ResumeDocument :content="resume.content" :template="template" />
      </div>
      <p class="print-help">
        在打印窗口选择“另存为 PDF”；开启背景图形，关闭页眉和页脚。打印记录不能确认文件是否已保存。
      </p></template
    >
    <SiteFiling />
  </div>
</template>
<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import ResumeDocument from '@/components/resume/ResumeDocument.vue'
import ResumePreview from '@/components/resume/ResumePreview.vue'
import { resumeTemplates } from '@/utils/resume-templates'
import { getResume } from '@/api/resumes'
import { createExport } from '@/api/exports'
import SiteFiling from '@/components/SiteFiling.vue'
const route = useRoute(),
  loading = ref(true),
  printing = ref(false),
  error = ref(''),
  resume = ref({ content: {} })
const previousTitle = document.title
const actualSize = ref(false)
const template = computed(() =>
  resumeTemplates.some((item) => item.id === route.query.template)
    ? route.query.template
    : 'classic',
)
async function load() {
  loading.value = true
  error.value = ''
  try {
    resume.value = (await getResume(route.params.id)).data.data.resume
    document.title = [
      resume.value.content.basics?.name || resume.value.title,
      resume.value.content.basics?.position,
      '简历',
    ]
      .filter(Boolean)
      .join('-')
  } catch (e) {
    error.value = e.response?.data?.message || '简历加载失败'
  } finally {
    loading.value = false
  }
}
onMounted(load)
onBeforeUnmount(() => {
  document.title = previousTitle
})
async function printPdf() {
  if (printing.value) return
  printing.value = true
  try {
    await document.fonts.ready
    await Promise.all(
      [...document.querySelectorAll('.print-paper img')].map((img) => img.decode().catch(() => {})),
    )
    await createExport({ resumeId: Number(route.params.id), template: template.value })
    window.print()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '导出准备失败')
  } finally {
    printing.value = false
  }
}
</script>
<style>
.print-page {
  --el-color-primary: #6d4aff;
  min-height: 100dvh;
  padding: 24px;
  background: #eae7f0;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 950px;
  margin: 0 auto 24px;
  padding: 14px 18px;
  background: #25283e;
  color: white;
  border-radius: 12px;
  gap: 15px;
}
.toolbar > a {
  font-size: 13px;
  text-decoration: none;
}
.toolbar > div {
  display: flex;
  align-items: center;
  gap: 16px;
}
.toolbar span {
  font-size: 11px;
  color: #bab1cd;
}
.screen-paper {
  width: 210mm;
  max-width: 100%;
  margin: auto;
}
.paper-viewport {
  max-width: 100%;
  overflow: auto;
  padding: 0 0 14px;
}
.screen-paper.actual-size {
  width: 210mm;
  max-width: none;
}
.reading-toggle {
  border: 1px solid #706880;
  padding: 7px 11px;
  background: transparent;
  color: #d0c7e5;
  font-size: 13px;
  border-radius: 5px;
  white-space: nowrap;
}
.print-paper {
  display: none;
}
.print-state {
  min-height: 50vh;
  display: grid;
  place-content: center;
  gap: 20px;
  color: #898093;
}
.print-help {
  text-align: center;
  font-size: 12px;
  color: #92889e;
  margin: 22px auto;
  max-width: 700px;
}
@media (max-width: 650px) {
  .print-page {
    padding: 14px;
  }
  .toolbar {
    padding: 12px;
  }
  .toolbar span {
    display: none;
  }
}
@media print {
  @page {
    size: A4;
    margin: 12mm;
  }
  html,
  body,
  #app {
    height: auto !important;
    min-height: 0 !important;
    background: white !important;
  }
  .print-page {
    padding: 0;
    background: white;
    min-height: 0;
  }
  .toolbar,
  .screen-paper,
  .paper-viewport,
  .print-help,
  .print-state,
  .el-message {
    display: none !important;
  }
  .print-paper {
    display: block;
  }
  .print-paper .resume-document {
    width: 100%;
    padding: 0;
    min-height: 0;
    box-shadow: none;
  }
}
</style>
