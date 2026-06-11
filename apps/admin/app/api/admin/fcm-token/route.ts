import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/auth-server";

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireAdminUser();
    const body = (await request.json()) as { token?: unknown };
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json({ error: "Token is required." }, { status: 400 });
    }

    const { error } = await supabase.from("admin_fcm_tokens").upsert(
      {
        admin_user_id: user.id,
        token,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "token" },
    );

    if (error) {
      console.error("[FCM_TOKEN_UPSERT_ERROR]", error.message);
      return NextResponse.json(
        { error: "Failed to save notification token." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
