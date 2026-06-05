// External Supabase client — points at the user-owned Supabase project.
// The anon/publishable key is safe to ship in client code (RLS enforces access).
// To override at build time, set VITE_EXTERNAL_SUPABASE_URL and
// VITE_EXTERNAL_SUPABASE_ANON_KEY (Lovable Workspace → Build Secrets,
// or a local .env.local during development).
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL =
  (import.meta.env.VITE_EXTERNAL_SUPABASE_URL as string | undefined) ||
  "https://dlajmpxehuqlhuzotbir.supabase.co";

const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_EXTERNAL_SUPABASE_ANON_KEY as string | undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsYWptcHhlaHVxbGh1em90YmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTgzMzcsImV4cCI6MjA5NjIzNDMzN30.MKagzxl7BesQKDw2YbXex2FnruGeeI4gdfR04SKyajI";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});