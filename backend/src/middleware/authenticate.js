const jwt = require('jsonwebtoken')
const { env } = require('../config/env')
const { AppError } = require('../utils/app-error')

function authenticate(req, _res, next) {
  const [scheme, token] = String(req.headers.authorization || '').split(' ')
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, '请先登录', 'UNAUTHORIZED'))
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret)
    req.user = { id: Number(payload.sub), username: payload.username }
    next()
  } catch (_error) {
    next(new AppError(401, '登录状态已失效，请重新登录', 'TOKEN_INVALID'))
  }
}

module.exports = { authenticate }
