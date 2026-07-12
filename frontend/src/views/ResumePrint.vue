<template>
  <div class="print-page">
    <div class="toolbar">
      <button @click="$router.back()">← 返回导出中心</button>
      <div>
        <span>打印设置：A4 · 边距默认 · 背景图形开启</span
        ><button class="primary" :disabled="printing" @click="printPdf">
          {{ printing ? '准备中...' : '打印 / 保存 PDF' }}
        </button>
      </div>
    </div>
    <div v-if="loading" class="loading">正在生成预览...</div>
    <article v-else class="paper" :class="template">
      <header>
        <div>
          <h1>{{ basics.name || '未填写姓名' }}</h1>
          <p>{{ basics.summary }}</p>
        </div>
        <span class="monogram">{{ basics.name?.slice(0, 1) || 'CV' }}</span>
      </header>
      <div class="contact">
        <span v-if="basics.phone">{{ basics.phone }}</span
        ><span v-if="basics.email">{{ basics.email }}</span
        ><span v-if="basics.location">{{ basics.location }}</span>
      </div>
      <ResumePrintSection
        v-if="content.experience.length"
        title="工作经历"
        :items="content.experience"
      /><ResumePrintSection
        v-if="content.projects.length"
        title="项目经历"
        :items="content.projects"
      /><ResumePrintSection
        v-if="content.education.length"
        title="教育经历"
        :items="content.education"
      />
      <section v-if="content.skills.length" class="skills">
        <h2>专业技能</h2>
        <div>
          <span v-for="skill in content.skills" :key="skill">{{ skill }}</span>
        </div>
      </section>
      <footer>由简跃 AI · ResumeLeap 生成</footer>
    </article>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import ResumePrintSection from '@/components/resume/ResumePrintSection.vue'
import { getResume } from '@/api/resumes'
import { createExport } from '@/api/exports'
const route = useRoute(),
  loading = ref(true),
  printing = ref(false),
  resume = ref({ content: { basics: {}, education: [], experience: [], projects: [], skills: [] } })
const template = computed(() => (route.query.template === 'modern' ? 'modern' : 'classic')),
  content = computed(() => resume.value.content),
  basics = computed(() => content.value.basics || {})
onMounted(async () => {
  try {
    resume.value = (await getResume(route.params.id)).data.data.resume
    document.title = `${basics.value.name || resume.value.title}-简历`
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '简历加载失败')
  } finally {
    loading.value = false
  }
})
const printPdf = async () => {
  printing.value = true
  try {
    await createExport({ resumeId: Number(route.params.id), template: template.value })
    await new Promise((resolve) => setTimeout(resolve, 100))
    window.print()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '导出准备失败')
  } finally {
    printing.value = false
  }
}
</script>
<style scoped>
.print-page {
  min-height: 100vh;
  padding: 28px;
  background: #dfe2e8;
  color: #20232b;
}
.toolbar {
  position: sticky;
  z-index: 10;
  top: 15px;
  max-width: 900px;
  margin: 0 auto 22px;
  padding: 11px 14px;
  border-radius: 12px;
  background: #171923;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8px 30px #0003;
}
.toolbar button {
  border: 0;
  background: transparent;
  color: #ccd1dc;
  cursor: pointer;
}
.toolbar > div {
  display: flex;
  align-items: center;
  gap: 17px;
}
.toolbar span {
  color: #9299a8;
  font-size: 12px;
}
.toolbar .primary {
  padding: 9px 15px;
  border-radius: 8px;
  background: #6d4aff;
  color: #fff;
}
.paper {
  width: 210mm;
  min-height: 297mm;
  margin: auto;
  padding: 18mm 17mm;
  background: #fff;
  box-shadow: 0 12px 45px #20263733;
  font-family: Arial, 'Microsoft YaHei', sans-serif;
}
.paper header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 14px;
  border-bottom: 3px solid #20232b;
}
.paper h1 {
  font-size: 30px;
  font-weight: 750;
  letter-spacing: 2px;
}
.paper header p {
  max-width: 610px;
  margin-top: 7px;
  color: #555d69;
  line-height: 1.65;
}
.monogram {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: #20232b;
  color: #fff;
  font-size: 20px;
  font-weight: 750;
}
.contact {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 23px;
  padding: 11px 0;
  color: #4e5663;
  font-size: 12px;
}
.contact span:not(:last-child)::after {
  content: '·';
  margin-left: 23px;
  color: #bbb;
}
.skills {
  margin-top: 20px;
  break-inside: avoid;
}
.skills h2 {
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #bbb;
  font-size: 16px;
  font-weight: 750;
}
.skills div {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.skills span {
  padding: 4px 9px;
  background: #f1f2f4;
  border-radius: 4px;
  font-size: 11px;
}
.paper footer {
  margin-top: 28px;
  padding-top: 8px;
  border-top: 1px solid #ddd;
  color: #aaa;
  text-align: center;
  font-size: 9px;
}
.paper.modern {
  padding-top: 0;
  border-top: 13mm solid #6d4aff;
}
.paper.modern header {
  padding-top: 12mm;
  border-bottom-color: #6d4aff;
}
.paper.modern .monogram {
  background: #6d4aff;
}
.paper.modern :deep(.resume-section h2),
.paper.modern .skills h2 {
  color: #6d4aff;
  border-color: #cfc6ff;
}
.loading {
  display: grid;
  place-items: center;
  height: 70vh;
}
@media (max-width: 900px) {
  .paper {
    width: 100%;
    min-height: auto;
    padding: 30px;
  }
  .toolbar span {
    display: none;
  }
}
@media print {
  @page {
    size: A4;
    margin: 0;
  }
  .print-page {
    padding: 0;
    background: #fff;
  }
  .toolbar,
  .loading {
    display: none !important;
  }
  .paper {
    width: 210mm;
    min-height: 297mm;
    margin: 0;
    padding: 16mm 17mm;
    box-shadow: none;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .paper.modern {
    padding-top: 0;
  }
  .paper footer {
    display: none;
  }
}
</style>
