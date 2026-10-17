<template>
  <AppLayout
    ><header class="head">
      <div>
        <h1>我的简历</h1>
        <p>一份完整母简历，为不同岗位保留独立表达</p>
      </div>
      <el-button type="primary" :loading="creating" @click="createNew">新建母简历</el-button>
    </header>
    <div v-if="loading" class="state">正在加载...</div>
    <div v-else-if="loadError" class="state">
      <p>{{ loadError }}</p>
      <el-button @click="load">重新加载</el-button>
    </div>
    <div v-else-if="!items.length" class="state">暂无简历，点击右上角开始创建。</div>
    <section v-else class="grid">
      <article v-for="item in items" :key="item.id">
        <div class="cover">
          <div class="cover-paper"><ResumePreview :content="item.content" template="modern" /></div>
          <span>{{ item.source_resume_id ? '岗位版本' : '母简历' }}</span>
        </div>
        <h3>{{ item.title }}</h3>
        <p>
          {{ item.content?.basics?.name || '尚未填写姓名' }} ·
          {{ item.status === 'completed' ? '已完成' : '草稿' }}
        </p>
        <small>更新于 {{ formatDate(item.updated_at) }}</small>
        <div class="actions">
          <el-button @click="$router.push(`/resumes/${item.id}`)">编辑</el-button
          ><el-button type="danger" plain @click="remove(item)">删除</el-button>
        </div>
      </article>
    </section></AppLayout
  >
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppLayout from '@/layouts/AppLayout.vue'
import ResumePreview from '@/components/resume/ResumePreview.vue'
import { createResume, deleteResume, listResumes } from '@/api/resumes'
const router = useRouter(),
  items = ref([]),
  loading = ref(true),
  loadError = ref('')
const load = async () => {
  loading.value = true
  loadError.value = ''
  try {
    items.value = (await listResumes()).data.data.resumes
  } catch (e) {
    loadError.value = e.response?.data?.message || '加载失败，请稍后重试'
    ElMessage.error(loadError.value)
  } finally {
    loading.value = false
  }
}
onMounted(load)
const creating = ref(false)
const createNew = async () => {
  if (creating.value) return
  creating.value = true
  try {
    const { data } = await createResume({ title: '我的母简历' })
    router.push(`/resumes/${data.data.resume.id}`)
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '创建失败，请稍后重试')
  } finally {
    creating.value = false
  }
}
const remove = async (item) => {
  try {
    await ElMessageBox.confirm(`确定删除“${item.title}”吗？`, '删除简历', { type: 'warning' })
    await deleteResume(item.id)
    items.value = items.value.filter((x) => x.id !== item.id)
    ElMessage.success('已删除')
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') ElMessage.error(e.response?.data?.message || '删除失败')
  }
}
const formatDate = (v) => new Date(v.replace(' ', 'T') + 'Z').toLocaleString('zh-CN')
</script>
<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 26px;
}
.head h1 {
  font-size: 29px;
  font-weight: 750;
}
.head p {
  color: #858b99;
}
.state {
  display: grid;
  place-items: center;
  min-height: 360px;
  background: #fff;
  border-radius: 18px;
  color: #858b99;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}
.grid article {
  padding: 20px;
  background: #fff;
  border: 1px solid #e7e9ef;
  border-radius: 17px;
}
.cover {
  height: 185px;
  overflow: hidden;
  margin-bottom: 17px;
  border-radius: 12px;
  background: #e3dfee;
  color: #6d4aff;
  font-size: 30px;
  font-weight: 800;
}
.grid h3 {
  font-size: 17px;
  font-weight: 650;
}
.grid p,
.grid small {
  display: block;
  color: #8a909e;
}
.actions {
  display: flex;
  margin-top: 18px;
}
.actions button {
  flex: 1;
}
</style>

<style scoped>
.cover {
  position: relative;
}
.cover > span {
  position: absolute;
  right: 12px;
  top: 10px;
  padding: 3px 8px;
  background: #ffffffbb;
  border-radius: 5px;
  font-size: 13px;
  font-weight: 500;
  color: #6b6182;
}
.cover-paper {
  width: 83%;
  margin: 20px auto 0;
  transform: rotate(-3deg);
  box-shadow: 0 9px 25px #2c243b15;
}
.grid article {
  border-color: #d9d5e3;
  border-radius: 12px;
}
.grid h3 {
  font-size: 19px;
  font-weight: 550;
}
.grid p {
  margin-top: 8px;
  font-size: 14px;
  color: #797289;
}
.grid small {
  margin-top: 7px;
  font-size: 13px;
  color: #948da5;
}
.actions {
  border-top: 1px solid #ddd8e8;
  padding-top: 17px;
}
.grid article {
  transition: box-shadow 0.2s;
}
.grid article:hover {
  box-shadow: 0 8px 30px #3827580c;
}
</style>
