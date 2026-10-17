<template>
  <AppLayout>
    <header class="head">
      <div>
        <span class="page-kicker">YOUR CAREER DESK</span>
        <h1>你好，{{ auth.user?.display_name || auth.user?.username }}。</h1>
        <p>把今天的准备，留给下一次机会。</p>
      </div>
      <el-button type="primary" :loading="creating" @click="createNew">＋ 新建母简历</el-button>
    </header>
    <section class="desk-banner">
      <div>
        <span class="banner-kicker">KEEP MOVING FORWARD</span>
        <h2>{{ nextStep.title }}</h2>
        <p>{{ nextStep.description }}</p>
        <router-link :to="nextStep.to">{{ nextStep.action }}<AppIcon name="arrow" /></router-link>
      </div>
      <div class="banner-number">
        <span>YOUR NEXT STEP</span><strong>0{{ nextStep.index }}</strong
        ><small>/ 03</small>
      </div>
    </section>
    <section class="stats">
      <article v-for="item in statCards" :key="item.key">
        <span>{{ item.label }}<AppIcon :name="item.icon" /></span
        ><strong>{{ stats[item.key] }}</strong
        ><small>{{ item.hint }}</small>
      </article>
    </section>
    <div class="desk-grid">
      <section class="panel">
        <header class="panel-title">
          <div>
            <span>YOUR DOCUMENTS</span>
            <h2>最近编辑</h2>
          </div>
          <router-link to="/resumes">全部简历 ↗</router-link>
        </header>
        <div v-if="loading" class="empty">正在加载你的简历…</div>
        <div v-else-if="!resumes.length" class="empty">
          <AppIcon name="resume" /><b>从第一份母简历开始。</b
          ><span>完整留下经历，再为不同岗位调整表达。</span
          ><el-button @click="createNew">创建简历</el-button>
        </div>
        <div v-else class="recent-list">
          <button
            v-for="item in resumes.slice(0, 4)"
            :key="item.id"
            @click="$router.push('/resumes/' + item.id)"
          >
            <span class="file-icon"><AppIcon name="resume" /></span
            ><span
              ><b>{{ item.title }}</b
              ><small
                >{{ item.source_resume_id ? '岗位版本' : '母简历' }} ·
                {{ formatDate(item.updated_at) }}</small
              ></span
            ><em>{{ item.status === 'completed' ? '信息已完善' : '编辑中' }}</em
            ><AppIcon name="arrow" />
          </button>
        </div>
      </section>
      <aside class="desk-shortcuts">
        <span class="page-kicker">A LITTLE MORE PREPARATION</span>
        <h2>让准备，更进一步。</h2>
        <router-link to="/analysis"
          ><AppIcon name="match" />
          <div>
            <b>分析一个目标岗位</b>
            <p>用原文，校准你的表达。</p>
          </div>
          <span>↗</span></router-link
        ><router-link to="/chat"
          ><AppIcon name="chat" />
          <div>
            <b>练习一次项目介绍</b>
            <p>带着简历，和 AI 聊聊。</p>
          </div>
          <span>↗</span></router-link
        ><router-link to="/exports"
          ><AppIcon name="export" />
          <div>
            <b>准备一份投递文件</b>
            <p>选好版式，放大检查。</p>
          </div>
          <span>↗</span></router-link
        >
        <p class="shortcut-note">每份经历，都值得被认真呈现。</p>
      </aside>
    </div>
  </AppLayout>
</template>
<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppLayout from '@/layouts/AppLayout.vue'
import AppIcon from '@/components/AppIcon.vue'
import { useAuthStore } from '@/stores/auth'
import { createResume, listResumes } from '@/api/resumes'
import { getDashboard } from '@/api/dashboard'
const auth = useAuthStore(),
  router = useRouter(),
  resumes = ref([]),
  loading = ref(true),
  creating = ref(false)
const stats = reactive({
  resumes: 0,
  completed_resumes: 0,
  analyses: 0,
  chat_sessions: 0,
  exports: 0,
})
const statCards = [
  { key: 'resumes', label: '简历文档', hint: '你的经历档案', icon: 'resume' },
  { key: 'analyses', label: '岗位分析', hint: '积累每次判断', icon: 'match' },
  { key: 'chat_sessions', label: 'AI 对话', hint: '持续练习表达', icon: 'chat' },
  { key: 'exports', label: '打印记录', hint: '准备每次投递', icon: 'export' },
]
const nextStep = computed(() =>
  !stats.resumes
    ? {
        index: 1,
        title: '从一份完整的经历档案开始。',
        description: '先建立母简历，把教育、工作与项目经历有序留下来。',
        action: '整理我的第一份简历',
        to: '/resumes',
      }
    : !stats.analyses
      ? {
          index: 2,
          title: '让你的经历，对准心动的岗位。',
          description: '粘贴一份职位描述，查看匹配依据，在独立版本里调整表达。',
          action: '开始一次岗位匹配',
          to: '/analysis',
        }
      : {
          index: 3,
          title: '好经历，值得一份好呈现。',
          description: '选择专业版式，放大检查内容，生成下一次投递的简历。',
          action: '前往导出中心',
          to: '/exports',
        },
)
onMounted(async () => {
  try {
    const [r, d] = await Promise.all([listResumes(), getDashboard()])
    resumes.value = r.data.data.resumes
    Object.assign(stats, d.data.data.stats)
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
})
const createNew = async () => {
  if (creating.value) return
  creating.value = true
  try {
    const { data } = await createResume({ title: '我的母简历' })
    router.push('/resumes/' + data.data.resume.id)
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '创建失败')
  } finally {
    creating.value = false
  }
}
const formatDate = (value) => new Date(value.replace(' ', 'T') + 'Z').toLocaleDateString('zh-CN')
</script>
<style scoped>
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.page-kicker {
  font-size: 10px;
  letter-spacing: 2px;
  color: #867d9b;
}
.desk-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 25px;
  background: #e4dcf8;
  padding: 32px 36px;
  border-radius: 13px;
  color: #352b4b;
  margin-bottom: 22px;
}
.banner-kicker {
  font-size: 10px;
  color: #77658f;
  letter-spacing: 2px;
}
.desk-banner h2 {
  font-size: 27px;
  font-weight: 500;
  letter-spacing: -0.6px;
  margin: 13px 0;
}
.desk-banner p {
  font-size: 15px;
  color: #756389;
  line-height: 1.9;
}
.desk-banner a {
  display: inline-flex;
  align-items: center;
  gap: 20px;
  font-size: 14px;
  color: #6846a4;
  text-decoration: none;
  margin-top: 22px;
}
.desk-banner a > .app-icon {
  width: 17px;
}
.banner-number {
  position: relative;
  flex: none;
  min-width: 130px;
}
.banner-number > span {
  display: block;
  font-size: 9px;
  letter-spacing: 1.4px;
  color: #7b708f;
}
.banner-number strong {
  font-family: Georgia, serif;
  font-style: italic;
  font-weight: 400;
  font-size: 103px;
  line-height: 1.2;
  color: #9474c7;
}
.banner-number small {
  font-size: 15px;
  color: #716685;
}
.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 27px;
}
.stats article {
  padding: 23px 24px;
  background: #f8f7fc;
  border: 1px solid #d7d2e4;
  border-radius: 11px;
}
.stats article > span {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: #746b88;
  gap: 10px;
}
.stats .app-icon {
  width: 18px;
  color: #9187ab;
}
.stats strong {
  display: block;
  font-size: 35px;
  font-weight: 500;
  color: #352b48;
  margin: 12px 0 6px;
  line-height: 1.2;
}
.stats small {
  font-size: 13px;
  color: #908aa0;
}
.desk-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 23px;
}
.panel {
  background: white;
  border: 1px solid #d9d5e3;
  border-radius: 13px;
  padding: 25px;
  min-width: 0;
}
.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 14px;
}
.panel-title span {
  font-size: 9px;
  letter-spacing: 2px;
  color: #968eaa;
}
.panel-title h2 {
  font-size: 23px;
  font-weight: 550;
  margin-top: 8px;
}
.panel-title a {
  font-size: 14px;
  text-decoration: none;
  color: #54447a;
  white-space: nowrap;
}
.empty {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #8980a0;
  text-align: center;
  font-size: 14px;
}
.empty > .app-icon {
  height: 35px;
  width: 35px;
  color: #a097b4;
}
.empty > b {
  font-size: 18px;
  color: #665b80;
  font-weight: 500;
}
.recent-list button {
  width: 100%;
  background: transparent;
  padding: 20px 0;
  border: 0;
  border-top: 1px solid #e2deeb;
  display: flex;
  align-items: center;
  text-align: left;
  gap: 13px;
}
.file-icon {
  width: 36px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 1px solid #ccc5de;
  background: #eeebf6;
  color: #726396;
  border-radius: 6px;
  flex: none;
}
.recent-list button > span:nth-child(2) {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}
.recent-list b {
  font-size: 15px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recent-list small {
  font-size: 13px;
  color: #8f88a1;
}
.recent-list em {
  font-size: 12px;
  color: #8276a0;
  font-style: normal;
  white-space: nowrap;
}
.recent-list button > .app-icon {
  height: 15px;
  width: 15px;
  color: #998fb1;
}
.desk-shortcuts {
  padding: 25px;
  background: #e4dcf8;
  border: 1px solid #d3cce4;
  border-radius: 13px;
}
.desk-shortcuts h2 {
  font-size: 23px;
  font-weight: 550;
  margin: 10px 0 22px;
}
.desk-shortcuts > a {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 17px 0;
  border-top: 1px solid #d1cae2;
  text-decoration: none;
}
.desk-shortcuts > a > .app-icon {
  color: #7a6aa1;
  flex: none;
}
.desk-shortcuts a > div {
  flex: 1;
  min-width: 0;
}
.desk-shortcuts b {
  font-size: 15px;
  font-weight: 500;
}
.desk-shortcuts p {
  font-size: 13px;
  color: #887ea0;
  margin-top: 5px;
}
.desk-shortcuts a > span {
  color: #8375a5;
}
.desk-shortcuts .shortcut-note {
  border-top: 1px solid #d1cae2;
  padding-top: 19px;
  font-size: 13px;
}
@media (max-width: 1050px) {
  .desk-grid {
    grid-template-columns: 1fr;
  }
  .desk-banner {
    padding: 28px;
  }
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 650px) {
  .head {
    align-items: flex-start;
    flex-direction: column;
  }
  .desk-banner {
    padding: 25px;
    gap: 15px;
  }
  .desk-banner h2 {
    font-size: 23px;
  }
  .desk-banner p {
    font-size: 14px;
  }
  .banner-number {
    display: none;
  }
  .stats {
    gap: 11px;
  }
  .stats article {
    padding: 20px;
  }
  .stats article > span {
    font-size: 13px;
  }
  .panel,
  .desk-shortcuts {
    padding: 22px;
  }
  .recent-list em,
  .recent-list button > .app-icon {
    display: none;
  }
}
</style>
