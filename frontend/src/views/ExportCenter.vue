<template>
  <AppLayout>
    <header class="head">
      <span>READY FOR YOUR NEXT OPPORTUNITY</span>
      <h1>让好经历，成为好简历。</h1>
      <p>选择内容与版式，确认预览后生成投递文件。</p>
    </header>
    <div v-if="loading" class="empty">正在加载简历…</div>
    <div v-else-if="error" class="empty">
      <p>{{ error }}</p>
      <el-button @click="load">重新加载</el-button>
    </div>
    <div v-else class="export-layout">
      <section class="export-options">
        <div class="option-step">
          <span>01</span>
          <h2>选择简历内容</h2>
        </div>
        <div v-if="!resumes.length" class="empty">
          还没有简历。<router-link to="/resumes">创建第一份母简历 →</router-link>
        </div>
        <el-select v-else v-model="resumeId" aria-label="选择导出简历" class="resume-select"
          ><el-option
            v-for="item in resumes"
            :key="item.id"
            :value="item.id"
            :label="(item.source_resume_id ? '岗位版' : '母简历') + ' · ' + item.title"
        /></el-select>
        <div class="option-step">
          <span>02</span>
          <h2>选择你的版式</h2>
        </div>
        <div class="template-options">
          <button
            v-for="item in resumeTemplates"
            :key="item.id"
            :class="{ active: template === item.id }"
            :aria-pressed="template === item.id"
            @click="template = item.id"
          >
            <TemplateThumbnail :template="item.id" :content="selected?.content" /><b>{{
              item.name
            }}</b
            ><small>{{ item.description }}</small
            ><span>{{ template === item.id ? '✓ 已选择' : '选择版式' }}</span>
          </button>
        </div>
        <div class="export-action">
          <el-button type="primary" size="large" :disabled="!selected" @click="preview"
            >检查并打印 / 保存 PDF ↗</el-button
          >
          <p>A4 纸张 · 三款版式 · 预览与打印使用相同排版</p>
        </div>
        <div class="history">
          <h3>最近打印记录</h3>
          <p v-if="!records.length">尚无记录</p>
          <article v-for="item in records.slice(0, 5)" :key="item.id">
            <span>PDF</span>
            <div>
              <b>{{ item.resume_title }}</b
              ><small>{{ templateName(item.template) }} · {{ formatDate(item.created_at) }}</small>
            </div>
          </article>
          <small>记录表示发起过打印，是否保存成功以浏览器结果为准。</small>
        </div>
      </section>
      <aside class="live-preview">
        <header>
          <span>实时版式预览</span><small>A4 / {{ templateName(template) }}</small>
        </header>
        <div v-if="selected" class="preview-reading-bar">
          <span>正文已放大 · A4 真实排版</span
          ><el-button @click="readingVisible = true">100% 阅读 ↗</el-button>
        </div>
        <ResumePreview v-if="selected" :content="selected.content" :template="template" />
        <div v-else class="preview-empty">
          <b>你的下一份简历</b>
          <p>创建内容后，在这里查看完整排版。</p>
        </div>
        <p>投递前确认联系方式，内容建议控制在 1–2 页。</p>
      </aside>
    </div>
    <el-dialog v-model="readingVisible" title="简历内容 · 放大阅读" width="920px"
      ><ResumePreview v-if="selected" :content="selected.content" :template="template"
    /></el-dialog>
  </AppLayout>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import TemplateThumbnail from '@/components/resume/TemplateThumbnail.vue'
import ResumePreview from '@/components/resume/ResumePreview.vue'
import { resumeTemplates } from '@/utils/resume-templates'
import { listResumes } from '@/api/resumes'
import { listExports } from '@/api/exports'
const router = useRouter(),
  route = useRoute(),
  resumes = ref([]),
  records = ref([]),
  resumeId = ref(null),
  template = ref('classic'),
  loading = ref(true),
  error = ref('')
const readingVisible = ref(false)
if (resumeTemplates.some((item) => item.id === route.query.template))
  template.value = route.query.template
const selected = computed(() => resumes.value.find((item) => item.id === resumeId.value))
async function load() {
  loading.value = true
  error.value = ''
  try {
    const [r, e] = await Promise.all([listResumes(), listExports()])
    resumes.value = r.data.data.resumes
    records.value = e.data.data.exports
    resumeId.value =
      resumes.value.find((item) => item.id === Number(route.query.resumeId))?.id ||
      resumes.value[0]?.id ||
      null
  } catch (e) {
    error.value = e.response?.data?.message || '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
onMounted(load)
const preview = () =>
  router.push({
    name: 'resume-print',
    params: { id: resumeId.value },
    query: { template: template.value },
  })
const templateName = (id) => resumeTemplates.find((item) => item.id === id)?.name || id
const formatDate = (value) => new Date(value.replace(' ', 'T') + 'Z').toLocaleDateString('zh-CN')
</script>
<style scoped>
.head {
  margin: 5px 0 30px;
}
.head > span {
  font-size: 13px;
  letter-spacing: 2px;
  color: #797582;
}
.head h1 {
  font-size: 31px;
  letter-spacing: -0.8px;
  font-weight: 750;
  margin: 8px 0;
}
.head p {
  color: #6e6877;
  font-size: 13px;
}
.export-layout {
  display: grid;
  grid-template-columns: minmax(320px, 0.7fr) minmax(0, 1.3fr);
  gap: 26px;
  max-width: 1400px;
}
.export-options {
  background: white;
  border: 1px solid #dbd7e3;
  border-radius: 20px;
  padding: 26px;
  align-self: start;
}
.option-step {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 16px;
}
.option-step > span {
  font-size: 13px;
  color: #9c8eb8;
}
.option-step h2 {
  font-size: 15px;
  font-weight: 700;
}
.resume-select {
  width: 100%;
  margin-bottom: 30px;
}
.template-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.template-options button {
  padding: 7px;
  border: 1px solid #dbd7e3;
  border-radius: 10px;
  background: #fbfafc;
  text-align: left;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.template-options button.active {
  outline: 2px solid #6d4aff;
  outline-offset: -1px;
  background: #faf7ff;
}
.template-options b {
  font-size: 14px;
  font-weight: 650;
  margin-top: 4px;
}
.template-options small {
  font-size: 13px;
  color: #6e6976;
  line-height: 1.6;
}
.template-options button > span {
  font-size: 13px;
  color: #6d4aff;
  margin-top: auto;
}
.export-action {
  padding: 24px 0;
  border-bottom: 1px solid #ede8f2;
}
.export-action .el-button {
  width: 100%;
  font-size: 13px;
}
.export-action p {
  font-size: 13px;
  color: #797581;
  text-align: center;
  margin-top: 10px;
}
.live-preview {
  padding: 18px;
  background: #dfdaea;
  border: 1px solid #ccc5dc;
  border-radius: 13px;
  align-self: start;
}
.preview-reading-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 15px;
  font-size: 13px;
  color: #7d7590;
}
.preview-reading-bar :deep(.el-button) {
  font-size: 13px;
  min-height: 32px;
  background: transparent;
  border-color: #afa4c8;
  color: #4c3e6b;
}
.live-preview > header {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #797084;
  margin-bottom: 15px;
}
.live-preview small {
  font-size: 13px;
  color: #a198ad;
}
.live-preview > p {
  text-align: center;
  color: #a49aad;
  font-size: 13px;
  margin-top: 16px;
}
.history {
  padding-top: 22px;
}
.history h3 {
  font-size: 13px;
  margin-bottom: 10px;
}
.history > p,
.history > small {
  font-size: 13px;
  color: #a69caf;
}
.history article {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 14px 0;
}
.history article > span {
  font-size: 13px;
  padding: 5px 6px;
  color: #9b6e89;
  background: #faf0f6;
  border-radius: 5px;
}
.history article div {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.history article b {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.history article small {
  font-size: 13px;
  color: #797581;
}
.preview-empty {
  min-height: 440px;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #b3aabc;
  font-size: 13px;
}
.empty {
  padding: 40px 16px;
  color: #9b91a6;
  font-size: 13px;
}
.empty .el-button {
  margin-top: 14px;
}
@media (max-width: 1100px) {
  .export-layout {
    grid-template-columns: 1fr;
  }
  .live-preview {
    width: 100%;
    max-width: 700px;
    margin: auto;
  }
}
@media (max-width: 500px) {
  .export-options {
    padding: 18px;
  }
  .template-options {
    gap: 7px;
  }
  .template-options button {
    padding: 6px;
  }
  .template-options small {
    display: none;
  }
  .head h1 {
    font-size: 26px;
  }
  .live-preview {
    padding: 12px;
  }
}
</style>
