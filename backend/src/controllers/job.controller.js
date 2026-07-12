const service = require('../services/job.service')
const { success } = require('../utils/response')

const list = (req, res) => success(res, { jobs: service.list(req.user.id) }, '获取目标岗位成功')
const get = (req, res) => success(res, { job: service.get(Number(req.params.id), req.user.id) }, '获取目标岗位成功')
const create = (req, res) => success(res, { job: service.create(req.body || {}, req.user.id) }, '目标岗位创建成功', 201)
const update = (req, res) => success(res, { job: service.update(Number(req.params.id), req.body || {}, req.user.id) }, '目标岗位保存成功')
const remove = (req, res) => { service.remove(Number(req.params.id), req.user.id); success(res, null, '目标岗位删除成功') }

module.exports = { list, get, create, update, remove }
