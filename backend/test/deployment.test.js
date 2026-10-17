const { test, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const workspace = path.resolve(__dirname, '../..')
const tempRoot = path.join(workspace, 'tmp', 'deployment-tests')
fs.mkdirSync(tempRoot, { recursive: true })
const temp = fs.mkdtempSync(path.join(tempRoot, 'run-'))
const dist = path.join(temp, 'frontend')
fs.mkdirSync(path.join(dist, 'assets'), { recursive: true })
fs.writeFileSync(path.join(dist, 'index.html'), '<!doctype html><title>deployment-fixture</title>')
fs.writeFileSync(path.join(dist, 'assets', 'app.js'), 'console.log("fixture")')

process.env.NODE_ENV = 'production'
process.env.JWT_SECRET = 'test-only-secret-for-deployment-check-123456789'
process.env.DATABASE_PATH = path.join(temp, 'data', 'test.db')
process.env.FRONTEND_DIST = dist
process.env.SERVE_FRONTEND = 'true'
process.env.TRUST_PROXY = 'loopback'
process.env.AI_RATE_LIMIT_MAX = '1'
process.env.DOUBAO_API_KEY = ''
process.env.DOUBAO_MODEL_ENDPOINT = ''

const { db, initializeDatabase } = require('../src/database')
initializeDatabase()
const app = require('../src/app')
let server
let base
let token
let resumeId

async function request(route, options = {}) {
  return fetch(base + route, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}), ...options.headers },
  })
}

test('production deployment through one HTTP service', async (t) => {
  server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}`

  await t.test('health is JSON; homepage and deep links are HTML', async () => {
    const health = await request('/api/v1/health')
    assert.equal(health.status, 200)
    assert.equal((await health.json()).data.status, 'ok')
    for (const route of ['/', '/resumes/1', '/analysis/1', '/resumes/1/print']) {
      const res = await request(route, { headers: { Accept: 'text/html' } })
      assert.equal(res.status, 200)
      assert.match(res.headers.get('content-type'), /text\/html/)
      assert.equal(res.headers.get('cache-control'), 'no-store')
    }
  })

  await t.test('API typos, source files and missing assets do not return the SPA', async () => {
    for (const route of ['/api/v1/missing', '/api/missing', '/assets/missing.js', '/backend/.env', '/backend/server.js']) {
      const res = await request(route, { headers: { Accept: 'text/html' } })
      assert.equal(res.status, 404, route)
      assert.doesNotMatch(await res.text(), /deployment-fixture/)
    }
    const asset = await request('/assets/app.js')
    assert.equal(asset.status, 200)
    assert.match(await asset.text(), /fixture/)
  })

  await t.test('deployment maintenance blocks writes while health remains readable', async () => {
    const flag = path.join(temp, 'data', '.deploying')
    fs.writeFileSync(flag, 'deployment-test')
    try {
      const res = await request('/api/v1/resumes', { method: 'POST', body: '{}' })
      assert.equal(res.status, 503)
      assert.equal((await res.json()).code, 'DEPLOYMENT_IN_PROGRESS')
      assert.equal(res.headers.get('retry-after'), '15')
      assert.equal((await request('/api/v1/health')).status, 200)
    } finally { fs.unlinkSync(flag) }
  })

  await t.test('register, authenticated save and SQLite persistence', async () => {
    const registered = await request('/api/v1/auth/register', { method: 'POST', body: JSON.stringify({ username: 'deploy_check', password: 'DeployCheck123' }) })
    assert.equal(registered.status, 201)
    assert.equal((await registered.json()).data.token, undefined)
    token = (await (await request('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ username: 'deploy_check', password: 'DeployCheck123' }) })).json()).data.token
    assert.equal((await request('/api/v1/resumes')).status, 401)
    const created = await request('/api/v1/resumes', { method: 'POST', token, body: JSON.stringify({ title: 'deployment test' }) })
    assert.equal(created.status, 201)
    resumeId = (await created.json()).data.resume.id
    const changed = await request(`/api/v1/resumes/${resumeId}`, { method: 'PATCH', token, body: JSON.stringify({ title: 'saved after deployment', expectedRevision: 1 }) })
    assert.equal(changed.status, 200)
    assert.equal((await (await request(`/api/v1/resumes/${resumeId}`, { token })).json()).data.resume.title, 'saved after deployment')
    await db.backup(path.join(temp, 'snapshot.db'))
    const Database = require('better-sqlite3')
    const copy = new Database(path.join(temp, 'snapshot.db'), { readonly: true })
    try { assert.equal(copy.prepare('SELECT title FROM resumes WHERE id=?').get(resumeId).title, 'saved after deployment') } finally { copy.close() }
  })

  await t.test('AI limit is enforced across endpoints and isolated per account without a model call', async () => {
    const first = await request('/api/v1/chat/stream', { method: 'POST', token, body: '{}' })
    assert.equal(first.status, 400)
    const limited = await request('/api/v1/analyses', { method: 'POST', token, body: '{}' })
    assert.equal(limited.status, 429)
    assert.equal((await limited.json()).code, 'AI_RATE_LIMITED')
    const account = await request('/api/v1/auth/register', { method: 'POST', body: JSON.stringify({ username: 'deploy_other', password: 'DeployCheck123' }) })
    assert.equal(account.status, 201)
    const otherToken = (await (await request('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ username: 'deploy_other', password: 'DeployCheck123' }) })).json()).data.token
    assert.equal((await request('/api/v1/chat/stream', { method: 'POST', token: otherToken, body: '{}' })).status, 400)
  })

  await t.test('production rejects weak JWT secrets; first-install configuration preserves existing secrets', () => {
    const weak = spawnSync(process.execPath, ['-e', "require('./src/config/env')"], { cwd: path.resolve(__dirname, '..'), env: { ...process.env, JWT_SECRET: 'short' }, encoding: 'utf8' })
    assert.notEqual(weak.status, 0)
    const setup = path.join(workspace, 'deploy', 'configure.mjs')
    const fixture = path.join(temp, 'setup')
    fs.mkdirSync(path.join(fixture, 'deploy'), { recursive: true })
    fs.mkdirSync(path.join(fixture, 'backend'), { recursive: true })
    fs.copyFileSync(setup, path.join(fixture, 'deploy', 'configure.mjs'))
    const args = [path.join(fixture, 'deploy', 'configure.mjs'), '--origin', 'https://example.test', '--data-dir', path.join(temp, 'setup-data')]
    const first = spawnSync(process.execPath, args, { encoding: 'utf8' })
    assert.equal(first.status, 0, first.stderr)
    const before = fs.readFileSync(path.join(fixture, 'backend', '.env'), 'utf8')
    assert.match(before, /JWT_SECRET=[a-f0-9]{96}/)
    assert.match(before, /DOUBAO_API_KEY=\n/)
    const second = spawnSync(process.execPath, args, { encoding: 'utf8' })
    assert.notEqual(second.status, 0)
    assert.equal(fs.readFileSync(path.join(fixture, 'backend', '.env'), 'utf8'), before)
    assert.doesNotMatch(first.stdout, /JWT_SECRET=/)
  })
})

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  db.close()
})
