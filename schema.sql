-- ۱. ساخت جدول مجموعه‌ها (Folders)
create table if not exists folders (
  id bigint primary key, -- شناسه عددی منطبق بر Timestamp جاوااسکریپت
  user_id uuid references auth.users not null, -- متصل به شناسه کاربر وارد شده
  name text not null,
  updated_at bigint default 0 not null,
  is_phrase boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ۲. ساخت جدول کلمات (Words)
create table if not exists words (
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
drop policy if exists "Users can manage their own folders" on folders;
create policy "Users can manage their own folders" 
on folders for all 
using (auth.uid() = user_id);

drop policy if exists "Users can manage their own words" on words;
create policy "Users can manage their own words" 
on words for all 
using (auth.uid() = user_id);

-- ۵. جدول اشتراک‌های نوتیفیکیشن (Push Subscriptions)
create table if not exists push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users, -- ساختار Nullable برای کاربران مهمان
  subscription jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- فعال‌سازی امنیت برای جدول جدید
alter table push_subscriptions enable row level security;

-- تعریف دسترسی‌ها برای جدول جدید
drop policy if exists "Users can manage their own subscriptions" on push_subscriptions;

-- سیاست برای کاربران عضو شده
create policy "Authenticated users can manage their own"
on push_subscriptions for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- سیاست برای عضویت مهمان (ثبت نام نوتیفیکیشن قبل از لاگین)
create policy "Allow insert for all"
on push_subscriptions for insert
to anon, authenticated
with check (user_id is null or auth.uid() = user_id);

-- سیاست برای مشاهده و آپدیت مهمان بر اساس شناسه نال یا فیلتر خودشان
create policy "Allow select and update for all"
on push_subscriptions for select
to anon, authenticated
using (user_id is null or auth.uid() = user_id);

create policy "Allow update for all"
on push_subscriptions for update
to anon, authenticated
using (user_id is null or auth.uid() = user_id)
with check (user_id is null or auth.uid() = user_id);

create policy "Allow delete for all"
on push_subscriptions for delete
to anon, authenticated
using (user_id is null or auth.uid() = user_id);

-- ۶. تابع حذف حساب کاربری و تمامی داده‌های مربوط به آن
create or replace function delete_user()
returns void as $$
begin
  -- حذف تمامی اشتراک‌های نوتیفیکیشن
  delete from public.push_subscriptions where user_id = auth.uid();
  -- حذف تمامی کلمات کاربر
  delete from public.words where user_id = auth.uid();
  -- حذف تمامی مجموعه‌های کاربر
  delete from public.folders where user_id = auth.uid();
  -- حذف خود کاربر از auth.users
  delete from auth.users where id = auth.uid();
end;
$$ language plpgsql security definer;


