-- Add gcal_webhook_url column to n8n_settings table
ALTER TABLE public.n8n_settings
ADD COLUMN gcal_webhook_url TEXT;

-- Add a comment for the new column
COMMENT ON COLUMN public.n8n_settings.gcal_webhook_url IS 'Google Calendar用N8N Webhook URL';
