import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;
const OUT = resolve('.impeccable/review');
mkdirSync(OUT, { recursive: true });

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--hide-scrollbars',
    '--user-data-dir=/tmp/ts-dash-review-chrome',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

process.on('exit', () => chrome.kill('SIGKILL'));

async function waitForDebugger(tries = 40) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return res.json();
    } catch {
      /* retry */
    }
    await delay(150);
  }
  throw new Error('Chrome debugger did not start');
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

function attach(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 0;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(String(event.data));
    if (msg.id != null && pending.has(msg.id)) {
      const { resolveFn, rejectFn } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) rejectFn(new Error(JSON.stringify(msg.error)));
      else resolveFn(msg.result);
    }
  });
  const ready = new Promise((resolveOpen, rejectOpen) => {
    ws.addEventListener('open', resolveOpen);
    ws.addEventListener('error', rejectOpen);
  });
  async function send(method, params = {}) {
    await ready;
    const id = ++nextId;
    return new Promise((resolveFn, rejectFn) => {
      pending.set(id, { resolveFn, rejectFn });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }
  return { send, close: () => ws.close() };
}

async function shot({ width, height, file, theme }) {
  const targets = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const session = attach(pageTarget.webSocketDebuggerUrl);
  await session.send('Page.enable');
  await session.send('Runtime.enable');
  await session.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width <= 430,
  });
  await session.send('Page.navigate', { url: 'http://127.0.0.1:9001/' });
  await delay(8000);
  await session.send('Runtime.evaluate', {
    expression: `(() => {
      const wantLight = ${JSON.stringify(theme)} === 'light';
      const isLight = document.body.classList.contains('body--light');
      if (wantLight && !isLight) {
        const btn = document.querySelector('button[aria-label="Use paper theme"]');
        if (btn) btn.click();
      }
      if (!wantLight && isLight) {
        const btn = document.querySelector('button[aria-label="Use ink theme"]');
        if (btn) btn.click();
      }
      const cores = document.querySelectorAll('.core');
      const target = cores[6] || cores[0];
      if (target) target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      window.scrollTo(0, 0);
      return true;
    })()`,
  });
  await delay(600);
  const shotResult = await session.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  writeFileSync(resolve(OUT, file), Buffer.from(shotResult.data, 'base64'));
  session.close();
}

const version = await waitForDebugger();
console.log('chrome', version.Browser);

await shot({ width: 1440, height: 900, file: 'desktop.png', theme: 'dark' });
console.log('wrote desktop.png');
await shot({ width: 1440, height: 900, file: 'light.png', theme: 'light' });
console.log('wrote light.png');
await shot({ width: 390, height: 844, file: 'mobile.png', theme: 'dark' });
console.log('wrote mobile.png');

chrome.kill('SIGKILL');
process.exit(0);
