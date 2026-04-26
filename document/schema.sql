-- ============================================================
-- MULTI-TENANT EVENT APP PLATFORM — SUPABASE SCHEMA
-- Version: 1.0
-- Description: 1 Supabase project, N brands, fully isolated via RLS
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for text search on product names


-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('super_admin', 'brand_admin', 'brand_editor');
create type product_status as enum ('draft', 'active', 'archived');
create type asset_type as enum ('logo', 'banner', 'product_image', 'background', 'icon');
create type notif_level as enum ('info', 'success', 'warning', 'error');


-- ============================================================
-- TABLE: brands
-- Core config for each brand/client
-- ============================================================
create table brands (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text not null unique,          -- dùng làm subdomain: brandA.yourapp.com
  is_active     boolean not null default true,

  -- Visual identity
  logo_url      text,
  favicon_url   text,
  primary_color text not null default '#000000',
  secondary_color text,
  accent_color  text,
  font_family   text default 'Inter',          -- Google Font name hoặc system font

  -- Header config
  header_config jsonb not null default '{
    "title": "",
    "show_logo": true,
    "bg_color": "#ffffff",
    "text_color": "#000000",
    "links": []
  }'::jsonb,
  -- footer_config.links = [{label, url}]
  footer_config jsonb not null default '{
    "copyright": "",
    "bg_color": "#f5f5f5",
    "text_color": "#666666",
    "social_links": [],
    "links": []
  }'::jsonb,

  -- Notification defaults for this brand
  notif_config  jsonb not null default '{
    "accent_color": "#0070f3",
    "position": "top-right",
    "duration_ms": 4000
  }'::jsonb,

  -- Event metadata
  event_name    text,
  event_date    date,
  event_location text,
  event_config  jsonb default '{}'::jsonb,     -- flexible per-event settings

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table brands is 'One row per brand/client. All visual and config data lives here.';
comment on column brands.slug is 'URL-safe identifier. Used for subdomain routing, storage folder naming.';
comment on column brands.header_config is 'JSON config for shared header component. Rendered by app shell.';
comment on column brands.notif_config is 'Default notification styling for this brand.';


-- ============================================================
-- TABLE: brand_users
-- Maps Supabase Auth users to brands with a role
-- ============================================================
create table brand_users (
  id         uuid primary key default uuid_generate_v4(),
  brand_id   uuid not null references brands(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       user_role not null default 'brand_editor',
  created_at timestamptz not null default now(),
  unique(brand_id, user_id)
);

comment on table brand_users is 'Links auth users to brands. A super_admin can manage all brands.';


-- ============================================================
-- TABLE: product_categories
-- Optional taxonomy per brand
-- ============================================================
create table product_categories (
  id          uuid primary key default uuid_generate_v4(),
  brand_id    uuid not null references brands(id) on delete cascade,
  name        text not null,
  slug        text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  unique(brand_id, slug)
);

comment on table product_categories is 'Optional product grouping per brand.';


-- ============================================================
-- TABLE: products
-- Core product data, tied to a brand
-- ============================================================
create table products (
  id            uuid primary key default uuid_generate_v4(),
  brand_id      uuid not null references brands(id) on delete cascade,
  category_id   uuid references product_categories(id) on delete set null,

  name          text not null,
  slug          text not null,
  description   text,
  short_desc    text,                          -- used for cards/thumbnails
  status        product_status not null default 'draft',

  -- Primary display image
  image_url     text,
  thumbnail_url text,

  -- Flexible product data (ingredients, specs, pricing, etc.)
  metadata      jsonb not null default '{}'::jsonb,

  -- Ordering/display
  sort_order    int not null default 0,
  is_featured   boolean not null default false,

  -- SEO
  seo_title     text,
  seo_description text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(brand_id, slug)
);

comment on table products is 'Product data per brand. image_url points to Supabase Storage path.';
comment on column products.metadata is 'Flexible JSON: e.g. { ingredients: [], price: 0, specs: {} }';


-- ============================================================
-- TABLE: product_assets
-- Multiple images/files per product
-- ============================================================
create table product_assets (
  id           uuid primary key default uuid_generate_v4(),
  product_id   uuid not null references products(id) on delete cascade,
  brand_id     uuid not null references brands(id) on delete cascade,  -- denorm for RLS
  asset_type   asset_type not null default 'product_image',
  url          text not null,                  -- Supabase Storage public URL
  storage_path text not null,                  -- brands/{slug}/products/{id}/{filename}
  alt_text     text,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

comment on table product_assets is 'All media assets for a product. brand_id denormalized for RLS efficiency.';


-- ============================================================
-- TABLE: brand_assets
-- Brand-level assets: logo, banner, background, etc.
-- ============================================================
create table brand_assets (
  id           uuid primary key default uuid_generate_v4(),
  brand_id     uuid not null references brands(id) on delete cascade,
  asset_type   asset_type not null,
  url          text not null,
  storage_path text not null,                  -- brands/{slug}/{asset_type}/{filename}
  label        text,                           -- e.g. "Main Logo", "Dark Mode Logo"
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

comment on table brand_assets is 'Brand-level visual assets. Upload new logo here, brands.logo_url updates accordingly.';


-- ============================================================
-- TABLE: notifications
-- System-wide or brand-specific broadcast messages
-- ============================================================
create table notifications (
  id           uuid primary key default uuid_generate_v4(),
  brand_id     uuid references brands(id) on delete cascade, -- null = global (super_admin only)
  level        notif_level not null default 'info',
  title        text not null,
  body         text,
  cta_label    text,
  cta_url      text,
  is_active    boolean not null default true,
  show_from    timestamptz,
  show_until   timestamptz,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now()
);

comment on table notifications is 'brand_id = NULL means global broadcast visible to all brands.';


-- ============================================================
-- TABLE: audit_log
-- Track all admin actions for accountability
-- ============================================================
create table audit_log (
  id           bigserial primary key,
  brand_id     uuid references brands(id) on delete set null,
  user_id      uuid references auth.users(id) on delete set null,
  action       text not null,                  -- e.g. 'product.create', 'brand.update_logo'
  table_name   text,
  record_id    uuid,
  old_data     jsonb,
  new_data     jsonb,
  ip_address   text,
  created_at   timestamptz not null default now()
);

comment on table audit_log is 'Immutable log of all admin changes. Never delete rows.';


-- ============================================================
-- INDEXES
-- ============================================================
create index idx_brands_slug            on brands(slug);
create index idx_brands_is_active       on brands(is_active);
create index idx_brand_users_user       on brand_users(user_id);
create index idx_brand_users_brand      on brand_users(brand_id);
create index idx_products_brand         on products(brand_id);
create index idx_products_brand_status  on products(brand_id, status);
create index idx_products_featured      on products(brand_id, is_featured) where is_featured = true;
create index idx_products_name_search   on products using gin(name gin_trgm_ops);
create index idx_product_assets_product on product_assets(product_id);
create index idx_brand_assets_brand     on brand_assets(brand_id, asset_type);
create index idx_notifications_brand    on notifications(brand_id, is_active);
create index idx_audit_brand_created    on audit_log(brand_id, created_at desc);


-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Helper: get current user's brand_id (used in RLS policies)
create or replace function current_brand_id()
returns uuid language sql stable as $$
  select brand_id from brand_users
  where user_id = auth.uid()
  limit 1;
$$;

-- Helper: check if current user is super_admin
create or replace function is_super_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from brand_users
    where user_id = auth.uid()
    and role = 'super_admin'
  );
$$;

-- Helper: check if current user has access to a specific brand
create or replace function has_brand_access(p_brand_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from brand_users
    where user_id = auth.uid()
    and (brand_id = p_brand_id or role = 'super_admin')
  );
$$;


-- ============================================================
-- TRIGGERS: auto updated_at
-- ============================================================
create trigger trg_brands_updated_at
  before update on brands
  for each row execute function handle_updated_at();

create trigger trg_products_updated_at
  before update on products
  for each row execute function handle_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table brands             enable row level security;
alter table brand_users        enable row level security;
alter table product_categories enable row level security;
alter table products           enable row level security;
alter table product_assets     enable row level security;
alter table brand_assets       enable row level security;
alter table notifications      enable row level security;
alter table audit_log          enable row level security;


-- ---- brands ----
create policy "brands: super_admin can do anything"
  on brands for all
  using (is_super_admin())
  with check (is_super_admin());

create policy "brands: brand_admin/editor can read own brand"
  on brands for select
  using (has_brand_access(id));

create policy "brands: brand_admin can update own brand"
  on brands for update
  using (
    exists (
      select 1 from brand_users
      where user_id = auth.uid()
      and brand_id = brands.id
      and role in ('brand_admin')
    )
  );


-- ---- brand_users ----
create policy "brand_users: super_admin full access"
  on brand_users for all
  using (is_super_admin())
  with check (is_super_admin());

create policy "brand_users: users can see own memberships"
  on brand_users for select
  using (user_id = auth.uid());


-- ---- product_categories ----
create policy "categories: access by brand"
  on product_categories for all
  using (has_brand_access(brand_id))
  with check (has_brand_access(brand_id));


-- ---- products ----
create policy "products: access by brand"
  on products for all
  using (has_brand_access(brand_id))
  with check (has_brand_access(brand_id));

-- Public read for active products (for frontend display, no auth needed)
create policy "products: public can read active"
  on products for select
  using (status = 'active');


-- ---- product_assets ----
create policy "product_assets: access by brand"
  on product_assets for all
  using (has_brand_access(brand_id))
  with check (has_brand_access(brand_id));


-- ---- brand_assets ----
create policy "brand_assets: access by brand"
  on brand_assets for all
  using (has_brand_access(brand_id))
  with check (has_brand_access(brand_id));


-- ---- notifications ----
-- Super admin can manage all; brand admin can manage their own
create policy "notifications: admin access"
  on notifications for all
  using (
    is_super_admin() or has_brand_access(brand_id)
  )
  with check (
    is_super_admin() or has_brand_access(brand_id)
  );

-- Anyone (even unauthenticated) can read active notifications for a brand
create policy "notifications: public read active"
  on notifications for select
  using (
    is_active = true
    and (show_from is null or show_from <= now())
    and (show_until is null or show_until >= now())
  );


-- ---- audit_log ----
create policy "audit_log: super_admin read all"
  on audit_log for select
  using (is_super_admin());

create policy "audit_log: brand_admin read own"
  on audit_log for select
  using (has_brand_access(brand_id));

-- Only internal functions should insert (not direct client inserts)
create policy "audit_log: service role insert"
  on audit_log for insert
  with check (true); -- restricted via Supabase service_role key in backend


-- ============================================================
-- STORAGE BUCKET SETUP
-- Run these in Supabase Dashboard > Storage, or via API
-- ============================================================
-- Folder convention:
--   brands/{brand-slug}/logo/
--   brands/{brand-slug}/banner/
--   brands/{brand-slug}/products/{product-id}/
--   brands/{brand-slug}/background/
--
-- insert into storage.buckets (id, name, public)
-- values ('brand-assets', 'brand-assets', true);


-- ============================================================
-- SEED DATA — Super Admin brand + user
-- Uncomment and replace values before running
-- ============================================================
-- insert into brands (name, slug, primary_color, header_config, footer_config)
-- values (
--   'Admin Brand',
--   'admin',
--   '#1a1a1a',
--   '{"title": "Admin Panel", "show_logo": true, "bg_color": "#ffffff", "text_color": "#000000", "links": []}'::jsonb,
--   '{"copyright": "© 2025 YourCompany", "bg_color": "#f5f5f5", "text_color": "#666666", "social_links": [], "links": []}'::jsonb
-- );

-- insert into brand_users (brand_id, user_id, role)
-- values (
--   (select id from brands where slug = 'admin'),
--   '<YOUR_AUTH_USER_UUID>',
--   'super_admin'
-- );


-- ============================================================
-- EXAMPLE: Add a new brand (Brand A)
-- ============================================================
-- insert into brands (name, slug, primary_color, logo_url, header_config, footer_config, event_name, event_date)
-- values (
--   'Brand A',
--   'brand-a',
--   '#e63946',
--   'https://<project>.supabase.co/storage/v1/object/public/brand-assets/brands/brand-a/logo/logo.png',
--   '{"title": "Brand A", "show_logo": true, "bg_color": "#e63946", "text_color": "#ffffff", "links": []}'::jsonb,
--   '{"copyright": "© 2025 Brand A", "bg_color": "#1d1d1d", "text_color": "#cccccc", "social_links": [], "links": []}'::jsonb,
--   'Brand A Launch Event',
--   '2025-10-15'
-- );
