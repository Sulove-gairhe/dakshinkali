export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;

  return Response.json({
    supabaseUrl: url,
    anonKeyStartsWith: key ? key.slice(0, 30) : null,
    anonKeyLength: key ? key.length : null,
    nodeEnv: process.env.NODE_ENV,
  });
}