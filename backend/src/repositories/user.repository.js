const { db } = require('../database')

const publicFields = 'id, username, display_name, email, bio, location, created_at, updated_at'

function findByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username)
}

function findPublicById(id) {
  return db.prepare(`SELECT ${publicFields} FROM users WHERE id = ?`).get(id)
}

function create(username, passwordHash) {
  const result = db
    .prepare('INSERT INTO users (username, password) VALUES (?, ?)')
    .run(username, passwordHash)
  return findPublicById(result.lastInsertRowid)
}

function updatePassword(id, passwordHash) {
  db.prepare("UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(passwordHash, id)
}

function updateProfile(id, profile) {
  db.prepare(`UPDATE users SET display_name = ?, email = ?, bio = ?, location = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(profile.displayName, profile.email, profile.bio, profile.location, id)
  return findPublicById(id)
}

module.exports = { findByUsername, findPublicById, create, updatePassword, updateProfile }
