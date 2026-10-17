const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const apiRoutes = require('./routes')
const { env } = require('./config/env')
const { notFound, errorHandler } = require('./middleware/error-handler')

const app = express()

app.disable('x-powered-by')
app.set('trust proxy', env.trustProxy)
app.use(cors({ origin: env.clientOrigin }))
app.use(express.json({ limit: '1mb' }))
app.use('/api', (req, res, next) => {
  const maintenanceFile = path.join(path.dirname(env.databasePath), '.deploying')
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && fs.existsSync(maintenanceFile)) {
    res.setHeader('Retry-After', '15')
    return res.status(503).json({ success: false, data: null, message: '正在发布新版本，请稍后重试', code: 'DEPLOYMENT_IN_PROGRESS' })
  }
  next()
})
app.use('/api/v1', apiRoutes)
app.use('/api', notFound)

if (env.serveFrontend) {
  const indexFile = path.join(env.frontendDist, 'index.html')
  if (!fs.existsSync(indexFile)) throw new Error('Frontend build missing. Build the frontend or set SERVE_FRONTEND=false.')
  app.use(express.static(env.frontendDist, { index: false, dotfiles: 'deny' }))
  app.get('/{*path}', (req, res, next) => {
    if (path.extname(req.path) || /\/\./.test(req.path) || !req.accepts('html')) return next()
    res.setHeader('Cache-Control', 'no-store')
    res.sendFile(indexFile)
  })
}
app.use(notFound)
app.use(errorHandler)

module.exports = app
