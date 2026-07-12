const axios = require('axios')
const { env } = require('../config/env')
const resumes = require('./resume.service')
const jobs = require('./job.service')
const analyses = require('../repositories/analysis.repository')
const { AppError } = require('../utils/app-error')

const systemPrompt = `你是一名严谨的中文招聘顾问和 ATS 简历优化专家。请比较候选人简历与目标岗位，只输出合法 JSON，不要 Markdown。输出结构必须为：{"score":0到100的整数,"summary":"总体判断","strengths":["优势"],"gaps":[{"keyword":"缺失或薄弱项","importance":"high或medium或low","advice":"行动建议"}],"keywords":{"matched":["已匹配"],"missing":["缺失"]},"suggestions":[{"section":"简历模块","original":"原内容或空字符串","optimized":"建议改写","reason":"原因"}],"interviewQuestions":["面试准备题"]}。基于输入事实分析，不得编造候选人经历；建议应具体、可执行。`

function parseModelJson(text) {
  const cleaned = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const start = cleaned.indexOf('{'), end = cleaned.lastIndexOf('}')
  if (start < 0 || end <= start) throw new AppError(502, 'AI 返回结果无法解析，请重试', 'AI_INVALID_RESPONSE')
  try { return JSON.parse(cleaned.slice(start, end + 1)) } catch { throw new AppError(502, 'AI 返回结果格式异常，请重试', 'AI_INVALID_RESPONSE') }
}

function normalizeResult(value) {
  return {
    score: Math.max(0, Math.min(100, Math.round(Number(value.score) || 0))),
    summary: String(value.summary || '暂无总结'),
    strengths: Array.isArray(value.strengths) ? value.strengths.slice(0, 8).map(String) : [],
    gaps: Array.isArray(value.gaps) ? value.gaps.slice(0, 12).map(item => ({ keyword: String(item.keyword || ''), importance: ['high','medium','low'].includes(item.importance) ? item.importance : 'medium', advice: String(item.advice || '') })) : [],
    keywords: { matched: Array.isArray(value.keywords?.matched) ? value.keywords.matched.slice(0, 30).map(String) : [], missing: Array.isArray(value.keywords?.missing) ? value.keywords.missing.slice(0, 30).map(String) : [] },
    suggestions: Array.isArray(value.suggestions) ? value.suggestions.slice(0, 12).map(item => ({ section: String(item.section || ''), original: String(item.original || ''), optimized: String(item.optimized || ''), reason: String(item.reason || '') })) : [],
    interviewQuestions: Array.isArray(value.interviewQuestions) ? value.interviewQuestions.slice(0, 10).map(String) : [],
  }
}

async function run(input, userId) {
  if (!env.doubaoApiKey || !env.doubaoModelEndpoint) throw new AppError(503, 'AI 服务尚未配置', 'AI_NOT_CONFIGURED')
  const resume = resumes.get(Number(input.resumeId), userId)
  const job = jobs.get(Number(input.jobId), userId)
  const startedAt = Date.now()
  let response
  try {
    response = await axios.post('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      model: env.doubaoModelEndpoint,
      temperature: 0.2,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: JSON.stringify({ resume: resume.content, targetJob: job }) }],
    }, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.doubaoApiKey}` }, timeout: 120000 })
  } catch (error) {
    console.error('AI analysis failed:', error.response?.status || error.message)
    throw new AppError(502, 'AI 分析暂时失败，请稍后重试', 'AI_REQUEST_FAILED')
  }
  const result = normalizeResult(parseModelJson(response.data?.choices?.[0]?.message?.content))
  return parseAnalysis(analyses.create(userId, resume.id, job.id, JSON.stringify(result), env.doubaoModelEndpoint, Date.now() - startedAt))
}

function parseAnalysis(row) { if (!row) return null; const { result_json, user_id: _ignored, model: _model, ...rest } = row; return { ...rest, result: JSON.parse(result_json) } }
const list = (userId) => analyses.listByUser(userId)
function get(id, userId) { const row = analyses.findByIdAndUser(id, userId); if (!row) throw new AppError(404, '分析报告不存在', 'ANALYSIS_NOT_FOUND'); return parseAnalysis(row) }

module.exports = { run, list, get }
