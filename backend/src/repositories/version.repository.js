const { db } = require('../database')

function nextNumber(resumeId) {
  return db.prepare('SELECT COALESCE(MAX(version_number), 0) + 1 AS value FROM resume_versions WHERE resume_id = ?').get(resumeId).value
}
function create(resume, userId, source, summary) {
  const result = db.prepare(`INSERT INTO resume_versions (resume_id, user_id, version_number, title, content_json, source, change_summary) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(resume.id, userId, nextNumber(resume.id), resume.title, resume.content_json, source, summary)
  return findByIdAndUser(result.lastInsertRowid, userId)
}
function listByResume(resumeId, userId) {
  return db.prepare(`SELECT id, resume_id, version_number, title, source, change_summary, created_at FROM resume_versions WHERE resume_id = ? AND user_id = ? ORDER BY version_number DESC`).all(resumeId, userId)
}
function findByIdAndUser(id, userId) {
  return db.prepare('SELECT * FROM resume_versions WHERE id = ? AND user_id = ?').get(id, userId)
}
const findAction = (analysisId, suggestionIndex, userId) => db.prepare('SELECT * FROM analysis_suggestion_actions WHERE analysis_id = ? AND suggestion_index = ? AND user_id = ?').get(analysisId, suggestionIndex, userId)
function createAction(analysisId, suggestionIndex, resumeId, userId, targetPath, versionId) {
  return db.prepare('INSERT INTO analysis_suggestion_actions (analysis_id, suggestion_index, resume_id, user_id, target_path, version_id) VALUES (?, ?, ?, ?, ?, ?)').run(analysisId, suggestionIndex, resumeId, userId, targetPath, versionId)
}
const listActions = (analysisId, userId) => db.prepare('SELECT suggestion_index, target_path, created_at FROM analysis_suggestion_actions WHERE analysis_id = ? AND user_id = ?').all(analysisId, userId)

module.exports = { create, listByResume, findByIdAndUser, findAction, createAction, listActions }
