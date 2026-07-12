<template>
  <AppLayout>
    <header class="page-head">
      <div><span class="eyebrow">AI CAREER LAB</span><h1>岗位匹配分析</h1><p>用真实职位描述校准简历内容，找到影响通过率的关键差距。</p></div>
      <div class="steps"><b>01</b><i></i><b>02</b><i></i><b>03</b></div>
    </header>

    <div class="workspace">
      <section class="setup-card">
        <div class="section-head"><div><small>STEP 01</small><h2>选择分析简历</h2></div><router-link to="/resumes">管理简历</router-link></div>
        <div v-if="!resumes.length" class="notice">请先创建并填写一份简历</div>
        <div v-else class="resume-options">
          <button v-for="item in resumes" :key="item.id" :class="{ active: form.resumeId === item.id }" @click="form.resumeId = item.id">
            <span class="doc">CV</span><span><b>{{ item.title }}</b><small>{{ item.content?.basics?.name || '信息待完善' }}</small></span><em>{{ form.resumeId === item.id ? '✓' : '' }}</em>
          </button>
        </div>

        <div class="section-head second"><div><small>STEP 02</small><h2>录入目标岗位</h2></div><button class="text-btn" @click="resetJob">清空</button></div>
        <div class="fields">
          <label>公司名称 <span>选填</span><el-input v-model="form.company" placeholder="例如：字节跳动" maxlength="80" /></label>
          <label>岗位名称<el-input v-model="form.position" placeholder="例如：前端开发工程师" maxlength="80" /></label>
          <label class="full">职位描述 JD <span>{{ form.content.length }}/20000</span><el-input v-model="form.content" type="textarea" :rows="10" placeholder="粘贴完整职位描述，包含工作职责、任职要求和加分项。" maxlength="20000" /></label>
        </div>
        <div class="run-bar">
          <div><b>{{ readiness.title }}</b><small :class="{ warning: !readiness.ready }">{{ readiness.hint }}</small></div>
          <el-button type="primary" size="large" :loading="running" @click="analyze">{{ running ? '正在深度分析' : '开始匹配分析' }}</el-button>
        </div>
      </section>

      <aside>
        <section class="tips"><span>分析建议</span><h3>怎样获得更准确的结果？</h3><ul><li>简历中尽量填写量化项目成果</li><li>复制完整 JD，而非只有岗位标题</li><li>针对不同岗位分别保存分析报告</li></ul></section>
        <section class="history"><div class="history-title"><h3>最近报告</h3><span>{{ histories.length }}</span></div><div v-if="!histories.length" class="history-empty">完成首次分析后，报告会出现在这里。</div><button v-for="item in histories.slice(0, 6)" :key="item.id" @click="$router.push(`/analysis/${item.id}`)"><span><b>{{ item.position }}</b><small>{{ item.company || '未填写公司' }} · {{ item.resume_title }}</small></span><strong>{{ item.score }}</strong></button></section>
      </aside>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppLayout from '@/layouts/AppLayout.vue'
import { listResumes } from '@/api/resumes'
import { createJob, listAnalyses, listJobs, runAnalysis } from '@/api/jobs'

const router = useRouter()
const resumes = ref([])
const histories = ref([])
const running = ref(false)
const form = reactive({ resumeId: null, company: '', position: '', content: '' })

const readiness = computed(() => {
  if (!resumes.value.length) return { ready: false, title: '请先创建一份简历', hint: '进入“我的简历”创建并填写后再开始分析' }
  if (!form.resumeId) return { ready: false, title: '请选择用于分析的简历', hint: '点击上方简历卡片完成选择' }
  if (!form.position.trim()) return { ready: false, title: '还差一个岗位名称', hint: '填写目标岗位，例如“前端开发工程师”' }
  if (form.content.trim().length < 20) return { ready: false, title: '职位描述还不够完整', hint: `还需输入 ${20 - form.content.trim().length} 个字符，建议粘贴完整 JD` }
  return { ready: true, title: '信息已完整，可以开始分析', hint: '通常需要 10–30 秒，分析结果将自动保存' }
})

onMounted(async () => {
  try {
    const [resumeResponse, _jobResponse, analysisResponse] = await Promise.all([listResumes(), listJobs(), listAnalyses()])
    resumes.value = resumeResponse.data.data.resumes
    histories.value = analysisResponse.data.data.analyses
    if (resumes.value.length) form.resumeId = resumes.value[0].id
  } catch (error) { ElMessage.error(error.response?.data?.message || '页面加载失败') }
})

const resetJob = () => Object.assign(form, { company: '', position: '', content: '' })
const analyze = async () => {
  if (!readiness.value.ready) { ElMessage.warning(readiness.value.hint); return }
  running.value = true
  try {
    const job = (await createJob({ company: form.company, position: form.position, content: form.content })).data.data.job
    const analysis = (await runAnalysis({ resumeId: form.resumeId, jobId: job.id })).data.data.analysis
    router.push(`/analysis/${analysis.id}`)
  } catch (error) { ElMessage.error(error.response?.data?.message || '分析失败，请稍后重试') }
  finally { running.value = false }
}
</script>

<style scoped>
.page-head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:28px}.eyebrow{color:#6d4aff;font-size:11px;font-weight:800;letter-spacing:2px}.page-head h1{margin:5px 0 3px;font-size:31px;font-weight:760}.page-head p{color:#7d8391}.steps{display:flex;align-items:center;gap:8px}.steps b{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#171923;color:#fff;font-size:11px}.steps i{width:28px;height:1px;background:#ccd0d9}.workspace{display:grid;grid-template-columns:minmax(560px,1fr) 310px;gap:22px}.setup-card,.tips,.history{background:#fff;border:1px solid #e5e7ed;border-radius:20px;box-shadow:0 8px 28px #222b4010}.setup-card{padding:28px}.section-head{display:flex;align-items:center;justify-content:space-between}.section-head small{color:#6d4aff;font-weight:700;letter-spacing:1px}.section-head h2{font-size:19px;font-weight:700}.section-head a,.text-btn{color:#6d4aff;text-decoration:none;border:0;background:none;cursor:pointer}.resume-options{display:grid;grid-template-columns:repeat(2,1fr);gap:11px;margin-top:15px}.resume-options button{display:flex;align-items:center;gap:11px;padding:14px;border:1px solid #e4e6ec;border-radius:13px;background:#fff;text-align:left;cursor:pointer}.resume-options button:hover,.resume-options button.active{border-color:#6d4aff;background:#f8f6ff}.doc{display:grid;place-items:center;width:38px;height:42px;border-radius:8px;background:#eeebff;color:#6d4aff;font-weight:800}.resume-options button>span:nth-child(2){display:flex;min-width:0;flex:1;flex-direction:column}.resume-options b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:650}.resume-options small{color:#8d93a0}.resume-options em{color:#6d4aff;font-style:normal}.second{margin-top:32px;padding-top:25px;border-top:1px solid #eceef3}.fields{display:grid;grid-template-columns:1fr 1fr;gap:17px;margin-top:16px}.fields label{display:grid;gap:7px;font-size:13px;font-weight:650}.fields label span{float:right;color:#9ba0aa;font-weight:400}.fields .full{grid-column:1/-1}.run-bar{display:flex;align-items:center;justify-content:space-between;margin:24px -28px -28px;padding:20px 28px;border-radius:0 0 20px 20px;background:#fafafe}.run-bar div{display:flex;flex-direction:column}.run-bar b{font-size:14px;font-weight:650}.run-bar small{color:#39805c}.run-bar small.warning{color:#c56a20}.notice{margin-top:15px;padding:18px;background:#fff8e7;border-radius:12px;color:#8c6611}.tips{padding:23px;background:#171923;color:#fff}.tips>span{color:#9d8cff;font-size:11px;font-weight:750}.tips h3{margin:8px 0 14px;font-size:18px;font-weight:650}.tips ul{display:grid;gap:10px;padding-left:19px;color:#bac0cd;font-size:13px}.history{margin-top:18px;padding:20px}.history-title{display:flex;justify-content:space-between}.history-title h3{font-size:17px;font-weight:700}.history-title span{padding:2px 8px;border-radius:10px;background:#eeeaff;color:#6d4aff}.history button{width:100%;display:flex;align-items:center;padding:14px 0;border:0;border-top:1px solid #eee;background:#fff;text-align:left;cursor:pointer}.history button span{display:flex;min-width:0;flex:1;flex-direction:column}.history button b,.history button small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.history button b{font-weight:650}.history button small{color:#9196a2}.history button strong{font-size:21px;color:#6d4aff}.history-empty{padding:28px 5px;color:#989da8;text-align:center;font-size:13px}@media(max-width:1050px){.workspace{grid-template-columns:1fr}.workspace aside{display:grid;grid-template-columns:1fr 1fr;gap:18px}.history{margin-top:0}}@media(max-width:700px){.resume-options,.fields,.workspace aside{grid-template-columns:1fr}.steps{display:none}.run-bar{align-items:flex-start;gap:15px;flex-direction:column}}
</style>
