const axios = require('axios')
const { env } = require('../config/env')
const { AppError } = require('../utils/app-error')

async function createChatStream(messages) {
  if (!env.doubaoApiKey || !env.doubaoModelEndpoint) {
    throw new AppError(503, 'AI 服务尚未配置', 'AI_NOT_CONFIGURED')
  }
  const url = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
  const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.doubaoApiKey}`,
      },
      responseType: 'stream',
      timeout: 120000,
    }
  const payload = {
    model: env.doubaoModelEndpoint,
    messages,
    stream: true,
    max_tokens: env.doubaoChatMaxTokens,
    thinking: { type: env.doubaoChatThinking },
  }
  try {
    return await axios.post(url, payload, config)
  } catch (error) {
    // Older endpoints may not support the thinking parameter. Retry once without it.
    if (error.response?.status === 400) {
      const { thinking: _ignored, ...fallbackPayload } = payload
      return axios.post(url, fallbackPayload, config)
    }
    throw error
  }
}

module.exports = { createChatStream }
