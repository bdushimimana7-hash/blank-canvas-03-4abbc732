ALTER TABLE public.queue_entries 
ADD COLUMN IF NOT EXISTS headsup_sent BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS sms_template_headsup TEXT NOT NULL DEFAULT 'Hi {name}, you are 3rd in line at {business}. Start making your way now.';
