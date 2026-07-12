const resumes = require('../repositories/resume.repository')
const { AppError } = require('../utils/app-error')

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
  try { content = JSON.parse(row.content_json) } catch { content = emptyContent }
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

function update(id, input, userId) {
  const current = get(id, userId)
  const status = input.status === 'completed' ? 'completed' : 'draft'
  return parse(resumes.update(
    id,
    userId,
    normalizeTitle(input.title ?? current.title),
    normalizeContent(input.content ?? current.content),
    status,
  ))
}

function remove(id, userId) {
  if (!resumes.remove(id, userId)) throw new AppError(404, '简历不存在', 'RESUME_NOT_FOUND')
}

module.exports = { list, get, create, update, remove, emptyContent }
