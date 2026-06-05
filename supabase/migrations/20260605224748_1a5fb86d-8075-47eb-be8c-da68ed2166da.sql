CREATE OR REPLACE FUNCTION public.shift_queue_positions(_queue_id uuid, _old_position int, _new_position int)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.queue_entries
  SET position = position - 1
  WHERE queue_id = _queue_id
    AND status = 'waiting'
    AND position > _old_position
    AND position <= _new_position;
$$;

REVOKE EXECUTE ON FUNCTION public.shift_queue_positions(uuid, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.shift_queue_positions(uuid, int, int) TO service_role;