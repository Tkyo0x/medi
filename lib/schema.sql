-- =============================================
-- MEDICORE — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- =============================================

-- Subscriptions: one row per module purchase
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  price_usd NUMERIC(5,2) DEFAULT 3.00,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','cancelled','expired')),
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  payment_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- Trials: one trial per user per module (72h)
CREATE TABLE IF NOT EXISTS trials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- Access log: track module usage
CREATE TABLE IF NOT EXISTS access_log (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  action TEXT DEFAULT 'access',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subs_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_trials_user ON trials(user_id);
CREATE INDEX IF NOT EXISTS idx_access_user ON access_log(user_id);
