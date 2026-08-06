-- ═══════════════════════════════════════════════════════════════
--  ALTER — SITE_IMAGES.sql
--
--  Run this once in the Supabase SQL editor. It is safe to run again:
--  it never overwrites a photo you have already uploaded, it only adds
--  any missing slots and refreshes the labels.
--
--  After running it, open the admin and go to Website Images. Every
--  photo spot on the website will be listed, grouped by page.
-- ═══════════════════════════════════════════════════════════════

-- 1. the table ---------------------------------------------------
create table if not exists public.site_images (
  key         text primary key,
  label       text,
  page        text,
  hint        text,
  sort_order  int default 0,
  url         text,
  updated_at  timestamptz default now()
);

-- columns added since the first version
alter table public.site_images add column if not exists page       text;
alter table public.site_images add column if not exists hint       text;
alter table public.site_images add column if not exists sort_order int default 0;

-- 2. who can read and write it -----------------------------------
alter table public.site_images enable row level security;

drop policy if exists "site_images public read" on public.site_images;
create policy "site_images public read"
  on public.site_images for select
  to anon, authenticated
  using (true);

drop policy if exists "site_images admin write" on public.site_images;
create policy "site_images admin write"
  on public.site_images for all
  to authenticated
  using (true)
  with check (true);

-- 3. the storage bucket the admin uploads into --------------------
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do update set public = true;

drop policy if exists "site-images public read" on storage.objects;
create policy "site-images public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'site-images');

drop policy if exists "site-images admin write" on storage.objects;
create policy "site-images admin write"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'site-images')
  with check (bucket_id = 'site-images');

-- 4. every photo slot on the website (42 in total) ------------------------------
--    Adding a row here makes it appear in the admin. Deleting a row
--    removes it from the admin but not from the website markup.
insert into public.site_images (key, label, page, hint, sort_order) values
  -- Home page ---------------------------------------------------
  ('hero_bg',        'Hero, main photo',              'Home',       'Fills the whole screen behind BIKINI BUILD. Upright photo, at least 1600 x 2000. Leave room at the bottom, the words sit there.', 10),
  ('hero_feature',   'Hero, second photo',            'Home',       'Sits beside the first one on a laptop. Hidden on phones. Upright, at least 1600 x 2000.', 20),
  ('program_1',      'Program card, Glute Build',     'Home',       'Upright 3:4, about 900 x 1200. The program name sits over the top left corner.', 30),
  ('program_2',      'Program card, Foundations',     'Home',       'Upright 3:4, about 900 x 1200.', 40),
  ('program_3',      'Program card, Two Day Minimum', 'Home',       'Upright 3:4, about 900 x 1200.', 50),
  ('program_4',      'Program card, Home Strength',   'Home',       'Upright 3:4, about 900 x 1200.', 60),
  ('recipe_1',       'Recipe, strawberry oats',       'Home',       'Square, about 1000 x 1000. Shot from above works best.', 70),
  ('recipe_2',       'Recipe, hot honey beef bowl',   'Home',       'Square, about 1000 x 1000.', 80),
  ('recipe_3',       'Recipe, chilli chicken pasta',  'Home',       'Square, about 1000 x 1000.', 90),
  ('home_walk',      'The Sunday walk',               'Home',       'Wide 16:10, about 1600 x 1000. A group shot from the walk.', 100),
  ('founder',        'Roxy, home page portrait',      'Home',       'Upright 4:5, about 1000 x 1250. Also used on the blog article.', 110),
  ('pilates_popup',  'Pilates in the Park popup',     'Home',       'Wide 16:9, about 1200 x 675. Shows at the top of the launch popup.', 120),

  -- App screenshots ---------------------------------------------
  ('app_today',      'Screenshot, Today',             'App screens','A phone screenshot, straight from your iPhone. No frame needed, the website adds one.', 200),
  ('app_tracker',    'Screenshot, Tracker',           'App screens','Phone screenshot.', 210),
  ('app_form',       'Screenshot, Form library',      'App screens','Phone screenshot.', 220),
  ('app_fuel',       'Screenshot, Fuel',              'App screens','Phone screenshot.', 230),
  ('app_cycle',      'Screenshot, Cycle',             'App screens','Phone screenshot.', 240),
  ('app_programs',   'Screenshot, Program picker',    'App screens','Phone screenshot. Used on the Features page.', 250),
  ('app_progress',   'Screenshot, Progress',          'App screens','Phone screenshot. Used on the Features page.', 260),
  ('app_warmup',     'Screenshot, Warm up',           'App screens','Phone screenshot. Used on the Features page.', 270),
  ('app_grocery',    'Screenshot, Grocery list',      'App screens','Phone screenshot. Used on the Features page.', 280),
  ('app_week',       'Screenshot, The week',          'App screens','Phone screenshot. Used on the Features page.', 290),

  -- Challenges page ----------------------------------------------
  ('ch_hero',        'Why challenges work',           'Challenges', 'Upright 4:5, about 1000 x 1250. Community or training energy.', 300),
  ('ch_build',       'Bikini Build cover',            'Challenges', 'Wide 16:10, about 1600 x 1000.', 310),
  ('ch_shred',       'Summer Shred cover',            'Challenges', 'Wide 16:10, about 1600 x 1000.', 320),
  ('ch_recomp',      'Body Recomp cover',             'Challenges', 'Wide 16:10, about 1600 x 1000.', 330),
  ('ch_strong',      'Strong cover',                  'Challenges', 'Wide 16:10, about 1600 x 1000.', 340),
  ('ch_back',        'Back On Track cover',           'Challenges', 'Wide 16:10, about 1600 x 1000.', 350),
  ('amb_build',      'Bikini Build host',             'Challenges', 'Square headshot, about 400 x 400. Shown as a small circle.', 360),
  ('amb_shred',      'Summer Shred host',             'Challenges', 'Square headshot, about 400 x 400.', 370),
  ('amb_recomp',     'Body Recomp host',              'Challenges', 'Square headshot, about 400 x 400.', 380),
  ('amb_strong',     'Strong host',                   'Challenges', 'Square headshot, about 400 x 400.', 390),
  ('amb_back',       'Back On Track host',            'Challenges', 'Square headshot, about 400 x 400.', 400),

  -- Challenge and program pages ------------------------------------
  ('build_hero',     'Bikini Build hero, main',       'Bikini Build','Fills the screen behind the title. Upright, at least 1600 x 2000. Keep the bottom third fairly plain.', 410),
  ('build_hero_2',   'Bikini Build hero, second',     'Bikini Build','Shown beside the first on a laptop only. Upright, at least 1600 x 2000.', 420),
  ('build_training', 'Bikini Build, the training',    'Bikini Build','Upright 4:5, about 1000 x 1250. Someone lifting.', 430),
  ('build_food',     'Bikini Build, the food',        'Bikini Build','Upright 4:5, about 1000 x 1250.', 440),
  ('shred_hero',     'Summer Shred cover',            'Summer Shred','Wide 16:10, about 1600 x 1000.', 450),
  ('glutes_hero',    'Glute training cover',          'Glute training','Wide 16:10, about 1600 x 1000. A gym shot works best.', 460),
  ('glutes_form',    'Form library screenshot',       'Glute training','A phone screenshot of a form guide.', 470),

  -- About + blog --------------------------------------------------
  ('about_roxy',     'Roxy, About page portrait',     'About',      'Upright 4:5, about 1000 x 1250. Your name sits over the bottom of it.', 500),
  ('post_overload',  'Blog card, progressive overload','Blog',      'Wide 16:10, about 1600 x 1000.', 600)
on conflict (key) do update set
  label      = excluded.label,
  page       = excluded.page,
  hint       = excluded.hint,
  sort_order = excluded.sort_order;
-- note: url is deliberately not touched, so re-running never wipes a photo.

-- 5. check it worked ----------------------------------------------
select page, count(*) as slots, count(url) as filled
from public.site_images
group by page
order by min(sort_order);
