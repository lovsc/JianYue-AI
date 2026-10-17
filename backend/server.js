require('dotenv').config({ path: require('path').join(__dirname, '.env') })

const app = require('./src/app')
const { env } = require('./src/config/env')
const { initializeDatabase } = require('./src/database')

initializeDatabase()

app.listen(env.port, env.host, () => {
  console.log(`Server running at http://${env.host}:${env.port}`)
})
