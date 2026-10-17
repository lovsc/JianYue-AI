const { AppError } = require('../utils/app-error')

function notFound(req, res) {
  res.status(404).json({ success: false, data: null, message: '接口不存在', code: 'NOT_FOUND' })
}

function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || (error.type === 'entity.parse.failed' ? 400 : error.type === 'entity.too.large' ? 413 : 500)
  if (statusCode >= 500) console.error('Request failed', { status: statusCode, code: error instanceof AppError ? error.code : 'INTERNAL_ERROR' })
  res.status(statusCode).json({
    success: false,
    data: null,
    message: error instanceof AppError ? error.message : statusCode === 400 ? '请求数据格式不正确' : statusCode === 413 ? '请求内容过大' : '服务器内部错误',
    code: error instanceof AppError ? error.code : 'REQUEST_FAILED',
  })
}

module.exports = { notFound, errorHandler }
