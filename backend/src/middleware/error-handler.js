function notFound(req, res) {
  res.status(404).json({ success: false, data: null, message: '接口不存在', code: 'NOT_FOUND' })
}

function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500
  if (statusCode >= 500) console.error(error)
  res.status(statusCode).json({
    success: false,
    data: null,
    message: statusCode >= 500 ? '服务器内部错误' : error.message,
    code: error.code || 'INTERNAL_ERROR',
  })
}

module.exports = { notFound, errorHandler }
