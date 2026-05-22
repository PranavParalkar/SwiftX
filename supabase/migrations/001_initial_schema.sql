-- FinTech Wallet schema (plan section 3)
-- Apply via Supabase SQL editor or `supabase db push` after `supabase link`.

-------------------------------------------------------------------------------
-- Tables
-------------------------------------------------------------------------------

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text unique,
  country_code text not null,
  language text not null default 'en',
  kyc_status text not null default 'pending',
  kyc_document_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  currency text not null,
  balance numeric(20, 4) not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, currency)
);

create table if not exists transactions (
  id bigserial primary key,
  from_wallet_id uuid references wallets(id),
  to_wallet_id uuid references wallets(id),
  from_amount numeric(20, 4) not null,
  from_currency text not null,
  to_amount numeric(20, 4) not null,
  to_currency text not null,
  fx_rate numeric(20, 8) not null,
  tx_type text not null default 'transfer',
  status text not null default 'completed',
  prev_hash text,
  current_hash text,
  created_at timestamptz not null default now()
);

create index if not exists idx_tx_from_wallet on transactions(from_wallet_id);
create index if not exists idx_tx_to_wallet on transactions(to_wallet_id);
create index if not exists idx_tx_created on transactions(created_at desc);

create table if not exists fx_rates_cache (
  base_currency text not null,
  target_currency text not null,
  rate numeric(20, 8) not null,
  fetched_at timestamptz not null default now(),
  primary key (base_currency, target_currency, fetched_at)
);

create table if not exists aml_flags (
  id uuid primary key default gen_random_uuid(),
  transaction_id bigint references transactions(id) on delete cascade,
  rule_triggered text not null,
  severity text not null,
  resolved boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

-------------------------------------------------------------------------------
-- execute_transfer RPC: atomic debit/credit + tx insert
-------------------------------------------------------------------------------

create or replace function execute_transfer(
  p_from_user_id uuid,
  p_to_user_id uuid,
  p_from_currency text,
  p_to_currency text,
  p_from_amount numeric,
  p_to_amount numeric,
  p_fx_rate numeric
) returns transactions
language plpgsql
security definer
as $$
declare
  v_from_wallet wallets;
  v_to_wallet wallets;
  v_prev_hash text;
  v_tx transactions;
begin
  -- Lock the sender wallet (row-level lock)
  select * into v_from_wallet
    from wallets
   where user_id = p_from_user_id and currency = p_from_currency
     for update;
  if not found then raise exception 'Sender wallet not found'; end if;
  if v_from_wallet.balance < p_from_amount then raise exception 'Insufficient balance'; end if;

  -- Lock or auto-create the recipient wallet
  select * into v_to_wallet
    from wallets
   where user_id = p_to_user_id and currency = p_to_currency
     for update;
  if not found then
    insert into wallets (user_id, currency, balance)
      values (p_to_user_id, p_to_currency, 0)
      returning * into v_to_wallet;
  end if;

  -- Debit / credit
  update wallets set balance = balance - p_from_amount where id = v_from_wallet.id;
  update wallets set balance = balance + p_to_amount    where id = v_to_wallet.id;

  -- Look up previous hash (most recent tx)
  select current_hash into v_prev_hash
    from transactions
   order by id desc
   limit 1;

  -- Insert the transaction row (current_hash filled by caller after compute)
  insert into transactions (
    from_wallet_id, to_wallet_id,
    from_amount, from_currency, to_amount, to_currency,
    fx_rate, tx_type, status, prev_hash
  ) values (
    v_from_wallet.id, v_to_wallet.id,
    p_from_amount, p_from_currency, p_to_amount, p_to_currency,
    p_fx_rate, 'transfer', 'completed', v_prev_hash
  ) returning * into v_tx;

  return v_tx;
end;
$$;

-------------------------------------------------------------------------------
-- Row Level Security
-------------------------------------------------------------------------------

alter table profiles      enable row level security;
alter table wallets       enable row level security;
alter table transactions  enable row level security;
alter table aml_flags     enable row level security;

-- Profiles: users see/edit their own row; admins see all
create policy "profiles_self_select" on profiles
  for select using (auth.uid() = id);
create policy "profiles_self_update" on profiles
  for update using (auth.uid() = id);
create policy "profiles_admin_select" on profiles
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Wallets: users see their own
create policy "wallets_self_select" on wallets
  for select using (auth.uid() = user_id);

-- Transactions: users see anything involving their wallets; admins see all
create policy "transactions_user_select" on transactions
  for select using (
    from_wallet_id in (select id from wallets where user_id = auth.uid())
    or to_wallet_id in (select id from wallets where user_id = auth.uid())
  );
create policy "transactions_admin_select" on transactions
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );

-- AML flags: admin only
create policy "aml_flags_admin_select" on aml_flags
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Trigger: auto-create a profile row when a new auth.users record appears
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, phone, country_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    new.phone,
    coalesce(new.raw_user_meta_data->>'country_code', 'IN')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
