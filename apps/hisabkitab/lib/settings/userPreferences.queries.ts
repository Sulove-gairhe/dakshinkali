import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

export type UserPreferences = {
  user_id: string;
  privacy_mode: boolean | null;
  calendar_pref: "BS" | "AD" | null;
  number_format: "indian" | "international" | null;
};

export function defaultUserPreferences(userId: string): UserPreferences {
  return {
    user_id: userId,
    privacy_mode: null,
    calendar_pref: null,
    number_format: null,
  };
}

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("user_preferences")
    .select("user_id,privacy_mode,calendar_pref,number_format")
    .eq("user_id", userId)
    .maybeSingle<UserPreferences>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? defaultUserPreferences(userId);
}
