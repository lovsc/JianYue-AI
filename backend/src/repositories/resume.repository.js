const { db } = require('../database')
const { AppError } = require('../utils/app-error')

const fields = 'id, user_id, title, content_json, status, revision, source_resume_id, target_job_id, created_at, updated_at'

function listByUser(userId) {
  return db.prepare(`SELECT ${fields} FROM resumes WHERE user_id = ? ORDER BY updated_at DESC`).all(userId)
}

function findByIdAndUser(id, userId) {
  return db.prepare(`SELECT ${fields} FROM resumes WHERE id = ? AND user_id = ?`).get(id, userId)
}

function create(userId, title, contentJson, sourceResumeId = null, targetJobId = null) {
  const result = db.prepare(
    'INSERT INTO resumes (user_id, title, content_json, source_resume_id, target_job_id) VALUES (?, ?, ?, ?, ?)',
  ).run(userId, title, contentJson, sourceResumeId, targetJobId)
  return findByIdAndUser(result.lastInsertRowid, userId)
}

function update(id, userId, title, contentJson, status, expectedRevision) {
  const result = db.prepare(`
    UPDATE resumes
    SET title = ?, content_json = ?, status = ?, revision = revision + 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ? AND revision = ?
  `).run(title, contentJson, status, id, userId, expectedRevision)
  if (!result.changes) throw new AppError(409, '简历已更新，请重新加载后再合并修改', 'RESUME_CONFLICT')
  return findByIdAndUser(id, userId)
}

function remove(id, userId) {
  return db.prepare('DELETE FROM resumes WHERE id = ? AND user_id = ?').run(id, userId).changes
}

module.exports = { listByUser, findByIdAndUser, create, update, remove }
