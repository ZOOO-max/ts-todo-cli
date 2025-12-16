import http from 'node:http';

export interface RouteContext {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  url: URL;
  method: string;
}

export type RouteHandler = (ctx: RouteContext) => Promise<boolean>;

