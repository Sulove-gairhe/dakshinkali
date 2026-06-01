export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;

  let keyPayload: Record<string, unknown> | null = null;

  try {
    if (key?.includes(".")) {
      const payloadPart = key.split(".")[1];
      const decoded = Buffer.from(payloadPart, "base64url").toString("utf8");
      keyPayload = JSON.parse(decoded);
    }
  } catch {
    keyPayload = { error: "Could not decode key payload" };
  }

  return Response.json({
    supabaseUrl: url,
    urlProjectRef: url?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? null,
    anonKeyStartsWith: key ? key.slice(0, 30) : null,
    anonKeyLength: key ? key.length : null,
    keyPayload: keyPayload
      ? {
          iss: keyPayload.iss,
          ref: keyPayload.ref,
          role: keyPayload.role,
          iat: keyPayload.iat,
          exp: keyPayload.exp,
        }
      : null,
    nodeEnv: process.env.NODE_ENV,
  });
}