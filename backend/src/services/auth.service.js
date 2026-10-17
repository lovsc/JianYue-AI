const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const users = require('../repositories/user.repository')
const { env } = require('../config/env')
const { AppError } = require('../utils/app-error')

function normalizeCredentials(username, password) {
  const normalizedUsername = String(username || '').trim()
  const normalizedPassword = String(password || '')

  if (normalizedUsername.length < 3 || normalizedUsername.length > 20) {
    throw new AppError(400, '用户名长度应为 3 到 20 个字符', 'VALIDATION_ERROR')
  }
  if (normalizedPassword.length < 6 || Buffer.byteLength(normalizedPassword, 'utf8') > 72 || !normalizedPassword.trim()) {
    throw new AppError(400, '密码至少 6 个字符，且不能超过 72 字节或全部为空格', 'VALIDATION_ERROR')
  }
  return { username: normalizedUsername, password: normalizedPassword }
}

function createToken(user) {
  return jwt.sign({ sub: String(user.id), username: user.username }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  })
}

async function register(input) {
  const { username, password } = normalizeCredentials(input.username, input.password)
  if (users.findByUsername(username)) {
    throw new AppError(409, '用户名已存在', 'USERNAME_EXISTS')
  }
  const passwordHash = await bcrypt.hash(password, 12)
  try {
    return { user: users.create(username, passwordHash) }
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') throw new AppError(409, '用户名已存在', 'USERNAME_EXISTS')
    throw error
  }
}

async function login(input) {
  const { username, password } = normalizeCredentials(input.username, input.password)
  const userRecord = users.findByUsername(username)
  if (!userRecord) throw new AppError(401, '用户名或密码错误', 'INVALID_CREDENTIALS')

  const usesHash = userRecord.password.startsWith('$2')
  const valid = usesHash
    ? await bcrypt.compare(password, userRecord.password)
    : password === userRecord.password

  if (!valid) throw new AppError(401, '用户名或密码错误', 'INVALID_CREDENTIALS')

  if (!usesHash) {
    users.updatePassword(userRecord.id, await bcrypt.hash(password, 12))
  }
  const user = users.findPublicById(userRecord.id)
  return { user, token: createToken(user) }
}

module.exports = { register, login }
