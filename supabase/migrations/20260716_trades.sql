CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Allow public read (for registration form)
CREATE POLICY "Enable read access for all users" ON trades
  FOR SELECT USING (true);

-- Allow staff full access
CREATE POLICY "Enable all access for staff" ON trades
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'authenticated'
  );
