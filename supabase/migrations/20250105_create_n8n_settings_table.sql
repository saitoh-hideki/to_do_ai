-- Create n8n_settings table for storing N8N configuration
CREATE TABLE IF NOT EXISTS public.n8n_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  n8n_webhook_url TEXT,
  n8n_api_key TEXT,
  line_webhook_url TEXT,
  x_webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.n8n_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for service role
DROP POLICY IF EXISTS "Allow all operations for service role" ON public.n8n_settings;
CREATE POLICY "Allow all operations for service role" ON public.n8n_settings
  FOR ALL USING (true) WITH CHECK (true);

-- Insert default record
INSERT INTO public.n8n_settings (id, n8n_webhook_url, n8n_api_key, line_webhook_url, x_webhook_url)
VALUES (1, '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Add comment
COMMENT ON TABLE public.n8n_settings IS 'N8N連携設定';
COMMENT ON COLUMN public.n8n_settings.n8n_webhook_url IS 'N8N Webhook URL';
COMMENT ON COLUMN public.n8n_settings.n8n_api_key IS 'N8N API Key';
COMMENT ON COLUMN public.n8n_settings.line_webhook_url IS 'LINE用N8N Webhook URL';
COMMENT ON COLUMN public.n8n_settings.x_webhook_url IS 'X用N8N Webhook URL'; 