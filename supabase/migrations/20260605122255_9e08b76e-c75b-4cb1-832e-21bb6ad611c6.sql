
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_superadmin(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_can_access_business(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_owns_business(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_business() FROM anon, authenticated, PUBLIC;
