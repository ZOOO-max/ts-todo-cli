import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

import { TodoService } from './todoService.js';

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(text).toString(),
    'cache-control': 'no-store',
  });
  res.end(text);
}

function sendText(res: http.ServerResponse, status: number, body: string, contentType = 'text/plain; charset=utf-8'): void {
  res.writeHead(status, {
    'content-type': contentType,
    'content-length': Buffer.byteLength(body).toString(),
    'cache-control': 'no-store',
  });
  res.end(body);
}

function contentTypeForPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.js') return 'text/javascript; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  return 'application/octet-stream';
}

async function sendFile(res: http.ServerResponse, filePath: string): Promise<void> {
  try {
    const body = await readFile(filePath);
    res.writeHead(200, {
      'content-type': contentTypeForPath(filePath),
      'content-length': body.byteLength.toString(),
      'cache-control': 'no-store',
    });
    res.end(body);
  } catch {
    notFound(res);
  }
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
  const text = await readBody(req);
  if (!text.trim()) return null;
  return JSON.parse(text) as unknown;
}

function notFound(res: http.ServerResponse): void {
  sendJson(res, 404, { error: 'not found' });
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = process.env.TODO_DATA_PATH ?? path.join(__dirname, '..', 'data', 'todos.json');
const todoService = new TodoService(dataFilePath);
const publicDir = process.env.PUBLIC_DIR ?? path.join(__dirname, '..', 'public');

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const method = (req.method ?? 'GET').toUpperCase();

    if (method === 'GET' && url.pathname === '/') return await sendFile(res, path.join(publicDir, 'index.html'));
    if (method === 'GET' && url.pathname === '/styles.css') return await sendFile(res, path.join(publicDir, 'styles.css'));
    if (method === 'GET' && url.pathname === '/app.js') return await sendFile(res, path.join(publicDir, 'app.js'));
    if (method === 'GET' && url.pathname === '/favicon.ico') return sendText(res, 204, '', 'text/plain; charset=utf-8');

    if (url.pathname === '/api/todos' && method === 'GET') {
      const todos = await todoService.list();
      return sendJson(res, 200, { todos });
    }

    if (url.pathname === '/api/todos' && method === 'POST') {
      const body = await readJsonBody(req);
      const title = typeof (body as any)?.title === 'string' ? (body as any).title : '';
      const todo = await todoService.add(title);
      return sendJson(res, 201, { todo });
    }

    if (url.pathname === '/api/todos' && method === 'DELETE') {
      await todoService.clear();
      return sendJson(res, 200, { ok: true });
    }

    const match = url.pathname.match(/^\/api\/todos\/(\d+)$/);
    if (match) {
      const id = Number(match[1]);
      if (!Number.isFinite(id)) return sendJson(res, 400, { error: 'invalid id' });

      if (method === 'PATCH') {
        const updated = await todoService.toggleDone(id);
        if (!updated) return sendJson(res, 404, { error: 'not found' });
        return sendJson(res, 200, { todo: updated });
      }

      if (method === 'DELETE') {
        const removed = await todoService.remove(id);
        if (!removed) return sendJson(res, 404, { error: 'not found' });
        return sendJson(res, 200, { ok: true });
      }
    }

    return notFound(res);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error';
    return sendJson(res, 500, { error: message });
  }
});

const port = Number(process.env.PORT ?? 5173);
server.listen(port, () => {
  console.log(`Todo Web: http://localhost:${port}`);
});
