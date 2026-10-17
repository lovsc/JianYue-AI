export const resumeTemplates = [
  {
    id: 'classic',
    name: '青蓝 · 清晰',
    description: '几何页眉 · 青蓝分区 · 清晰叙事',
    color: '#3f98b5',
  },
  {
    id: 'modern',
    name: '深蓝 · 专业',
    description: '折角页眉 · 图标索引 · 稳重有序',
    color: '#305798',
  },
  {
    id: 'elegant',
    name: '灰蓝 · 雅致',
    description: '居中抬头 · 虚线分区 · 雅致舒展',
    color: '#526d8f',
  },
]
export function normalizeResumeContent(content = {}) {
  return {
    ...content,
    basics: { name: '', phone: '', email: '', location: '', summary: '', ...content.basics },
    ...Object.fromEntries(
      ['education', 'experience', 'projects', 'skills'].map((key) => [
        key,
        Array.isArray(content[key]) ? content[key] : [],
      ]),
    ),
  }
}
