-- Create google_settings table for storing Google service configurations
CREATE TABLE IF NOT EXISTS public.google_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  gcal_webhook_url TEXT,
  gmail_webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE public.google_settings ENABLE ROW LEVEL SECURITY;

-- Create a permissive policy for anon and authenticated users
CREATE POLICY "Public access for google_settings"
ON public.google_settings
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Insert a default empty record
INSERT INTO public.google_settings (id, gcal_webhook_url, gmail_webhook_url)
VALUES (1, '', '')
ON CONFLICT (id) DO NOTHING;

-- Add comments for clarity
COMMENT ON TABLE public.google_settings IS 'Googleサービス連携設定（Calendar, Gmailなど）';
COMMENT ON COLUMN public.google_settings.gcal_webhook_url IS 'Google Calendar用N8N Webhook URL';
COMMENT ON COLUMN public.google_settings.gmail_webhook_url IS 'Gmail用N8N Webhook URL';
