const exportsRepository = require('../repositories/export.repository')
const resumeService = require('../services/resume.service')
const { AppError } = require('../utils/app-error')
const { success } = require('../utils/response')

function list(req, res) { success(res, { exports: exportsRepository.list(req.user.id) }, '获取导出记录成功') }
function create(req, res) {
  const resumeId = Number(req.body?.resumeId)
  const template = String(req.body?.template || '')
  resumeService.get(resumeId, req.user.id)
  if (!['classic', 'modern'].includes(template)) throw new AppError(400, '导出模板不存在', 'INVALID_TEMPLATE')
  success(res, { export: exportsRepository.create(req.user.id, resumeId, template) }, '导出记录已创建', 201)
}

module.exports = { list, create }
