import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../dist/spa', import.meta.url)));
const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || '0.0.0.0';
const envPath = resolve(fileURLToPath(new URL('../.env', import.meta.url)));

function loadDotEnv() {
  try {
    return Object.fromEntries(
      readFileSync(envPath, 'utf8')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
          const index = line.indexOf('=');
          return [line.slice(0, index), line.slice(index + 1)];
        }),
    );
  } catch {
    return {};
  }
}

function envLoginConfig() {
  const env = loadDotEnv();
  const apiKey = env.TYPESENSE_API_KEY?.trim();
  const nodeHost = env.TYPESENSE_HOST?.trim();
  if (!apiKey || !nodeHost) {
    return null;
  }
  const protocol = env.TYPESENSE_PROTOCOL?.trim() || 'https';
  return {
    apiKey,
    node: {
      host: nodeHost,
      port: Number(env.TYPESENSE_PORT) || (protocol === 'https' ? 443 : 8108),
      protocol,
      path: '',
      tls: true,
    },
  };
}

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

try {
  await stat(join(root, 'index.html'));
} catch {
  console.error('No build found in dist/spa. Run `bun run build` first.');
  process.exit(1);
}

createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath === '/config.json') {
      const loginConfig = envLoginConfig();
      if (loginConfig) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(loginConfig));
        return;
      }
    }
    let filePath = normalize(join(root, urlPath));
    if (!filePath.startsWith(root)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    try {
      const fileStat = await stat(filePath);
      if (fileStat.isDirectory()) {
        filePath = join(filePath, 'index.html');
      }
    } catch {
      filePath = join(root, 'index.html');
    }

    const body = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': types[extname(filePath)] || 'application/octet-stream',
    });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, host, () => {
  console.log(`Typesense Dashboard: http://localhost:${port}/`);
});
