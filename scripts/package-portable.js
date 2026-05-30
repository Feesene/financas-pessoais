const { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');

const rootDir = path.resolve(__dirname, '..');
const rootPackage = require(path.join(rootDir, 'package.json'));
const targetName = `financas-v${rootPackage.version}`;
const targetDir = path.join(rootDir, targetName);

function copyDir(source, target) {
  if (!existsSync(source)) {
    throw new Error(`Pasta obrigatoria nao encontrada: ${source}`);
  }

  mkdirSync(path.dirname(target), { recursive: true });
  cpSync(source, target, { recursive: true, force: true });
}

function copyDirContents(source, target) {
  if (!existsSync(source)) {
    throw new Error(`Pasta obrigatoria nao encontrada: ${source}`);
  }

  mkdirSync(target, { recursive: true });
  for (const entry of readdirSync(source)) {
    copyDir(path.join(source, entry), path.join(target, entry));
  }
}

function copyIfExists(source, target) {
  if (existsSync(source)) {
    copyDir(source, target);
  }
}

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });

mkdirSync(path.join(targetDir, 'backend'), { recursive: true });
esbuild.buildSync({
  entryPoints: [path.join(rootDir, 'backend', 'dist', 'main.js')],
  outfile: path.join(targetDir, 'backend', 'main.js'),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  sourcemap: false,
  external: [
    'better-sqlite3',
    '@nestjs/microservices',
    '@nestjs/websockets',
    'cache-manager',
    'class-transformer/storage',
    'mysql',
    'mysql2',
    'oracledb',
    'pg-native',
    'redis',
    'sqlite3',
    'tedious',
  ],
});

copyDirContents(path.join(rootDir, 'frontend', '.next', 'standalone'), path.join(targetDir, 'frontend'));

const frontendRoots = [
  path.join(targetDir, 'frontend'),
  path.join(targetDir, 'frontend', 'frontend'),
].filter((candidate) => existsSync(path.join(candidate, 'server.js')));

if (frontendRoots.length === 0) {
  throw new Error('Nao foi possivel encontrar o server.js do Next standalone.');
}

for (const frontendRoot of frontendRoots) {
  copyDir(path.join(rootDir, 'frontend', '.next', 'static'), path.join(frontendRoot, '.next', 'static'));
  copyIfExists(path.join(rootDir, 'frontend', 'public'), path.join(frontendRoot, 'public'));
}

copyDir(path.join(rootDir, 'node_modules', 'better-sqlite3'), path.join(targetDir, 'backend', 'node_modules', 'better-sqlite3'));
copyDir(path.join(rootDir, 'node_modules', 'bindings'), path.join(targetDir, 'backend', 'node_modules', 'bindings'));
copyDir(
  path.join(rootDir, 'node_modules', 'file-uri-to-path'),
  path.join(targetDir, 'backend', 'node_modules', 'file-uri-to-path'),
);

copyDir(path.join(rootDir, 'scripts', 'runtime'), path.join(targetDir, 'scripts', 'runtime'));

mkdirSync(path.join(targetDir, 'data'), { recursive: true });
mkdirSync(path.join(targetDir, 'logs'), { recursive: true });
mkdirSync(path.join(targetDir, 'runtime'), { recursive: true });

if (process.platform === 'win32' && existsSync(process.execPath)) {
  copyFileSync(process.execPath, path.join(targetDir, 'runtime', 'node.exe'));
}

writeFileSync(
  path.join(targetDir, 'Iniciar App.bat'),
  [
    '@echo off',
    'setlocal',
    'cd /d "%~dp0"',
    'if exist "runtime\\node.exe" (',
    '  "runtime\\node.exe" "scripts\\runtime\\start-portable.js"',
    ') else (',
    '  node "scripts\\runtime\\start-portable.js"',
    ')',
    'pause',
    '',
  ].join('\r\n'),
);

writeFileSync(
  path.join(targetDir, 'README-INICIAR.txt'),
  [
    'Financas Pessoais',
    '',
    'Para iniciar, execute o arquivo "Iniciar App.bat".',
    'O banco local fica em data\\financas.db.',
    'Para fazer backup, copie a pasta data ou o arquivo financas.db.',
    '',
  ].join('\r\n'),
);

console.log(`Pacote portatil criado em: ${targetDir}`);
