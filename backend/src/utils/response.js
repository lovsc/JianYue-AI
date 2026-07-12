function success(res, data = null, message = '操作成功', statusCode = 200) {
  return res.status(statusCode).json({ success: true, data, message })
}

module.exports = { success }
