import { resolveSupabaseAnonKey } from "@dakshinkali/auth";

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const resolved = resolveSupabaseAnonKey(url);

  if ("error" in resolved) {
    return { url: url ?? null, key: null, error: resolved.error };
  }

  return { url: url ?? null, key: resolved.key, error: null };
}
