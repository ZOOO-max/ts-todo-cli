import { TodoService } from '../todoService.js';
import { readJsonBody, sendJson } from './httpUtils.js';
import type { RouteHandler } from './types.js';

export function createTodoApi(service: TodoService): RouteHandler {
  return async ({ req, res, url, method }) => {
    if (!url.pathname.startsWith('/api/todos')) return false;

    if (url.pathname === '/api/todos' && method === 'GET') {
      const todos = await service.list();
      sendJson(res, 200, { todos });
      return true;
    }

    if (url.pathname === '/api/todos' && method === 'POST') {
      const body = await readJsonBody(req);
      const title = typeof (body as any)?.title === 'string' ? (body as any).title : '';
      const todo = await service.add(title);
      sendJson(res, 201, { todo });
      return true;
    }

    if (url.pathname === '/api/todos' && method === 'DELETE') {
      await service.clear();
      sendJson(res, 200, { ok: true });
      return true;
    }

    const match = url.pathname.match(/^\/api\/todos\/(\d+)$/);
    if (!match) return false;
    const id = Number(match[1]);
    if (!Number.isFinite(id)) {
      sendJson(res, 400, { error: 'invalid id' });
      return true;
    }

    if (method === 'PATCH') {
      const updated = await service.toggleDone(id);
      if (!updated) {
        sendJson(res, 404, { error: 'not found' });
        return true;
      }
      sendJson(res, 200, { todo: updated });
      return true;
    }

    if (method === 'DELETE') {
      const removed = await service.remove(id);
      if (!removed) {
        sendJson(res, 404, { error: 'not found' });
        return true;
      }
      sendJson(res, 200, { ok: true });
      return true;
    }

    return false;
  };
}
