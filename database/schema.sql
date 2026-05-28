-- ============================================
-- GovExam Pro — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  role          TEXT DEFAULT 'user',
  avatar_url    TEXT,
  streak_days   INTEGER DEFAULT 0,
  total_points  INTEGER DEFAULT 0,
  last_active_date TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  icon        TEXT DEFAULT '📚',
  description TEXT,
  color       TEXT DEFAULT '#3b82f6'
);

-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
  id            SERIAL PRIMARY KEY,
  subject_id    INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  question      TEXT NOT NULL,
  option_a      TEXT NOT NULL,
  option_b      TEXT NOT NULL,
  option_c      TEXT NOT NULL,
  option_d      TEXT NOT NULL,
  correct_ans   TEXT NOT NULL CHECK (correct_ans IN ('A','B','C','D')),
  explanation   TEXT,
  has_image     BOOLEAN DEFAULT false,
  image_url     TEXT,
  difficulty    TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  source_book   TEXT,
  page_no       INTEGER,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Tests Table
CREATE TABLE IF NOT EXISTS tests (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  subject_id    INTEGER REFERENCES subjects(id),
  test_type     TEXT CHECK (test_type IN ('mock','practice','daily','previous_year')),
  duration_mins INTEGER DEFAULT 30,
  total_marks   INTEGER,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Test Questions Junction Table
CREATE TABLE IF NOT EXISTS test_questions (
  id          SERIAL PRIMARY KEY,
  test_id     INTEGER REFERENCES tests(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  order_num   INTEGER,
  UNIQUE(test_id, question_id)
);

-- Test Results Table
CREATE TABLE IF NOT EXISTS test_results (
  id            SERIAL PRIMARY KEY,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  test_id       INTEGER REFERENCES tests(id),
  score         INTEGER DEFAULT 0,
  total_marks   INTEGER,
  time_taken    INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  wrong_count   INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  submitted_at  TIMESTAMP DEFAULT NOW()
);

-- Bookmarks Table
CREATE TABLE IF NOT EXISTS bookmarks (
  id          SERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- PDF Upload Logs Table
CREATE TABLE IF NOT EXISTS pdf_upload_logs (
  id              SERIAL PRIMARY KEY,
  admin_id        UUID REFERENCES users(id),
  file_name       TEXT,
  total_pages     INTEGER,
  processed_pages INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','paused','completed','failed')),
  subject_id      INTEGER REFERENCES subjects(id),
  source_book     TEXT,
  started_at      TIMESTAMP DEFAULT NOW(),
  completed_at    TIMESTAMP
);

-- ============================================
-- Seed Initial Subjects
-- ============================================
INSERT INTO subjects (name, icon, description, color) VALUES
  ('Mathematics', '🔢', 'Arithmetic, Algebra, Geometry, Statistics', '#3b82f6'),
  ('Aptitude', '🧠', 'Logical Reasoning, Verbal, Non-Verbal', '#8b5cf6'),
  ('General Knowledge', '🌍', 'Current Affairs, History, Geography, Science', '#f59e0b'),
  ('English', '📖', 'Grammar, Vocabulary, Comprehension', '#10b981'),
  ('Reasoning', '🔍', 'Puzzles, Series, Coding-Decoding, Syllogisms', '#ef4444'),
  ('Science', '🔬', 'Physics, Chemistry, Biology', '#06b6d4')
ON CONFLICT DO NOTHING;

-- ============================================
-- RPC: increment_points (called after test submit)
-- ============================================
CREATE OR REPLACE FUNCTION increment_points(user_id UUID, points INTEGER)
RETURNS VOID AS $$
  UPDATE users SET total_points = total_points + points WHERE id = user_id;
$$ LANGUAGE SQL;

-- ============================================
-- RLS Policies (enable Row Level Security)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_upload_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "users_read_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- Anyone can read questions and subjects
CREATE POLICY "questions_public_read" ON questions FOR SELECT USING (true);
CREATE POLICY "subjects_public_read" ON subjects FOR SELECT USING (true);

-- Users can read/write their own results and bookmarks
CREATE POLICY "results_own" ON test_results FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_own" ON bookmarks FOR ALL USING (auth.uid() = user_id);

-- Admins can write questions (via service key from backend — bypasses RLS)
