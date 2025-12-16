const $ = (id) => document.getElementById(id);
const listEl = $("list");
const statusEl = $("status");
const inputEl = $("title");
const formEl = $("form");
const clearEl = $("clear");

const api = {
  list: () => fetch("/api/todos").then((r) => r.json()),
  add: (title) =>
    fetch("/api/todos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title }),
    }).then((r) => r.json()),
  toggle: (id) => fetch("/api/todos/" + id, { method: "PATCH" }).then((r) => r.json()),
  del: (id) => fetch("/api/todos/" + id, { method: "DELETE" }).then((r) => r.json()),
  clear: () => fetch("/api/todos", { method: "DELETE" }).then((r) => r.json()),
};

function setStatus(text) {
  statusEl.textContent = text || "";
}

function render(todos) {
  listEl.innerHTML = "";
  for (const t of todos) {
    const li = document.createElement("li");
    li.className = t.status === "done" ? "done" : "";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = t.status === "done";
    checkbox.addEventListener("change", async () => {
      await api.toggle(t.id);
      await refresh();
    });

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = t.title;

    const del = document.createElement("button");
    del.type = "button";
    del.className = "danger";
    del.textContent = "削除";
    del.addEventListener("click", async () => {
      await api.del(t.id);
      await refresh();
    });

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

