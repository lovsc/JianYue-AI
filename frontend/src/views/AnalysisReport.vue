<template>
  <AppLayout
    ><div v-if="loading" class="loading">正在加载分析报告...</div>
    <div v-else-if="pageError" class="loading">
      <p>{{ pageError }}</p>
      <el-button @click="load">重新加载</el-button>
    </div>
    <template v-else-if="report"
      ><header class="report-head">
        <div>
          <button @click="$router.push('/analysis')">← 返回岗位匹配</button
          ><span>分析报告 #{{ report.id }}</span>
          <h1>{{ report.position }}</h1>
          <p>{{ report.company || '未填写公司' }} · 使用「{{ report.resume_title }}」分析</p>
        </div>
        <div class="score" :style="{ '--score': `${result.score * 3.6}deg` }">
          <div>
            <strong>{{ result.score }}</strong
            ><small>匹配分</small>
          </div>
        </div>
      </header>
      <div class="report-actions">
        <el-button @click="snapshotVisible = true">查看分析快照</el-button
        ><el-button :disabled="!result.sourceSnapshot" @click="diffVisible = true"
          >修改对比</el-button
        ><router-link :to="'/resumes/' + report.resume_id">编辑这份简历 →</router-link
        ><router-link :to="{ path: '/exports', query: { resumeId: report.resume_id } }"
          >选择模板并导出 ↗</router-link
        >
      </div>
      <section class="summary">
        <span>AI 结论</span>
        <p>{{ result.summary }}</p>
        <p class="score-explanation">
          {{ result.scoreExplanation || '匹配分为 AI 参考判断，不代表录用概率。' }}
        </p>
        <div>
          <small>分析耗时 {{ (report.duration_ms / 1000).toFixed(1) }}s</small
          ><small>{{ formatDate(report.created_at) }}</small>
        </div>
      </section>
      <div class="metrics">
        <article>
          <span class="icon purple">✓</span>
          <div>
            <small>匹配优势</small><strong>{{ result.strengths.length }} 项</strong>
          </div>
        </article>
        <article>
          <span class="icon orange">!</span>
          <div>
            <small>能力差距</small><strong>{{ result.gaps.length }} 项</strong>
          </div>
        </article>
        <article>
          <span class="icon blue">#</span>
          <div>
            <small>缺失关键词</small><strong>{{ result.keywords.missing.length }} 个</strong>
          </div>
        </article>
      </div>
      <div class="report-grid">
        <main>
          <ReportSection index="01" title="核心优势"
            ><ul class="strengths">
              <li v-for="item in result.strengths" :key="item"><span>✓</span>{{ item }}</li>
            </ul></ReportSection
          ><ReportSection index="02" title="能力差距与行动建议"
            ><div class="gaps">
              <article v-for="gap in result.gaps" :key="gap.keyword">
                <div>
                  <b>{{ gap.keyword }}</b
                  ><em :class="gap.importance">{{ labels[gap.importance] }}</em>
                </div>
                <p>{{ gap.advice }}</p>
              </article>
            </div></ReportSection
          ><ReportSection index="03" title="简历改写建议"
            ><div class="suggestions">
              <article
                v-for="(item, i) in result.suggestions"
                :key="i"
                :class="{ applied: isApplied(i) }"
              >
                <header>
                  <span>{{ item.section }}</span
                  ><small>{{ item.reason }}</small>
                </header>
                <div v-if="item.original" class="original">
                  <b>原内容</b>
                  <p>{{ item.original }}</p>
                </div>
                <div class="optimized">
                  <b>建议表达</b>
                  <p>{{ item.optimized }}</p>
                </div>
                <footer>
                  <span v-if="isApplied(i)">✓ 已采纳到简历</span
                  ><el-button
                    v-else
                    type="primary"
                    plain
                    :disabled="!canApply(i)"
                    @click="openApply(i)"
                    >{{ canApply(i) ? '对比并采纳' : '原文已变更或无法定位' }}</el-button
                  >
                </footer>
              </article>
            </div></ReportSection
          >
        </main>
        <aside>
          <section v-if="result.evidence?.length" class="evidence-card">
            <h3>原文匹配依据</h3>
            <article v-for="item in result.evidence" :key="item.keyword">
              <b>{{ item.keyword }}</b>
              <p>{{ item.excerpt }}</p>
            </article>
          </section>
          <section class="keyword-card">
            <h3>关键词覆盖</h3>
            <div>
              <small>已匹配</small>
              <p>
                <span v-for="word in result.keywords.matched" :key="word" class="matched">{{
                  word
                }}</span>
              </p>
            </div>
            <div>
              <small>建议补充</small>
              <p>
                <span v-for="word in result.keywords.missing" :key="word" class="missing">{{
                  word
                }}</span>
              </p>
            </div>
          </section>
          <section class="question-card">
            <span>面试准备</span>
            <h3>建议重点准备的问题</h3>
            <ol>
              <li v-for="q in result.interviewQuestions" :key="q">{{ q }}</li>
            </ol>
          </section>
          <el-button class="new-analysis" size="large" @click="$router.push('/analysis')"
            >分析另一个岗位</el-button
          >
        </aside>
      </div>
      <el-dialog v-model="applyVisible" title="确认修改内容" width="700px"
        ><p class="dialog-tip">
          应用到
          {{
            targetLabel(selectedSuggestion?.targetPath)
          }}。仅替换标记的原文片段，其余内容会保留；修改前自动创建快照。
        </p>
        <div class="apply-comparison">
          <section>
            <small>当前完整内容</small>
            <p>{{ currentText }}</p>
          </section>
          <section>
            <small>采纳后完整内容</small>
            <p>{{ replacementText }}</p>
          </section>
        </div>
        <template #footer
          ><el-button :disabled="applying" @click="applyVisible = false">取消</el-button
          ><el-button type="primary" :loading="applying" @click="confirmApply"
            >保存快照并采纳</el-button
          ></template
        ></el-dialog
      >
      <el-dialog v-model="snapshotVisible" title="本次分析使用的快照" width="850px"
        ><template v-if="result.sourceSnapshot"
          ><p class="dialog-tip">
            快照标题：{{ result.sourceSnapshot.title }} · 内容修订
            {{ result.sourceSnapshot.revision }}。分析结论始终对应以下内容。
          </p>
          <ResumePreview :content="result.sourceSnapshot.content" />
          <h3 class="snapshot-job-title">岗位原文 · {{ result.sourceSnapshot.job.position }}</h3>
          <p class="snapshot-job">{{ result.sourceSnapshot.job.content }}</p></template
        >
        <p v-else>该历史报告没有快照，请重新分析。</p></el-dialog
      >
      <el-dialog v-model="diffVisible" title="分析前后修改对比" width="850px"
        ><ResumeDiff
          v-if="result.sourceSnapshot && resume"
          :before="result.sourceSnapshot"
          :after="resume"
          before-label="分析时内容"
          after-label="当前简历" /></el-dialog></template
  ></AppLayout>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppLayout from '@/layouts/AppLayout.vue'
import ReportSection from '@/components/analysis/ReportSection.vue'
import ResumeDiff from '@/components/resume/ResumeDiff.vue'
import ResumePreview from '@/components/resume/ResumePreview.vue'
import { applySuggestion, getAnalysis } from '@/api/jobs'
import { getResume } from '@/api/resumes'
const route = useRoute(),
  loading = ref(true),
  pageError = ref(''),
  report = ref(null),
  resume = ref(null),
  result = ref({
    strengths: [],
    gaps: [],
    keywords: { matched: [], missing: [] },
    suggestions: [],
    interviewQuestions: [],
  }),
  applied = ref([]),
  applyVisible = ref(false),
  applying = ref(false),
  selectedIndex = ref(null),
  snapshotVisible = ref(false),
  diffVisible = ref(false)
const labels = { high: '高优先级', medium: '中优先级', low: '低优先级' }
async function load() {
  loading.value = true
  pageError.value = ''
  try {
    const response = (await getAnalysis(route.params.id)).data.data
    report.value = response.analysis
    result.value = report.value.result
    applied.value = response.appliedSuggestions || []
    resume.value = (await getResume(report.value.resume_id)).data.data.resume
  } catch (e) {
    pageError.value = e.response?.data?.message || '报告加载失败'
    ElMessage.error(pageError.value)
  } finally {
    loading.value = false
  }
}
onMounted(load)
const atPath = (value, path) => path?.split('.').reduce((target, key) => target?.[key], value)
const targetLabel = (path) =>
  ({ basics: '个人简介', education: '教育经历', experience: '工作经历', projects: '项目经历' })[
    path?.split('.')[0]
  ] || '未定位'
const isApplied = (index) => applied.value.some((item) => item.suggestion_index === index)
const canApply = (index) => {
  const item = result.value.suggestions[index],
    snapshot = result.value.sourceSnapshot?.content,
    current = resume.value?.content
  if (!item?.targetPath || !snapshot || !current || !item.original) return false
  const parent = item.targetPath.split('.').slice(0, -1).join('.')
  return (
    atPath(snapshot, item.targetPath) === atPath(current, item.targetPath) &&
    (item.targetPath.startsWith('basics.') ||
      JSON.stringify(atPath(snapshot, parent)) === JSON.stringify(atPath(current, parent)))
  )
}
const selectedSuggestion = computed(() => result.value.suggestions[selectedIndex.value])
const currentText = computed(
  () => atPath(resume.value?.content, selectedSuggestion.value?.targetPath) || '',
)
const replacementText = computed(() =>
  currentText.value.replace(
    selectedSuggestion.value?.original || '',
    () => selectedSuggestion.value?.optimized || '',
  ),
)
async function openApply(index) {
  try {
    resume.value = (await getResume(report.value.resume_id)).data.data.resume
    if (!canApply(index)) {
      ElMessage.warning('原模块已变更或建议无法准确定位，请重新分析')
      return
    }
    selectedIndex.value = index
    applyVisible.value = true
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '加载简历失败')
  }
}
async function confirmApply() {
  if (applying.value) return
  applying.value = true
  try {
    const item = selectedSuggestion.value
    const response = await applySuggestion(route.params.id, {
      suggestionIndex: selectedIndex.value,
      targetPath: item.targetPath,
      expectedRevision: resume.value.revision,
    })
    resume.value = response.data.data.resume
    applied.value.push({ suggestion_index: selectedIndex.value, target_path: item.targetPath })
    applyVisible.value = false
    ElMessage.success('建议已采纳，修改前内容已保存为快照')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '采纳失败')
    if (e.response?.status === 409) {
      applyVisible.value = false
      await load()
    }
  } finally {
    applying.value = false
  }
}
const formatDate = (value) => new Date(value.replace(' ', 'T') + 'Z').toLocaleString('zh-CN')
</script>
<style scoped>
.loading {
  display: grid;
  place-items: center;
  height: 70vh;
  color: #8b91a0;
}
.report-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 5px 26px;
}
.report-head button {
  padding: 0;
  border: 0;
  background: none;
  color: #6d4aff;
  cursor: pointer;
}
.report-head span {
  margin-left: 14px;
  color: #969ba7;
  font-size: 13px;
}
.report-head h1 {
  margin-top: 8px;
  font-size: 32px;
  font-weight: 760;
}
.report-head p {
  color: #7f8592;
}
.score {
  width: 114px;
  height: 114px;
  padding: 8px;
  border-radius: 50%;
  background: conic-gradient(#6d4aff var(--score), #e9e8f1 0);
}
.score > div {
  height: 100%;
  display: grid;
  place-content: center;
  border-radius: 50%;
  background: #f7f7fb;
  text-align: center;
}
.score strong {
  font-size: 34px;
  font-weight: 780;
}
.score small {
  color: #878d9a;
}
.summary {
  padding: 24px 28px;
  border-radius: 17px;
  background: #171c2c;
  color: #fff;
}
.summary > span {
  color: #9e8eff;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 1.5px;
}
.summary > p {
  margin: 8px 0 13px;
  font-size: 17px;
  line-height: 1.75;
}
.summary > div {
  display: flex;
  gap: 18px;
  color: #8e95a4;
}
.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin: 20px 0;
}
.metrics article {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 18px;
  background: #fff;
  border: 1px solid #e6e8ee;
  border-radius: 15px;
}
.icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 11px;
  font-weight: 800;
}
.purple {
  background: #eae7f1;
  color: #6d4aff;
}
.orange {
  background: #fff1e8;
  color: #d76a28;
}
.blue {
  background: #e9f3ff;
  color: #2777c7;
}
.metrics article div {
  display: flex;
  flex-direction: column;
}
.metrics small {
  color: #8e94a1;
}
.metrics strong {
  font-size: 18px;
  font-weight: 700;
}
.report-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  gap: 20px;
}
.strengths {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  list-style: none;
  padding: 0;
}
.strengths li {
  padding: 13px;
  background: #f7f8fb;
  border-radius: 10px;
}
.strengths span {
  margin-right: 9px;
  color: #5f38a0;
}
.gaps article {
  padding: 15px 0;
  border-top: 1px solid #eee;
}
.gaps article:first-child {
  border: 0;
}
.gaps article div {
  display: flex;
  align-items: center;
  gap: 9px;
}
.gaps b {
  font-weight: 700;
}
.gaps em {
  padding: 2px 8px;
  border-radius: 9px;
  font-size: 13px;
  font-style: normal;
}
.gaps .high {
  background: #ffebea;
  color: #c33;
}
.gaps .medium {
  background: #fff2dc;
  color: #a76600;
}
.gaps .low {
  background: #edf2fa;
  color: #54708e;
}
.gaps p {
  margin-top: 5px;
  color: #6f7582;
}
.suggestions > article {
  margin-top: 14px;
  border: 1px solid #e6e7ed;
  border-radius: 12px;
  overflow: hidden;
}
.suggestions header {
  display: flex;
  justify-content: space-between;
  padding: 11px 14px;
  background: #f7f7fa;
}
.suggestions header span {
  font-weight: 700;
}
.suggestions header small {
  color: #858b98;
}
.suggestions .original,
.suggestions .optimized {
  padding: 13px 15px;
}
.suggestions b {
  color: #999;
  font-size: 13px;
}
.suggestions p {
  white-space: pre-line;
}
.suggestions .optimized {
  background: #efecf5;
  border-top: 1px solid #e8e2ff;
}
.suggestions .optimized b {
  color: #6d4aff;
}
.keyword-card,
.question-card {
  padding: 21px;
  background: #fff;
  border: 1px solid #e5e7ed;
  border-radius: 17px;
}
.keyword-card h3,
.question-card h3 {
  font-size: 17px;
  font-weight: 700;
}
.keyword-card > div {
  margin-top: 18px;
}
.keyword-card small {
  color: #858b98;
}
.keyword-card p {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 7px;
}
.keyword-card p span {
  padding: 4px 9px;
  border-radius: 8px;
  font-size: 13px;
}
.matched {
  background: #efeaf8;
  color: #47287a;
}
.missing {
  background: #fff0eb;
  color: #b95332;
}
.question-card {
  margin-top: 16px;
  background: #eae7f2;
  border-color: #e1d9ff;
}
.question-card > span {
  color: #6d4aff;
  font-size: 13px;
  font-weight: 750;
}
.question-card ol {
  display: grid;
  gap: 12px;
  margin-top: 14px;
  padding-left: 20px;
  color: #555b68;
}
.new-analysis {
  width: 100%;
  margin-top: 16px;
}
@media (max-width: 1000px) {
  .report-grid {
    grid-template-columns: 1fr;
  }
  .report-grid > aside {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .question-card {
    margin-top: 0;
  }
}
@media (max-width: 700px) {
  .metrics,
  .strengths,
  .report-grid > aside {
    grid-template-columns: 1fr;
  }
  .report-head {
    align-items: flex-start;
  }
  .score {
    width: 90px;
    height: 90px;
  }
  .score strong {
    font-size: 27px;
  }
}
.suggestions article.applied {
  border-color: #cbbce4;
}
.suggestions footer {
  display: flex;
  justify-content: flex-end;
  padding: 10px 14px;
  border-top: 1px solid #ececf2;
}
.suggestions footer span {
  color: #4a2784;
  font-weight: 650;
}
.dialog-tip {
  margin: -5px 0 18px;
  color: #747b88;
  line-height: 1.7;
}
</style>

<style scoped>
.report-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.report-actions a {
  font-size: 13px;
  color: #6d4aff;
  text-decoration: none;
}
.summary .score-explanation {
  color: #b4a8cb;
  font-size: 13px;
}
.apply-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.apply-comparison section {
  padding: 16px;
  background: #fff7f4;
  border-radius: 10px;
  min-width: 0;
}
.apply-comparison section + section {
  background: #f4f1f9;
}
.apply-comparison small {
  font-size: 13px;
  color: #9d91a5;
}
.apply-comparison p,
.snapshot-job {
  white-space: pre-wrap;
  line-height: 1.8;
  font-size: 13px;
  margin-top: 10px;
}
.snapshot-job-title {
  font-size: 16px;
  margin-top: 24px;
}
.evidence-card {
  padding: 20px;
  border: 1px solid #e6e1ee;
  background: white;
  border-radius: 16px;
  margin-bottom: 16px;
}
.evidence-card h3 {
  font-size: 15px;
  font-weight: 650;
}
.evidence-card article {
  padding-top: 14px;
  font-size: 13px;
}
.evidence-card b {
  color: #6d4aff;
}
.evidence-card p {
  font-size: 13px;
  color: #96899f;
  margin-top: 5px;
}
.suggestions header {
  gap: 12px;
  flex-wrap: wrap;
}
@media (max-width: 600px) {
  .apply-comparison {
    grid-template-columns: 1fr;
  }
}
</style>
