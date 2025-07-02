-- companiesテーブルの作成
create table if not exists companies (
  id bigint primary key generated always as identity,
  name text not null,
  business text,
  ceo text,
  established text,
  philosophy text,
  summary text,
  created_at timestamp with time zone default now()
);

alter table companies enable row level security;

create policy "Public access for companies"
  on companies for all
  to anon, authenticated
  using (true)
  with check (true); 