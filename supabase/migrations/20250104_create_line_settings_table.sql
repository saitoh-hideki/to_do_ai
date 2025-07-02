-- Create line_settings table for storing LINE configuration
CREATE TABLE IF NOT EXISTS public.line_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  channel_access_token TEXT,
  channel_secret TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.line_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for service role
DROP POLICY IF EXISTS "Allow all operations for service role" ON public.line_settings;
CREATE POLICY "Allow all operations for service role" ON public.line_settings
  FOR ALL USING (true) WITH CHECK (true);

-- Insert default record
INSERT INTO public.line_settings (id, channel_access_token, channel_secret)
VALUES (1, '', '')
ON CONFLICT (id) DO NOTHING;

-- Add comment
COMMENT ON TABLE public.line_settings IS 'LINE公式アカウント設定';
COMMENT ON COLUMN public.line_settings.channel_access_token IS 'LINEチャンネルアクセストークン';
COMMENT ON COLUMN public.line_settings.channel_secret IS 'LINEチャンネルシークレット'; 