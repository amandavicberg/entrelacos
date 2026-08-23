import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL não foi definida no .env");
}

if (!supabaseSecretKey) {
  throw new Error("SUPABASE_SECRET_KEY não foi definida no .env");
}

export const supabase = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    realtime: {
      transport: ws as never,
    },
  },
);