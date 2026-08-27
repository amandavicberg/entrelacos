import "dotenv/config";
import { createClient, type RealtimeClientOptions } from "@supabase/supabase-js";
import WebSocket from "ws";

class NodeWebSocket extends WebSocket {
  constructor(address: string | URL, protocols?: string | string[]) {
    super(address, protocols);
  }
}

const nodeWebSocketTransport = NodeWebSocket as unknown as NonNullable<
  RealtimeClientOptions["transport"]
>;

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
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      transport: nodeWebSocketTransport,
    },
  },
);
