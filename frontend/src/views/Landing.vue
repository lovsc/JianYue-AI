<template>
  <AppLayout>
    <div class="landing">
      <section class="hero">
        <div class="hero-copy">
          <div class="hero-eyebrow"><span class="hero-dot"></span>为下一次机会，做好准备</div>
          <h1>把经历写清楚，<br /><em>向下一程跃进。</em></h1>
          <p class="hero-description">整理真实经历、匹配目标岗位，准备好每一次投递。</p>
          <div class="hero-actions">
            <button class="primary-cta" @click="$router.push('/resumes')">
              {{ stats.resumes ? '继续完善简历' : '创建第一份简历'
              }}<AppIcon name="arrow" /></button
            ><a href="#templates" class="secondary-cta">探索简历模板<span>↗</span></a>
          </div>
        </div>
        <div class="hero-visual" role="img" aria-label="积累真实经历，梳理清晰表达，走向新的机会">
          <svg class="leap-art" viewBox="0 0 360 250" fill="none" aria-hidden="true">
            <circle cx="187" cy="126" r="107" fill="white" fill-opacity=".2" />
            <path d="M77 210 203 84h-51V43h126v126h-41v-51L106 239Z" fill="#c8b8e9" />
            <path d="M60 193 186 67h-51V26h126v126h-41v-51L89 222Z" fill="white" />
            <path
              d="m41 171 43-43M104 108l8-8"
              stroke="#ad93d7"
              stroke-width="3"
              stroke-linecap="round"
            />
            <path
              d="M303 185v15m-7.5-7.5h15M56 55v11m-5.5-5.5h11"
              stroke="#9d7ccf"
              stroke-width="2"
              stroke-linecap="round"
            />
            <circle cx="307" cy="82" r="4" fill="#b19ad9" />
          </svg>
          <span class="opportunity-tag experience"><AppIcon name="spark" />真实经历</span>
          <span class="opportunity-tag expression"><AppIcon name="check" />清晰表达</span>
          <span class="opportunity-tag opportunity"><AppIcon name="arrow" />新的机会</span>
        </div>
      </section>

      <section id="workflow" class="journey-section">
        <div class="section-top">
          <div>
            <h2>三步，准备好下一次投递。</h2>
          </div>
          <p>从整理经历，到带着准备出发。</p>
        </div>
        <div class="journey-cards">
          <article
            v-for="(step, index) in steps"
            :key="step.title"
            class="journey-card"
            :class="{ complete: step.done }"
          >
            <div class="journey-top">
              <span>0{{ index + 1 }}</span
              ><AppIcon :name="step.icon" />
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
            <button @click="$router.push(step.to)">{{ step.action }}<AppIcon name="arrow" /></button
            ><small v-if="step.done" class="step-done">✓ 已完成这一步</small>
          </article>
        </div>
      </section>

      <section id="capabilities" class="match-feature">
        <div class="match-copy">
          <span class="section-kicker">CLEAR WORDS. REAL EXPERIENCE.</span>
          <h2>每一处修改，<br />都说得出理由。</h2>
          <p>
            对照真实岗位，找出表达上的差距。看清原文和建议的区别，再决定是否采纳。保留母简历，也保留每一次选择。
          </p>
          <div class="feature-points">
            <span><AppIcon name="match" />原文匹配依据</span
            ><span><AppIcon name="resume" />独立岗位版本</span
            ><span><AppIcon name="shield" />修改前自动快照</span>
          </div>
          <router-link to="/analysis">分析我的目标岗位<AppIcon name="arrow" /></router-link>
        </div>
        <div class="match-demo">
          <header>
            <span><AppIcon name="spark" />表达优化工作区</span><small>功能演示</small>
          </header>
          <div class="before-copy">
            <small>BEFORE / 原来的表达</small>
            <p>负责日常行政工作，协助组织活动。</p>
          </div>
          <div class="after-copy">
            <small>AFTER / 具体到真实职责</small>
            <p>
              负责会议安排、来访接待和办公用品登记；协助组织团队活动，跟进场地、物料与现场签到。
            </p>
            <span>说明实际工作，不编造经历与数字。</span>
          </div>
          <footer>
            <span><AppIcon name="shield" />已保留修改前快照</span><b>对比后，再采纳 ↗</b>
          </footer>
        </div>
      </section>

      <section id="templates" class="template-section">
        <div class="section-top">
          <div>
            <span class="section-kicker">FORM MEETS CONTENT</span>
            <h2>好内容，也有好呈现。</h2>
          </div>
          <p>
            三款专业版式，先预览再选择。<br /><button
              class="sample-open"
              @click="openSample('modern')"
            >
              放大阅读示例简历 <span>↗</span>
            </button>
          </p>
        </div>
        <div class="template-grid">
          <article v-for="(item, index) in resumeTemplates" :key="item.id" class="template-card">
            <button
              class="template-paper"
              :aria-label="'放大预览' + item.name"
              @click="openSample(item.id)"
            >
              <TemplateThumbnail :template="item.id" /><span class="template-view"
                >放大阅读<AppIcon name="arrow"
              /></span>
            </button>
            <div class="template-meta">
              <div>
                <small>COLLECTION / 0{{ index + 1 }}</small>
                <h3>{{ item.name }}</h3>
                <p>{{ item.description }}</p>
              </div>
              <i :style="{ background: item.color }"></i>
            </div>
            <button
              class="template-use"
              @click="$router.push({ path: '/exports', query: { template: item.id } })"
            >
              使用这款模板<AppIcon name="arrow" />
            </button>
          </article>
        </div>
      </section>

      <section class="career-banner">
        <div>
          <span>YOUR NEXT CHAPTER</span>
          <h2>下一次机会，<br />从这一页开始。</h2>
          <p>让认真做过的事，成为有分量的介绍。</p>
        </div>
        <div class="banner-action">
          <button @click="$router.push('/resumes')">开始写我的简历<AppIcon name="arrow" /></button
          ><router-link to="/chat">先和 AI 助手聊聊 ↗</router-link>
        </div>
        <span class="banner-arrow" aria-hidden="true">↗</span>
      </section>
    </div>
    <el-dialog
      v-model="sampleVisible"
      title="示例简历 · 放大阅读"
      width="900px"
      class="sample-dialog"
      ><div class="sample-toolbar">
        <span>示例内容，不会写入你的简历</span
        ><el-select v-model="sampleTemplate" aria-label="示例模板"
          ><el-option
            v-for="item in resumeTemplates"
            :key="item.id"
            :label="item.name"
            :value="item.id"
        /></el-select>
      </div>
      <ResumePreview :content="sampleResume" :template="sampleTemplate"
    /></el-dialog>
  </AppLayout>
</template>
<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import AppIcon from '@/components/AppIcon.vue'
import ResumePreview from '@/components/resume/ResumePreview.vue'
import TemplateThumbnail from '@/components/resume/TemplateThumbnail.vue'
import { resumeTemplates } from '@/utils/resume-templates'
import { sampleResume } from '@/utils/resume-sample'
import { useAuthStore } from '@/stores/auth'
import { getDashboard } from '@/api/dashboard'
const auth = useAuthStore(),
  sampleVisible = ref(false),
  sampleTemplate = ref('modern')
const stats = reactive({ resumes: 0, analyses: 0, exports: 0 })
const openSample = (template) => {
  sampleTemplate.value = template
  sampleVisible.value = true
}
onMounted(async () => {
  if (!auth.isAuthenticated) return
  try {
    Object.assign(stats, (await getDashboard()).data.data.stats)
  } catch {
    /* The public product tour remains available. */
  }
})
const steps = computed(() => [
  {
    icon: 'resume',
    title: '先把经历，完整留下来',
    description: '整理教育、工作与项目经历，建立一份持续维护的母简历。',
    action: '整理我的简历',
    to: '/resumes',
    done: stats.resumes > 0,
  },
  {
    icon: 'match',
    title: '为心动岗位，找准方向',
    description: '对照职位要求查看原文依据，在独立版本里调整表达。',
    action: '开始岗位匹配',
    to: '/analysis',
    done: stats.analyses > 0,
  },
  {
    icon: 'export',
    title: '让每次投递，都得体',
    description: '选好版式，放大检查内容，导出一份清晰可读的简历。',
    action: '选择导出版式',
    to: '/exports',
    done: stats.exports > 0,
  },
])
</script>
<style scoped>
.landing {
  max-width: 1400px;
  margin: auto;
  color: #2b233a;
}
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.85fr);
  align-items: center;
  gap: 38px;
  padding: 24px 30px;
  border: 1px solid #dbcfef;
  border-radius: 15px;
  background: #e4dcf8;
  color: #252338;
}
.hero-copy {
  min-width: 0;
}
.hero-eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #7155ba;
  font-size: 13px;
}
.hero-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #6d4aff;
}
.hero h1 {
  margin: 12px 0 14px;
  font-size: 42px;
  font-weight: 700;
  letter-spacing: -1.5px;
  line-height: 1.3;
  white-space: nowrap;
}
.hero h1 em {
  color: #6d4aff;
  font-style: normal;
}
.hero-description {
  color: #756389;
  font-size: 15px;
  line-height: 1.8;
}
.hero-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 22px;
}
.primary-cta {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 44px;
  padding: 0 18px;
  border: 0;
  border-radius: 7px;
  background: #6d4aff;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 5px 12px #6d4aff1a;
  transition: background 0.2s;
}
.primary-cta:hover {
  background: #5738d5;
}
.secondary-cta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #625671;
  font-size: 14px;
  text-decoration: none;
}
.hero-visual {
  position: relative;
  width: 100%;
  max-width: 370px;
  height: 235px;
  margin-left: auto;
  isolation: isolate;
}
.leap-art {
  display: block;
  width: 100%;
  height: 100%;
}
.opportunity-tag {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background: white;
  border: 1px solid #dcd0ef;
  border-radius: 8px;
  color: #786092;
  box-shadow: 0 8px 18px #5e418211;
  font-size: 13px;
  white-space: nowrap;
}
.opportunity-tag .app-icon {
  width: 16px;
  height: 16px;
  color: #9b7cc9;
}
.opportunity-tag.experience {
  top: 17px;
  left: 0;
  transform: rotate(-5deg);
}
.opportunity-tag.expression {
  bottom: 7px;
  left: 25px;
  transform: rotate(-3deg);
}
.opportunity-tag.opportunity {
  top: 83px;
  right: 0;
  transform: rotate(5deg);
}
.sample-open {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border: 0;
  background: transparent;
  padding: 4px 0 0;
  color: #6d4aff;
  font-size: 14px;
}
.sample-open:hover {
  color: #5738d5;
}

.journey-section,
.template-section {
  padding-top: 76px;
  scroll-margin-top: 30px;
}
.journey-section {
  padding-top: 28px;
}
.journey-section .section-top h2 {
  font-size: 26px;
  margin: 0;
}
.journey-section .section-top {
  margin-bottom: 18px;
}
.section-top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
}
.section-kicker {
  font-size: 10px;
  letter-spacing: 2.5px;
  color: #887ea1;
}
.section-top h2 {
  font-size: 38px;
  line-height: 1.4;
  letter-spacing: -1.2px;
  font-weight: 550;
  margin-top: 16px;
  color: #342c44;
}
.section-top > p {
  font-size: 15px;
  line-height: 1.9;
  color: #7c7490;
  max-width: 390px;
}
.journey-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  border: 1px solid #d7d3e2;
  border-radius: 13px;
  background: white;
  overflow: hidden;
}
.journey-card {
  position: relative;
  padding: 22px;
  border-right: 1px solid #d7d3e2;
}
.journey-card:last-child {
  border: 0;
}
.journey-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.journey-top > span {
  font-family: Georgia, serif;
  font-size: 28px;
  font-style: italic;
  font-weight: 400;
  color: #a69ac3;
  line-height: 1;
}
.journey-top > .app-icon {
  width: 22px;
  height: 22px;
  color: #81759f;
}
.journey-card h3 {
  font-size: 19px;
  font-weight: 550;
  letter-spacing: -0.4px;
}
.journey-card > p {
  font-size: 15px;
  line-height: 1.75;
  color: #7e7790;
  margin: 11px 0 17px;
}
.journey-card > button {
  border: 0;
  background: none;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 20px;
  color: #493c63;
  font-size: 14px;
}
.journey-card > button > .app-icon {
  width: 17px;
}
.step-done {
  display: block;
  font-size: 11px;
  color: #83799b;
  margin-top: 15px;
}
.match-feature {
  display: grid;
  grid-template-columns: 1fr 1.05fr;
  gap: 36px;
  align-items: center;
  padding: 30px;
  margin-top: 36px;
  background: #e4dcf8;
  border: 1px solid #d5cfe4;
  border-radius: 15px;
}
.match-copy h2 {
  font-size: 30px;
  line-height: 1.45;
  font-weight: 550;
  letter-spacing: -1px;
  margin: 18px 0 21px;
}
.match-copy > p {
  font-size: 16px;
  line-height: 1.95;
  color: #766e89;
}
.feature-points {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 25px;
  color: #645880;
  font-size: 13px;
}
.feature-points > span {
  display: flex;
  align-items: center;
  gap: 6px;
}
.feature-points .app-icon {
  width: 15px;
  height: 15px;
}
.match-copy > a {
  display: inline-flex;
  align-items: center;
  gap: 20px;
  font-size: 15px;
  color: #41345a;
  text-decoration: none;
  margin-top: 30px;
}
.match-demo {
  background: #fffefe;
  border: 1px solid #cfc9df;
  border-radius: 10px;
  box-shadow: 0 20px 35px #362b500c;
  overflow: hidden;
}
.match-demo > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 21px;
  border-bottom: 1px solid #dfdbe9;
}
.match-demo > header > span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4e426a;
}
.match-demo > header small {
  font-size: 12px;
  color: #968dac;
}
.match-demo .app-icon {
  width: 17px;
  height: 17px;
}
.before-copy,
.after-copy {
  padding: 15px 18px;
  margin: 14px;
  background: #f0eff5;
  border-left: 2px solid #d5cbbd;
}
.before-copy small,
.after-copy small {
  font-size: 10px;
  color: #a59885;
  letter-spacing: 1px;
}
.before-copy p {
  font-size: 15px;
  color: #a39a89;
  text-decoration: line-through;
  text-decoration-color: #c9c1b1;
  margin-top: 12px;
  line-height: 1.8;
}
.after-copy {
  background: #e4dcf8;
  border-color: #836eb8;
}
.after-copy small {
  color: #706098;
}
.after-copy p {
  font-size: 17px;
  color: #4b3d6d;
  line-height: 1.8;
  margin-top: 10px;
}
.after-copy > span {
  display: block;
  font-size: 12px;
  color: #897ea5;
  margin-top: 14px;
}
.match-demo > footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 17px 21px;
  background: #f1eff7;
  font-size: 12px;
  color: #80759a;
}
.match-demo > footer > span {
  display: flex;
  align-items: center;
  gap: 6px;
}
.match-demo > footer > b {
  font-weight: 500;
  color: #52417b;
}
.template-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}
.template-card {
  min-width: 0;
}
.template-paper {
  display: block;
  position: relative;
  width: 100%;
  padding: 24px;
  background: #e4dcf8;
  border: 1px solid #d2cbe2;
  border-radius: 9px;
  overflow: hidden;
}
.template-view {
  position: absolute;
  bottom: 17px;
  left: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px;
  background: #282036ed;
  color: #e5dff3;
  font-size: 14px;
  border-radius: 5px;
  opacity: 0;
  translate: 0 5px;
  transition:
    opacity 0.2s,
    translate 0.2s;
}
.template-paper:hover .template-view,
.template-paper:focus-visible .template-view {
  opacity: 1;
  translate: 0 0;
}
.template-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 21px;
}
.template-meta small {
  font-size: 10px;
  letter-spacing: 2px;
  color: #928ba4;
}
.template-meta h3 {
  font-size: 21px;
  font-weight: 550;
  margin: 8px 0 9px;
}
.template-meta p {
  font-size: 14px;
  line-height: 1.8;
  color: #837b96;
}
.template-meta > i {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex: none;
}
.template-use {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 15px 0;
  border: 0;
  border-top: 1px solid #d1cbdf;
  background: none;
  color: #504171;
  font-size: 14px;
  margin-top: 21px;
}
.template-use .app-icon {
  width: 17px;
}
.career-banner {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
  padding: 47px 48px;
  margin-top: 76px;
  background: #e4dcf8;
  border-radius: 13px;
  overflow: hidden;
  color: #352b4b;
}
.career-banner > div {
  z-index: 1;
}
.career-banner > div > span {
  font-size: 10px;
  letter-spacing: 2.5px;
  color: #695992;
}
.career-banner h2 {
  font-size: 40px;
  font-weight: 550;
  line-height: 1.4;
  letter-spacing: -1.2px;
  margin: 19px 0;
}
.career-banner p {
  font-size: 15px;
  color: #66578c;
}
.banner-action {
  display: flex;
  flex-direction: column;
  gap: 19px;
  align-items: center;
}
.banner-action > button {
  display: flex;
  align-items: center;
  gap: 24px;
  border: 0;
  padding: 17px 24px;
  border-radius: 7px;
  background: #2b203d;
  color: #ded6f1;
  font-size: 16px;
}
.banner-action > a {
  font-size: 14px;
  color: #695793;
  text-decoration: none;
}
.banner-arrow {
  position: absolute;
  right: 140px;
  bottom: -65px;
  font-size: 350px;
  line-height: 1;
  font-family: Arial, sans-serif;
  color: #a28cdb;
  z-index: 0;
}
.sample-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #7e788c;
}
.sample-toolbar .el-select {
  width: 170px;
}
@media (max-width: 1200px) {
  .match-feature {
    gap: 36px;
    padding: 36px;
  }
  .match-copy h2 {
    font-size: 32px;
  }
  .template-grid {
    gap: 19px;
  }
  .template-paper {
    padding: 17px;
  }
}
@media (max-width: 1000px) {
  .match-feature {
    grid-template-columns: 1fr;
    gap: 34px;
  }
  .section-top h2 {
    font-size: 34px;
  }
  .template-grid {
    gap: 15px;
  }
  .template-paper {
    padding: 13px;
  }
  .template-meta h3 {
    font-size: 18px;
  }
  .template-meta p {
    font-size: 13px;
  }
  .career-banner h2 {
    font-size: 35px;
  }
  .career-banner {
    padding: 36px;
  }
}
@media (max-width: 700px) {
  .template-section {
    padding-top: 52px;
  }
  .section-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 18px;
    margin-bottom: 26px;
  }
  .section-top h2 {
    font-size: 31px;
    margin-top: 13px;
  }
  .section-top > p {
    font-size: 15px;
  }
  .section-top > p br {
    display: none;
  }
  .match-feature {
    padding: 23px 18px;
    margin-top: 47px;
    gap: 28px;
  }
  .match-copy h2 {
    font-size: 30px;
  }
  .match-copy > p {
    font-size: 15px;
  }
  .feature-points {
    font-size: 13px;
    gap: 15px;
  }
  .match-demo > header {
    padding: 16px 14px;
  }
  .match-demo > header > span {
    font-size: 13px;
  }
  .match-demo > header small {
    font-size: 11px;
  }
  .before-copy,
  .after-copy {
    padding: 17px 16px;
    margin: 14px;
  }
  .after-copy p {
    font-size: 16px;
  }
  .match-demo > footer {
    padding: 15px;
    font-size: 11px;
  }
  .template-grid {
    grid-template-columns: 1fr;
    gap: 34px;
  }
  .template-paper {
    padding: 25px;
  }
  .template-view {
    opacity: 1;
    translate: 0 0;
  }
  .template-meta h3 {
    font-size: 22px;
  }
  .template-meta p {
    font-size: 14px;
  }
  .career-banner {
    padding: 31px 25px;
    align-items: flex-start;
    flex-direction: column;
    margin-top: 48px;
  }
  .career-banner h2 {
    font-size: 35px;
  }
  .career-banner p {
    font-size: 15px;
  }
  .banner-action {
    align-items: flex-start;
  }
  .banner-action > button {
    font-size: 15px;
  }
  .banner-arrow {
    right: -30px;
    bottom: -70px;
    font-size: 300px;
  }
  .sample-toolbar {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }
}

@media (min-width: 701px) and (max-width: 1100px) {
  .hero {
    grid-template-columns: minmax(0, 1fr) minmax(220px, 0.85fr);
    gap: 22px;
    padding: 22px;
  }
  .hero h1 {
    font-size: 34px;
  }
  .hero-actions {
    gap: 15px;
  }
  .hero-visual {
    height: 220px;
  }
  .opportunity-tag {
    padding: 8px 11px;
    font-size: 12px;
  }
  .journey-card {
    padding: 18px;
  }
  .journey-card h3 {
    font-size: 17px;
  }
  .journey-section .section-top {
    align-items: baseline;
  }
  .journey-section .section-top h2 {
    font-size: 24px;
  }
}
@media (max-width: 700px) {
  .hero {
    grid-template-columns: 1fr;
    padding: 21px;
    gap: 22px;
    border-radius: 12px;
  }
  .hero h1 {
    font-size: clamp(29px, 9vw, 36px);
  }
  .hero-actions {
    gap: 16px;
    margin-top: 18px;
  }
  .primary-cta {
    font-size: 14px;
    padding: 0 15px;
    gap: 10px;
  }
  .secondary-cta {
    font-size: 13px;
  }
  .hero-visual {
    max-width: 310px;
    height: 205px;
    margin: auto;
  }
  .opportunity-tag {
    padding: 8px 11px;
    font-size: 12px;
  }
  .opportunity-tag.experience {
    top: 8px;
  }
  .opportunity-tag.expression {
    bottom: 0;
  }
  .opportunity-tag.opportunity {
    top: 72px;
  }
  .journey-section {
    padding-top: 25px;
  }
  .journey-section .section-top {
    gap: 6px;
    margin-bottom: 17px;
  }
  .journey-section .section-top h2 {
    font-size: 23px;
    margin-top: 0;
  }
  .journey-section .section-top > p {
    font-size: 14px;
  }
  .journey-cards {
    grid-template-columns: 1fr;
  }
  .journey-card {
    padding: 19px;
    border-right: 0;
    border-bottom: 1px solid #e4deef;
  }
  .journey-top {
    margin-bottom: 10px;
  }
  .journey-card h3 {
    font-size: 18px;
  }
  .journey-card > p {
    margin: 9px 0 13px;
  }
  .match-feature {
    margin-top: 30px;
  }
}
</style>
