const authService = require('../services/auth.service')
const users = require('../repositories/user.repository')
const { success } = require('../utils/response')

async function register(req, res) {
  const result = await authService.register(req.body || {})
  success(res, result, '注册成功', 201)
}

async function login(req, res) {
  const result = await authService.login(req.body || {})
  success(res, result, '登录成功')
}

function me(req, res) {
  success(res, { user: users.findPublicById(req.user.id) }, '获取用户信息成功')
}

module.exports = { register, login, me }
