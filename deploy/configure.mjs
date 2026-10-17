import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const options = new Map()
for (let i = 0; i < args.length; i += 2) {
  if (!['--origin', '--data-dir'].includes(args[i]) || !args[i + 1]) {
    throw new Error('Usage: node deploy/configure.mjs --origin https://your-domain --data-dir /absolute/data/path')
  }
  options.set(args[i], args[i + 1])
}
const origin = new URL(options.get('--origin') || 'https://octopush5.com')
if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
  throw new Error('Origin must be a bare HTTPS origin without a path or credentials')
}
const dataDir = options.get('--data-dir') || path.join(root, 'data')
if (!path.isAbsolute(dataDir) || /[\r\n"]/.test(dataDir)) throw new Error('Data directory must be an absolute path')
const envFile = path.join(root, 'backend', '.env')
if (fs.existsSync(envFile)) throw new Error('backend/.env already exists; preserved without changes. Edit it in the server panel.')
fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 })
const databasePath = path.join(dataDir, 'resume.db').replaceAll('\\', '/')
const content = [
  'NODE_ENV=production', 'HOST=127.0.0.1', 'PORT=3000', 'TRUST_PROXY=loopback',
  'SERVE_FRONTEND=true', `CLIENT_ORIGIN=${origin.origin}`,
  `DATABASE_PATH="${databasePath}"`, `JWT_SECRET=${crypto.randomBytes(48).toString('hex')}`,
  'JWT_EXPIRES_IN=7d', 'DOUBAO_API_KEY=', 'DOUBAO_MODEL_ENDPOINT=',
  'DOUBAO_CHAT_THINKING=disabled', 'DOUBAO_CHAT_MAX_TOKENS=1200', 'AI_RATE_LIMIT_MAX=20', '',
].join('\n')
fs.writeFileSync(envFile, content, { flag: 'wx', mode: 0o600 })
console.log('Created backend/.env with a new JWT secret. No existing user database was copied.')
console.log('Set DOUBAO_API_KEY and DOUBAO_MODEL_ENDPOINT in the server panel before testing AI.')
