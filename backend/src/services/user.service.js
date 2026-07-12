const bcrypt = require('bcryptjs')
const users = require('../repositories/user.repository')
const { AppError } = require('../utils/app-error')

function updateProfile(userId, input) {
  const displayName = String(input.displayName || '').trim().slice(0, 40)
  const email = String(input.email || '').trim().toLowerCase().slice(0, 120)
  const bio = String(input.bio || '').trim().slice(0, 300)
  const location = String(input.location || '').trim().slice(0, 80)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError(400, '邮箱格式不正确', 'VALIDATION_ERROR')
  }
  return users.updateProfile(userId, { displayName, email, bio, location })
}

async function changePassword(userId, input) {
  const currentPassword = String(input.currentPassword || '')
  const newPassword = String(input.newPassword || '')
  if (newPassword.length < 8 || newPassword.length > 72) {
    throw new AppError(400, '新密码长度应为 8 到 72 个字符', 'VALIDATION_ERROR')
  }
  if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    throw new AppError(400, '新密码必须同时包含字母和数字', 'PASSWORD_TOO_WEAK')
  }
  const user = users.findPublicById(userId)
  const privateUser = users.findByUsername(user.username)
  const valid = privateUser.password.startsWith('$2')
    ? await bcrypt.compare(currentPassword, privateUser.password)
    : currentPassword === privateUser.password
  if (!valid) throw new AppError(400, '当前密码不正确', 'CURRENT_PASSWORD_INVALID')
  if (await bcrypt.compare(newPassword, privateUser.password).catch(() => false)) {
    throw new AppError(400, '新密码不能与当前密码相同', 'PASSWORD_UNCHANGED')
  }
  users.updatePassword(userId, await bcrypt.hash(newPassword, 12))
}

module.exports = { updateProfile, changePassword }
