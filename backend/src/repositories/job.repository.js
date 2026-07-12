const { db } = require('../database')

const fields = 'id, user_id, company, position, content, created_at, updated_at'
const findByIdAndUser = (id, userId) => db.prepare(`SELECT ${fields} FROM job_descriptions WHERE id = ? AND user_id = ?`).get(id, userId)
const listByUser = (userId) => db.prepare(`SELECT ${fields} FROM job_descriptions WHERE user_id = ? ORDER BY updated_at DESC`).all(userId)
function create(userId, company, position, content) {
  const result = db.prepare('INSERT INTO job_descriptions (user_id, company, position, content) VALUES (?, ?, ?, ?)').run(userId, company, position, content)
  return findByIdAndUser(result.lastInsertRowid, userId)
}
function update(id, userId, company, position, content) {
  db.prepare('UPDATE job_descriptions SET company = ?, position = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?').run(company, position, content, id, userId)
  return findByIdAndUser(id, userId)
}
const remove = (id, userId) => db.prepare('DELETE FROM job_descriptions WHERE id = ? AND user_id = ?').run(id, userId).changes

module.exports = { findByIdAndUser, listByUser, create, update, remove }
