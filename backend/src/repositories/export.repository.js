const { db } = require('../database')

function create(userId, resumeId, template) {
  const result = db.prepare('INSERT INTO export_records (user_id, resume_id, template) VALUES (?, ?, ?)').run(userId, resumeId, template)
  return db.prepare(`SELECT e.id, e.resume_id, e.template, e.format, e.created_at, r.title AS resume_title FROM export_records e JOIN resumes r ON r.id=e.resume_id WHERE e.id=? AND e.user_id=?`).get(result.lastInsertRowid, userId)
}
function list(userId) {
  return db.prepare(`SELECT e.id, e.resume_id, e.template, e.format, e.created_at, r.title AS resume_title FROM export_records e JOIN resumes r ON r.id=e.resume_id WHERE e.user_id=? ORDER BY e.created_at DESC LIMIT 50`).all(userId)
}

module.exports = { create, list }
