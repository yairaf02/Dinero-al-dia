import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://emcisdcdmnthgvadtvav.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_CZUkXBfvimIRj9cNFv3rpA__zPSHf8U";

const isConfigured = SUPABASE_URL.startsWith("https://")
  && SUPABASE_URL !== "https://YOUR_PROJECT_ID.supabase.co"
  && SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY";

export const supabaseClient = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
