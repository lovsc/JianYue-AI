const { db } = require('../database')

function create(userId, resumeId, jobId, resultJson, model, durationMs) {
  const result = db.prepare(`INSERT INTO resume_analyses (user_id, resume_id, job_description_id, result_json, model, duration_ms) VALUES (?, ?, ?, ?, ?, ?)`).run(userId, resumeId, jobId, resultJson, model, durationMs)
  return findByIdAndUser(result.lastInsertRowid, userId)
}
function findByIdAndUser(id, userId) {
  return db.prepare(`
    SELECT a.*, r.title AS resume_title, j.position, j.company
    FROM resume_analyses a
    JOIN resumes r ON r.id = a.resume_id
    JOIN job_descriptions j ON j.id = a.job_description_id
    WHERE a.id = ? AND a.user_id = ?
  `).get(id, userId)
}
function listByUser(userId) {
  return db.prepare(`
    SELECT a.id, a.resume_id, a.job_description_id, a.status, a.duration_ms, a.created_at,
           COALESCE(json_extract(a.result_json, '$.sourceSnapshot.title'), r.title) AS resume_title,
           COALESCE(json_extract(a.result_json, '$.sourceSnapshot.job.position'), j.position) AS position,
           COALESCE(json_extract(a.result_json, '$.sourceSnapshot.job.company'), j.company) AS company,
           json_extract(a.result_json, '$.score') AS score
    FROM resume_analyses a
    JOIN resumes r ON r.id = a.resume_id
    JOIN job_descriptions j ON j.id = a.job_description_id
    WHERE a.user_id = ? ORDER BY a.created_at DESC LIMIT 50
  `).all(userId)
}

module.exports = { create, findByIdAndUser, listByUser }
