import { NextResponse } from "next/server";
import { HISABKITAB_PERMISSIONS } from "@/lib/auth/permissions";
import { requireHisabKitabPermission } from "@/lib/auth/requireHisabKitabPermission";
import { setSessionPrivacyOverride } from "@/lib/auth/session";

export async function POST(request: Request) {
  await requireHisabKitabPermission(HISABKITAB_PERMISSIONS.settings.view);

  const body = (await request.json().catch(() => ({}))) as {
    value?: boolean | null;
  };

  await setSessionPrivacyOverride(
    typeof body.value === "boolean" ? body.value : null,
  );

  return NextResponse.json({ ok: true });
}
