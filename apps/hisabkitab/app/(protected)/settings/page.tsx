import { PageHeader } from "@/components/shared/PageHeader";
import { BusinessSettingsForm } from "@/components/settings/BusinessSettingsForm";
import { PrivacyModeControls } from "@/components/settings/PrivacyModeControls";
import { HISABKITAB_PERMISSIONS } from "@/lib/auth/permissions";
import { requireHisabKitabPermission } from "@/lib/auth/requireHisabKitabPermission";
import { getSessionPrivacyOverride } from "@/lib/auth/session";
import { getBusinessSettings } from "@/lib/settings/businessSettings.queries";
import { resolveEffectivePrivacyMode } from "@/lib/settings/privacyMode";
import { getUserPreferences } from "@/lib/settings/userPreferences.queries";

export default async function SettingsPage() {
  const context = await requireHisabKitabPermission(
    HISABKITAB_PERMISSIONS.settings.view,
  );
  const [businessSettings, userPreferences, sessionOverride] =
    await Promise.all([
      getBusinessSettings(),
      getUserPreferences(context.userId),
      getSessionPrivacyOverride(),
    ]);
  const canEdit = context.isAdmin
    ? true
    : context.staffPermissions.includes(HISABKITAB_PERMISSIONS.settings.edit);
  const effectivePrivacyMode = resolveEffectivePrivacyMode({
    sessionOverride,
    userPreference: userPreferences.privacy_mode,
    businessDefault: businessSettings.default_privacy_mode,
  });

  return (
    <div>
      <PageHeader
        eyebrow="Phase 1"
        title="Settings"
        description="Business defaults, user preferences, and Privacy Mode controls for the HisabKitab shell."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <BusinessSettingsForm settings={businessSettings} canEdit={canEdit} />
        <PrivacyModeControls
          preferences={userPreferences}
          sessionOverride={sessionOverride}
          businessDefault={businessSettings.default_privacy_mode}
          effectivePrivacyMode={effectivePrivacyMode}
        />
      </div>
    </div>
  );
}
