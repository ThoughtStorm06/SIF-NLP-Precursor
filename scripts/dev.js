import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('\x1b[36m%s\x1b[0m', '════════════════════════════════════════════════════════');
console.log('\x1b[36m%s\x1b[0m', '  🛡️  SIF-Sentinel Fullstack Dev Server Orchestrator    ');
console.log('\x1b[36m%s\x1b[0m', '════════════════════════════════════════════════════════');

// 1. Start Backend API
const backendProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(rootDir, 'backend'),
  stdio: 'pipe',
  shell: true
});

backendProcess.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[35m[API]\x1b[0m ${data}`);
});

backendProcess.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[31m[API ERR]\x1b[0m ${data}`);
});

// 2. Start Frontend Vite Client
const frontendProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(rootDir, 'frontend'),
  stdio: 'pipe',
  shell: true
});

frontendProcess.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[32m[VITE]\x1b[0m ${data}`);
});

frontendProcess.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[33m[VITE ERR]\x1b[0m ${data}`);
});

// Graceful shutdown
const cleanup = () => {
  console.log('\n\x1b[33mStopping SIF-Sentinel dev servers...\x1b[0m');
  try {
    if (isWin) {
      if (backendProcess.pid) spawn('taskkill', ['/pid', backendProcess.pid, '/f', '/t']);
      if (frontendProcess.pid) spawn('taskkill', ['/pid', frontendProcess.pid, '/f', '/t']);
    } else {
      backendProcess.kill('SIGTERM');
      frontendProcess.kill('SIGTERM');
    }
  } catch (err) {
    // Ignore cleanup errors
  }
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
