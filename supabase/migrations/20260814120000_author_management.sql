/*
# Author Management — privileged functions for admin

## Overview
Adds server-side functions that allow an admin to:
1. Promote any existing user to 'author' role (reuses set_user_role)
2. Look up author accounts by display_name / email prefix for the UI

## Admin bootstrap (manual step — run once in Supabase Dashboard SQL editor)
Because Supabase auth.users cannot be seeded from migrations, create the
sudo admin account manually:

  -- Step 1: Go to Supabase Dashboard → Authentication → Users → Add user
  --   Email   : sudo@barakin.id
  --   Password: barakinjaya13
  --   (disable email confirmation so it is immediately active)
  --
  -- Step 2: After the user is created, run this in the SQL editor
  --   (replace <uuid> with the actual user id from auth.users):
  --
  --   UPDATE profiles SET role = 'admin', display_name = 'Sudo Admin'
  --   WHERE id = '<uuid>';
  --
  -- Alternatively, use the set_user_role() function:
  --   SELECT set_user_role('<uuid>', 'admin');

## Functions added here

### admin_create_author(p_user_id uuid, p_display_name text)
  Sets role to 'author' for an existing user. Convenience wrapper.

### admin_reset_author_name(p_user_id uuid, p_name text)
  Allows admin to update display_name of any profile.
*/

-- ============================================================
-- admin_create_author  — promote existing user → author
-- ============================================================
CREATE OR REPLACE FUNCTION admin_create_author(p_user_id uuid, p_display_name text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Caller must be admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized: only admins can promote authors';
  END IF;

  -- Update role
  UPDATE profiles
  SET role = 'author',
      display_name = COALESCE(p_display_name, display_name),
      updated_at = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_create_author FROM anon, public;
GRANT EXECUTE ON FUNCTION admin_create_author TO authenticated;

-- ============================================================
-- admin_reset_display_name — admin edits any profile name
-- ============================================================
CREATE OR REPLACE FUNCTION admin_reset_display_name(p_user_id uuid, p_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE profiles
  SET display_name = p_name, updated_at = now()
  WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_reset_display_name FROM anon, public;
GRANT EXECUTE ON FUNCTION admin_reset_display_name TO authenticated;
