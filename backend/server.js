require('dotenv').config()

const app = require('./src/app')
const { env } = require('./src/config/env')
const { initializeDatabase } = require('./src/database')

initializeDatabase()

app.listen(env.port, () => {
  console.log(`Server running at http://localhost:${env.port}`)
})
