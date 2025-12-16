# ts-todo-cli

Todoをブラウザから操作できる簡易Web版を追加しました。

## 起動

```bash
npm run dev:web
```

起動後に `http://localhost:5173` を開いてください。

### 他のスクリプト

- `npm run dev:cli` — 既存のCLIサンプル
- `npm run build` — TypeScriptビルド
- `npm run start:web` — `npm run build` 後に生成された `dist/server.js` を起動

## UIファイル

- `public/index.html`
- `public/styles.css`
- `public/app.js`

## サーバー構成（学びポイント）

- `src/server.ts` — HTTPサーバーのエントリーポイント。ハンドラー配列で静的配信とAPIを切り替え。
- `src/config.ts` — ディレクトリやポートなどの設定を一箇所に集約。
- `src/http/api.ts` — Todo APIのルーティングとエラーハンドリング。
- `src/http/static.ts` — `public/` 配下の静的ファイルを安全に返却。
- `src/todoService.ts` — ファイルストレージを扱うドメインサービス。

シンプルな構成ですが、関心ごとを分離したことでファイルを追いやすくなっています。

## 環境変数

- `PORT` — 既定 `5173`
- `TODO_DATA_PATH` — 既定 `data/todos.json`
- `PUBLIC_DIR` — 既定 `public/`

## API（参考）

- `GET /api/todos`
- `POST /api/todos` `{ "title": "..." }`
- `PATCH /api/todos/:id`（完了/未完了トグル）
- `DELETE /api/todos/:id`
- `DELETE /api/todos`（全削除）
