const service = require('../services/version.service')
const { success } = require('../utils/response')

const list = (req, res) => success(res, { versions: service.list(Number(req.params.id), req.user.id) }, '获取版本历史成功')
const create = (req, res) => success(res, { version: service.createManual(Number(req.params.id), req.body || {}, req.user.id) }, '版本快照创建成功', 201)
const restore = (req, res) => success(res, { resume: service.restore(Number(req.params.id), Number(req.params.versionId), req.user.id) }, '历史版本恢复成功')
const applySuggestion = (req, res) => success(res, { resume: service.applySuggestion(Number(req.params.id), req.body || {}, req.user.id) }, '优化建议已采纳')

module.exports = { list, create, restore, applySuggestion }
