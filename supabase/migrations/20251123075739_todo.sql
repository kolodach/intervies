-- Create a "tasks" table with a user_id column that maps to a Clerk user ID
create table tasks(
  id serial primary key,
  name text not null,
  user_id text not null default auth.jwt()->>'sub'
);

-- Enable RLS on the table
alter table "tasks" enable row level security;

create policy "User can view their own tasks"
on "public"."tasks"
for select
to authenticated
using (
((select auth.jwt()->>'sub') = (user_id)::text)
);

create policy "Users must insert their own tasks"
on "public"."tasks"
as permissive
for insert
to authenticated
with check (
((select auth.jwt()->>'sub') = (user_id)::text)
);