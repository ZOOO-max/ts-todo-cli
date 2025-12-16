import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, '..');

export const config = {
  port: Number(process.env.PORT ?? 5173),
  dataFile: process.env.TODO_DATA_PATH ?? path.join(projectRoot, 'data', 'todos.json'),
  publicDir: process.env.PUBLIC_DIR ?? path.join(projectRoot, 'public'),
};

