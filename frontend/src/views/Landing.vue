<template>
  <AppLayout>
    <div class="landing">
      <section class="hero">
        <div class="hero-copy">
          <div class="brand-kicker">
            <span class="brand-mini">简<i>↗</i></span
            ><b>简跃 AI</b><em>RESUMELEAP</em>
          </div>
          <span class="eyebrow"><i></i> AI 驱动的职业跃迁空间</span>
          <h1>把经历写清楚，<br /><em>向机会跃近一步。</em></h1>
          <p>
            从简历搭建、岗位匹配到面试准备，简跃 AI
            将分散的求职任务连接成一条清晰、可回退、可持续优化的路径。
          </p>
          <div class="hero-actions">
            <el-button type="primary" size="large" @click="primaryAction">{{
              stats.resumes ? '继续完善简历' : '创建第一份简历'
            }}</el-button>
            <button class="text-action" @click="$router.push('/analysis')">
              体验岗位匹配 <span>↗</span>
            </button>
          </div>
          <div class="trust">
            <span><b>✓</b> 数据仅自己可见</span><span><b>✓</b> AI 修改可恢复</span
            ><span><b>✓</b> 支持 PDF 导出</span>
          </div>
        </div>

        <div class="hero-visual">
          <div class="leap-word">LEAP</div>
          <div class="leap-track"><i></i><i></i><i></i><i></i></div>
          <div class="orb one"></div>
          <div class="orb two"></div>
          <article class="score-card">
            <header><span>岗位匹配报告</span><small>刚刚更新</small></header>
            <div class="score">
              <strong>{{ displayScore }}</strong
              ><span>/ 100</span>
            </div>
            <div class="progress"><i></i></div>
            <p>你的项目经验与目标岗位高度相关</p>
            <div class="tags"><span>Vue 3</span><span>工程化</span><span>性能优化</span></div>
          </article>
          <article class="suggest-card">
            <span class="spark">✦</span>
            <div><small>AI 优化建议</small><b>加入量化成果，让项目价值更具体</b></div>
            <em>采纳</em>
          </article>
          <div class="floating-note">
            <span>CV</span>
            <div>
              <b>{{ stats.resumes || 0 }} 份简历</b><small>持续积累你的职业资产</small>
            </div>
          </div>
        </div>
      </section>

      <section class="quick-start">
        <header>
          <div>
            <span>YOUR NEXT STEP</span>
            <h2>{{ progressTitle }}</h2>
          </div>
          <router-link to="/dashboard">查看工作台 →</router-link>
        </header>
        <div class="steps">
          <button
            v-for="(step, index) in steps"
            :key="step.title"
            :class="{ done: step.done, active: step.active }"
            @click="$router.push(step.to)"
          >
            <div class="step-number">{{ step.done ? '✓' : `0${index + 1}` }}</div>
            <span
              ><b>{{ step.title }}</b
              ><small>{{ step.description }}</small></span
            ><em>→</em>
          </button>
        </div>
      </section>

      <section class="capabilities">
        <div class="section-heading">
          <span>ONE WORKFLOW</span>
          <h2>求职准备，不再是零散的任务</h2>
          <p>围绕同一份真实简历，让每一次分析、修改和对话都沉淀为可复用的职业资产。</p>
        </div>
        <div class="feature-grid">
          <article class="feature primary">
            <div class="feature-icon">01</div>
            <span>结构化简历</span>
            <h3>内容与版式分离，专注表达真正的价值</h3>
            <p>实时预览、自动保存和版本快照，让长时间编辑更安心。</p>
            <router-link to="/resumes">管理我的简历 →</router-link>
            <div class="mini-resume"><i></i><i></i><i></i><i></i></div>
          </article>
          <article class="feature">
            <div class="feature-icon purple">02</div>
            <span>岗位匹配</span>
            <h3>不只给分数，更告诉你下一步怎么改</h3>
            <p>识别关键词、能力差距和表达问题，将建议准确应用到指定模块。</p>
            <router-link to="/analysis">开始分析 →</router-link>
          </article>
          <article class="feature dark">
            <div class="feature-icon">03</div>
            <span>求职 AI 助手</span>
            <h3>带着你的简历上下文，准备真正相关的问题</h3>
            <p>流式对话、历史持久化，支持面试准备和项目表达训练。</p>
            <router-link to="/chat">打开 AI 助手 →</router-link>
          </article>
          <article class="feature">
            <div class="feature-icon orange">04</div>
            <span>专业导出</span>
            <h3>从在线内容到可投递 PDF</h3>
            <p>两套 A4 模板、安全分页和导出历史，保证最终交付质量。</p>
            <router-link to="/exports">前往导出中心 →</router-link>
          </article>
        </div>
      </section>

      <section class="bottom-cta">
        <div>
          <span>准备好迈出下一步了吗？</span>
          <h2>从一份真实、清晰的简历开始。</h2>
        </div>
        <el-button size="large" @click="primaryAction">开始使用 <span>↗</span></el-button>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import { getDashboard } from '@/api/dashboard'

const router = useRouter()
const stats = reactive({
  resumes: 0,
  completed_resumes: 0,
  analyses: 0,
  chat_sessions: 0,
  exports: 0,
})
onMounted(async () => {
  try {
    Object.assign(stats, (await getDashboard()).data.data.stats)
  } catch {
    /* 首页仍可展示静态引导 */
  }
})
const displayScore = computed(() => (stats.analyses ? 86 : 72))
const progressTitle = computed(() => {
  if (!stats.resumes) return '用三步完成第一次求职准备'
  if (!stats.analyses) return '下一步：用真实岗位检验简历'
  if (!stats.exports) return '分析已完成，生成一份投递版简历'
  return '继续为新的机会做准备'
})
const steps = computed(() => [
  {
    title: '创建并完善简历',
    description: '建立你的结构化职业档案',
    to: '/resumes',
    done: stats.resumes > 0,
    active: stats.resumes === 0,
  },
  {
    title: '分析目标岗位',
    description: '发现优势、差距与关键词',
    to: '/analysis',
    done: stats.analyses > 0,
    active: stats.resumes > 0 && stats.analyses === 0,
  },
  {
    title: '优化并导出 PDF',
    description: '采纳建议，生成投递版本',
    to: '/exports',
    done: stats.exports > 0,
    active: stats.analyses > 0 && stats.exports === 0,
  },
])
const primaryAction = () => router.push(stats.resumes ? '/resumes' : '/resumes')
</script>

<style scoped>
.landing {
  max-width: 1320px;
  margin: auto;
  color: #171923;
}
.hero {
  position: relative;
  display: grid;
  grid-template-columns: 1.02fr 0.98fr;
  min-height: 570px;
  overflow: hidden;
  border-radius: 28px;
  background: #f0eff8;
}
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(#6d4aff0a 1px, transparent 1px),
    linear-gradient(90deg, #6d4aff0a 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: linear-gradient(90deg, #000, transparent);
}
.hero-copy {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 65px 30px 65px 62px;
}
.brand-kicker {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 28px;
}
.brand-mini {
  position: relative;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #171923;
  color: #fff;
  font-weight: 800;
}
.brand-mini i {
  position: absolute;
  top: 1px;
  right: 3px;
  color: #b6a8ff;
  font-size: 8px;
  font-style: normal;
}
.brand-kicker b {
  font-size: 15px;
  font-weight: 750;
}
.brand-kicker > em {
  padding-left: 9px;
  border-left: 1px solid #c9c7d0;
  color: #9895a2;
  font-size: 9px;
  font-style: normal;
  font-weight: 700;
  letter-spacing: 1.4px;
}
.eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6d4aff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.6px;
}
.eyebrow i {
  width: 18px;
  height: 2px;
  background: #6d4aff;
}
.hero h1 {
  margin: 17px 0 21px;
  font-size: 55px;
  font-weight: 780;
  line-height: 1.14;
  letter-spacing: -2.5px;
}
.hero h1 em {
  color: #6d4aff;
  font-style: normal;
  font-weight: 780;
}
.hero-copy > p {
  max-width: 590px;
  color: #626977;
  font-size: 16px;
  line-height: 1.85;
}
.hero-actions {
  display: flex;
  align-items: center;
  gap: 22px;
  margin-top: 31px;
}
.hero-actions :deep(.el-button) {
  height: 48px;
  padding: 0 25px;
  border-radius: 12px;
  background: #171923;
  border-color: #171923;
}
.text-action {
  border: 0;
  background: none;
  color: #343944;
  font-weight: 650;
  cursor: pointer;
}
.text-action span {
  margin-left: 5px;
  color: #6d4aff;
}
.trust {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 31px;
  color: #858b98;
  font-size: 12px;
}
.trust b {
  color: #40a273;
}
.hero-visual {
  position: relative;
  min-height: 570px;
}
.leap-word {
  position: absolute;
  z-index: 1;
  top: 15px;
  right: -10px;
  color: #ffffff25;
  font-size: 118px;
  font-weight: 900;
  letter-spacing: -10px;
  line-height: 1;
}
.leap-track {
  position: absolute;
  z-index: 1;
  right: 20px;
  bottom: 30px;
  display: flex;
  align-items: flex-end;
  gap: 7px;
  transform: skewY(-12deg);
}
.leap-track i {
  display: block;
  width: 46px;
  background: #ffffff22;
  border: 1px solid #ffffff33;
}
.leap-track i:nth-child(1) {
  height: 45px;
}
.leap-track i:nth-child(2) {
  height: 78px;
}
.leap-track i:nth-child(3) {
  height: 111px;
}
.leap-track i:nth-child(4) {
  height: 144px;
}
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(1px);
}
.orb.one {
  width: 390px;
  height: 390px;
  top: 76px;
  right: 70px;
  background: linear-gradient(145deg, #6d4aff, #4b2ecf);
}
.orb.two {
  width: 180px;
  height: 180px;
  right: -30px;
  bottom: -20px;
  background: #ffb27d;
}
.score-card {
  position: absolute;
  z-index: 2;
  top: 95px;
  right: 82px;
  width: 350px;
  padding: 26px;
  border: 1px solid #ffffff88;
  border-radius: 22px;
  background: #ffffffed;
  box-shadow: 0 30px 65px #29204933;
  backdrop-filter: blur(15px);
  transform: rotate(1.5deg);
}
.score-card header {
  display: flex;
  justify-content: space-between;
}
.score-card header span {
  font-weight: 700;
}
.score-card header small {
  color: #999;
}
.score {
  margin: 24px 0 11px;
}
.score strong {
  font-size: 56px;
  font-weight: 800;
}
.score span {
  color: #999;
}
.progress {
  height: 7px;
  overflow: hidden;
  border-radius: 5px;
  background: #e7e5ed;
}
.progress i {
  display: block;
  width: 86%;
  height: 100%;
  border-radius: 5px;
  background: #6d4aff;
}
.score-card > p {
  margin: 15px 0;
  color: #626977;
}
.tags {
  display: flex;
  gap: 7px;
}
.tags span {
  padding: 5px 9px;
  border-radius: 8px;
  background: #efecff;
  color: #6d4aff;
  font-size: 11px;
}
.suggest-card {
  position: absolute;
  z-index: 3;
  right: 25px;
  bottom: 85px;
  width: 330px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  background: #171923;
  color: #fff;
  box-shadow: 0 18px 40px #10121c55;
}
.spark {
  display: grid;
  place-items: center;
  width: 39px;
  height: 39px;
  flex: none;
  border-radius: 11px;
  background: #6d4aff;
}
.suggest-card div {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.suggest-card small {
  color: #969dac;
}
.suggest-card b {
  font-size: 12px;
  font-weight: 650;
}
.suggest-card em {
  padding: 5px 8px;
  border-radius: 7px;
  background: #fff;
  color: #171923;
  font-size: 10px;
  font-style: normal;
}
.floating-note {
  position: absolute;
  z-index: 3;
  bottom: 42px;
  left: 5px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 12px 30px #25214833;
}
.floating-note > span {
  display: grid;
  place-items: center;
  width: 36px;
  height: 40px;
  border-radius: 7px;
  background: #eeeaff;
  color: #6d4aff;
  font-weight: 800;
}
.floating-note div {
  display: flex;
  flex-direction: column;
}
.floating-note b {
  font-size: 12px;
  font-weight: 700;
}
.floating-note small {
  color: #999;
  font-size: 10px;
}
.quick-start {
  margin: 24px 0;
  padding: 26px 29px;
  border: 1px solid #e6e7ed;
  border-radius: 20px;
  background: #fff;
}
.quick-start > header {
  display: flex;
  justify-content: space-between;
  align-items: end;
}
.quick-start header span,
.section-heading > span {
  color: #6d4aff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}
.quick-start h2 {
  font-size: 21px;
  font-weight: 720;
}
.quick-start header a {
  color: #6d4aff;
  text-decoration: none;
}
.steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 11px;
  margin-top: 20px;
}
.steps button {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 15px;
  border: 1px solid #e7e8ed;
  border-radius: 13px;
  background: #fafbfc;
  text-align: left;
  cursor: pointer;
}
.steps button.active {
  border-color: #6d4aff;
  background: #f7f5ff;
}
.steps button.done {
  background: #f5faf7;
}
.step-number {
  display: grid;
  place-items: center;
  width: 37px;
  height: 37px;
  flex: none;
  border-radius: 10px;
  background: #e9e8ed;
  color: #555;
  font-size: 11px;
  font-weight: 800;
}
.steps .active .step-number {
  background: #6d4aff;
  color: #fff;
}
.steps .done .step-number {
  background: #dff2e7;
  color: #278052;
}
.steps button > span {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.steps b {
  font-weight: 650;
}
.steps small {
  color: #9297a2;
}
.steps em {
  font-style: normal;
}
.capabilities {
  padding: 75px 0 20px;
}
.section-heading {
  max-width: 620px;
  margin: 0 auto 35px;
  text-align: center;
}
.section-heading h2 {
  margin: 8px 0 10px;
  font-size: 34px;
  font-weight: 760;
}
.section-heading p {
  color: #7b8290;
}
.feature-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 16px;
}
.feature {
  position: relative;
  min-height: 285px;
  overflow: hidden;
  padding: 29px;
  border: 1px solid #e4e6ec;
  border-radius: 21px;
  background: #fff;
}
.feature.primary {
  background: #f0eff8;
}
.feature.dark {
  background: #171923;
  color: #fff;
}
.feature-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #171923;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
}
.feature-icon.purple {
  background: #eeeaff;
  color: #6d4aff;
}
.feature-icon.orange {
  background: #fff0e5;
  color: #cc6b29;
}
.feature > span {
  display: block;
  margin-top: 24px;
  color: #868c98;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 1px;
}
.feature h3 {
  max-width: 450px;
  margin: 7px 0 10px;
  font-size: 22px;
  font-weight: 720;
}
.feature p {
  max-width: 430px;
  color: #7c8390;
  line-height: 1.7;
}
.feature.dark p {
  color: #aeb4c1;
}
.feature a {
  display: inline-block;
  margin-top: 22px;
  color: #6d4aff;
  text-decoration: none;
  font-weight: 650;
}
.feature.dark a {
  color: #a695ff;
}
.mini-resume {
  position: absolute;
  right: -20px;
  bottom: -35px;
  width: 180px;
  height: 220px;
  padding: 25px 20px;
  background: #fff;
  box-shadow: 0 15px 35px #2222;
  transform: rotate(8deg);
}
.mini-resume i {
  display: block;
  height: 6px;
  margin-bottom: 13px;
  background: #d8dae0;
}
.mini-resume i:first-child {
  width: 55%;
  height: 17px;
  background: #6d4aff;
}
.bottom-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 70px 0 15px;
  padding: 38px 45px;
  border-radius: 24px;
  background: #6d4aff;
  color: #fff;
}
.bottom-cta span {
  color: #d7d0ff;
}
.bottom-cta h2 {
  font-size: 29px;
  font-weight: 740;
}
.bottom-cta :deep(.el-button) {
  border: 0;
  color: #171923;
}
.bottom-cta :deep(.el-button span) {
  color: #171923;
}
@media (max-width: 1100px) {
  .hero {
    grid-template-columns: 1fr;
  }
  .hero-copy {
    padding: 55px;
  }
  .hero-visual {
    display: none;
  }
  .steps {
    grid-template-columns: 1fr;
  }
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 700px) {
  .hero-copy {
    padding: 38px 25px;
  }
  .hero h1 {
    font-size: 39px;
  }
  .trust {
    display: grid;
  }
  .quick-start {
    padding: 22px 18px;
  }
  .bottom-cta {
    align-items: flex-start;
    gap: 20px;
    flex-direction: column;
    padding: 30px;
  }
  .section-heading h2 {
    font-size: 28px;
  }
}
</style>
