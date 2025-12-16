import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type Status = 'todo' | 'done';

export interface Todo {
  id: number;
  title: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const text = await readFile(filePath, 'utf8');
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

export class TodoService {
  readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async list(): Promise<Todo[]> {
    const todos = await readJsonFile<Todo[]>(this.filePath, []);
    return todos.sort((a, b) => b.id - a.id);
  }

  async add(title: string): Promise<Todo> {
    const trimmed = title.trim();
    if (!trimmed) throw new Error('title is required');

    const todos = await this.list();
    const now = nowIso();
    const todo: Todo = {
      id: Date.now(),
      title: trimmed,
      status: 'todo',
      createdAt: now,
      updatedAt: now,
    };
    await writeJsonFile(this.filePath, [todo, ...todos]);
    return todo;
  }

  async toggleDone(id: number): Promise<Todo | null> {
    const todos = await this.list();
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const current = todos[index]!;
    const updated: Todo = {
      ...current,
      status: current.status === 'done' ? 'todo' : 'done',
      updatedAt: nowIso(),
    };
    todos[index] = updated;
    await writeJsonFile(this.filePath, todos);
    return updated;
  }

  async remove(id: number): Promise<boolean> {
    const todos = await this.list();
    const next = todos.filter((t) => t.id !== id);
    const changed = next.length !== todos.length;
    if (changed) await writeJsonFile(this.filePath, next);
    return changed;
  }

  async clear(): Promise<void> {
    await writeJsonFile(this.filePath, []);
  }
}

