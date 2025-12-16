type Status = 'todo' | 'done';

interface Todo {
  id: number;
  title: string;
  status: Status;
}

const todos: Todo[] = [];

function addTodo(title: string): Todo {
  const todo: Todo = {
    id: Date.now(),
    title,
    status: 'todo',
  };
  todos.push(todo);
  return todo;
}

function listTodos(): void {
  if (todos.length === 0) {
    console.log('（空）Todoはまだない');
    return;
  }

  for (const t of todos) {
    const mark = t.status === 'done' ? '✅' : '⬜️';
    console.log(`${mark} [${t.id}] ${t.title}`);
  }
}

// 動作確認（仮の呼び出し）
addTodo('牛乳を買う');
addTodo('TypeScriptを学ぶ');
listTodos();
