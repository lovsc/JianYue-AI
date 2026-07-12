const express = require('express')
const cors = require('cors')
const apiRoutes = require('./routes')
const { env } = require('./config/env')
const { notFound, errorHandler } = require('./middleware/error-handler')

const app = express()

app.disable('x-powered-by')
app.use(cors({ origin: env.clientOrigin }))
app.use(express.json({ limit: '1mb' }))
app.use('/api/v1', apiRoutes)
app.use(notFound)
app.use(errorHandler)

module.exports = app
