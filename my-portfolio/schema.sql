-- ============================================================
-- Samuel Gatimu Portfolio — PostgreSQL Database Schema
-- Run: psql -U postgres -d sgk_portfolio -f schema.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Admin ──────────────────────────────────────────────
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  two_fa_secret VARCHAR(100),
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Audit Log ──────────────────────────────────────────
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  admin_id UUID REFERENCES admins(id),
  action VARCHAR(100),
  ip VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Videos ─────────────────────────────────────────────
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  youtube_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  duration VARCHAR(20),
  views INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Projects ───────────────────────────────────────────
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  tech_stack TEXT[],
  github_url VARCHAR(500),
  demo_url VARCHAR(500),
  doc_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  video_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'In Progress',
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Blog Posts ─────────────────────────────────────────
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category VARCHAR(100),
  tags TEXT[],
  cover_url VARCHAR(500),
  read_time INTEGER DEFAULT 5,
  is_published BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE blog_comments (
  id SERIAL PRIMARY KEY,
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  author_name VARCHAR(100) NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Timeline ───────────────────────────────────────────
CREATE TABLE timeline (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  institution VARCHAR(255),
  date_period VARCHAR(100),
  description TEXT,
  tags TEXT[],
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Skills ─────────────────────────────────────────────
CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(100),
  level INTEGER DEFAULT 70,
  icon VARCHAR(10),
  sort_order INTEGER DEFAULT 0
);

-- ─── Certifications ─────────────────────────────────────
CREATE TABLE certifications (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  issuer VARCHAR(255),
  date_issued DATE,
  credential_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Contact Messages ───────────────────────────────────
CREATE TABLE contact_messages (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Private Vault (Encrypted File References) ──────────
CREATE TABLE vault_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label VARCHAR(255) NOT NULL,
  encrypted_path VARCHAR(500) NOT NULL,
  encryption_key_hint VARCHAR(100),
  file_type VARCHAR(50),
  file_size BIGINT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Visitor Analytics ──────────────────────────────────
CREATE TABLE page_views (
  id SERIAL PRIMARY KEY,
  page VARCHAR(255),
  referrer VARCHAR(500),
  user_agent VARCHAR(500),
  ip_hash VARCHAR(64),
  country VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CV Config ──────────────────────────────────────────
CREATE TABLE cv_config (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Seed Default CV Config ─────────────────────────────
INSERT INTO cv_config (key, value) VALUES
  ('full_name', 'Samuel Gatimu Kariuki'),
  ('title', 'Electrical & Electronic Engineering Student'),
  ('email', 'samuel.gatimu@email.com'),
  ('phone', '+254 700 000 000'),
  ('location', 'Chuka, Tharaka-Nithi, Kenya'),
  ('github', 'github.com/samuelgatimu'),
  ('linkedin', 'linkedin.com/in/samuelgatimu'),
  ('summary', 'Passionate Electrical and Electronic Engineering student at Chuka University with hands-on experience in circuit design, embedded systems, and power electronics. Dedicated technology educator creating content to help students understand complex engineering concepts.');

-- ─── Seed Timeline ──────────────────────────────────────
INSERT INTO timeline (title, institution, date_period, description, tags, sort_order) VALUES
  ('KCSE — B+', 'Langa Langa Secondary School', '2018 – 2021', 'Completed KCSE with distinction in Mathematics, Physics, and Chemistry.', ARRAY['KCSE B+', 'Mathematics', 'Physics'], 1),
  ('Volunteer Teacher', 'Langa Langa Secondary School', '2022', 'Mentored students in Mathematics and Physics. Improved class performance by 15%.', ARRAY['Teaching', 'Mentorship'], 2),
  ('B.Sc Electrical & Electronic Engineering', 'Chuka University', '2022 – Present', 'Currently pursuing degree with focus on power systems, electronics, and control systems.', ARRAY['EEE Degree', 'Power Systems', 'Electronics'], 3);

-- ─── Indexes ────────────────────────────────────────────
CREATE INDEX idx_videos_cat ON videos(category);
CREATE INDEX idx_blog_slug ON blog_posts(slug);
CREATE INDEX idx_blog_published ON blog_posts(is_published);
CREATE INDEX idx_page_views_date ON page_views(created_at);
