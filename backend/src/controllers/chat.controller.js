const chatService = require('../services/chat.service')
const { AppError } = require('../utils/app-error')

async function stream(req, res) {
  const messages = req.body?.messages
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
    throw new AppError(400, '消息列表格式不正确', 'VALIDATION_ERROR')
  }
  const normalized = messages.map(({ role, content }) => ({
    role,
    content: String(content || '').slice(0, 10000),
  }))
  if (normalized.some((item) => !['user', 'assistant', 'system'].includes(item.role) || !item.content)) {
    throw new AppError(400, '消息内容格式不正确', 'VALIDATION_ERROR')
  }

  const response = await chatService.createChatStream(normalized)
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  response.data.pipe(res)
  response.data.on('error', () => res.end())
}

module.exports = { stream }
