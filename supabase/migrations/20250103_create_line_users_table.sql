-- Create line_users table for storing LINE user IDs
CREATE TABLE IF NOT EXISTS line_users (
  id BIGSERIAL PRIMARY KEY,
  line_user_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE line_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for service role
CREATE POLICY "Allow all operations for service role" ON line_users
  FOR ALL USING (true) WITH CHECK (true);

-- Add index for faster lookups
CREATE INDEX idx_line_users_line_user_id ON line_users(line_user_id);

-- Add comment
COMMENT ON TABLE line_users IS 'LINE公式アカウントの友だち登録者一覧';
COMMENT ON COLUMN line_users.line_user_id IS 'LINEユーザーID';
COMMENT ON COLUMN line_users.display_name IS 'LINE表示名'; 