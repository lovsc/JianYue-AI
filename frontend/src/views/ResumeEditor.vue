<template>
  <AppLayout
    ><header class="editor-head">
      <el-button :disabled="restoring" @click="$router.push('/resumes')">返回</el-button
      ><el-input
        v-model="resume.title"
        :disabled="restoring || !initialized"
        class="title"
        maxlength="80"
      />
      <div>
        <span class="save-state" :class="saveState">{{ saveStateText }}</span>
        <span v-if="savedAt" class="saved-time">{{ savedAt }}</span
        ><el-button @click="openVersions">版本历史</el-button
        ><el-button
          type="primary"
          :disabled="restoring || !initialized"
          :loading="saving"
          @click="save()"
          >保存简历</el-button
        >
      </div>
    </header>
    <div v-if="saveState === 'conflict'" class="conflict-banner" role="alert">
      服务器已有更新，已暂停自动保存。请下载当前草稿，刷新后对照合并。<el-button
        @click="downloadDraft"
        >下载当前草稿</el-button
      >
    </div>
    <div v-if="loading" class="loading">正在加载简历...</div>
    <div v-else-if="loadError" class="loading">{{ loadError }}</div>
    <div v-else class="editor-grid" :inert="restoring">
      <section class="form-card">
        <h2>基本信息</h2>
        <div class="two">
          <el-form-item label="姓名"><el-input v-model="resume.content.basics.name" /></el-form-item
          ><el-form-item label="所在城市"
            ><el-input v-model="resume.content.basics.location" /></el-form-item
          ><el-form-item label="手机"
            ><el-input v-model="resume.content.basics.phone" /></el-form-item
          ><el-form-item label="邮箱"
            ><el-input v-model="resume.content.basics.email"
          /></el-form-item>
        </div>
        <div class="two">
          <el-form-item label="性别（选填）"
            ><el-input v-model="resume.content.basics.gender" placeholder="不填则不展示"
          /></el-form-item>
          <el-form-item label="年龄（选填）"
            ><el-input v-model="resume.content.basics.age" placeholder="例如：24 岁"
          /></el-form-item>
          <el-form-item label="意向岗位"
            ><el-input v-model="resume.content.basics.position"
          /></el-form-item>
          <el-form-item label="期望薪资"
            ><el-input v-model="resume.content.basics.salary" placeholder="选填，例如：面议"
          /></el-form-item>
          <el-form-item label="求职类型"
            ><el-input v-model="resume.content.basics.jobType" placeholder="全职 / 实习"
          /></el-form-item>
          <el-form-item label="个人照片（选填）"
            ><input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              aria-label="上传个人照片"
              @change="uploadPhoto"
            /><el-button
              v-if="resume.content.basics.photo"
              text
              @click="resume.content.basics.photo = ''"
              >移除照片</el-button
            ></el-form-item
          >
        </div>
        <el-form-item label="个人简介"
          ><el-input v-model="resume.content.basics.summary" type="textarea" :rows="4"
        /></el-form-item>
        <BlockEditor
          title="教育经历"
          :items="resume.content.education"
          kind="education"
          @add="add('education')"
          @remove="remove('education', $event)"
        /><BlockEditor
          title="工作经历"
          :items="resume.content.experience"
          kind="experience"
          @add="add('experience')"
          @remove="remove('experience', $event)"
        /><BlockEditor
          title="项目经历"
          :items="resume.content.projects"
          kind="projects"
          @add="add('projects')"
          @remove="remove('projects', $event)"
        />
        <div class="section-title"><h2>专业技能</h2></div>
        <el-input
          v-model="skillsText"
          type="textarea"
          :rows="3"
          placeholder="多个技能请用逗号分隔，例如：办公软件，沟通协调，活动策划"
        />
      </section>
      <aside class="preview live-editor-preview">
        <header class="preview-controls">
          <b>实时预览</b
          ><el-select v-model="template" aria-label="预览模板"
            ><el-option
              v-for="item in resumeTemplates"
              :key="item.id"
              :label="item.name"
              :value="item.id"
          /></el-select>
        </header>
        <ResumePreview :content="resume.content" :template="template" />
        <el-button
          class="export-link"
          :disabled="dirty || saving"
          @click="
            $router.push({ path: '/exports', query: { resumeId: route.params.id, template } })
          "
          >前往导出中心 →</el-button
        >
      </aside>
    </div>
    <el-drawer v-model="versionVisible" title="版本历史" size="390px"
      ><div class="version-intro">AI 建议采纳和版本恢复前会自动创建快照。</div>
      <div class="manual-version">
        <el-input
          v-model="versionSummary"
          maxlength="100"
          placeholder="版本备注，例如：投递前最终版"
        /><el-button type="primary" plain :loading="creatingVersion" @click="createVersion"
          >创建快照</el-button
        >
      </div>
      <div v-if="versionLoading" class="version-empty">正在加载...</div>
      <div v-else-if="!versions.length" class="version-empty">暂无历史版本</div>
      <div v-else class="version-list">
        <article v-for="item in versions" :key="item.id">
          <div class="version-dot">V{{ item.version_number }}</div>
          <div>
            <b>{{ sourceLabel[item.source] || '自动备份' }}</b>
            <p>{{ item.change_summary || item.title }}</p>
            <small>{{ formatDate(item.created_at) }}</small>
          </div>
          <el-button text type="primary" @click="restoreVersion(item)">恢复</el-button>
          <el-button text @click="compareVersion(item)">对比</el-button>
        </article>
      </div></el-drawer
    >
    <el-dialog v-model="diffVisible" title="历史版本与当前修改对比" width="850px"
      ><ResumeDiff v-if="comparedVersion" :before="comparedVersion" :after="resume"
    /></el-dialog>
  </AppLayout>
</template>
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppLayout from '@/layouts/AppLayout.vue'
import BlockEditor from '@/components/resume/BlockEditor.vue'
import ResumePreview from '@/components/resume/ResumePreview.vue'
import ResumeDiff from '@/components/resume/ResumeDiff.vue'
import { resumeTemplates, normalizeResumeContent } from '@/utils/resume-templates'
import {
  createResumeVersion,
  getResume,
  getResumeVersion,
  listResumeVersions,
  restoreResumeVersion,
  updateResume,
} from '@/api/resumes'
const route = useRoute(),
  loading = ref(true),
  saving = ref(false),
  savedAt = ref(''),
  skillsText = ref(''),
  versionVisible = ref(false),
  versionLoading = ref(false),
  versions = ref([])
const dirty = ref(false),
  saveState = ref('saved'),
  versionSummary = ref(''),
  creatingVersion = ref(false)
const initialized = ref(false),
  revision = ref(null),
  loadError = ref(''),
  diffVisible = ref(false),
  comparedVersion = ref(null),
  template = ref('classic'),
  restoring = ref(false)
let saveTimer = null,
  disposed = false
const saveStateText = computed(
  () =>
    ({
      saved: '已保存',
      dirty: '等待自动保存',
      saving: '正在保存...',
      error: '保存失败，将自动重试',
      conflict: '内容冲突，请保留草稿后重新加载',
      invalid: '请检查标题或内容后重新保存',
    })[saveState.value],
)
const sourceLabel = {
  ai_apply: '采纳 AI 建议前',
  before_restore: '恢复历史版本前',
  manual: '手动保存',
  before_edit: '编辑保存前',
}
const resume = reactive({
  title: '',
  status: 'draft',
  content: {
    basics: { name: '', phone: '', email: '', location: '', summary: '' },
    education: [],
    experience: [],
    projects: [],
    skills: [],
  },
})
const assignResume = (item) => {
  resume.title = item.title
  resume.status = item.status
  revision.value = item.revision
  resume.content = normalizeResumeContent(item.content)
  skillsText.value = (resume.content.skills || []).join(', ')
}
watch(skillsText, (v) => {
  resume.content.skills = v
    .split(/[,，]/)
    .map((x) => x.trim())
    .filter(Boolean)
})
const scheduleSave = (delay = 1200) => {
  clearTimeout(saveTimer)
  if (disposed || restoring.value || saveState.value === 'conflict') return
  saveTimer = setTimeout(() => save(true), delay)
}
watch(
  resume,
  () => {
    if (!initialized.value || disposed) return
    dirty.value = true
    if (saveState.value === 'conflict') return
    saveState.value = 'dirty'
    scheduleSave()
  },
  { deep: true },
)
onMounted(async () => {
  try {
    assignResume((await getResume(route.params.id)).data.data.resume)
    await nextTick()
    initialized.value = true
  } catch (e) {
    loadError.value = e.response?.data?.message || '加载失败，请刷新页面重试'
    ElMessage.error(e.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
})
const templates = {
  education: { school: '', degree: '', period: '', description: '' },
  experience: { company: '', role: '', period: '', description: '' },
  projects: { name: '', role: '', period: '', description: '' },
}
const add = (key) => resume.content[key].push({ ...templates[key] })
const remove = (key, index) => resume.content[key].splice(index, 1)
const save = async (silent = false) => {
  if (!initialized.value || disposed || saveState.value === 'conflict') return false
  if (saving.value) {
    dirty.value = true
    scheduleSave(800)
    return false
  }
  clearTimeout(saveTimer)
  saving.value = true
  saveState.value = 'saving'
  const signature = JSON.stringify({
    title: resume.title,
    content: resume.content,
  })
  const payload = JSON.parse(signature)
  try {
    const status = resume.content.basics.name && resume.content.basics.email ? 'completed' : 'draft'
    const item = (
      await updateResume(route.params.id, {
        ...payload,
        expectedRevision: revision.value,
        status,
      })
    ).data.data.resume
    revision.value = item.revision
    const unchanged = signature === JSON.stringify({ title: resume.title, content: resume.content })
    dirty.value = !unchanged
    saveState.value = unchanged ? 'saved' : 'dirty'
    savedAt.value = new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
    if (!silent) ElMessage.success('保存成功')
    if (!unchanged) scheduleSave(500)
    return unchanged
  } catch (e) {
    dirty.value = true
    saveState.value =
      e.response?.status === 409 ? 'conflict' : e.response?.status === 400 ? 'invalid' : 'error'
    if (!silent) ElMessage.error(e.response?.data?.message || '保存失败')
    if (saveState.value === 'error') scheduleSave(5000)
    return false
  } finally {
    saving.value = false
  }
}
const openVersions = async () => {
  versionVisible.value = true
  versionLoading.value = true
  try {
    versions.value = (await listResumeVersions(route.params.id)).data.data.versions
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '版本加载失败')
  } finally {
    versionLoading.value = false
  }
}
const createVersion = async () => {
  creatingVersion.value = true
  try {
    if (dirty.value && !(await save(true))) return
    await createResumeVersion(route.params.id, {
      summary: versionSummary.value,
      expectedRevision: revision.value,
    })
    versionSummary.value = ''
    versions.value = (await listResumeVersions(route.params.id)).data.data.versions
    ElMessage.success('版本快照创建成功')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '创建版本失败')
  } finally {
    creatingVersion.value = false
  }
}
const restoreVersion = async (item) => {
  if (saving.value || restoring.value || saveState.value === 'conflict') {
    ElMessage.warning('请先完成保存或处理内容冲突')
    return
  }
  restoring.value = true
  clearTimeout(saveTimer)
  try {
    await ElMessageBox.confirm(
      `恢复到 V${item.version_number}？当前内容也会自动备份。`,
      '恢复历史版本',
      { type: 'warning' },
    )
    if (dirty.value && !(await save(true))) return
    initialized.value = false
    assignResume(
      (await restoreResumeVersion(route.params.id, item.id, revision.value)).data.data.resume,
    )
    await nextTick()
    dirty.value = false
    saveState.value = 'saved'
    versionVisible.value = false
    ElMessage.success('版本恢复成功')
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') ElMessage.error(e.response?.data?.message || '恢复失败')
  } finally {
    initialized.value = true
    restoring.value = false
    if (dirty.value) scheduleSave()
  }
}
const beforeUnload = (event) => {
  if (!dirty.value) return
  event.preventDefault()
  event.returnValue = ''
}
window.addEventListener('beforeunload', beforeUnload)
onBeforeUnmount(() => {
  disposed = true
  clearTimeout(saveTimer)
  window.removeEventListener('beforeunload', beforeUnload)
})
const compareVersion = async (item) => {
  try {
    comparedVersion.value = (await getResumeVersion(route.params.id, item.id)).data.data.version
    diffVisible.value = true
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '版本加载失败')
  }
}
const uploadPhoto = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 250 * 1024) {
    ElMessage.warning('请选择不超过 250KB 的 PNG、JPG 或 WebP 照片')
    event.target.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    resume.content.basics.photo = reader.result
  }
  reader.readAsDataURL(file)
  event.target.value = ''
}
const downloadDraft = () => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify({ title: resume.title, content: resume.content }, null, 2)], {
      type: 'application/json',
    }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = '简历草稿备份.json'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
onBeforeRouteLeave(() => {
  if (!dirty.value) return true
  return window.confirm('简历还有未保存的修改，确定离开吗？')
})
const formatDate = (v) => new Date(v.replace(' ', 'T') + 'Z').toLocaleString('zh-CN')
</script>
<style scoped>
.editor-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}
.title {
  max-width: 360px;
}
.editor-head > div {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}
.editor-head span {
  color: #8b91a0;
  font-size: 13px;
}
.editor-head .save-state {
  padding: 4px 9px;
  border-radius: 9px;
  background: #f2eef8;
  color: #482780;
}
.editor-head .save-state.dirty,
.editor-head .save-state.saving {
  background: #fff6e7;
  color: #a66a11;
}
.editor-head .save-state.error {
  background: #fff0ee;
  color: #c64f43;
}
.manual-version {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  margin-bottom: 16px;
}
.loading {
  display: grid;
  place-items: center;
  height: 400px;
}
.editor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
  gap: 24px;
}
.form-card,
.preview {
  padding: 28px;
  background: #fff;
  border: 1px solid #e6e8ef;
  border-radius: 18px;
}
.form-card h2 {
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 700;
}
.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}
.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 28px;
}
.preview {
  position: sticky;
  top: 34px;
  min-height: 700px;
  align-self: start;
  padding: 42px;
  color: #282c36;
}
.preview > h3 {
  font-size: 28px;
  font-weight: 700;
}
.preview > p {
  color: #747b89;
}
.preview h4 {
  margin: 26px 0 10px;
  padding-bottom: 5px;
  border-bottom: 2px solid #6d4aff;
  font-weight: 700;
}
.preview article {
  margin: 13px 0;
}
.preview article b,
.preview article small {
  display: block;
}
.preview article small {
  color: #777;
}
.preview article p {
  white-space: pre-line;
}
@media (max-width: 1100px) {
  .editor-grid {
    grid-template-columns: 1fr;
  }
  .preview {
    position: static;
  }
}
@media (max-width: 650px) {
  .two {
    grid-template-columns: 1fr;
  }
}
.version-intro {
  margin-bottom: 20px;
  padding: 13px;
  background: #eae7f2;
  border-radius: 10px;
  color: #625a7d;
}
.version-empty {
  padding: 50px 0;
  color: #9298a5;
  text-align: center;
}
.version-list article {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 16px 0;
  border-bottom: 1px solid #eceef2;
}
.version-dot {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #eae7f1;
  color: #6d4aff;
  font-size: 13px;
  font-weight: 750;
}
.version-list article > div:nth-child(2) {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.version-list b {
  font-weight: 650;
}
.version-list p {
  overflow: hidden;
  color: #737a87;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.version-list small {
  color: #a0a5af;
}
</style>

<style scoped>
.live-editor-preview {
  padding: 16px;
  min-height: 0;
  background: #eeecf3;
  border: 0;
}
.preview-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 15px;
  font-size: 13px;
  color: #8d819c;
}
.preview-controls .el-select {
  width: 135px;
}
.export-link {
  width: 100%;
  margin-top: 16px;
}
.conflict-banner {
  padding: 16px;
  background: #fff2e7;
  color: #a36b34;
  border-radius: 12px;
  margin-bottom: 18px;
  font-size: 13px;
}
.conflict-banner button {
  margin-left: 12px;
}
.editor-head .conflict,
.editor-head .invalid {
  background: #fff0ee;
  color: #c64f43;
}
.form-card {
  min-width: 0;
}
input[type='file'] {
  max-width: 100%;
  font-size: 13px;
}
</style>
