-- הרצה חד-פעמית ב-Supabase SQL editor
-- גרסה 2: מבנה עם טבלת סוגי אימונים, תרגילים לכל סוג, אימונים בפועל (לפי תאריך) ותרגילים שבוצעו בכל אימון

create extension if not exists "pgcrypto";

-- מאפשר להריץ את הסקריפט הזה מחדש בבטחה אם משהו נכשל באמצע
drop table if exists session_items cascade;
drop table if exists workout_sessions cascade;
drop table if exists exercises cascade;
drop table if exists workout_types cascade;

-- סוגי האימונים (אימון אחד / שתיים / שלוש)
create table if not exists workout_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null
);

-- רשימת התרגילים של כל סוג אימון, כולל המשקל הנוכחי לכל תרגיל
create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  workout_type_id uuid not null references workout_types(id) on delete cascade,
  slot_order int not null,
  name text not null,
  muscle_group text,
  weight numeric,
  active boolean not null default true
);

-- אימון בפועל שבוצע בתאריך מסוים (נוצר בלחיצה על "התחל")
create table if not exists workout_sessions (
  id uuid primary key default gen_random_uuid(),
  workout_type_id uuid not null references workout_types(id) on delete cascade,
  session_date date not null,
  created_at timestamptz not null default now(),
  unique (workout_type_id, session_date)
);

-- מה בוצע בפועל בכל אימון: תרגיל, המשקל שהיה רשום באותו רגע, וסימון בוצע/לא
create table if not exists session_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references workout_sessions(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  weight numeric,
  completed boolean not null default false,
  unique (session_id, exercise_id)
);

-- מדיניות גישה פתוחה (אפליקציה אישית, ללא התחברות משתמשים)
alter table workout_types enable row level security;
alter table exercises enable row level security;
alter table workout_sessions enable row level security;
alter table session_items enable row level security;

create policy "public all workout_types" on workout_types for all using (true) with check (true);
create policy "public all exercises" on exercises for all using (true) with check (true);
create policy "public all workout_sessions" on workout_sessions for all using (true) with check (true);
create policy "public all session_items" on session_items for all using (true) with check (true);

-- שלושת סוגי האימונים
insert into workout_types (name, sort_order) values
('אימון אחד', 1);

-- 14 התרגילים לכל אחד משלושת האימונים (תרגיל #1 משתנה בין הסוגים)
insert into exercises (workout_type_id, slot_order, name, muscle_group, weight)
select id, 1, 'סקוואט גובלט (דמבל)', 'רגל קדמית / עכוז', null::numeric from workout_types where sort_order = 1;

insert into exercises (workout_type_id, slot_order, name, muscle_group, weight)
select id, s.slot, s.name, s.muscle, null::numeric
from workout_types, (values
  (2,  'לחיצת חזה במכונה', 'חזה'),
  (3,  'פולי עליון', 'גב עליון'),
  (4,  'חתירה בכבל בישיבה - גב ישר', 'גב אמצעי'),
  (5,  'Face Pull בכבל', 'כתף אחורית'),
  (6,  'לחיצת כתפיים במכונה', 'כתפיים'),
  (7,  'כפיפת ברכיים במכונה', 'האמסטרינג'),
  (8,  'מכונת Hip Abduction', 'הרחקת ירך'),
  (9,  'כפיפת מרפקים במכונה', 'יד קדמית'),
  (10, 'פשיטת מרפקים בדמבל מעל הראש', 'יד אחורית'),
  (11, 'הרמת עקבים במכונה', 'שוקיים'),
  (12, 'פלאנק', 'ליבה קדמית'),
  (13, 'פלאנק צידי', 'ליבה צידית'),
  (14, 'הליכת חקלאי (Farmer''s Walk)', 'אחיזה / יציבות')
) as s(slot, name, muscle);
