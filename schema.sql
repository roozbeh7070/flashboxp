-- ۱. ساخت جدول مجموعه‌ها (Folders)
create table folders (
  id bigint primary key, -- شناسه عددی منطبق بر Timestamp جاوااسکریپت
  user_id uuid references auth.users not null, -- متصل به شناسه کاربر وارد شده
  name text not null,
  updated_at bigint default 0 not null,
  is_phrase boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ۲. ساخت جدول کلمات (Words)
create table words (
  id bigint primary key, -- شناسه عددی منطبق بر Timestamp جاوااسکریپت
  folder_id bigint references folders(id) on delete cascade not null, -- متصل به پوشه مربوطه
  user_id uuid references auth.users not null,
  eng text not null,
  per text not null,
  failed boolean default false not null,
  success boolean default false not null,
  updated_at bigint default 0 not null,
  is_phrase boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ۳. فعال‌سازی امنیت دیتابیس (Row Level Security - RLS)
alter table folders enable row level security;
alter table words enable row level security;

-- ۴. تعریف دسترسی‌ها (Policies)
create policy "Users can manage their own folders" 
on folders for all 
using (auth.uid() = user_id);

create policy "Users can manage their own words" 
on words for all 
using (auth.uid() = user_id);
