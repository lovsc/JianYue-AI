const { db } = require('../database')

const fields = 'id, user_id, title, content_json, status, created_at, updated_at'

function listByUser(userId) {
  return db.prepare(`SELECT ${fields} FROM resumes WHERE user_id = ? ORDER BY updated_at DESC`).all(userId)
}

function findByIdAndUser(id, userId) {
  return db.prepare(`SELECT ${fields} FROM resumes WHERE id = ? AND user_id = ?`).get(id, userId)
}

function create(userId, title, contentJson) {
  const result = db.prepare(
    'INSERT INTO resumes (user_id, title, content_json) VALUES (?, ?, ?)',
  ).run(userId, title, contentJson)
  return findByIdAndUser(result.lastInsertRowid, userId)
}

function update(id, userId, title, contentJson, status) {
  db.prepare(`
    UPDATE resumes
    SET title = ?, content_json = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(title, contentJson, status, id, userId)
  return findByIdAndUser(id, userId)
}

function remove(id, userId) {
  return db.prepare('DELETE FROM resumes WHERE id = ? AND user_id = ?').run(id, userId).changes
}

module.exports = { listByUser, findByIdAndUser, create, update, remove }
