import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const stamp = new Date().toISOString().replaceAll(/[:.]/g, '-')
const output = path.join(root, 'tmp', 'releases', stamp)
const release = path.join(output, 'jianyue')
const commitSha = process.env.RELEASE_SHA || null
if (commitSha && !/^[a-f0-9]{40}$/.test(commitSha)) throw new Error('RELEASE_SHA must be a full Git commit SHA')
fs.mkdirSync(release, { recursive: true })

// Copy a strict allowlist; never copy local .env, database, uploads or node_modules.
for (const item of ['backend/src', 'backend/server.js', 'backend/package.json', 'backend/package-lock.json', 'backend/.env.example', 'deploy']) {
  fs.cpSync(path.join(root, item), path.join(release, item), {
    recursive: true, errorOnExist: true, force: false,
    filter: (source) => path.basename(source) !== '__pycache__' && !source.endsWith('.pyc'),
  })
}
fs.copyFileSync(path.join(root, 'docs', 'DEPLOYMENT_BAOTA.md'), path.join(release, 'DEPLOYMENT.md'))
fs.writeFileSync(path.join(release, 'release.json'), JSON.stringify({ format: 1, commitSha, builtAt: new Date().toISOString() }) + '\n')
const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', [
  'run', 'build', '--', '--outDir', path.join(release, 'frontend', 'dist'),
], {
  cwd: path.join(root, 'frontend'),
  env: { ...process.env, VITE_API_BASE_URL: '/api/v1' },
  stdio: 'inherit',
  shell: process.platform === 'win32',
})
if (result.error) throw result.error
if (result.status !== 0) throw new Error(`Frontend build failed (${result.status}); no release archive was created.`)
const archive = path.join(output, 'jianyue-release.tar.gz')
const packed = spawnSync('tar', ['-czf', archive, '-C', output, 'jianyue'], { stdio: 'inherit' })
if (packed.error) throw packed.error
if (packed.status !== 0) throw new Error('Archive creation failed')
console.log(`Release archive: ${archive}`)
console.log('Includes built frontend and backend source; install Linux dependencies on the server.')
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `archive_path=${archive}\n`)
