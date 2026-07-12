const path = require('path')

const env = {
  port: Number(process.env.PORT || 3000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'development-only-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  databasePath: path.resolve(__dirname, '../../', process.env.DATABASE_PATH || 'database.db'),
  doubaoApiKey: process.env.DOUBAO_API_KEY || '',
  doubaoModelEndpoint: process.env.DOUBAO_MODEL_ENDPOINT || '',
  doubaoChatThinking: process.env.DOUBAO_CHAT_THINKING || 'disabled',
  doubaoChatMaxTokens: Number(process.env.DOUBAO_CHAT_MAX_TOKENS || 1200),
}

if (process.env.NODE_ENV === 'production' && env.jwtSecret === 'development-only-change-me') {
  throw new Error('JWT_SECRET must be configured in production')
}

module.exports = { env }
