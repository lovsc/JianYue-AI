class AppError extends Error {
  constructor(statusCode, message, code = 'REQUEST_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
  }
}

module.exports = { AppError }
