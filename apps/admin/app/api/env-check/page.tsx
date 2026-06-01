export default function EnvCheckPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <main style={{ padding: 24 }}>
      <h1>Env Check</h1>
      <p>
        <strong>Supabase URL:</strong> {url}
      </p>
      <p>
        <strong>Anon key starts with:</strong> {key?.slice(0, 30)}
      </p>
      <p>
        <strong>Anon key length:</strong> {key?.length}
      </p>
    </main>
  );
}
