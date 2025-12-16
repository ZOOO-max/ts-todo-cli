import http from 'node:http';

import { config } from './config.js';
import { TodoService } from './todoService.js';
import { createTodoApi } from './http/api.js';
import { createStaticHandler } from './http/static.js';
import { sendJson } from './http/httpUtils.js';
import type { RouteHandler } from './http/types.js';

const service = new TodoService(config.dataFile);
const handlers: RouteHandler[] = [createTodoApi(service), createStaticHandler(config.publicDir)];

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const method = (req.method ?? 'GET').toUpperCase();

    for (const handler of handlers) {
      if (await handler({ req, res, url, method })) return;
    }

    sendJson(res, 404, { error: 'not found' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error';
    sendJson(res, 500, { error: message });
  }
});

server.listen(config.port, () => {
  console.log(`Todo Web: http://localhost:${config.port}`);
});
