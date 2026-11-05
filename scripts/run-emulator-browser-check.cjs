#!/usr/bin/env node
// Isolate Expo's file-based virtual environment from the connected cloud app.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'shelflife-emulator-ui-'));
const destination = path.join(root, '.local', 'checks', 'firebase-browser-checks.json');
const cli = require.resolve('firebase-tools/lib/bin/firebase.js');
const expo = path.join(path.dirname(require.resolve('expo/package.json')), 'bin', 'cli');
let metro;
async function main() {
  try {
    for (const name of [
      'src',
      'assets',
      'package.json',
      'package-lock.json',
      'app.config.js',
      'babel.config.js',
      'metro.config.js',
      'firebase.json',
      'firestore.rules',
      'firestore.indexes.json',
    ]) {
      const source = path.join(root, name);
      if (fs.existsSync(source)) fs.cpSync(source, path.join(fixture, name), { recursive: true });
    }
    fs.mkdirSync(path.join(fixture, 'scripts'));
    fs.mkdirSync(path.join(fixture, 'docs'));
    fs.mkdirSync(path.join(fixture, '.local'));
    fs.copyFileSync(
      path.join(root, 'scripts/firebase_browser_smoke.py'),
      path.join(fixture, 'scripts/firebase_browser_smoke.py'),
    );
    fs.symlinkSync(path.join(root, 'node_modules'), path.join(fixture, 'node_modules'), 'junction');
    fs.writeFileSync(
      path.join(fixture, '.env.local'),
      'EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true\nEXPO_PUBLIC_EMULATOR_HOST=127.0.0.1\n',
      { mode: 0o600 },
    );
    const env = {
      ...process.env,
      EXPO_PUBLIC_USE_FIREBASE_EMULATORS: 'true',
      EXPO_PUBLIC_EMULATOR_HOST: '127.0.0.1',
    };
    for (const key of Object.keys(env))
      if (key.startsWith('EXPO_PUBLIC_FIREBASE_')) delete env[key];
    fs.mkdirSync(path.join(root, '.local', 'checks'), { recursive: true });
    const log = fs.openSync(path.join(root, '.local', 'emulator-browser-metro.log'), 'w');
    metro = spawn(
      process.execPath,
      [expo, 'start', '--web', '--go', '--port', '8082', '--max-workers', '2'],
      { cwd: fixture, env, stdio: ['ignore', log, log] },
    );
    fs.closeSync(log);
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (metro.exitCode !== null)
        throw new Error('Emulator Metro server exited. Check .local/emulator-browser-metro.log.');
      try {
        const response = await fetch('http://localhost:8082/register', {
          signal: AbortSignal.timeout(1500),
        });
        if (response.ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (!ready) throw new Error('Emulator Metro server did not become ready.');
    execFileSync(
      process.execPath,
      [
        cli,
        'emulators:exec',
        '--only',
        'auth,firestore',
        '--project',
        'demo-shelflife',
        'python scripts/firebase_browser_smoke.py',
      ],
      { cwd: fixture, env, stdio: 'inherit', timeout: 240000 },
    );
    fs.copyFileSync(path.join(fixture, '.local', 'checks', 'firebase-browser-checks.json'), destination);
    console.log('PASS isolated Firebase emulator browser check. Production requests were blocked.');
  } finally {
    if (metro && metro.exitCode === null && !metro.signalCode) {
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 2000);
        metro.once('exit', () => {
          clearTimeout(timer);
          resolve();
        });
        metro.kill('SIGTERM');
      });
      if (metro.exitCode === null && !metro.signalCode) metro.kill('SIGKILL');
    }
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
