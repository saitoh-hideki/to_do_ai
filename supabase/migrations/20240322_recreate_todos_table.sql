-- ToDoテーブルの作成
create table if not exists todos (
  id bigint primary key generated always as identity,
  text text not null,
  completed boolean default false,
  status text not null default 'todo',
  memo text,
  created_at timestamp with time zone default now()
);

-- RLS (Row Level Security)ポリシーの設定
alter table todos enable row level security;

-- 匿名ユーザーを含むすべてのユーザーがToDoを操作できるようにするポリシー
-- これにより、ログインしていなくてもToDoリスト機能が利用できます。
create policy "Public access for todos"
  on todos for all
  to anon, authenticated
  using (true)
  with check (true); 