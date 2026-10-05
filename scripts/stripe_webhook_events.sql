-- Optional (recommended) idempotency table for Stripe webhooks.
-- Run in Supabase SQL editor.

create table if not exists public.stripe_webhook_events (
  id text primary key,
  type text,
  created_at timestamptz not null default now()
);

-- You can enable RLS if you want; webhook uses service role normally.
-- alter table public.stripe_webhook_events enable row level security;

