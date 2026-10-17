const { db } = require('../database')
const resumeRepo = require('../repositories/resume.repository')
const versions = require('../repositories/version.repository')
const analyses = require('../repositories/analysis.repository')
const resumeService = require('./resume.service')
const { AppError } = require('../utils/app-error')

function list(resumeId, userId) {
  resumeService.get(resumeId, userId)
  return versions.listByResume(resumeId, userId)
}

const createManual = db.transaction((resumeId, input, userId) => {
  const current = resumeRepo.findByIdAndUser(resumeId, userId)
  if (!current) throw new AppError(404, '简历不存在', 'RESUME_NOT_FOUND')
  resumeService.assertRevision(current, input.expectedRevision)
  const summary = String(input.summary || '手动保存的重要版本').trim().slice(0, 100)
  return versions.create(current, userId, 'manual', summary)
})

const restoreTransaction = db.transaction((version, current, userId) => {
  versions.create(current, userId, 'before_restore', `恢复到版本 V${version.version_number} 前的自动备份`)
  return resumeRepo.update(current.id, userId, version.title, version.content_json, 'draft', current.revision)
})
function get(resumeId, versionId, userId) {
  resumeService.get(resumeId, userId)
  const version = versions.findByIdAndUser(versionId, userId)
  if (!version || version.resume_id !== resumeId) throw new AppError(404, '简历版本不存在', 'VERSION_NOT_FOUND')
  const { content_json, user_id, ...publicVersion } = version
  return { ...publicVersion, content: JSON.parse(content_json) }
}
function restore(resumeId, versionId, userId, expectedRevision) {
  const current = resumeRepo.findByIdAndUser(resumeId, userId)
  const version = versions.findByIdAndUser(versionId, userId)
  if (!current || !version || version.resume_id !== resumeId) throw new AppError(404, '简历版本不存在', 'VERSION_NOT_FOUND')
  resumeService.assertRevision(current, expectedRevision)
  restoreTransaction(version, current, userId)
  return resumeService.get(resumeId, userId)
}

function setAtPath(content, path, value) {
  const parts = String(path).split('.')
  const allowed = /^(basics\.summary|(education|experience|projects)\.\d+\.description)$/
  if (!allowed.test(path)) throw new AppError(400, '不支持的简历目标位置', 'INVALID_TARGET_PATH')
  let target = content
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = /^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i]
    if (target?.[key] == null) throw new AppError(400, '简历目标位置不存在', 'INVALID_TARGET_PATH')
    target = target[key]
  }
  target[parts.at(-1)] = value
}

const applyTransaction = db.transaction((analysisRow, index, targetPath, userId, expectedRevision) => {
  if (versions.findAction(analysisRow.id, index, userId)) throw new AppError(409, '该建议已经采纳', 'SUGGESTION_ALREADY_APPLIED')
  const current = resumeRepo.findByIdAndUser(analysisRow.resume_id, userId)
  if (!current) throw new AppError(404, '关联简历不存在', 'RESUME_NOT_FOUND')
  resumeService.assertRevision(current, expectedRevision)
  const result = JSON.parse(analysisRow.result_json)
  const suggestion = result.suggestions?.[index]
  if (!suggestion?.optimized) throw new AppError(404, '优化建议不存在', 'SUGGESTION_NOT_FOUND')
  const content = JSON.parse(current.content_json)
  const snapshot = result.sourceSnapshot?.content
  const atPath = (value, path) => path.split('.').reduce((target, key) => target?.[key], value)
  if (!snapshot || !suggestion.targetPath || suggestion.targetPath !== targetPath || !suggestion.original) throw new AppError(409, '该建议无法定位到分析原文，请重新分析后再采纳', 'SUGGESTION_UNBOUND')
  const previous = atPath(snapshot, targetPath)
  const actual = atPath(content, targetPath)
  const parentPath = targetPath.split('.').slice(0, -1).join('.')
  if (typeof previous !== 'string' || previous !== actual || !previous.includes(suggestion.original) ||
      (!targetPath.startsWith('basics.') && JSON.stringify(atPath(snapshot, parentPath)) !== JSON.stringify(atPath(content, parentPath)))) {
    throw new AppError(409, '该模块在分析后已变更，请重新分析，避免覆盖新内容', 'SUGGESTION_STALE')
  }
  const version = versions.create(current, userId, 'ai_apply', `采纳 AI 建议前：${suggestion.section || '简历内容'}`)
  setAtPath(content, targetPath, actual.replace(suggestion.original, () => suggestion.optimized))
  resumeRepo.update(current.id, userId, current.title, JSON.stringify(content), 'draft', current.revision)
  versions.createAction(analysisRow.id, index, current.id, userId, targetPath, version.id)
  return current.id
})
function applySuggestion(analysisId, input, userId) {
  const analysis = analyses.findByIdAndUser(analysisId, userId)
  if (!analysis) throw new AppError(404, '分析报告不存在', 'ANALYSIS_NOT_FOUND')
  if (!Number.isInteger(input.suggestionIndex) || input.suggestionIndex < 0) throw new AppError(400, '建议序号不正确', 'VALIDATION_ERROR')
  const resumeId = applyTransaction(analysis, input.suggestionIndex, String(input.targetPath || ''), userId, input.expectedRevision)
  return resumeService.get(resumeId, userId)
}

const listActions = (analysisId, userId) => versions.listActions(analysisId, userId)
module.exports = { list, get, createManual, restore, applySuggestion, listActions }
