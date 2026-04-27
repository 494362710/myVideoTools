import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseEnv } from 'node:util'

const command = process.argv.slice(2).join(' ').trim()

if (!command) {
  console.error('Missing command for run-with-dotenv-overrides')
  process.exit(1)
}

const envFilePath = join(process.cwd(), '.env')
const fileEnv = existsSync(envFilePath)
  ? parseEnv(readFileSync(envFilePath, 'utf8'))
  : {}

const child = spawn(command, {
  cwd: process.cwd(),
  env: {
    ...process.env,
    ...fileEnv,
  },
  shell: true,
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})
