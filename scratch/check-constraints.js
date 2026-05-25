import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const sql = `
    SELECT
      conname AS constraint_name,
      pg_get_constraintdef(c.oid) AS constraint_definition
    FROM
      pg_constraint c
    JOIN
      pg_namespace n ON n.oid = c.connamespace
    JOIN
      pg_class t ON t.oid = c.conrelid
    WHERE
      n.nspname = 'public'
      AND t.relname = 'orders';
  `;
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    console.error("RPC exec_sql failed:", error.message);
    const { data: qData, error: qError } = await supabase.rpc('query', { query_text: sql });
    if (qError) {
      console.error("RPC query failed:", qError.message);
    } else {
      console.log("Constraints:", qData);
    }
  } else {
    console.log("Constraints:", data);
  }
}

main().catch(console.error);
