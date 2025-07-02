-- Create clients table for business card data
CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  company_name TEXT,
  person_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists and create new one
DROP POLICY IF EXISTS "Allow all operations for all users" ON clients;
CREATE POLICY "Allow all operations for all users" ON clients
  FOR ALL USING (true) WITH CHECK (true);

-- Create storage bucket for business cards if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-cards', 'business-cards', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policy if exists and create new one
DROP POLICY IF EXISTS "Allow all operations for all users" ON storage.objects;
CREATE POLICY "Allow all operations for all users" ON storage.objects
  FOR ALL USING (bucket_id = 'business-cards') WITH CHECK (bucket_id = 'business-cards'); 