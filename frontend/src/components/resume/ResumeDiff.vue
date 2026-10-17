<template>
  <div class="resume-diff">
    <p v-if="!changes.length" class="no-changes">两个版本的内容相同。</p>
    <article v-for="change in changes" :key="change.path">
      <h4>{{ change.label }}</h4>
      <div>
        <section>
          <small>{{ beforeLabel }}</small>
          <p>{{ change.before || '（空）' }}</p>
        </section>
        <section>
          <small>{{ afterLabel }}</small>
          <p>{{ change.after || '（空）' }}</p>
        </section>
      </div>
    </article>
  </div>
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({
  before: { type: Object, required: true },
  after: { type: Object, required: true },
  beforeLabel: { type: String, default: '历史版本' },
  afterLabel: { type: String, default: '当前内容' },
})
const names = {
  title: '标题',
  name: '姓名',
  phone: '手机',
  email: '邮箱',
  location: '城市',
  summary: '自我评价',
  position: '意向岗位',
  salary: '期望薪资',
  jobType: '求职类型',
  photo: '照片',
  education: '教育经历',
  experience: '工作经历',
  projects: '项目经历',
  skills: '专业技能',
}
const changes = computed(() => {
  const rows = []
  const compare = (path, label, before, after) => {
    if (JSON.stringify(before) !== JSON.stringify(after))
      rows.push({ path, label, before: format(before, path), after: format(after, path) })
  }
  compare('title', '简历标题', props.before.title, props.after.title)
  const a = props.before.content || {},
    b = props.after.content || {}
  for (const key of new Set([...Object.keys(a.basics || {}), ...Object.keys(b.basics || {})]))
    compare(key, names[key] || key, a.basics?.[key], b.basics?.[key])
  for (const key of ['education', 'experience', 'projects', 'skills'])
    compare(key, names[key], a[key], b[key])
  return rows
})
function format(value, path) {
  if (path === 'photo') return value ? '已上传照片' : ''
  if (Array.isArray(value))
    return value
      .map((item) =>
        typeof item === 'string' ? item : Object.values(item).filter(Boolean).join(' · '),
      )
      .join('\n\n')
  return value || ''
}
</script>
<style scoped>
.resume-diff article {
  margin: 0 0 20px;
  border: 1px solid #e9e5ee;
  border-radius: 10px;
  overflow: hidden;
}
.resume-diff h4 {
  background: #f7f5fb;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 650;
}
.resume-diff article > div {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.resume-diff section {
  padding: 14px;
  min-width: 0;
  background: #fff8f6;
}
.resume-diff section + section {
  background: #f3faf6;
}
.resume-diff small {
  font-size: 11px;
  color: #95879a;
}
.resume-diff p {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 12px;
  margin-top: 8px;
}
.no-changes {
  color: #9c93a7;
  padding: 25px;
  text-align: center;
}
@media (max-width: 600px) {
  .resume-diff article > div {
    grid-template-columns: 1fr;
  }
}
</style>
