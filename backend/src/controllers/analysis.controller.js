const service = require('../services/analysis.service')
const { success } = require('../utils/response')
const versionService = require('../services/version.service')

const list = (req, res) => success(res, { analyses: service.list(req.user.id) }, '获取分析记录成功')
const get = (req, res) => {
  const id = Number(req.params.id)
  success(res, { analysis: service.get(id, req.user.id), appliedSuggestions: versionService.listActions(id, req.user.id) }, '获取分析报告成功')
}
const run = async (req, res) => success(res, { analysis: await service.run(req.body || {}, req.user.id) }, '分析完成', 201)

module.exports = { list, get, run }
