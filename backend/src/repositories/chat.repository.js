const { db } = require('../database')

const findSession = (id, userId) => db.prepare(`SELECT s.id,s.user_id,s.resume_id,s.title,s.created_at,s.updated_at,r.title AS resume_title FROM chat_sessions s LEFT JOIN resumes r ON r.id=s.resume_id WHERE s.id=? AND s.user_id=?`).get(id, userId)
const listSessions = (userId) => db.prepare(`SELECT s.id,s.resume_id,s.title,s.created_at,s.updated_at,r.title AS resume_title,(SELECT content FROM chat_messages WHERE session_id=s.id ORDER BY id DESC LIMIT 1) AS last_message FROM chat_sessions s LEFT JOIN resumes r ON r.id=s.resume_id WHERE s.user_id=? ORDER BY s.updated_at DESC LIMIT 50`).all(userId)
function createSession(userId, resumeId, title) { const result=db.prepare('INSERT INTO chat_sessions(user_id,resume_id,title) VALUES(?,?,?)').run(userId,resumeId,title);return findSession(result.lastInsertRowid,userId) }
const deleteSession = (id,userId) => db.prepare('DELETE FROM chat_sessions WHERE id=? AND user_id=?').run(id,userId).changes
const listMessages = (sessionId, limit=100) => db.prepare('SELECT id,role,content,created_at FROM chat_messages WHERE session_id=? ORDER BY id DESC LIMIT ?').all(sessionId,limit).reverse()
function addMessage(sessionId,role,content){const result=db.prepare('INSERT INTO chat_messages(session_id,role,content) VALUES(?,?,?)').run(sessionId,role,content);db.prepare('UPDATE chat_sessions SET updated_at=CURRENT_TIMESTAMP WHERE id=?').run(sessionId);return result.lastInsertRowid}
function updateTitle(id,userId,title){db.prepare('UPDATE chat_sessions SET title=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?').run(title,id,userId)}

module.exports={findSession,listSessions,createSession,deleteSession,listMessages,addMessage,updateTitle}
