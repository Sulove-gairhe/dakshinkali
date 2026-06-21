export type PrivacyModeInputs = {
  sessionOverride?: boolean | null;
  userPreference?: boolean | null;
  businessDefault?: boolean | null;
};

export function resolveEffectivePrivacyMode({
  sessionOverride,
  userPreference,
  businessDefault,
}: PrivacyModeInputs) {
  return sessionOverride ?? userPreference ?? businessDefault ?? false;
}
