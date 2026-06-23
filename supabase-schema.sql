-- ============================================================
-- Fahmy Charcoal ERP - Supabase Database Schema
-- ============================================================
-- Run this in Supabase SQL Editor to initialize the database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Profiles (extends auth.users) ───────────────────────────────────────────

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null default 'sales' check (role in ('admin','sales','warehouse','driver')),
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', 'مستخدم جديد'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Customers ────────────────────────────────────────────────────────────────

create table public.customers (
  id uuid primary key default uuid_generate_v4(),
  cafe_name text not null,
  owner_name text not null,
  phone text not null,
  whatsapp text,
  address text not null,
  maps_link text,
  monthly_consumption numeric(10,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Suppliers ────────────────────────────────────────────────────────────────

create table public.suppliers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  charcoal_type text not null check (charcoal_type in ('orange','lemon','guava','mango','mixed')),
  price_per_kg numeric(10,2) not null default 0,
  price_per_bag numeric(10,2) not null default 0,
  bag_weight_kg numeric(10,2) not null default 15,
  delivery_cost numeric(10,2) not null default 0,
  phone text,
  notes text,
  outstanding_balance numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Inventory ────────────────────────────────────────────────────────────────

create table public.inventory (
  id uuid primary key default uuid_generate_v4(),
  charcoal_type text not null unique check (charcoal_type in ('orange','lemon','guava','mango','mixed')),
  warehouse_stock numeric(10,0) not null default 0,
  incoming_stock numeric(10,0) not null default 0,
  outgoing_stock numeric(10,0) not null default 0,
  damaged_stock numeric(10,0) not null default 0,
  reserved_stock numeric(10,0) not null default 0,
  minimum_stock numeric(10,0) not null default 50,
  updated_at timestamptz not null default now()
);

-- Seed initial inventory rows
insert into public.inventory (charcoal_type, minimum_stock) values
  ('orange', 100), ('lemon', 80), ('guava', 100), ('mango', 60), ('mixed', 50);

-- ─── Inventory Movements ──────────────────────────────────────────────────────

create table public.inventory_movements (
  id uuid primary key default uuid_generate_v4(),
  charcoal_type text not null check (charcoal_type in ('orange','lemon','guava','mango','mixed')),
  movement_type text not null check (movement_type in ('in','out','damaged','reserved')),
  quantity numeric(10,0) not null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  order_id uuid,
  user_id uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- ─── Orders ──────────────────────────────────────────────────────────────────

create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text not null unique,
  customer_id uuid not null references public.customers(id) on delete restrict,
  driver_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','in_delivery','delivered','collected')),
  delivery_date timestamptz not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Order Items ──────────────────────────────────────────────────────────────

create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  charcoal_type text not null check (charcoal_type in ('orange','lemon','guava','mango','mixed')),
  quantity numeric(10,0) not null,
  price_per_unit numeric(10,2) not null,
  total_price numeric(12,2) generated always as (quantity * price_per_unit) stored
);

-- ─── Payments ─────────────────────────────────────────────────────────────────

create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  order_id uuid references public.orders(id) on delete set null,
  amount numeric(12,2) not null,
  payment_type text not null check (payment_type in ('full','partial','installment')),
  payment_date timestamptz not null default now(),
  notes text,
  collected_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ─── Expenses ─────────────────────────────────────────────────────────────────

create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  category text not null,
  amount numeric(12,2) not null,
  description text not null,
  expense_date date not null default current_date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ─── Supplier Payments ────────────────────────────────────────────────────────

create table public.supplier_payments (
  id uuid primary key default uuid_generate_v4(),
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  amount numeric(12,2) not null,
  payment_date timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

-- ─── Notifications ────────────────────────────────────────────────────────────

create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('overdue_balance','no_payment_30_days','no_order_recently','low_stock','supplier_payment_due')),
  title text not null,
  message text not null,
  customer_id uuid references public.customers(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.supplier_payments enable row level security;
alter table public.notifications enable row level security;

-- Allow authenticated users to read all (admin controls writes via role check)
create policy "Authenticated users can read all" on public.customers for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert" on public.customers for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update" on public.customers for update using (auth.role() = 'authenticated');

create policy "Authenticated users can read all" on public.suppliers for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert" on public.suppliers for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update" on public.suppliers for update using (auth.role() = 'authenticated');

create policy "Authenticated users can read all" on public.inventory for select using (auth.role() = 'authenticated');
create policy "Authenticated users can update" on public.inventory for update using (auth.role() = 'authenticated');

create policy "Authenticated users can read all" on public.inventory_movements for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert" on public.inventory_movements for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can read all" on public.orders for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert" on public.orders for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update" on public.orders for update using (auth.role() = 'authenticated');

create policy "Authenticated users can read all" on public.order_items for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert" on public.order_items for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can read all" on public.payments for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert" on public.payments for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can read all" on public.expenses for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert" on public.expenses for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can read all" on public.notifications for select using (auth.role() = 'authenticated');
create policy "Authenticated users can update" on public.notifications for update using (auth.role() = 'authenticated');

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id or auth.role() = 'authenticated');
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- ─── Useful Views ─────────────────────────────────────────────────────────────

-- Customer balances view
create or replace view public.customer_balances as
select
  c.id,
  c.cafe_name,
  c.owner_name,
  c.phone,
  coalesce(sum(oi.total_price), 0) as total_purchases,
  coalesce(sum(p.amount), 0) as total_payments,
  coalesce(sum(oi.total_price), 0) - coalesce(sum(p.amount), 0) as outstanding_balance
from public.customers c
left join public.orders o on o.customer_id = c.id
left join public.order_items oi on oi.order_id = o.id
left join public.payments p on p.customer_id = c.id
group by c.id, c.cafe_name, c.owner_name, c.phone;
