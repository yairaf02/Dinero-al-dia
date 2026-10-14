import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const isConfigured = SUPABASE_URL.startsWith("https://")
  && SUPABASE_URL !== "https://YOUR_PROJECT_ID.supabase.co"
  && SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY";

export const supabaseClient = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
