const { createWriteStream, existsSync, mkdirSync } = require('node:fs');
const { spawn } = require('node:child_process');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..', '..');
const nodePath = existsSync(path.join(rootDir, 'runtime', 'node.exe')) ? path.join(rootDir, 'runtime', 'node.exe') : process.execPath;
const logsDir = path.join(rootDir, 'logs');
const dataDir = path.join(rootDir, 'data');
const backendPort = '50081';
const frontendPort = '50080';
const backendUrl = `http://127.0.0.1:${backendPort}`;
const frontendUrl = `http://127.0.0.1:${frontendPort}`;

mkdirSync(logsDir, { recursive: true });
mkdirSync(dataDir, { recursive: true });

function findFrontendServer() {
  const candidates = [
    path.join(rootDir, 'frontend', 'server.js'),
    path.join(rootDir, 'frontend', 'frontend', 'server.js'),
  ];

  const server = candidates.find((candidate) => existsSync(candidate));
  if (!server) {
    throw new Error('server.js do frontend nao encontrado no pacote.');
  }

  return server;
}

function startProcess(name, script, env) {
  const log = createWriteStream(path.join(logsDir, `${name}.log`), { flags: 'a' });
  const child = spawn(nodePath, [script], {
    cwd: rootDir,
    env: { ...process.env, ...env },
    windowsHide: false,
  });

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[${name}] ${chunk}`);
    log.write(chunk);
  });

  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[${name}] ${chunk}`);
    log.write(chunk);
  });

  child.on('exit', (code) => {
    log.end();
    if (!shuttingDown) {
      console.log(`${name} finalizou com codigo ${code ?? 'desconhecido'}.`);
      shutdown(code ?? 1);
    }
  });

  return child;
}

function openBrowser(url) {
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
    return;
  }

  const command = process.platform === 'darwin' ? 'open' : 'xdg-open';
  spawn(command, [url], { detached: true, stdio: 'ignore' }).unref();
}

let shuttingDown = false;
const backend = startProcess('backend', path.join(rootDir, 'backend', 'main.js'), {
  NODE_ENV: 'production',
  PORT: backendPort,
  DATABASE_TYPE: 'sqlite',
  DATABASE_PATH: path.join(dataDir, 'financas.db'),
  DB_SYNCHRONIZE: 'true',
});

const frontend = startProcess('frontend', findFrontendServer(), {
  NODE_ENV: 'production',
  PORT: frontendPort,
  HOSTNAME: '0.0.0.0',
  API_URL: backendUrl,
  NEXT_PUBLIC_API_URL: backendUrl,
});

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of [frontend, backend]) {
    if (!child.killed) {
      child.kill();
    }
  }
  setTimeout(() => process.exit(code), 500);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

if (process.env.NO_OPEN !== '1') {
  setTimeout(() => openBrowser(frontendUrl), 3000);
}
console.log(`App iniciado em ${frontendUrl}`);
console.log('Feche esta janela para encerrar os servidores locais.');
