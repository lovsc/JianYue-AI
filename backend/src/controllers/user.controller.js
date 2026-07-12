const service = require('../services/user.service')
const { success } = require('../utils/response')

function updateProfile(req, res) { success(res, { user: service.updateProfile(req.user.id, req.body || {}) }, '个人资料保存成功') }
async function changePassword(req, res) { await service.changePassword(req.user.id, req.body || {}); success(res, null, '密码修改成功，请重新登录') }

module.exports = { updateProfile, changePassword }
