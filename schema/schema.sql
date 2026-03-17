-- ============================================================
-- Kreavia.ai — Master Production Schema
-- Stack: PostgreSQL via Supabase
-- Version: 1.0.0
-- Run this file in your Supabase SQL editor or via psql
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT UNIQUE NOT NULL,
  password_hash  TEXT,
  username       TEXT UNIQUE,
  avatar_url     TEXT,
  plan           TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'creator', 'pro', 'agency')),
  credits        INTEGER NOT NULL DEFAULT 3,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  niche       TEXT,
  audience    TEXT,
  style       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- ============================================================
-- 3. BRAND KITS
-- ============================================================
CREATE TABLE IF NOT EXISTS brand_kits (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  logo_url         TEXT,
  primary_color    TEXT,
  secondary_color  TEXT,
  accent_color     TEXT,
  font_heading     TEXT,
  font_body        TEXT,
  brand_voice      TEXT,
  brand_archetype  TEXT,
  brand_score      INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_brand_kits_project_id ON brand_kits(project_id);

-- ============================================================
-- 4. LOGOS
-- ============================================================
CREATE TABLE IF NOT EXISTS logos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_kit_id   UUID NOT NULL REFERENCES brand_kits(id) ON DELETE CASCADE,
  image_url      TEXT NOT NULL,
  style          TEXT CHECK (style IN ('monogram', 'symbol', 'wordmark', 'combination')),
  model_used     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_logos_brand_kit_id ON logos(brand_kit_id);

-- ============================================================
-- 5. COLOR PALETTES
-- ============================================================
CREATE TABLE IF NOT EXISTS color_palettes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_kit_id  UUID NOT NULL REFERENCES brand_kits(id) ON DELETE CASCADE,
  palette_name  TEXT NOT NULL DEFAULT 'Primary Palette',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS colors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palette_id  UUID NOT NULL REFERENCES color_palettes(id) ON DELETE CASCADE,
  hex_code    TEXT NOT NULL,
  role        TEXT CHECK (role IN ('primary', 'secondary', 'accent', 'background', 'highlight', 'neutral'))
);
CREATE INDEX IF NOT EXISTS idx_colors_palette_id ON colors(palette_id);

-- ============================================================
-- 6. TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN (
    'instagram_post', 'reel_cover', 'story', 'carousel',
    'youtube_thumbnail', 'linkedin_post', 'twitter_header'
  )),
  canvas_data  JSONB NOT NULL DEFAULT '{}',
  preview_url  TEXT,
  is_public    BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_templates_project_id ON templates(project_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);

-- ============================================================
-- 7. TEMPLATE ELEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS template_elements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id  UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('text', 'image', 'shape', 'icon', 'video', 'gradient')),
  properties   JSONB NOT NULL DEFAULT '{}',
  z_index      INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Example properties: {"font":"Playfair","size":48,"color":"#0F0F0F","x":100,"y":200,"width":300,"height":80}
CREATE INDEX IF NOT EXISTS idx_template_elements_template_id ON template_elements(template_id);

-- ============================================================
-- 8. AI GENERATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_generations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id       UUID REFERENCES projects(id) ON DELETE SET NULL,
  generation_type  TEXT NOT NULL CHECK (generation_type IN (
    'logo', 'brand_palette', 'brand_identity', 'caption',
    'content_ideas', 'hashtags', 'bio', 'font_pairing'
  )),
  prompt           TEXT,
  result_data      JSONB NOT NULL DEFAULT '{}',
  model            TEXT,
  credits_used     INTEGER NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_project_id ON ai_generations(project_id);

-- ============================================================
-- 9. AI USAGE (credit throttling)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_usage (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  generation_type  TEXT NOT NULL,
  credits_used     INTEGER NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at);

-- ============================================================
-- 10. CONTENT IDEAS
-- ============================================================
CREATE TABLE IF NOT EXISTS content_ideas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  content_type  TEXT CHECK (content_type IN ('reel', 'carousel', 'story', 'post', 'youtube_short')),
  hook          TEXT,        -- viral hook for the idea
  is_saved      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_content_ideas_project_id ON content_ideas(project_id);

-- ============================================================
-- 11. CAPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS captions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  caption_text  TEXT NOT NULL,
  tone          TEXT CHECK (tone IN ('luxury', 'motivational', 'fun', 'educational', 'storytelling', 'minimal')),
  char_count    INTEGER GENERATED ALWAYS AS (char_length(caption_text)) STORED,
  is_saved      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_captions_project_id ON captions(project_id);

-- ============================================================
-- 12. HASHTAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS hashtags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag         TEXT NOT NULL,
  category    TEXT, -- e.g. 'niche', 'broad', 'trending'
  reach_est   INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hashtags_project_id ON hashtags(project_id);

-- ============================================================
-- 13. ANALYTICS
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  metric_name   TEXT NOT NULL,
  metric_value  NUMERIC NOT NULL,
  period_start  TIMESTAMPTZ,
  period_end    TIMESTAMPTZ,
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Metric name examples: brand_score, content_consistency, posting_frequency,
--                       reach, engagement_rate, profile_views, follower_growth
CREATE INDEX IF NOT EXISTS idx_analytics_project_id ON analytics(project_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metric_name ON analytics(metric_name);

-- ============================================================
-- 14. EXPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS exports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id  UUID REFERENCES templates(id) ON DELETE SET NULL,
  export_type  TEXT NOT NULL CHECK (export_type IN ('png', 'jpg', 'mp4', 'pdf', 'svg', 'zip')),
  file_url     TEXT,   -- Stored in Cloudflare R2 / S3, only URL saved here
  file_size    INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exports_user_id ON exports(user_id);

-- ============================================================
-- 15. SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan              TEXT NOT NULL CHECK (plan IN ('free', 'creator', 'pro', 'agency')),
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'past_due', 'trialing')),
  renewal_date      TIMESTAMPTZ,
  trial_ends_at     TIMESTAMPTZ,
  payment_provider  TEXT CHECK (payment_provider IN ('stripe', 'razorpay', 'paypal')),
  provider_sub_id   TEXT,   -- Stripe subscription ID e.g. sub_abc123
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 16. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  action_url  TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ============================================================
-- HELPER: auto-update updated_at timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (Supabase RLS)
-- ============================================================
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_kits      ENABLE ROW LEVEL SECURITY;
ALTER TABLE logos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_palettes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE colors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage        ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE captions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics       ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own profile
CREATE POLICY "users_own" ON users FOR ALL USING (auth.uid() = id);

-- Projects: user owns their projects
CREATE POLICY "projects_own" ON projects FOR ALL USING (auth.uid() = user_id);

-- Brand kits: accessible via project ownership
CREATE POLICY "brand_kits_own" ON brand_kits FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);

-- Logos: via brand_kit → project
CREATE POLICY "logos_own" ON logos FOR ALL USING (
  brand_kit_id IN (
    SELECT bk.id FROM brand_kits bk
    JOIN projects p ON p.id = bk.project_id
    WHERE p.user_id = auth.uid()
  )
);

-- Templates: user owns via project
CREATE POLICY "templates_own" ON templates FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);

-- AI usage & generations
CREATE POLICY "ai_generations_own" ON ai_generations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "ai_usage_own" ON ai_usage FOR ALL USING (auth.uid() = user_id);

-- Content
CREATE POLICY "content_ideas_own" ON content_ideas FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);
CREATE POLICY "captions_own" ON captions FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);
CREATE POLICY "hashtags_own" ON hashtags FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);

-- Analytics
CREATE POLICY "analytics_own" ON analytics FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);

-- Exports, subscriptions, notifications
CREATE POLICY "exports_own" ON exports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_own" ON subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (auth.uid() = user_id);
