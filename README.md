# ts-todo-cli

Todoをブラウザから操作できる簡易Web版を追加しました。

## 起動

```bash
npm run dev:web
```

起動後に `http://localhost:5173` を開いてください。

## UIファイル

- `public/index.html`
- `public/styles.css`
- `public/app.js`

## データ保存先

- 既定: `data/todos.json`
- 変更: `TODO_DATA_PATH=/path/to/todos.json npm run dev:web`

## API（参考）

- `GET /api/todos`
- `POST /api/todos` `{ "title": "..." }`
- `PATCH /api/todos/:id`（完了/未完了トグル）
- `DELETE /api/todos/:id`
- `DELETE /api/todos`（全削除）
