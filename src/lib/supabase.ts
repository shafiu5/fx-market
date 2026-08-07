import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses row-level security. Access control for
// uploaded files is enforced in application code (admin-or-owner checks in
// the /files route), not in Postgres/Storage policies, so this key must
// never be exposed to the client.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export const UPLOADS_BUCKET = "uploads";
