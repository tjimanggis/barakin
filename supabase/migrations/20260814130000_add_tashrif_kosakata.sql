/*
# Tashrif dan Kosakata tables

## Overview
Adds two new tables for Arabic learning:
1. tashrif - verb conjugation tables for Sharaf lessons
2. kosakata - vocabulary/word entries for vocabulary lessons

Both tables support author/admin management with RLS policies.
*/

-- ============================================================
-- Create tashrif (verb conjugation) table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tashrif (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  level text DEFAULT 'pemula' CHECK (level IN ('pemula', 'menengah', 'mahir')),
  
  -- Verb conjugation data
  base_verb text NOT NULL, -- Base form (e.g., فعل)
  conjugations jsonb NOT NULL DEFAULT '{}', -- {present, past, imperative, participles, etc.}
  
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tashrif ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS tashrif_author_id_idx ON public.tashrif(author_id);
CREATE INDEX IF NOT EXISTS tashrif_category_id_idx ON public.tashrif(category_id);
CREATE INDEX IF NOT EXISTS tashrif_published_idx ON public.tashrif(published);

-- ============================================================
-- Create kosakata (vocabulary) table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kosakata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  level text DEFAULT 'pemula' CHECK (level IN ('pemula', 'menengah', 'mahir')),
  
  -- Vocabulary data
  arabic_text text NOT NULL, -- Arabic word
  arabic_harakat text, -- Arabic with harakat (diacritics)
  indonesia_meaning text NOT NULL, -- Indonesian translation
  example_sentence_ar text, -- Example sentence in Arabic
  example_sentence_id text, -- Example sentence in Indonesian
  word_type text, -- noun, verb, adjective, adverb, etc.
  
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.kosakata ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS kosakata_author_id_idx ON public.kosakata(author_id);
CREATE INDEX IF NOT EXISTS kosakata_category_id_idx ON public.kosakata(category_id);
CREATE INDEX IF NOT EXISTS kosakata_published_idx ON public.kosakata(published);

-- ============================================================
-- RLS Policies for tashrif
-- ============================================================

-- SELECT: public can read published; authors can read their own; admins can read all
CREATE POLICY tashrif_select ON public.tashrif
  FOR SELECT
  USING (
    published
    OR author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT: authors and admins only
CREATE POLICY tashrif_insert ON public.tashrif
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('author', 'admin'))
    )
  );

-- UPDATE: author or admin only
CREATE POLICY tashrif_update ON public.tashrif
  FOR UPDATE
  USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE: author or admin only
CREATE POLICY tashrif_delete ON public.tashrif
  FOR DELETE
  USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- RLS Policies for kosakata
-- ============================================================

-- SELECT: public can read published; authors can read their own; admins can read all
CREATE POLICY kosakata_select ON public.kosakata
  FOR SELECT
  USING (
    published
    OR author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT: authors and admins only
CREATE POLICY kosakata_insert ON public.kosakata
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('author', 'admin'))
    )
  );

-- UPDATE: author or admin only
CREATE POLICY kosakata_update ON public.kosakata
  FOR UPDATE
  USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE: author or admin only
CREATE POLICY kosakata_delete ON public.kosakata
  FOR DELETE
  USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
