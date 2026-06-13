CREATE INDEX IF NOT EXISTS idx_queue_entries_status ON public.queue_entries(status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_queue_status ON public.queue_entries(queue_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_business_status ON public.queue_entries(business_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_position ON public.queue_entries(queue_id, position);
