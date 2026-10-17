const { test, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '../../tmp/product-tests')
fs.mkdirSync(root, { recursive: true })
process.env.DATABASE_PATH = path.join(fs.mkdtempSync(path.join(root, 'run-')), 'test.db')
process.env.SERVE_FRONTEND = 'false'
process.env.JWT_SECRET = 'test-product-secret-at-least-thirty-two-characters'
process.env.DOUBAO_API_KEY = 'test-key-never-use-network'
process.env.DOUBAO_MODEL_ENDPOINT = 'test-model'
const { db, initializeDatabase } = require('../src/database')
initializeDatabase()
const app = require('../src/app')
const axios = require('axios')
const auth = require('../src/services/auth.service')
const resumes = require('../src/services/resume.service')
const jobs = require('../src/services/job.service')
const analysis = require('../src/services/analysis.service')
const versions = require('../src/services/version.service')
const originalPost = axios.post
const content = () => ({ basics: { name: '林晓', phone: '13800000000', email: 'test@example.com', location: '上海', summary: '熟悉 Vue，具备开发经验' }, education: [], experience: [], projects: [{ name: '求职平台', role: '开发', period: '2025–2026', description: '使用 Vue 开发前端，提升操作体验。保留这段背景。' }], skills: ['Vue', 'Node.js'] })
const modelResult = () => ({ score: 78, summary: 'Vue 匹配，需补充可验证成果', strengths: ['Vue 项目'], gaps: [], keywords: { matched: ['Vue', '不存在的技能'], missing: ['Node.js', 'Redis'] }, suggestions: [{ section: '项目经历', original: '使用 Vue 开发前端', optimized: '基于 Vue 实现组件化前端', reason: '突出实际工作' }], interviewQuestions: ['如何拆分组件？'] })
const mockModel = result => { axios.post = async () => ({ data: { choices: [{ message: { content: JSON.stringify(result) } }] } }) }
let server, base, user, other, token, resume, job, report
async function http(route, method = 'GET', body, accessToken = token) {
  const response = await fetch(base + '/api/v1' + route, { method, headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }, ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }) })
  return { status: response.status, ...(await response.json()) }
}
const errorCode = code => error => error.code === code

test('resume product workflow and data protections', async t => {
  server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}`

  await t.test('registration requires a separate login and rejects invalid input', async () => {
    for (const input of [{ username: 'ab', password: '123456' }, { username: 'valid', password: '      ' }, { username: 'valid', password: '汉'.repeat(25) }]) assert.equal((await http('/auth/register', 'POST', input, null)).status, 400)
    const response = await http('/auth/register', 'POST', { username: 'product_user', password: 'Product123' }, null)
    assert.equal(response.status, 201)
    assert.equal(response.data.token, undefined)
    assert.equal(response.data.user.password, undefined)
    user = response.data.user
    assert.equal((await http('/resumes', 'GET', undefined, null)).status, 401)
    assert.equal((await http('/auth/login', 'POST', { username: 'product_user', password: 'wrong123' }, null)).status, 401)
    token = (await http('/auth/login', 'POST', { username: 'product_user', password: 'Product123' }, null)).data.token
    other = (await auth.register({ username: 'other_user', password: 'Product123' })).user
  })

  await t.test('concurrent duplicate registrations return a readable conflict', async () => {
    const inputs = { username: 'concurrent_user', password: 'Product123' }
    const outcomes = await Promise.allSettled([auth.register(inputs), auth.register(inputs)])
    assert.equal(outcomes.filter(item => item.status === 'fulfilled').length, 1)
    assert.equal(outcomes.find(item => item.status === 'rejected').reason.code, 'USERNAME_EXISTS')
  })

  await t.test('migration can run repeatedly without losing data', () => {
    resume = resumes.create({ title: '母简历', content: content() }, user.id)
    initializeDatabase()
    assert.deepEqual(resumes.get(resume.id, user.id).content, content())
    assert.equal(resume.revision, 1)
  })

  await t.test('stale tab saves cannot overwrite content; saves create snapshots', async () => {
    const updated = await http(`/resumes/${resume.id}`, 'PATCH', { title: '母简历已保存', expectedRevision: 1 })
    assert.equal(updated.status, 200)
    resume = updated.data.resume
    const stale = await http(`/resumes/${resume.id}`, 'PATCH', { content: { ...content(), skills: [] }, expectedRevision: 1 })
    assert.equal(stale.status, 409)
    assert.equal(stale.code, 'RESUME_CONFLICT')
    assert.deepEqual(resumes.get(resume.id, user.id).content.skills, ['Vue', 'Node.js'])
    const snapshot = versions.list(resume.id, user.id)[0]
    assert.equal(snapshot.source, 'before_edit')
    assert.equal(versions.get(resume.id, snapshot.id, user.id).title, '母简历')
    assert.throws(() => versions.get(resume.id, snapshot.id, other.id), errorCode('RESUME_NOT_FOUND'))
    assert.throws(() => resumes.update(resume.id, { content: {} , expectedRevision: resume.revision }, user.id), errorCode('VALIDATION_ERROR'))
  })

  await t.test('analysis creates an independent job variant and immutable source snapshots', async () => {
    job = jobs.create({ position: '前端开发', company: '示例公司', content: '使用 Vue 和 Node.js 构建业务平台，熟悉 Redis 优先。' }, user.id)
    mockModel(modelResult())
    report = await analysis.run({ resumeId: resume.id, jobId: job.id, createVariant: true }, user.id)
    assert.notEqual(report.resume_id, resume.id)
    const variant = resumes.get(report.resume_id, user.id)
    assert.equal(variant.source_resume_id, resume.id)
    assert.equal(variant.target_job_id, job.id)
    assert.deepEqual(report.result.sourceSnapshot.content, resume.content)
    assert.equal(report.result.sourceSnapshot.job.content, job.content)
    assert.equal(report.result.suggestions[0].targetPath, 'projects.0.description')
    assert.deepEqual(report.result.keywords.matched, ['Vue', 'Node.js'])
    assert.ok(report.result.keywords.missing.includes('不存在的技能'))
    jobs.update(job.id, { position: '后来修改的岗位', company: '后来修改的公司', content: job.content }, user.id)
    assert.equal(analysis.get(report.id, user.id).position, '前端开发')
    assert.equal(analysis.list(user.id).find(item => item.id === report.id).position, '前端开发')
  })

  await t.test('suggestions preserve surrounding text and leave the mother resume unchanged', () => {
    const variant = versions.applySuggestion(report.id, { suggestionIndex: 0, targetPath: 'projects.0.description', expectedRevision: 1 }, user.id)
    assert.equal(variant.content.projects[0].description, '基于 Vue 实现组件化前端，提升操作体验。保留这段背景。')
    assert.equal(resumes.get(resume.id, user.id).content.projects[0].description, content().projects[0].description)
    assert.deepEqual(analysis.get(report.id, user.id).result.sourceSnapshot.content, content())
    assert.throws(() => versions.applySuggestion(report.id, { suggestionIndex: 0, targetPath: 'projects.0.description', expectedRevision: 2 }, user.id), errorCode('SUGGESTION_ALREADY_APPLIED'))
    const snapshot = versions.list(variant.id, user.id)[0]
    assert.equal(versions.get(variant.id, snapshot.id, user.id).content.projects[0].description, content().projects[0].description)
  })

  await t.test('restore checks revision and retains the pre-restore content', () => {
    const variant = resumes.get(report.resume_id, user.id)
    const snapshot = versions.list(variant.id, user.id)[0]
    assert.throws(() => versions.restore(variant.id, snapshot.id, user.id, 1), errorCode('RESUME_CONFLICT'))
    const restored = versions.restore(variant.id, snapshot.id, user.id, variant.revision)
    assert.equal(restored.content.projects[0].description, content().projects[0].description)
    assert.equal(versions.list(variant.id, user.id)[0].source, 'before_restore')
    assert.throws(() => resumes.update(restored.id, { title: '过时的自动保存', expectedRevision: variant.revision }, user.id), errorCode('RESUME_CONFLICT'))
  })

  await t.test('changed or reordered modules reject stale suggestions with no extra snapshot', async () => {
    mockModel(modelResult())
    const report2 = await analysis.run({ resumeId: resume.id, jobId: job.id, createVariant: true }, user.id)
    const variant = resumes.get(report2.resume_id, user.id)
    const changed = structuredClone(variant.content)
    changed.projects[0].name = '现在是另一个项目'
    const saved = resumes.update(variant.id, { content: changed, expectedRevision: variant.revision }, user.id)
    const count = versions.list(variant.id, user.id).length
    assert.throws(() => versions.applySuggestion(report2.id, { suggestionIndex: 0, targetPath: 'projects.0.description', expectedRevision: saved.revision }, user.id), errorCode('SUGGESTION_STALE'))
    assert.equal(versions.list(variant.id, user.id).length, count)
    assert.throws(() => versions.applySuggestion(report2.id, { suggestionIndex: 0, targetPath: 'basics.summary', expectedRevision: saved.revision }, user.id), errorCode('SUGGESTION_UNBOUND'))
    assert.throws(() => versions.applySuggestion(report2.id, { suggestionIndex: 0, targetPath: 'projects.0.description', expectedRevision: saved.revision }, other.id), errorCode('ANALYSIS_NOT_FOUND'))
  })

  await t.test('ambiguous original text cannot bind to the wrong field', () => {
    const value = modelResult()
    value.suggestions[0].original = 'Vue'
    const result = analysis.bindSuggestions(value, content())
    assert.equal(result.suggestions[0].targetPath, null)
    const schemaOnly = modelResult()
    schemaOnly.keywords = { matched: ['basics', 'description', 'AAAA'], missing: [] }
    assert.deepEqual(analysis.bindSuggestions(schemaOnly, { ...content(), basics: { ...content().basics, photo: 'data:image/png;base64,AAAA' } }).keywords.matched, [])
    assert.throws(() => analysis.normalizeResult(null), errorCode('AI_INVALID_RESPONSE'))
    assert.throws(() => analysis.normalizeResult({}), errorCode('AI_INVALID_RESPONSE'))
  })

  await t.test('invalid AI responses create neither variants nor reports', async () => {
    const before = resumes.list(user.id).length
    mockModel({ score: 90 })
    await assert.rejects(analysis.run({ resumeId: resume.id, jobId: job.id, createVariant: true }, user.id), errorCode('AI_INVALID_RESPONSE'))
    assert.equal(resumes.list(user.id).length, before)
  })

  await t.test('editing while AI runs rejects an outdated result without creating a variant', async () => {
    let release
    axios.post = () => new Promise(resolve => { release = () => resolve({ data: { choices: [{ message: { content: JSON.stringify(modelResult()) } }] } }) })
    const pending = analysis.run({ resumeId: resume.id, jobId: job.id, createVariant: true }, user.id)
    resume = resumes.update(resume.id, { title: '分析期间的新标题', expectedRevision: resume.revision }, user.id)
    release()
    await assert.rejects(pending, errorCode('RESUME_CONFLICT'))
  })

  await t.test('all three templates accepted, invalid templates and malformed JSON rejected', async () => {
    for (const template of ['classic', 'modern', 'elegant']) assert.equal((await http('/exports', 'POST', { resumeId: resume.id, template })).status, 201)
    assert.equal((await http('/exports', 'POST', { resumeId: resume.id, template: 'bad' })).status, 400)
    assert.equal((await http('/resumes', 'POST', '{malformed')).status, 400)
  })

  await t.test('error logs omit upstream credentials, request content and unknown error messages', () => {
    const { errorHandler } = require('../src/middleware/error-handler')
    const entries = [], previous = console.error
    console.error = (...args) => entries.push(args)
    let body
    try {
      const error = Object.assign(new Error('private-resume-and-secret'), { config: { headers: { Authorization: 'Bearer private-key' } } })
      errorHandler(error, {}, { status: () => ({ json: value => { body = value } }) }, () => {})
      assert.doesNotMatch(JSON.stringify(entries), /private|Authorization/)
      assert.equal(body.message, '服务器内部错误')
    } finally { console.error = previous }
  })

  await t.test('SSE handles split Unicode, exposes stream errors and preserves received text without forwarding photos', async () => {
    const { PassThrough } = require('node:stream')
    const photoContent = content()
    photoContent.basics.photo = 'data:image/png;base64,AAAA'
    const photoResume = resumes.create({ title: '照片测试', content: photoContent }, user.id)
    const session = (await http('/chat/sessions', 'POST', { resumeId: photoResume.id })).data.session
    axios.post = async (_url, payload) => {
      assert.doesNotMatch(JSON.stringify(payload.messages), /data:image|photo/)
      const stream = new PassThrough()
      const bytes = Buffer.from('data: ' + JSON.stringify({ choices: [{ delta: { content: '你好简历' } }] }) + '\n\n')
      const cut = bytes.indexOf(Buffer.from('你')) + 1
      setTimeout(() => { stream.write(bytes.subarray(0, cut)); stream.write(bytes.subarray(cut)); stream.destroy(new Error('private-upstream-error')) }, 10)
      return { data: stream }
    }
    const response = await fetch(base + `/api/v1/chat/sessions/${session.id}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ content: '帮我准备面试' }) })
    const text = await response.text()
    assert.match(text, /你好简历/)
    assert.match(text, /响应中断/)
    assert.doesNotMatch(text, /private-upstream-error/)
    const saved = (await http(`/chat/sessions/${session.id}`)).data.messages
    assert.equal(saved.at(-1).content, '你好简历')
  })
})

after(async () => {
  axios.post = originalPost
  if (server) await new Promise(resolve => server.close(resolve))
  db.close()
})
