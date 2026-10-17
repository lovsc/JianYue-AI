const resumes = require('../repositories/resume.repository')
const { AppError } = require('../utils/app-error')
const { db } = require('../database')
const versions = require('../repositories/version.repository')

const emptyContent = {
  basics: { name: '', phone: '', email: '', location: '', summary: '' },
  education: [],
  experience: [],
  projects: [],
  skills: [],
}

function parse(row) {
  if (!row) return null
  let content
  try { content = JSON.parse(row.content_json) } catch { throw new AppError(500, '简历数据读取失败', 'RESUME_DATA_INVALID') }
  const { content_json: _ignored, user_id: _userId, ...resume } = row
  return { ...resume, content }
}

function normalizeTitle(value) {
  const title = String(value || '').trim()
  if (!title || title.length > 80) {
    throw new AppError(400, '简历标题长度应为 1 到 80 个字符', 'VALIDATION_ERROR')
  }
  return title
}

function normalizeContent(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError(400, '简历内容格式不正确', 'VALIDATION_ERROR')
  }
  const json = JSON.stringify(value)
  if (Buffer.byteLength(json, 'utf8') > 1024 * 1024) {
    throw new AppError(413, '简历内容不能超过 1MB', 'CONTENT_TOO_LARGE')
  }
  if (!value.basics || typeof value.basics !== 'object' || Array.isArray(value.basics) ||
      !['education', 'experience', 'projects', 'skills'].every(key => Array.isArray(value[key])) ||
      !Object.values(value.basics).every(item => typeof item === 'string') ||
      !value.skills.every(item => typeof item === 'string') ||
      !['education', 'experience', 'projects'].every(key => value[key].every(item => item && typeof item === 'object' && !Array.isArray(item) && Object.values(item).every(v => typeof v === 'string')))) {
    throw new AppError(400, '请提供完整的基本信息、教育、工作、项目与技能数据', 'VALIDATION_ERROR')
  }
  return json
}

function list(userId) {
  return resumes.listByUser(userId).map(parse)
}

function get(id, userId) {
  const resume = parse(resumes.findByIdAndUser(id, userId))
  if (!resume) throw new AppError(404, '简历不存在', 'RESUME_NOT_FOUND')
  return resume
}

function create(input, userId) {
  return parse(resumes.create(userId, normalizeTitle(input.title || '我的简历'), normalizeContent(input.content || emptyContent)))
}

function assertRevision(current, expectedRevision) {
  if (!Number.isInteger(expectedRevision) || expectedRevision !== current.revision) {
    throw new AppError(409, '简历已在其他页面更新。请保留当前修改，重新加载后再合并', 'RESUME_CONFLICT')
  }
}

const update = db.transaction((id, input, userId) => {
  const current = get(id, userId)
  assertRevision(current, input.expectedRevision)
  const title = normalizeTitle(input.title ?? current.title)
  const contentJson = normalizeContent(input.content ?? current.content)
  const status = input.status == null ? current.status : input.status === 'completed' ? 'completed' : 'draft'
  if (title === current.title && contentJson === JSON.stringify(current.content) && status === current.status) return current
  versions.create(resumes.findByIdAndUser(id, userId), userId, 'before_edit', '编辑保存前自动快照')
  return parse(resumes.update(
    id,
    userId,
    title,
    contentJson,
    status,
    current.revision,
  ))
})

function remove(id, userId) {
  if (!resumes.remove(id, userId)) throw new AppError(404, '简历不存在', 'RESUME_NOT_FOUND')
}

module.exports = { list, get, create, update, remove, emptyContent, assertRevision }
