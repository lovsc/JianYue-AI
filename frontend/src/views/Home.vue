<template>
  <AppLayout
    ><div class="chat-shell">
      <aside class="sessions">
        <header>
          <div>
            <span>AI COPILOT</span>
            <h2>智能助手</h2>
          </div>
          <button title="新建对话" @click="newChat">＋</button>
        </header>
        <div class="context">
          <small>简历上下文</small
          ><el-select
            v-model="selectedResume"
            placeholder="不使用简历"
            clearable
            :disabled="Boolean(currentId)"
            ><el-option v-for="item in resumes" :key="item.id" :label="item.title" :value="item.id"
          /></el-select>
          <p v-if="currentId">新建对话时可重新选择</p>
        </div>
        <div class="session-list">
          <p>最近对话</p>
          <div
            v-for="item in sessions"
            :key="item.id"
            class="session-item"
            :class="{ active: item.id === currentId, confirming: pendingDeleteId === item.id }"
          >
            <template v-if="pendingDeleteId === item.id">
              <span class="delete-question">确定删除这个对话？</span>
              <button class="cancel-delete" @click="pendingDeleteId = null">取消</button>
              <button class="confirm-delete" @click="confirmRemove(item)">删除</button>
            </template>
            <template v-else>
              <button class="session-open" @click="openSession(item.id)">
                <span
                  ><b>{{ item.title }}</b
                  ><small>{{ item.last_message || item.resume_title || '暂无消息' }}</small></span
                >
              </button>
              <button class="delete-trigger" title="删除对话" @click="pendingDeleteId = item.id">
                ×
              </button>
            </template>
          </div>
          <div v-if="!sessions.length" class="session-empty">暂无历史对话</div>
        </div>
      </aside>

      <main class="conversation">
        <header>
          <div>
            <b>{{ currentSession?.title || '新对话' }}</b
            ><span>{{
              currentSession?.resume_title
                ? `正在参考：${currentSession.resume_title}`
                : '通用求职问答'
            }}</span>
          </div>
          <i :class="{ online: !loading }"></i>
        </header>
        <section ref="bodyRef" class="messages">
          <div v-if="!messages.length" class="welcome">
            <span class="ai-mark">AI</span>
            <h1>让每次求职准备更有方向</h1>
            <p>结合你的简历分析项目表达、准备面试问题，或制定岗位提升计划。</p>
            <div>
              <button v-for="prompt in prompts" :key="prompt" @click="input = prompt">
                {{ prompt }}
              </button>
            </div>
          </div>
          <div v-else class="message-list">
            <article
              v-for="message in messages"
              :key="message.id || message.localId"
              :class="message.role"
            >
              <span>{{ message.role === 'user' ? '我' : 'AI' }}</span>
              <div>
                <div v-if="message.pending && !message.content" class="typing">
                  <i></i><i></i><i></i><small>正在思考</small>
                </div>
                <p v-else>{{ message.content }}</p>
                <small v-if="message.created_at">{{ time(message.created_at) }}</small>
              </div>
            </article>
          </div>
        </section>
        <footer>
          <div class="composer">
            <textarea
              v-model="input"
              rows="1"
              maxlength="10000"
              placeholder="输入关于简历、岗位或面试的问题..."
              @input="resizeInput"
              @keydown.enter.exact.prevent="send"
              @keydown.shift.enter.stop
            ></textarea>
            <div>
              <small>Enter 发送 · Shift + Enter 换行</small
              ><button v-if="loading" class="stop" @click="stopGeneration">停止生成</button
              ><button v-else :disabled="!input.trim()" @click="send">发送 ↗</button>
            </div>
          </div>
          <p>AI 生成内容仅供参考，请结合实际经历判断。</p>
        </footer>
      </main>
    </div></AppLayout
  >
</template>

<script setup>
import { nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AppLayout from '@/layouts/AppLayout.vue'
import { listResumes } from '@/api/resumes'
import { createSession, deleteSession, getSession, listSessions } from '@/api/chat'
import { useAuthStore } from '@/stores/auth'
import { apiBase } from '@/api/http'

const auth = useAuthStore(),
  sessions = ref([]),
  resumes = ref([]),
  currentId = ref(null),
  currentSession = ref(null),
  selectedResume = ref(null),
  messages = ref([]),
  input = ref(''),
  loading = ref(false),
  bodyRef = ref(null)
const pendingDeleteId = ref(null)
const prompts = [
  '根据我的简历，帮我准备 5 个面试问题',
  '如何量化描述项目成果？',
  '帮我制定前端岗位的学习计划',
]
let controller = null

const loadSessions = async () => {
  sessions.value = (await listSessions()).data.data.sessions
}
onMounted(async () => {
  try {
    await Promise.all([
      loadSessions(),
      listResumes().then((r) => {
        resumes.value = r.data.data.resumes
      }),
    ])
    if (sessions.value.length) await openSession(sessions.value[0].id)
  } catch (e) {
    ElMessage.error(e.response?.data?.message || 'AI 助手加载失败')
  }
})
const scrollBottom = async () => {
  await nextTick()
  if (bodyRef.value) bodyRef.value.scrollTo({ top: bodyRef.value.scrollHeight, behavior: 'smooth' })
}
const openSession = async (id) => {
  if (loading.value) return
  const data = (await getSession(id)).data.data
  currentId.value = id
  currentSession.value = data.session
  selectedResume.value = data.session.resume_id
  messages.value = data.messages
  scrollBottom()
}
const newChat = () => {
  if (loading.value) return
  currentId.value = null
  currentSession.value = null
  selectedResume.value = null
  messages.value = []
  input.value = ''
}
const confirmRemove = async (item) => {
  try {
    await deleteSession(item.id)
    sessions.value = sessions.value.filter((x) => x.id !== item.id)
    pendingDeleteId.value = null
    if (currentId.value === item.id) newChat()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '删除失败')
  }
}
const ensureSession = async () => {
  if (currentId.value) return currentId.value
  const session = (await createSession({ resumeId: selectedResume.value, title: '新对话' })).data
    .data.session
  currentId.value = session.id
  currentSession.value = session
  sessions.value.unshift(session)
  return session.id
}
const resizeInput = (event) => {
  const el = event.target
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 120)}px`
}
const stopGeneration = () => controller?.abort()

const send = async () => {
  const content = input.value.trim()
  if (!content || loading.value) return
  let id
  try {
    id = await ensureSession()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '创建对话失败')
    return
  }
  messages.value.push({ localId: Date.now(), role: 'user', content })
  const assistant = reactive({
    localId: Date.now() + 1,
    role: 'assistant',
    content: '',
    pending: true,
  })
  messages.value.push(assistant)
  input.value = ''
  loading.value = true
  controller = new AbortController()
  scrollBottom()
  try {
    const response = await fetch(`${apiBase}/chat/sessions/${id}/messages`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ content }),
    })
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || '请求失败')
    }
    const reader = response.body.getReader(),
      decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.trim().startsWith('data:')) continue
        const raw = line.replace(/^data:\s*/, '').trim()
        if (raw === '[DONE]') continue
        try {
          assistant.content += JSON.parse(raw).choices?.[0]?.delta?.content || ''
          scrollBottom()
        } catch {}
      }
    }
    await loadSessions()
    currentSession.value = sessions.value.find((x) => x.id === id) || currentSession.value
  } catch (e) {
    if (e.name === 'AbortError') {
      if (!assistant.content) assistant.content = '已停止生成。'
    } else assistant.content = `请求失败：${e.message}`
  } finally {
    assistant.pending = false
    loading.value = false
    controller = null
    scrollBottom()
  }
}
const time = (value) =>
  new Date(value.replace(' ', 'T') + 'Z').toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
</script>

<style scoped>
.chat-shell {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  height: calc(100vh - 68px);
  min-height: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e5e7ed;
  border-radius: 20px;
  box-shadow: 0 9px 35px #222a4010;
}
.sessions {
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f5f6f9;
  border-right: 1px solid #e1e3e8;
}
.sessions > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 18px 15px;
}
.sessions header span {
  color: #6d4aff;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.5px;
}
.sessions h2 {
  font-size: 19px;
  font-weight: 720;
}
.sessions header button {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 10px;
  background: #171923;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
}
.context {
  padding: 0 16px 15px;
}
.context small {
  display: block;
  margin-bottom: 6px;
  color: #858b98;
}
.context p {
  margin-top: 5px;
  color: #a0a5ae;
  font-size: 10px;
}
.session-list {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding: 0 10px 15px;
}
.session-list > p {
  padding: 0 8px 7px;
  color: #9297a3;
  font-size: 11px;
}
.session-list > button {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 11px 10px;
  border: 0;
  border-radius: 11px;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.session-list > button:hover,
.session-list > button.active {
  background: #fff;
}
.session-list button span {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.session-list b,
.session-list small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.session-list b {
  font-weight: 650;
}
.session-list small {
  color: #969ba6;
}
.session-list em {
  opacity: 0;
  color: #999;
  font-size: 18px;
  font-style: normal;
}
.session-list button:hover em {
  opacity: 1;
}
.session-empty {
  padding: 35px 10px;
  color: #9a9faa;
  text-align: center;
}
.conversation {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.conversation > header {
  height: 66px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 25px;
  border-bottom: 1px solid #eceef2;
}
.conversation header div {
  display: flex;
  flex-direction: column;
}
.conversation header b {
  font-weight: 700;
}
.conversation header span {
  color: #8d93a0;
  font-size: 12px;
}
.conversation header > i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #bbb;
}
.conversation header > i.online {
  background: #37b276;
  box-shadow: 0 0 0 4px #e6f8ef;
}
.messages {
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 25px 28px 45px;
  scroll-padding-bottom: 45px;
}
.welcome {
  max-width: 650px;
  margin: 55px auto;
  text-align: center;
}
.ai-mark {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  margin: 0 auto 18px;
  border-radius: 18px;
  background: #6d4aff;
  color: #fff;
  font-weight: 800;
  box-shadow: 0 12px 25px #6d4aff44;
}
.welcome h1 {
  font-size: 27px;
  font-weight: 750;
}
.welcome p {
  margin: 8px 0 27px;
  color: #7e8492;
}
.welcome > div {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.welcome button {
  padding: 14px;
  border: 1px solid #e4e6ec;
  border-radius: 12px;
  background: #fff;
  color: #555b68;
  text-align: left;
  cursor: pointer;
}
.welcome button:hover {
  border-color: #6d4aff;
  background: #faf9ff;
}
.welcome button:last-child {
  grid-column: 1/-1;
}
.message-list {
  max-width: 760px;
  margin: auto;
}
.message-list article {
  display: flex;
  gap: 12px;
  margin-bottom: 22px;
}
.message-list article > span {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: none;
  border-radius: 10px;
  background: #171923;
  color: #fff;
  font-size: 11px;
  font-weight: 750;
}
.message-list article > div {
  max-width: 82%;
  padding: 12px 15px;
  border-radius: 3px 15px 15px;
  background: #f2f3f6;
}
.message-list article p {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.75;
}
.message-list article small {
  display: block;
  margin-top: 5px;
  color: #a0a5af;
}
.message-list article.user {
  flex-direction: row-reverse;
}
.message-list article.user > span {
  background: #6d4aff;
}
.message-list article.user > div {
  background: #6d4aff;
  color: #fff;
  border-radius: 15px 3px 15px 15px;
}
.typing {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 95px;
}
.typing i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #888;
  animation: pulse 1.2s infinite;
}
.typing i:nth-child(2) {
  animation-delay: 0.2s;
}
.typing i:nth-child(3) {
  animation-delay: 0.4s;
}
.typing small {
  margin-left: 5px !important;
}
@keyframes pulse {
  50% {
    opacity: 0.25;
    transform: translateY(-3px);
  }
}
.conversation > footer {
  position: relative;
  z-index: 2;
  flex: none;
  padding: 12px 26px 16px;
  background: #fff;
  border-top: 1px solid #f0f1f4;
}
.composer {
  max-width: 780px;
  margin: auto;
  padding: 11px 14px;
  border: 1px solid #dfe2e8;
  border-radius: 15px;
  box-shadow: 0 5px 18px #2222;
}
.composer:focus-within {
  border-color: #6d4aff;
  box-shadow: 0 7px 22px #6d4aff1c;
}
.composer textarea {
  display: block;
  width: 100%;
  max-height: 120px;
  border: 0;
  outline: 0;
  resize: none;
  font: inherit;
  line-height: 1.55;
}
.composer > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 7px;
}
.composer small {
  color: #9ba0aa;
}
.composer button {
  padding: 8px 14px;
  border: 0;
  border-radius: 9px;
  background: #6d4aff;
  color: #fff;
  cursor: pointer;
}
.composer button.stop {
  background: #fff0ee;
  color: #c84f42;
}
.composer button:disabled {
  background: #d8d5e5;
  cursor: not-allowed;
}
.conversation > footer > p {
  text-align: center;
  margin-top: 6px;
  color: #a0a5ae;
  font-size: 10px;
}
@media (max-width: 900px) {
  .chat-shell {
    grid-template-columns: 210px minmax(0, 1fr);
  }
  .welcome > div {
    grid-template-columns: 1fr;
  }
  .welcome button:last-child {
    grid-column: auto;
  }
}
@media (max-width: 650px) {
  .chat-shell {
    grid-template-columns: 1fr;
  }
  .sessions {
    display: none;
  }
  .messages {
    padding: 18px 16px 35px;
  }
  .conversation > footer {
    padding: 10px 13px;
  }
}
/* Viewport-locked chat layout: the composer never leaves the visible workspace. */
.chat-shell {
  position: fixed;
  z-index: 5;
  top: 34px;
  right: 42px;
  bottom: 34px;
  left: 272px;
  width: auto;
  height: auto;
  max-height: none;
}

.conversation {
  height: 100%;
  min-height: 0;
}

.messages {
  height: 0;
  min-height: 0;
  flex: 1 1 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.conversation > footer {
  min-height: 105px;
  max-height: 205px;
  flex: 0 0 auto;
  overflow: hidden;
}

@media (max-width: 760px) {
  .chat-shell {
    top: 24px;
    right: 16px;
    bottom: 24px;
    left: 92px;
  }
}
.session-item {
  display: flex;
  align-items: center;
  min-height: 54px;
  margin-bottom: 3px;
  padding: 4px;
  border-radius: 11px;
}
.session-item:hover,
.session-item.active,
.session-item.confirming {
  background: #fff;
}
.session-open {
  display: flex;
  min-width: 0;
  flex: 1;
  padding: 8px 6px;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.session-open span {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.session-open b,
.session-open small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.session-open b {
  font-weight: 650;
}
.session-open small {
  color: #969ba6;
}
.delete-trigger,
.cancel-delete,
.confirm-delete {
  flex: none;
  border: 0;
  border-radius: 7px;
  background: transparent;
  cursor: pointer;
}
.delete-trigger {
  width: 28px;
  height: 28px;
  color: #999;
  font-size: 18px;
  opacity: 0;
}
.session-item:hover .delete-trigger {
  opacity: 1;
}
.delete-question {
  min-width: 0;
  flex: 1;
  padding-left: 6px;
  color: #555b68;
  font-size: 12px;
}
.cancel-delete,
.confirm-delete {
  padding: 6px 7px;
  font-size: 11px;
}
.cancel-delete {
  color: #747b88;
}
.confirm-delete {
  background: #fff0ee;
  color: #c64f43;
}
</style>
