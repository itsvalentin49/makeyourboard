// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

function mustEnv(name: string, v: string | undefined): string {
  if (!v || !v.trim()) {
    throw new Error(
      `[Supabase] Missing ${name}. Add it to .env.local then restart: npm run dev`
    );
  }
  return v;
}

const supabaseUrl = mustEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = mustEnv(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
