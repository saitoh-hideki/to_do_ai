-- pgvector拡張機能を有効化
create extension if not exists vector;

-- ドキュメントテーブルの作成
create table if not exists documents (
  id bigint primary key generated always as identity,
  content text not null,
  embedding vector(1536),  -- OpenAI text-embedding-3-small の次元数
  metadata jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ベクトル検索用のインデックスを作成
create index if not exists documents_embedding_idx on documents
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- ドキュメント検索用の関数を作成
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id bigint,
  content text,
  similarity float,
  metadata jsonb
)
language sql stable
as $$
  select
    id,
    content,
    1 - (embedding <=> query_embedding) as similarity,
    metadata
  from documents
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

-- 内部チャットメッセージテーブルの作成
create table if not exists internal_chat_messages (
  id bigint primary key generated always as identity,
  content text not null,
  username text not null,
  created_at timestamp with time zone default now()
);

-- RLSポリシーの設定
alter table documents enable row level security;
alter table internal_chat_messages enable row level security;

-- 認証済みユーザーのみ読み取り可能に
create policy "認証済みユーザーは全てのドキュメントを読める"
  on documents for select
  to authenticated
  using (true);

create policy "認証済みユーザーは全てのメッセージを読める"
  on internal_chat_messages for select
  to authenticated
  using (true);

create policy "認証済みユーザーはメッセージを投稿できる"
  on internal_chat_messages for insert
  to authenticated
  with check (true); 