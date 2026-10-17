const axios = require('axios')
const { env } = require('../config/env')
const resumes = require('./resume.service')
const jobs = require('./job.service')
const analyses = require('../repositories/analysis.repository')
const { AppError } = require('../utils/app-error')
const { db } = require('../database')
const resumeRepo = require('../repositories/resume.repository')

const systemPrompt = `你是一名严谨的中文招聘顾问和 ATS 简历优化专家。请比较候选人简历与目标岗位，只输出合法 JSON，不要 Markdown。输出结构必须为：{"score":0到100的整数,"summary":"总体判断","strengths":["优势"],"gaps":[{"keyword":"缺失或薄弱项","importance":"high或medium或low","advice":"行动建议"}],"keywords":{"matched":["已匹配"],"missing":["缺失"]},"suggestions":[{"section":"简历模块","original":"原内容或空字符串","optimized":"建议改写","reason":"原因"}],"interviewQuestions":["面试准备题"]}。基于输入事实分析，不得编造候选人经历；建议应具体、可执行。`

function parseModelJson(text) {
  const cleaned = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const start = cleaned.indexOf('{'), end = cleaned.lastIndexOf('}')
  if (start < 0 || end <= start) throw new AppError(502, 'AI 返回结果无法解析，请重试', 'AI_INVALID_RESPONSE')
  try { return JSON.parse(cleaned.slice(start, end + 1)) } catch { throw new AppError(502, 'AI 返回结果格式异常，请重试', 'AI_INVALID_RESPONSE') }
}

function normalizeResult(value) {
  if (!value || typeof value !== 'object' || !Number.isFinite(value.score) || typeof value.summary !== 'string' || !Array.isArray(value.suggestions)) throw new AppError(502, 'AI 返回结果不完整，请重试', 'AI_INVALID_RESPONSE')
  return {
    score: Math.max(0, Math.min(100, Math.round(Number(value.score) || 0))),
    summary: String(value.summary || '暂无总结'),
    strengths: Array.isArray(value.strengths) ? value.strengths.slice(0, 8).map(String) : [],
    gaps: Array.isArray(value.gaps) ? value.gaps.filter(item => item && typeof item === 'object').slice(0, 12).map(item => ({ keyword: String(item.keyword || ''), importance: ['high','medium','low'].includes(item.importance) ? item.importance : 'medium', advice: String(item.advice || '') })) : [],
    keywords: { matched: Array.isArray(value.keywords?.matched) ? value.keywords.matched.slice(0, 30).map(String) : [], missing: Array.isArray(value.keywords?.missing) ? value.keywords.missing.slice(0, 30).map(String) : [] },
    suggestions: value.suggestions.filter(item => item && typeof item === 'object').slice(0, 12).map(item => ({ section: String(item.section || ''), original: String(item.original || ''), optimized: String(item.optimized || ''), reason: String(item.reason || '') })),
    interviewQuestions: Array.isArray(value.interviewQuestions) ? value.interviewQuestions.slice(0, 10).map(String) : [],
  }
}

function bindSuggestions(result, content) {
  const fields = [{ path: 'basics.summary', text: content.basics?.summary || '' }]
  for (const key of ['education', 'experience', 'projects']) (content[key] || []).forEach((item, index) => fields.push({ path: `${key}.${index}.description`, text: item.description || '' }))
  result.suggestions = result.suggestions.map(item => {
    const matches = item.original ? fields.filter(field => field.text.includes(item.original) && field.text.indexOf(item.original) === field.text.lastIndexOf(item.original)) : []
    return { ...item, targetPath: matches.length === 1 ? matches[0].path : null }
  })
  const evidenceFields = []
  for (const [key, text] of Object.entries(content.basics || {})) if (key !== 'photo' && typeof text === 'string') evidenceFields.push({ path: `basics.${key}`, text })
  for (const key of ['education', 'experience', 'projects']) (content[key] || []).forEach((item, index) => {
    for (const [field, text] of Object.entries(item)) if (typeof text === 'string') evidenceFields.push({ path: `${key}.${index}.${field}`, text })
  })
  for (const [index, text] of (content.skills || []).entries()) evidenceFields.push({ path: `skills.${index}`, text })
  const all = [...new Set([...result.keywords.matched, ...result.keywords.missing])].filter(Boolean)
  const matchesKeyword = word => evidenceFields.some(field => field.text.toLowerCase().includes(word.toLowerCase()))
  result.keywords = { matched: all.filter(matchesKeyword), missing: all.filter(word => !matchesKeyword(word)) }
  result.evidence = result.keywords.matched.map(keyword => {
    const field = evidenceFields.find(item => item.text.toLowerCase().includes(keyword.toLowerCase()))
    return { keyword, path: field.path, excerpt: field.text.slice(Math.max(0, field.text.toLowerCase().indexOf(keyword.toLowerCase()) - 30), field.text.toLowerCase().indexOf(keyword.toLowerCase()) + keyword.length + 60) }
  })
  result.scoreExplanation = '匹配分是 AI 基于本次简历与岗位快照的综合判断，并非录用概率；关键词覆盖按原文核验，优势与差距请结合实际经历判断。'
  return result
}

async function run(input, userId) {
  if (!env.doubaoApiKey || !env.doubaoModelEndpoint) throw new AppError(503, 'AI 服务尚未配置', 'AI_NOT_CONFIGURED')
  const resume = resumes.get(Number(input.resumeId), userId)
  const job = jobs.get(Number(input.jobId), userId)
  const { photo: _photo, ...textBasics } = resume.content.basics || {}
  const modelContent = { ...resume.content, basics: textBasics }
  const startedAt = Date.now()
  let response
  try {
    response = await axios.post('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      model: env.doubaoModelEndpoint,
      temperature: 0.2,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: JSON.stringify({ resume: modelContent, targetJob: job }) }],
    }, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.doubaoApiKey}` }, timeout: 120000 })
  } catch (error) {
    console.error('AI analysis failed', { status: error.response?.status || null })
    throw new AppError(502, 'AI 分析暂时失败，请稍后重试', 'AI_REQUEST_FAILED')
  }
  const result = bindSuggestions(normalizeResult(parseModelJson(response.data?.choices?.[0]?.message?.content)), resume.content)
  result.sourceSnapshot = { content: resume.content, title: resume.title, resumeId: resume.id, revision: resume.revision, job: { position: job.position, company: job.company, content: job.content } }
  return db.transaction(() => {
    resumes.assertRevision(resumes.get(resume.id, userId), resume.revision)
    let targetId = resume.id
    if (input.createVariant === true) {
      targetId = resumeRepo.create(userId, `${job.position} · ${resume.title}`.slice(0, 80), JSON.stringify(resume.content), resume.source_resume_id || resume.id, job.id).id
    }
    return parseAnalysis(analyses.create(userId, targetId, job.id, JSON.stringify(result), env.doubaoModelEndpoint, Date.now() - startedAt))
  })()
}

function parseAnalysis(row) {
  if (!row) return null
  const { result_json, user_id: _ignored, model: _model, ...rest } = row
  const result = JSON.parse(result_json)
  return { ...rest, ...(result.sourceSnapshot ? { resume_title: result.sourceSnapshot.title, position: result.sourceSnapshot.job.position, company: result.sourceSnapshot.job.company } : {}), result }
}
const list = (userId) => analyses.listByUser(userId)
function get(id, userId) { const row = analyses.findByIdAndUser(id, userId); if (!row) throw new AppError(404, '分析报告不存在', 'ANALYSIS_NOT_FOUND'); return parseAnalysis(row) }

module.exports = { run, list, get, normalizeResult, bindSuggestions }
