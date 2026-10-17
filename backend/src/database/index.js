const Database = require('better-sqlite3')
const { env } = require('../config/env')

require('fs').mkdirSync(require('path').dirname(env.databasePath), { recursive: true })
const db = new Database(env.databasePath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  const columns = db.prepare('PRAGMA table_info(users)').all()
  if (!columns.some((column) => column.name === 'created_at')) {
    db.exec('ALTER TABLE users ADD COLUMN created_at TEXT')
    db.exec("UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL")
  }
  if (!columns.some((column) => column.name === 'updated_at')) {
    db.exec('ALTER TABLE users ADD COLUMN updated_at TEXT')
    db.exec("UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL")
  }
  if (!columns.some((column) => column.name === 'display_name')) db.exec("ALTER TABLE users ADD COLUMN display_name TEXT NOT NULL DEFAULT ''")
  if (!columns.some((column) => column.name === 'email')) db.exec("ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT ''")
  if (!columns.some((column) => column.name === 'bio')) db.exec("ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT ''")
  if (!columns.some((column) => column.name === 'location')) db.exec("ALTER TABLE users ADD COLUMN location TEXT NOT NULL DEFAULT ''")

  db.exec(`
    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content_json TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_resumes_user_updated
      ON resumes(user_id, updated_at DESC);

    CREATE TABLE IF NOT EXISTS job_descriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      company TEXT NOT NULL DEFAULT '',
      position TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_jobs_user_updated
      ON job_descriptions(user_id, updated_at DESC);

    CREATE TABLE IF NOT EXISTS resume_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      resume_id INTEGER NOT NULL,
      job_description_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      result_json TEXT NOT NULL,
      model TEXT NOT NULL DEFAULT '',
      duration_ms INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
      FOREIGN KEY (job_description_id) REFERENCES job_descriptions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_analyses_user_created
      ON resume_analyses(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS resume_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resume_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      version_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      content_json TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'manual',
      change_summary TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(resume_id, version_number)
    );
    CREATE INDEX IF NOT EXISTS idx_versions_resume_created
      ON resume_versions(resume_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS analysis_suggestion_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_id INTEGER NOT NULL,
      suggestion_index INTEGER NOT NULL,
      resume_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      target_path TEXT NOT NULL,
      version_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (analysis_id) REFERENCES resume_analyses(id) ON DELETE CASCADE,
      FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (version_id) REFERENCES resume_versions(id) ON DELETE CASCADE,
      UNIQUE(analysis_id, suggestion_index)
    );

    CREATE TABLE IF NOT EXISTS export_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      resume_id INTEGER NOT NULL,
      template TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'pdf',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_exports_user_created
      ON export_records(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      resume_id INTEGER,
      title TEXT NOT NULL DEFAULT '新对话',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_updated
      ON chat_sessions(user_id, updated_at DESC);

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user','assistant')),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id
      ON chat_messages(session_id, id ASC);
  `)

  const resumeColumns = db.prepare('PRAGMA table_info(resumes)').all().map(column => column.name)
  if (!resumeColumns.includes('revision')) db.exec('ALTER TABLE resumes ADD COLUMN revision INTEGER NOT NULL DEFAULT 1')
  if (!resumeColumns.includes('source_resume_id')) db.exec('ALTER TABLE resumes ADD COLUMN source_resume_id INTEGER REFERENCES resumes(id) ON DELETE SET NULL')
  if (!resumeColumns.includes('target_job_id')) db.exec('ALTER TABLE resumes ADD COLUMN target_job_id INTEGER REFERENCES job_descriptions(id) ON DELETE SET NULL')
}

module.exports = { db, initializeDatabase }
