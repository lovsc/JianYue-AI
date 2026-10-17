<template>
  <article class="resume-document" :class="template">
    <div v-if="template === 'elegant'" class="document-title">个人简历</div>
    <header class="document-header">
      <div class="portrait" :class="{ empty: !safePhoto }">
        <img v-if="safePhoto" :src="safePhoto" alt="个人照片" />
        <svg v-else viewBox="0 0 100 128" aria-hidden="true">
          <circle cx="50" cy="44" r="19" fill="currentColor" />
          <path d="M16 104c0-23 15-37 34-37s34 14 34 37v5H16z" fill="currentColor" />
        </svg>
      </div>
      <div class="identity">
        <div class="name-line">
          <h1>{{ basics.name || '你的姓名' }}</h1>
          <span v-if="template === 'elegant' && basics.position" class="position"
            >意向岗位：{{ basics.position }}</span
          >
        </div>
        <div class="contact">
          <span v-if="basics.phone"><b>电话：</b>{{ basics.phone }}</span
          ><span v-if="basics.email"><b>邮箱：</b>{{ basics.email }}</span
          ><span v-if="basics.gender"><b>性别：</b>{{ basics.gender }}</span
          ><span v-if="basics.age"><b>年龄：</b>{{ basics.age }}</span
          ><span v-if="basics.location && !basics.gender"><b>城市：</b>{{ basics.location }}</span>
        </div>
      </div>
      <div class="header-ornament" aria-hidden="true"><i></i><i></i><i></i></div>
    </header>
    <section
      v-if="basics.position || basics.salary || basics.jobType"
      class="document-section intention"
    >
      <h2>
        <span class="section-label"><AppIcon name="intention" /><span>求职意向</span></span
        ><i class="section-rule"></i>
      </h2>
      <div class="intention-grid">
        <p v-if="basics.position"><b>意向岗位：</b>{{ basics.position }}</p>
        <p v-if="basics.location"><b>意向城市：</b>{{ basics.location }}</p>
        <p v-if="basics.salary"><b>期望薪资：</b>{{ basics.salary }}</p>
        <p v-if="basics.jobType"><b>求职类型：</b>{{ basics.jobType }}</p>
      </div>
    </section>
    <section v-for="section in sections" :key="section.key" class="document-section">
      <h2>
        <span class="section-label"
          ><AppIcon :name="section.key" /><span>{{ section.title }}</span></span
        ><i class="section-rule"></i>
      </h2>
      <article v-for="(item, index) in section.items" :key="index" class="document-entry">
        <header>
          <time>{{ item.period }}</time
          ><b>{{ item.school || item.company || item.name || '待填写' }}</b>
        </header>
        <p v-if="item.role || item.degree" class="entry-role">{{ item.role || item.degree }}</p>
        <ul v-if="lines(item.description).length > 1" class="description-list">
          <li v-for="(line, i) in lines(item.description)" :key="i">{{ line }}</li>
        </ul>
        <p v-else-if="item.description" class="entry-description">{{ item.description }}</p>
      </article>
    </section>
    <section v-if="content.skills.length" class="document-section">
      <h2>
        <span class="section-label"><AppIcon name="skills" /><span>专业技能</span></span
        ><i class="section-rule"></i>
      </h2>
      <ul class="skills-grid">
        <li v-for="(skill, index) in content.skills" :key="index">{{ skill }}</li>
      </ul>
    </section>
    <section v-if="basics.summary" class="document-section">
      <h2>
        <span class="section-label"><AppIcon name="summary" /><span>自我评价</span></span
        ><i class="section-rule"></i>
      </h2>
      <ul v-if="lines(basics.summary).length > 1" class="description-list summary-list">
        <li v-for="(line, i) in lines(basics.summary)" :key="i">{{ line }}</li>
      </ul>
      <p v-else class="summary-text">{{ basics.summary }}</p>
    </section>
  </article>
</template>
<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { normalizeResumeContent } from '@/utils/resume-templates'
const props = defineProps({
  content: { type: Object, required: true },
  template: { type: String, default: 'classic' },
})
const content = computed(() => normalizeResumeContent(props.content)),
  basics = computed(() => content.value.basics)
const safePhoto = computed(() =>
  /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(basics.value.photo || '')
    ? basics.value.photo
    : '',
)
const sections = computed(() =>
  [
    { key: 'education', title: '教育经历' },
    { key: 'experience', title: '工作经历' },
    { key: 'projects', title: '项目经历' },
  ]
    .map((section) => ({ ...section, items: content.value[section.key] }))
    .filter((section) => section.items.length),
)
const lines = (value) =>
  String(value || '')
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[•·●]\s*|^[-*]\s+/, ''))
    .filter(Boolean)
</script>
<style>
.resume-document {
  --resume-accent: #3f98b5;
  --resume-soft: #deebef;
  width: 210mm;
  min-height: 297mm;
  padding: 12mm;
  background: #fff;
  color: #32363b;
  font-family: Arial, 'Microsoft YaHei', sans-serif;
  font-size: 11.5pt;
  line-height: 1.65;
  overflow-wrap: anywhere;
  box-sizing: border-box;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}
.resume-document.modern {
  --resume-accent: #305798;
  --resume-soft: #e4e9f1;
}
.resume-document.elegant {
  --resume-accent: #526d8f;
  --resume-soft: #e6eaef;
}
.resume-document .document-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12mm;
  margin: 0;
  width: 100%;
  min-height: 44mm;
  padding: 4mm 0;
  isolation: isolate;
  break-inside: avoid;
}
.resume-document .identity {
  flex: 1;
  min-width: 0;
  position: relative;
  z-index: 1;
}
.resume-document .name-line {
  display: flex;
  align-items: baseline;
  gap: 14mm;
  flex-wrap: wrap;
}
.resume-document h1 {
  font-size: 28pt;
  line-height: 1.3;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: var(--resume-accent);
}
.resume-document .contact {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2mm 6mm;
  margin-top: 6mm;
  color: #50565f;
  font-size: 10.5pt;
}
.resume-document .contact b {
  font-weight: 400;
  color: var(--resume-accent);
}
.resume-document .portrait {
  position: relative;
  z-index: 1;
  flex: none;
  width: 28mm;
  height: 36mm;
  background: #f0f2f4;
  border: 1px solid #e8ebed;
  display: grid;
  place-items: center;
}
.resume-document .portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.resume-document .portrait svg {
  width: 85%;
  height: 85%;
  color: #dce0e3;
}
.resume-document .portrait.empty {
  border-color: transparent;
}
.resume-document .header-ornament {
  display: none;
}
.resume-document .document-section {
  margin-top: 6mm;
}
.resume-document h2 {
  display: flex;
  align-items: center;
  gap: 0;
  position: relative;
  margin: 0 0 2mm;
  padding: 0;
  font-size: 13pt;
  line-height: 1.5;
  font-weight: 700;
  break-after: avoid;
}
.resume-document .section-label {
  display: flex;
  align-items: center;
  gap: 2mm;
  flex: none;
  padding: 1.5mm 4mm;
  background: var(--resume-accent);
  color: white;
}
.resume-document .section-label .app-icon {
  width: 5.5mm;
  height: 5.5mm;
  stroke-width: 1.9;
}
.resume-document .section-rule {
  flex: 1;
  align-self: flex-end;
  display: block;
}
.resume-document .intention-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.8mm 9mm;
  padding: 0 1.5mm;
  color: #666c74;
  font-size: 10.5pt;
}
.resume-document .intention-grid b {
  font-weight: 400;
}
.resume-document .document-entry {
  margin: 2.5mm 1.5mm 0;
  break-inside: avoid;
}
.resume-document .document-entry + .document-entry {
  margin-top: 4mm;
}
.resume-document .document-entry header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 6mm;
  break-after: avoid;
}
.resume-document .document-entry header b {
  font-size: 12pt;
  font-weight: 700;
  text-align: right;
}
.resume-document .document-entry time {
  font-size: 11.5pt;
  font-weight: 700;
  flex: none;
  color: #363a40;
  letter-spacing: 0.1px;
}
.resume-document .entry-role {
  margin: 1.5mm 0 1.5mm;
  color: #414750;
}
.resume-document .entry-description,
.resume-document .summary-text {
  margin: 1mm 0 0;
  white-space: pre-line;
  color: #626972;
  line-height: 1.62;
}
.resume-document .description-list {
  margin: 1.5mm 0 0;
  padding-left: 3.5mm;
  color: #626972;
  line-height: 1.62;
}
.resume-document .description-list li {
  padding-left: 0.3mm;
  orphans: 3;
  widows: 3;
}
.resume-document .description-list li::marker {
  font-size: 7pt;
  color: #7c8795;
}
.resume-document .skills-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1mm 5mm;
  margin: 1.5mm 1.5mm 0;
  padding-left: 3.5mm;
  color: #626972;
  font-size: 10.5pt;
  line-height: 1.62;
}
.resume-document .summary-list,
.resume-document .summary-text {
  margin-left: 1.5mm;
  margin-right: 1.5mm;
}
.resume-document .document-title {
  text-align: center;
  font-size: 20pt;
  font-weight: 750;
  color: var(--resume-accent);
  letter-spacing: 2px;
  margin: 0;
  padding: 2mm 0;
  border-bottom: 2mm double var(--resume-accent);
  line-height: 1.2;
}
.resume-document .position {
  font-size: 10.5pt;
  color: #777f89;
  letter-spacing: 0;
}
.resume-document.classic .document-header::before {
  content: '';
  position: absolute;
  z-index: -1;
  top: 0;
  left: 0;
  width: 58mm;
  height: 100%;
  background: var(--resume-soft);
  clip-path: polygon(0 0, 60% 0, 100% 100%, 0 100%);
}
.resume-document.classic .document-header::after {
  content: '';
  position: absolute;
  z-index: -1;
  top: 0;
  left: 35mm;
  width: 24mm;
  height: 15mm;
  background: #b5ccd3;
  clip-path: polygon(0 0, 100% 0, 23% 100%);
}
.resume-document.classic .document-header {
  gap: 17mm;
  padding-bottom: 4mm;
}
.resume-document.classic .identity h1 {
  color: #34393e;
  font-weight: 500;
}
.resume-document.classic .contact {
  grid-template-columns: 1fr 1fr;
  gap: 2mm 5mm;
}
.resume-document.classic .contact b {
  color: #555;
}
.resume-document.classic .portrait {
  width: 26mm;
  height: 33mm;
  background: #f4f7f8;
}
.resume-document.classic .section-label {
  padding: 2mm 6mm;
  min-width: 31mm;
  justify-content: center;
  font-weight: 500;
}
.resume-document.classic .section-label .app-icon {
  display: none;
}
.resume-document.classic .document-header .header-ornament {
  position: absolute;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 1.2mm;
  align-items: stretch;
  height: 5mm;
}
.resume-document.classic .header-ornament i {
  display: block;
  width: 3mm;
  background: #b7cfd6;
}
.resume-document.classic .header-ornament i:first-child {
  width: 24mm;
  clip-path: polygon(12% 0, 100% 0, 100% 100%, 0 100%);
  background: #d9e7eb;
}
.resume-document.classic .document-section {
  margin-top: 4mm;
}
.resume-document.modern .document-header {
  padding-top: 8mm;
  padding-bottom: 5mm;
  min-height: 51mm;
  gap: 15mm;
}
.resume-document.modern .document-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 8mm;
  background: var(--resume-accent);
  clip-path: polygon(0 0, 100% 0, 100% 55%, 64% 55%, 62% 100%, 38% 100%, 36% 55%, 0 55%);
}
.resume-document.modern .portrait,
.resume-document.elegant .portrait {
  order: 2;
  width: 30mm;
  height: 40mm;
}
.resume-document.modern .contact {
  max-width: 125mm;
  margin-top: 8mm;
}
.resume-document.modern h2 {
  border-bottom: 1.2mm solid #e0e2e5;
  padding-bottom: 1.4mm;
}
.resume-document.modern .section-label {
  padding: 0;
  gap: 2mm;
  background: transparent;
  color: var(--resume-accent);
}
.resume-document.modern .section-label > .app-icon {
  box-sizing: content-box;
  background: var(--resume-accent);
  color: white;
  padding: 1.4mm;
  width: 5.5mm;
  height: 5.5mm;
}
.resume-document.modern .document-section {
  margin-top: 4mm;
}
.resume-document.elegant .document-header {
  margin-top: 0;
  min-height: 39mm;
  padding-top: 3mm;
  padding-bottom: 2mm;
  gap: 13mm;
}
.resume-document.elegant .portrait {
  width: 26mm;
  height: 34mm;
  box-shadow: 0 0 1.3mm #00000025;
  border: 1px solid #ddd;
}
.resume-document.elegant .contact {
  margin-top: 6mm;
}
.resume-document.elegant .contact b {
  font-weight: 700;
  color: #575d65;
}
.resume-document.elegant h2 {
  border-bottom: 0.45mm dotted #d4d9df;
  padding-bottom: 1.6mm;
}
.resume-document.elegant h2::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: -0.8mm;
  width: 1.2mm;
  height: 1.2mm;
  transform: rotate(45deg);
  background: #d0d7df;
}
.resume-document.elegant .section-label {
  padding: 1.2mm 4mm;
  min-width: 38mm;
  font-size: 13pt;
}
.resume-document.elegant .document-section {
  margin-top: 3.5mm;
}
@media print {
  .resume-document {
    width: 100%;
    min-height: 0;
    padding: 0;
    box-shadow: none;
  }
}
</style>
