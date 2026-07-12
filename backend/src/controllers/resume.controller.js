const resumeService = require('../services/resume.service')
const { success } = require('../utils/response')

function list(req, res) {
  success(res, { resumes: resumeService.list(req.user.id) }, '获取简历列表成功')
}

function get(req, res) {
  success(res, { resume: resumeService.get(Number(req.params.id), req.user.id) }, '获取简历成功')
}

function create(req, res) {
  const resume = resumeService.create(req.body || {}, req.user.id)
  success(res, { resume }, '简历创建成功', 201)
}

function update(req, res) {
  const resume = resumeService.update(Number(req.params.id), req.body || {}, req.user.id)
  success(res, { resume }, '简历保存成功')
}

function remove(req, res) {
  resumeService.remove(Number(req.params.id), req.user.id)
  success(res, null, '简历删除成功')
}

module.exports = { list, get, create, update, remove }
