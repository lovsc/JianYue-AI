const path = require('path')

module.exports = {
  apps: [{
    name: 'jianyue-ai',
    cwd: path.resolve(__dirname, '../backend'),
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_memory_restart: '512M',
    time: true,
    env: { NODE_ENV: 'production' },
  }],
}
