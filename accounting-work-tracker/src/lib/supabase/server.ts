import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

export function getSupabaseAuthClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", supabaseAnonKey),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export function getSupabaseServerClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY", supabaseServiceRoleKey),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
