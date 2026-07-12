const jobs = require('../repositories/job.repository')
const { AppError } = require('../utils/app-error')

function normalize(input) {
  const company = String(input.company || '').trim().slice(0, 80)
  const position = String(input.position || '').trim()
  const content = String(input.content || '').trim()
  if (!position || position.length > 80) throw new AppError(400, '岗位名称长度应为 1 到 80 个字符', 'VALIDATION_ERROR')
  if (content.length < 20 || content.length > 20000) throw new AppError(400, '职位描述长度应为 20 到 20000 个字符', 'VALIDATION_ERROR')
  return { company, position, content }
}
const publicJob = (row) => { const { user_id: _ignored, ...job } = row; return job }
const list = (userId) => jobs.listByUser(userId).map(publicJob)
function get(id, userId) { const row = jobs.findByIdAndUser(id, userId); if (!row) throw new AppError(404, '目标岗位不存在', 'JOB_NOT_FOUND'); return publicJob(row) }
function create(input, userId) { const value = normalize(input); return publicJob(jobs.create(userId, value.company, value.position, value.content)) }
function update(id, input, userId) { get(id, userId); const value = normalize(input); return publicJob(jobs.update(id, userId, value.company, value.position, value.content)) }
function remove(id, userId) { if (!jobs.remove(id, userId)) throw new AppError(404, '目标岗位不存在', 'JOB_NOT_FOUND') }

module.exports = { list, get, create, update, remove }
