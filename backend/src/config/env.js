const path = require('path')
const isProduction = process.env.NODE_ENV === 'production'
let releaseSha = null
try {
  const release = require('fs').readFileSync(path.resolve(__dirname, '../../../release.json'), 'utf8')
  const sha = JSON.parse(release).commitSha
  if (/^[a-f0-9]{40}$/.test(sha)) releaseSha = sha
} catch { /* Source checkouts and older releases do not contain release metadata. */ }

const env = {
  port: Number(process.env.PORT || 3000),
  releaseSha,
  host: process.env.HOST || (isProduction ? '127.0.0.1' : '0.0.0.0'),
  trustProxy: process.env.TRUST_PROXY === 'loopback' ? 'loopback' : false,
  serveFrontend: (process.env.SERVE_FRONTEND || String(isProduction)) === 'true',
  frontendDist: path.resolve(__dirname, '../../../', process.env.FRONTEND_DIST || 'frontend/dist'),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'development-only-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  databasePath: path.resolve(__dirname, '../../', process.env.DATABASE_PATH || 'database.db'),
  doubaoApiKey: process.env.DOUBAO_API_KEY || '',
  doubaoModelEndpoint: process.env.DOUBAO_MODEL_ENDPOINT || '',
  doubaoChatThinking: process.env.DOUBAO_CHAT_THINKING || 'disabled',
  doubaoChatMaxTokens: Number(process.env.DOUBAO_CHAT_MAX_TOKENS || 1200),
  aiRateLimitMax: Number(process.env.AI_RATE_LIMIT_MAX || 20),
}

if (isProduction && (env.jwtSecret.length < 32 || /^(development-only|replace-with)/.test(env.jwtSecret))) {
  throw new Error('JWT_SECRET must be a random secret of at least 32 characters in production')
}
if (!Number.isInteger(env.aiRateLimitMax) || env.aiRateLimitMax < 1) {
  throw new Error('AI_RATE_LIMIT_MAX must be a positive integer')
}

module.exports = { env }
