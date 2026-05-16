
-- Add heads-up template column
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS sms_template_headsup TEXT NOT NULL DEFAULT
    'Hi {name}, you are 3rd in line at {business}. Please start making your way back now.';

-- Update default for join + call templates to include {business}
ALTER TABLE public.businesses
  ALTER COLUMN sms_template_add SET DEFAULT
    'Hi {name}, you are number {position} in the queue at {business}. Estimated wait: {wait} minutes. We will alert you when you are close.';

ALTER TABLE public.businesses
  ALTER COLUMN sms_template_call SET DEFAULT
    'Hi {name}, it is your turn at {business}. Please come in now.';

-- Add headsup_sent flag on queue entries
ALTER TABLE public.queue_entries
  ADD COLUMN IF NOT EXISTS headsup_sent BOOLEAN NOT NULL DEFAULT FALSE;
