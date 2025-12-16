import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const indexHtml = `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Todo Web</title>
    <style>
      :root { color-scheme: light dark; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial; margin: 0; }
      .wrap { max-width: 720px; margin: 0 auto; padding: 24px; }
      h1 { margin: 0 0 16px; font-size: 20px; }
      form { display: flex; gap: 8px; margin: 12px 0 18px; }
      input { flex: 1; padding: 10px 12px; border: 1px solid color-mix(in oklab, CanvasText 25%, Canvas 75%); border-radius: 10px; background: Canvas; color: CanvasText; }
      button { padding: 10px 12px; border: 1px solid color-mix(in oklab, CanvasText 25%, Canvas 75%); border-radius: 10px; background: color-mix(in oklab, CanvasText 8%, Canvas 92%); color: CanvasText; cursor: pointer; }
      ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
      li { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid color-mix(in oklab, CanvasText 18%, Canvas 82%); border-radius: 12px; background: color-mix(in oklab, CanvasText 3%, Canvas 97%); }
      .title { flex: 1; }
      .done .title { text-decoration: line-through; opacity: 0.7; }
      .meta { font-size: 12px; opacity: 0.7; }
      .row { display: flex; gap: 8px; align-items: center; }
      .spacer { flex: 1; }
      .danger { background: color-mix(in oklab, red 12%, Canvas 88%); }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="row">
        <h1>Todo Web</h1>
        <div class="spacer"></div>
        <button id="clear" class="danger" type="button">全削除</button>
      </div>
      <form id="form">
        <input id="title" placeholder="例: 牛乳を買う" autocomplete="off" />
        <button type="submit">追加</button>
      </form>
      <div class="meta" id="status"></div>
      <ul id="list"></ul>
    </div>
    <script>
      const $ = (id) => document.getElementById(id);
      const listEl = $("list");
      const statusEl = $("status");
      const inputEl = $("title");
      const formEl = $("form");
      const clearEl = $("clear");

      const api = {
        list: () => fetch("/api/todos").then(r => r.json()),
        add: (title) => fetch("/api/todos", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title }) }).then(r => r.json()),
        toggle: (id) => fetch("/api/todos/" + id, { method: "PATCH" }).then(r => r.json()),
        del: (id) => fetch("/api/todos/" + id, { method: "DELETE" }).then(r => r.json()),
        clear: () => fetch("/api/todos", { method: "DELETE" }).then(r => r.json()),
      };

      function setStatus(text) { statusEl.textContent = text || ""; }

      function render(todos) {
        listEl.innerHTML = "";
        for (const t of todos) {
          const li = document.createElement("li");
          li.className = t.status === "done" ? "done" : "";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = t.status === "done";
          checkbox.addEventListener("change", async () => { await api.toggle(t.id); await refresh(); });

          const title = document.createElement("div");
          title.className = "title";
          title.textContent = t.title;

          const del = document.createElement("button");
          del.type = "button";
          del.className = "danger";
          del.textContent = "削除";
          del.addEventListener("click", async () => { await api.del(t.id); await refresh(); });

          li.appendChild(checkbox);
          li.appendChild(title);
          li.appendChild(del);
          listEl.appendChild(li);
        }
        setStatus(todos.length ? todos.length + "件" : "（空）Todoはまだない");
      }

      async function refresh() {
        const data = await api.list();
        if (data.error) throw new Error(data.error);
        render(data.todos || []);
      }

      formEl.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = inputEl.value.trim();
        if (!title) return;
        inputEl.value = "";
        const data = await api.add(title);
        if (data.error) return setStatus(data.error);
        await refresh();
      });

      clearEl.addEventListener("click", async () => {
        if (!confirm("全て削除します。よろしいですか？")) return;
        await api.clear();
        await refresh();
      });

      refresh().catch((e) => setStatus(String(e)));
    </script>
  </body>
</html>
`;

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const method = (req.method ?? 'GET').toUpperCase();

    if (method === 'GET' && url.pathname === '/') {
      return sendText(res, 200, indexHtml, 'text/html; charset=utf-8');
    }

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
