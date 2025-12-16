import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';

import type { RouteHandler } from './types.js';

function contentTypeForPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.js') return 'text/javascript; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.ico') return 'image/x-icon';
  return 'application/octet-stream';
}

export function createStaticHandler(publicDir: string): RouteHandler {
  const base = path.resolve(publicDir);
  return async ({ res, url, method }) => {
    if (method !== 'GET' && method !== 'HEAD') return false;

    let requestPath = decodeURIComponent(url.pathname);
    if (requestPath.endsWith('/')) requestPath += 'index.html';
    if (requestPath === '/') requestPath = '/index.html';

    const safeRelative = requestPath.replace(/^\/+/, '');
    const absolutePath = path.resolve(base, safeRelative);
    if (!absolutePath.startsWith(base)) return false;

    try {
      const fileStat = await stat(absolutePath);
      if (!fileStat.isFile()) return false;
      const body = method === 'HEAD' ? null : await readFile(absolutePath);
      res.writeHead(200, {
        'content-type': contentTypeForPath(absolutePath),
        'content-length': fileStat.size.toString(),
        'cache-control': 'no-store',
      });
      res.end(body ?? undefined);
      return true;
    } catch {
      return false;
    }
  };
}
