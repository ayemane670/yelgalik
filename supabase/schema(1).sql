-- ============================================================
-- YELGALIK (يلقالك) — FULL DATABASE SCHEMA
-- Postgres / Supabase
-- Run this once in Supabase SQL Editor (or via `supabase db push`)
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm; -- for fuzzy text search on product names

-- ---------------------------------------------------------
-- CITIES
-- ---------------------------------------------------------
create table cities (
  id serial primary key,
  name_ar text not null,
  name_fr text,
  wilaya_code smallint not null,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------
create table categories (
  id serial primary key,
  name_ar text not null,
  name_fr text,
  icon text,               -- lucide icon name
  parent_id int references categories(id),
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- USERS (extends Supabase auth.users)
-- ---------------------------------------------------------
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text unique,
  phone_verified boolean default false,
  city_id int references cities(id),
  avatar_url text,
  bio text,
  is_verified boolean default false,       -- "حساب موثق"
  is_admin boolean default false,
  is_banned boolean default false,
  rating_avg numeric(2,1) default 0,
  rating_count int default 0,
  deals_count int default 0,               -- عدد الصفقات المكتملة
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_users_city on users(city_id);

-- ---------------------------------------------------------
-- REQUESTS  ("أبحث عن")
-- ---------------------------------------------------------
create table requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  category_id int references categories(id),
  title text not null,                      -- اسم المنتج المطلوب (خام كما كتبه المستخدم)
  normalized_title text,                    -- بعد التطبيع (lowercase, بدون تشكيل) لتحسين المطابقة
  max_budget numeric(12,2) not null,
  city_id int references cities(id),
  accepted_condition text check (accepted_condition in ('new','like_new','good','used','any')) default 'any',
  quantity int default 1,
  specs jsonb default '{}'::jsonb,          -- {"ram":"16GB","storage":"256GB"}
  notes text,
  image_url text,
  status text check (status in ('active','matched','closed','expired')) default 'active',
  is_featured boolean default false,
  featured_until timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_requests_category on requests(category_id);
create index idx_requests_city on requests(city_id);
create index idx_requests_status on requests(status);
create index idx_requests_title_trgm on requests using gin (normalized_title gin_trgm_ops);

-- ---------------------------------------------------------
-- PRODUCTS  ("أبيع")
-- ---------------------------------------------------------
create table products (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  category_id int references categories(id),
  title text not null,
  normalized_title text,
  price numeric(12,2) not null,
  city_id int references cities(id),
  condition text check (condition in ('new','like_new','good','used')) default 'good',
  quantity int default 1,
  specs jsonb default '{}'::jsonb,
  description text,
  images text[] default '{}',
  status text check (status in ('active','sold','closed','expired')) default 'active',
  is_featured boolean default false,
  featured_until timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_products_category on products(category_id);
create index idx_products_city on products(city_id);
create index idx_products_status on products(status);
create index idx_products_title_trgm on products using gin (normalized_title gin_trgm_ops);

-- ---------------------------------------------------------
-- MATCHES  (نتيجة خوارزمية المطابقة، مخزّنة لتفادي إعادة الحساب)
-- ---------------------------------------------------------
create table matches (
  id uuid primary key default uuid_generate_v4(),
  request_id uuid not null references requests(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  score int not null check (score between 0 and 100),
  status text check (status in ('suggested','contacted','accepted','rejected')) default 'suggested',
  created_at timestamptz default now(),
  unique(request_id, product_id)
);
create index idx_matches_request on matches(request_id);
create index idx_matches_product on matches(product_id);
create index idx_matches_score on matches(score desc);

-- ---------------------------------------------------------
-- CONTACT REQUESTS (قبل كشف الاتصال بين طرفين)
-- ---------------------------------------------------------
create table contact_requests (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references matches(id) on delete cascade,
  from_user_id uuid not null references users(id),
  to_user_id uuid not null references users(id),
  status text check (status in ('pending','accepted','declined')) default 'pending',
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- MESSAGES (Chat داخلي)
-- ---------------------------------------------------------
create table conversations (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references matches(id),
  user_a uuid not null references users(id),
  user_b uuid not null references users(id),
  created_at timestamptz default now(),
  unique(user_a, user_b, match_id)
);

create table messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references users(id),
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);
create index idx_messages_conversation on messages(conversation_id, created_at);

-- ---------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  type text check (type in ('new_match','new_message','contact_request','contact_accepted','system')) not null,
  title text not null,
  body text,
  ref_id uuid,              -- request_id / product_id / match_id / conversation_id
  is_read boolean default false,
  created_at timestamptz default now()
);
create index idx_notifications_user on notifications(user_id, is_read);

-- ---------------------------------------------------------
-- REVIEWS (تقييم المستخدم بعد الصفقة)
-- ---------------------------------------------------------
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references matches(id),
  reviewer_id uuid not null references users(id),
  reviewed_id uuid not null references users(id),
  rating smallint check (rating between 1 and 5) not null,
  comment text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- REPORTS (بلاغات)
-- ---------------------------------------------------------
create table reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references users(id),
  reported_user_id uuid references users(id),
  reported_request_id uuid references requests(id),
  reported_product_id uuid references products(id),
  reason text not null,
  details text,
  status text check (status in ('open','reviewing','resolved','dismissed')) default 'open',
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- BLOCKS
-- ---------------------------------------------------------
create table blocks (
  id uuid primary key default uuid_generate_v4(),
  blocker_id uuid not null references users(id),
  blocked_id uuid not null references users(id),
  created_at timestamptz default now(),
  unique(blocker_id, blocked_id)
);

-- ---------------------------------------------------------
-- SUBSCRIPTIONS (خطط مستقبلية للبائعين المحترفين)
-- ---------------------------------------------------------
create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id),
  plan text check (plan in ('free','seller_pro')) default 'free',
  starts_at timestamptz default now(),
  ends_at timestamptz,
  status text check (status in ('active','cancelled','expired')) default 'active',
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- PAYMENTS (Featured listings, subscriptions)
-- ---------------------------------------------------------
create table payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id),
  amount numeric(12,2) not null,
  currency text default 'DZD',
  purpose text check (purpose in ('featured_request','featured_product','subscription')) not null,
  ref_id uuid,               -- request_id / product_id / subscription_id
  status text check (status in ('pending','completed','failed','refunded')) default 'pending',
  provider text,              -- 'edahabia','cib','manual'
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- ADMIN ACTIONS (سجل نشاط الإدارة)
-- ---------------------------------------------------------
create table admin_actions (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null references users(id),
  action text not null,          -- 'ban_user','delete_product','resolve_report'...
  target_type text,
  target_id uuid,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table users enable row level security;
alter table requests enable row level security;
alter table products enable row level security;
alter table matches enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table reports enable row level security;
alter table reviews enable row level security;
alter table blocks enable row level security;
alter table contact_requests enable row level security;

-- USERS: everyone can read basic profile info, only owner can update
create policy "users_select_all" on users for select using (true);
create policy "users_update_own" on users for update using (auth.uid() = id);
create policy "users_insert_own" on users for insert with check (auth.uid() = id);

-- REQUESTS: public read (active only) + owner full access
create policy "requests_select_active" on requests for select using (status = 'active' or user_id = auth.uid());
create policy "requests_insert_own" on requests for insert with check (user_id = auth.uid());
create policy "requests_update_own" on requests for update using (user_id = auth.uid());
create policy "requests_delete_own" on requests for delete using (user_id = auth.uid());

-- PRODUCTS: same pattern
create policy "products_select_active" on products for select using (status = 'active' or user_id = auth.uid());
create policy "products_insert_own" on products for insert with check (user_id = auth.uid());
create policy "products_update_own" on products for update using (user_id = auth.uid());
create policy "products_delete_own" on products for delete using (user_id = auth.uid());

-- MATCHES: visible to owners of either side
create policy "matches_select_related" on matches for select using (
  exists (select 1 from requests r where r.id = request_id and r.user_id = auth.uid())
  or exists (select 1 from products p where p.id = product_id and p.user_id = auth.uid())
);

-- CONVERSATIONS / MESSAGES: only participants
create policy "conversations_select_own" on conversations for select using (auth.uid() in (user_a, user_b));
create policy "messages_select_own" on messages for select using (
  exists (select 1 from conversations c where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b))
);
create policy "messages_insert_own" on messages for insert with check (sender_id = auth.uid());

-- NOTIFICATIONS: only own
create policy "notifications_select_own" on notifications for select using (user_id = auth.uid());
create policy "notifications_update_own" on notifications for update using (user_id = auth.uid());

-- REPORTS: reporter can insert, only admins read all (handled via service role in admin panel)
create policy "reports_insert_own" on reports for insert with check (reporter_id = auth.uid());

-- REVIEWS: public read, owner insert
create policy "reviews_select_all" on reviews for select using (true);
create policy "reviews_insert_own" on reviews for insert with check (reviewer_id = auth.uid());

-- BLOCKS: only own
create policy "blocks_select_own" on blocks for select using (blocker_id = auth.uid());
create policy "blocks_insert_own" on blocks for insert with check (blocker_id = auth.uid());

-- CONTACT REQUESTS
create policy "contact_requests_select_related" on contact_requests for select using (auth.uid() in (from_user_id, to_user_id));
create policy "contact_requests_insert_own" on contact_requests for insert with check (from_user_id = auth.uid());
create policy "contact_requests_update_related" on contact_requests for update using (to_user_id = auth.uid());

-- ============================================================
-- SEED DATA: categories & cities (starter set)
-- ============================================================
insert into cities (name_ar, name_fr, wilaya_code) values
('أدرار','Adrar',1),
('الشلف','Chlef',2),
('الأغواط','Laghouat',3),
('أم البواقي','Oum El Bouaghi',4),
('باتنة','Batna',5),
('بجاية','Bejaia',6),
('بسكرة','Biskra',7),
('بشار','Bechar',8),
('البليدة','Blida',9),
('البويرة','Bouira',10),
('تمنراست','Tamanrasset',11),
('تبسة','Tebessa',12),
('تلمسان','Tlemcen',13),
('تيارت','Tiaret',14),
('تيزي وزو','Tizi Ouzou',15),
('الجزائر العاصمة','Alger',16),
('الجلفة','Djelfa',17),
('جيجل','Jijel',18),
('سطيف','Setif',19),
('سعيدة','Saida',20),
('سكيكدة','Skikda',21),
('سيدي بلعباس','Sidi Bel Abbes',22),
('عنابة','Annaba',23),
('قالمة','Guelma',24),
('قسنطينة','Constantine',25),
('المدية','Medea',26),
('مستغانم','Mostaganem',27),
('المسيلة','M''Sila',28),
('معسكر','Mascara',29),
('ورقلة','Ouargla',30),
('وهران','Oran',31),
('البيض','El Bayadh',32),
('إليزي','Illizi',33),
('برج بوعريريج','Bordj Bou Arreridj',34),
('بومرداس','Boumerdes',35),
('الطارف','El Tarf',36),
('تندوف','Tindouf',37),
('تيسمسيلت','Tissemsilt',38),
('الوادي','El Oued',39),
('خنشلة','Khenchela',40),
('سوق أهراس','Souk Ahras',41),
('تيبازة','Tipaza',42),
('ميلة','Mila',43),
('عين الدفلى','Ain Defla',44),
('النعامة','Naama',45),
('عين تموشنت','Ain Temouchent',46),
('غرداية','Ghardaia',47),
('غليزان','Relizane',48),
('تيميمون','Timimoun',49),
('برج باجي مختار','Bordj Badji Mokhtar',50),
('أولاد جلال','Ouled Djellal',51),
('بني عباس','Beni Abbes',52),
('إن صالح','In Salah',53),
('إن قزام','In Guezzam',54),
('توقرت','Touggourt',55),
('جانت','Djanet',56),
('المغير','El M''Ghair',57),
('المنيعة','El Meniaa',58);

insert into categories (name_ar, name_fr, icon) values
('هواتف','Telephones','smartphone'),
('حواسيب ولابتوب','Ordinateurs','laptop'),
('سيارات','Voitures','car'),
('عقارات','Immobilier','home'),
('أثاث منزلي','Meubles','sofa'),
('ملابس','Vetements','shirt'),
('إلكترونيات','Electronique','tv'),
('ألعاب فيديو','Jeux video','gamepad-2'),
('أخرى','Autre','more-horizontal');
