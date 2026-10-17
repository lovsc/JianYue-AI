const express = require('express')
const rateLimit = require('express-rate-limit')
const authController = require('../controllers/auth.controller')
const chatController = require('../controllers/chat.controller')
const resumeController = require('../controllers/resume.controller')
const jobController = require('../controllers/job.controller')
const analysisController = require('../controllers/analysis.controller')
const versionController = require('../controllers/version.controller')
const exportController = require('../controllers/export.controller')
const chatSessionController = require('../controllers/chat-session.controller')
const dashboardController = require('../controllers/dashboard.controller')
const userController = require('../controllers/user.controller')
const { authenticate } = require('../middleware/authenticate')
const { asyncHandler } = require('../utils/async-handler')
const { env } = require('../config/env')

const router = express.Router()
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true })
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: env.aiRateLimitMax,
  keyGenerator: (req) => String(req.user.id),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, message: '本小时 AI 请求次数已达上限，请稍后重试', code: 'AI_RATE_LIMITED' },
})

router.get('/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.json({ success: true, data: { status: 'ok', ...(env.releaseSha ? { releaseSha: env.releaseSha } : {}) }, message: '服务正常' })
})
router.post('/auth/register', authLimiter, asyncHandler(authController.register))
router.post('/auth/login', authLimiter, asyncHandler(authController.login))
router.get('/users/me', authenticate, authController.me)
router.patch('/users/me', authenticate, userController.updateProfile)
router.post('/users/me/password', authenticate, asyncHandler(userController.changePassword))
router.post('/chat/stream', authenticate, aiLimiter, asyncHandler(chatController.stream))
router.get('/resumes', authenticate, resumeController.list)
router.post('/resumes', authenticate, resumeController.create)
router.get('/resumes/:id', authenticate, resumeController.get)
router.patch('/resumes/:id', authenticate, resumeController.update)
router.delete('/resumes/:id', authenticate, resumeController.remove)
router.get('/resumes/:id/versions', authenticate, versionController.list)
router.post('/resumes/:id/versions', authenticate, versionController.create)
router.post('/resumes/:id/versions/:versionId/restore', authenticate, versionController.restore)
router.get('/jobs', authenticate, jobController.list)
router.post('/jobs', authenticate, jobController.create)
router.get('/jobs/:id', authenticate, jobController.get)
router.patch('/jobs/:id', authenticate, jobController.update)
router.delete('/jobs/:id', authenticate, jobController.remove)
router.get('/analyses', authenticate, analysisController.list)
router.post('/analyses', authenticate, aiLimiter, asyncHandler(analysisController.run))
router.get('/analyses/:id', authenticate, analysisController.get)
router.post('/analyses/:id/apply', authenticate, versionController.applySuggestion)
router.get('/exports', authenticate, exportController.list)
router.post('/exports', authenticate, exportController.create)
router.get('/chat/sessions', authenticate, chatSessionController.list)
router.post('/chat/sessions', authenticate, chatSessionController.create)
router.get('/chat/sessions/:id', authenticate, chatSessionController.get)
router.delete('/chat/sessions/:id', authenticate, chatSessionController.remove)
router.post('/chat/sessions/:id/messages', authenticate, aiLimiter, asyncHandler(chatSessionController.send))
router.get('/dashboard', authenticate, dashboardController.get)

module.exports = router
