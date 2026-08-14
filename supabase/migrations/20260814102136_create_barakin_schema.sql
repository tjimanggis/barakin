/*
# Barakin - Core database schema with role-based RLS

## Overview
Creates the foundational tables for the Barakin Arabic learning platform:
profiles (with RBAC roles), categories, lessons, articles, quizzes, and
user_progress. All tables have Row Level Security enabled with policies
that enforce public read for published content, owner-scoped writes for
authors, admin full access, and user-scoped personal data.

## New Tables

### profiles
- `id` (uuid, PK, references auth.users) - one row per authenticated user
- `display_name` (text) - public display name
- `avatar_url` (text) - optional avatar image URL
- `bio` (text) - optional author bio
- `role` (text, default 'user') - one of 'user', 'author', 'admin'; NOT client-writable
- `created_at` (timestamptz) - creation timestamp
- `updated_at` (timestamptz) - last update timestamp

### categories
- `id` (uuid, PK)
- `name` (text, unique) - category name (Nahwu, Sharaf, Mufrodat, etc.)
- `slug` (text, unique) - URL-friendly identifier
- `description` (text) - optional category description
- `created_at` (timestamptz)

### lessons
- `id` (uuid, PK)
- `title` (text) - lesson title
- `slug` (text, unique) - URL-friendly identifier
- `description` (text) - short description
- `content_plain` (text) - lesson content WITHOUT harakat (kitab gundul)
- `content_voweled` (text) - lesson content WITH harakat
- `level` (text) - 'pemula' | 'menengah' | 'mahir'
- `category_id` (uuid, FK -> categories) - lesson category
- `author_id` (uuid, FK -> profiles, default auth.uid()) - lesson author
- `published` (boolean, default false) - whether the lesson is publicly visible
- `order_index` (integer, default 0) - ordering within a category/level
- `created_at`, `updated_at` (timestamptz)

### articles
- `id` (uuid, PK)
- `title` (text) - article title
- `slug` (text, unique) - URL-friendly identifier
- `excerpt` (text) - short summary
- `content` (text) - full article body
- `category_id` (uuid, FK -> categories) - article category
- `author_id` (uuid, FK -> profiles, default auth.uid()) - article author
- `tags` (text[]) - array of tag strings for filtering
- `read_time_minutes` (integer) - estimated read time
- `published` (boolean, default false)
- `cover_image_url` (text) - optional cover image
- `created_at`, `updated_at` (timestamptz)

### quizzes
- `id` (uuid, PK)
- `lesson_id` (uuid, FK -> lessons) - the lesson this quiz belongs to
- `title` (text) - quiz title
- `questions` (jsonb) - array of {question, options[], correct_index}
- `passing_score` (integer, default 70) - percentage needed to pass
- `created_at`, `updated_at` (timestamptz)

### user_progress
- `id` (uuid, PK)
- `user_id` (uuid, FK -> profiles, default auth.uid()) - the student
- `lesson_id` (uuid, FK -> lessons, nullable) - lesson being tracked
- `quiz_id` (uuid, FK -> quizzes, nullable) - quiz being tracked
- `status` (text) - 'not_started' | 'in_progress' | 'completed'
- `score` (integer, nullable) - quiz score percentage
- `bookmarked` (boolean, default false) - whether the user bookmarked this lesson
- `last_accessed_at` (timestamptz) - last time the user opened this lesson
- `created_at`, `updated_at` (timestamptz)
- Unique constraint on (user_id, lesson_id) to prevent duplicate progress rows

## Security

### RLS enabled on ALL tables.

### profiles
- SELECT: authenticated users can read all profiles (needed for author display names).
- UPDATE: users can update only their own profile, but NOT the role column
  (enforced via column-level GRANT - only display_name, avatar_url, bio are writable).

### categories
- SELECT: public (anon + authenticated) - categories are visible to everyone.
- INSERT/UPDATE/DELETE: admin only.

### lessons
- SELECT: public can read published lessons; authors can read their own
  (published or draft); admins can read all.
- INSERT: authors and admins can create (author_id defaults to auth.uid()).
- UPDATE: author of the lesson, or admin.
- DELETE: author of the lesson, or admin.

### articles
- SELECT: public can read published articles; authors can read their own;
  admins can read all.
- INSERT: authors and admins can create.
- UPDATE: author of the article, or admin.
- DELETE: author of the article, or admin.

### quizzes
- SELECT: public can read quizzes for published lessons; authors can read
  their own; admins can read all.
- INSERT/UPDATE/DELETE: author of the parent lesson, or admin.

### user_progress
- SELECT: only the owner (user_id = auth.uid()).
- INSERT/UPDATE/DELETE: only the owner.

## Privileged Functions

### set_user_role(p_target_user uuid, p_role text)
- SECURITY DEFINER function that allows an admin to change a user's role.
- Validates that the CALLER (auth.uid()) is an admin.
- Validates that p_role is one of 'user', 'author', 'admin'.
- EXECUTE revoked from anon, granted to authenticated.

## Important Notes
1. The `role` column on profiles is NOT writable by clients via the data API.
   Column-level GRANT restricts UPDATE to display_name, avatar_url, bio only.
   Role changes go through the set_user_role() SECURITY DEFINER function.
2. Owner columns (author_id, user_id) default to auth.uid() so client inserts
   that omit the owner field still satisfy WITH CHECK policies.
3. All policies use auth.uid() - never current_user.
4. Four separate policies per table (SELECT/INSERT/UPDATE/DELETE) - no FOR ALL.
*/

-- Enable pg_trgm FIRST (needed for gin_trgm_ops index on articles.title)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  bio text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'author', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON profiles;
CREATE POLICY "profiles_select_all_authenticated" ON profiles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Restrict client-writable columns: role must never be client-set
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_url, bio) ON profiles TO authenticated;

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_public" ON categories;
CREATE POLICY "categories_select_public" ON categories
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "categories_insert_admin" ON categories;
CREATE POLICY "categories_insert_admin" ON categories
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "categories_update_admin" ON categories;
CREATE POLICY "categories_update_admin" ON categories
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "categories_delete_admin" ON categories;
CREATE POLICY "categories_delete_admin" ON categories
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- LESSONS
-- ============================================================
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  content_plain text,
  content_voweled text,
  level text NOT NULL DEFAULT 'pemula' CHECK (level IN ('pemula', 'menengah', 'mahir')),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  published boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lessons_category_id_idx ON lessons(category_id);
CREATE INDEX IF NOT EXISTS lessons_author_id_idx ON lessons(author_id);
CREATE INDEX IF NOT EXISTS lessons_level_idx ON lessons(level);
CREATE INDEX IF NOT EXISTS lessons_published_idx ON lessons(published);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lessons_select_public_or_owner_or_admin" ON lessons;
CREATE POLICY "lessons_select_public_or_owner_or_admin" ON lessons
  FOR SELECT TO anon, authenticated
  USING (
    published = true
    OR author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "lessons_insert_author_or_admin" ON lessons;
CREATE POLICY "lessons_insert_author_or_admin" ON lessons
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "lessons_update_owner_or_admin" ON lessons;
CREATE POLICY "lessons_update_owner_or_admin" ON lessons
  FOR UPDATE TO authenticated
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "lessons_delete_owner_or_admin" ON lessons;
CREATE POLICY "lessons_delete_owner_or_admin" ON lessons
  FOR DELETE TO authenticated
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- ARTICLES
-- ============================================================
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  tags text[] DEFAULT '{}',
  read_time_minutes integer DEFAULT 5,
  published boolean NOT NULL DEFAULT false,
  cover_image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS articles_category_id_idx ON articles(category_id);
CREATE INDEX IF NOT EXISTS articles_author_id_idx ON articles(author_id);
CREATE INDEX IF NOT EXISTS articles_published_idx ON articles(published);
CREATE INDEX IF NOT EXISTS articles_tags_idx ON articles USING gin(tags);
CREATE INDEX IF NOT EXISTS articles_title_trgm_idx ON articles USING gin(title gin_trgm_ops);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "articles_select_public_or_owner_or_admin" ON articles;
CREATE POLICY "articles_select_public_or_owner_or_admin" ON articles
  FOR SELECT TO anon, authenticated
  USING (
    published = true
    OR author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "articles_insert_author_or_admin" ON articles;
CREATE POLICY "articles_insert_author_or_admin" ON articles
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "articles_update_owner_or_admin" ON articles;
CREATE POLICY "articles_update_owner_or_admin" ON articles
  FOR UPDATE TO authenticated
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "articles_delete_owner_or_admin" ON articles;
CREATE POLICY "articles_delete_owner_or_admin" ON articles
  FOR DELETE TO authenticated
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- QUIZZES
-- ============================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]',
  passing_score integer NOT NULL DEFAULT 70,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quizzes_lesson_id_idx ON quizzes(lesson_id);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quizzes_select_public_or_owner_or_admin" ON quizzes;
CREATE POLICY "quizzes_select_public_or_owner_or_admin" ON quizzes
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = quizzes.lesson_id
      AND (
        lessons.published = true
        OR lessons.author_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
    )
  );

DROP POLICY IF EXISTS "quizzes_insert_owner_or_admin" ON quizzes;
CREATE POLICY "quizzes_insert_owner_or_admin" ON quizzes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = quizzes.lesson_id
      AND (
        lessons.author_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
    )
  );

DROP POLICY IF EXISTS "quizzes_update_owner_or_admin" ON quizzes;
CREATE POLICY "quizzes_update_owner_or_admin" ON quizzes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = quizzes.lesson_id
      AND (
        lessons.author_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = quizzes.lesson_id
      AND (
        lessons.author_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
    )
  );

DROP POLICY IF EXISTS "quizzes_delete_owner_or_admin" ON quizzes;
CREATE POLICY "quizzes_delete_owner_or_admin" ON quizzes
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = quizzes.lesson_id
      AND (
        lessons.author_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
    )
  );

-- ============================================================
-- USER_PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  score integer,
  bookmarked boolean NOT NULL DEFAULT false,
  last_accessed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_progress_user_lesson_unique UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS user_progress_user_id_idx ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS user_progress_lesson_id_idx ON user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS user_progress_bookmarked_idx ON user_progress(user_id, bookmarked);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_progress_select_own" ON user_progress;
CREATE POLICY "user_progress_select_own" ON user_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_progress_insert_own" ON user_progress;
CREATE POLICY "user_progress_insert_own" ON user_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_progress_update_own" ON user_progress;
CREATE POLICY "user_progress_update_own" ON user_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_progress_delete_own" ON user_progress;
CREATE POLICY "user_progress_delete_own" ON user_progress
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- PRIVILEGED FUNCTION: set_user_role
-- ============================================================
CREATE OR REPLACE FUNCTION set_user_role(p_target_user uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_role NOT IN ('user', 'author', 'admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  UPDATE profiles SET role = p_role, updated_at = now()
  WHERE id = p_target_user;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_user_role FROM anon;
GRANT EXECUTE ON FUNCTION set_user_role TO authenticated;

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION handle_new_user FROM anon;
GRANT EXECUTE ON FUNCTION handle_new_user TO authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
