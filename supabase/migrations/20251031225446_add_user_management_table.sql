/*
  # Add User Management Table

  1. New Tables
    - `user_management`
      - `id` (uuid, primary key)
      - `email` (text, unique) - User email address
      - `password` (text) - User password (stored for admin reference)
      - `created_at` (timestamptz) - When the user was created
      - `updated_at` (timestamptz) - When the user was last updated

  2. Security
    - Enable RLS on `user_management` table
    - Add policy for authenticated users to read all user data
    - Add policy for authenticated users to insert new users
    - Add policy for authenticated users to update user data
    - Add policy for authenticated users to delete users

  3. Initial Data
    - Insert admin user (admin@admin.com / admin)
*/

CREATE TABLE IF NOT EXISTS user_management (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_management ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all users"
  ON user_management
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert users"
  ON user_management
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update users"
  ON user_management
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete users"
  ON user_management
  FOR DELETE
  TO authenticated
  USING (true);

INSERT INTO user_management (email, password)
VALUES ('admin@admin.com', 'admin')
ON CONFLICT (email) DO NOTHING;
