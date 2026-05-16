import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { user, loading, role } = useSession();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (role === "superadmin") navigate({ to: "/superadmin" });
    else if (role === "owner") navigate({ to: "/dashboard" });
    else if (role === "staff") navigate({ to: "/queue" });
    else navigate({ to: "/login" });
  }, [user, loading, role, navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      Loading…
    </div>
  );
}
