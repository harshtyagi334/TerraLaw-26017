const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const venvPython = path.join(root, '.venv', process.platform === 'win32' ? 'Scripts' : 'bin', process.platform === 'win32' ? 'python.exe' : 'python');
const python = fs.existsSync(venvPython) ? venvPython : (process.env.PYTHON || 'python');
const script = process.argv[2] || 'model_server.py';
console.log(`Starting ${script} with ${python}`);
const child = spawn(python, ['-u', path.join(root, script)], { cwd: root, stdio: 'inherit' });

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
child.on('error', (error) => {
  console.error(`Could not start the model service with ${python}: ${error.message}`);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
