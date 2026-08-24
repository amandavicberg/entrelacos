import "dotenv/config";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { supabase } from "./config/supabase.js";

const port = Number(process.env.PORT ?? 3333);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:8081";
const maxBodyBytes = 2_048;

type InviteBody = { code?: unknown };

class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly publicMessage: string,
  ) {
    super(publicMessage);
  }
}

function sendJson(response: ServerResponse, status: number, body: object): void {
  response.writeHead(status, {
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": corsOrigin,
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(status === 204 ? undefined : JSON.stringify(body));
}

async function readJson(request: IncomingMessage): Promise<InviteBody> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxBodyBytes) throw new HttpError(413, "Requisição muito grande.");
    chunks.push(buffer);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as InviteBody;
  } catch {
    throw new HttpError(400, "Corpo da requisição inválido.");
  }
}

function getBearerToken(request: IncomingMessage): string {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "Sessão inválida ou expirada.");
  }
  return authorization.slice("Bearer ".length).trim();
}

async function consumeInvite(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const token = getBearerToken(request);
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) throw new HttpError(401, "Sessão inválida ou expirada.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "patient" || profile.status !== 0) {
    throw new HttpError(403, "Este usuário não pode utilizar um convite de paciente.");
  }

  const body = await readJson(request);
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (code.length < 6 || code.length > 64) {
    throw new HttpError(400, "Informe um código de convite válido.");
  }

  const { data, error } = await supabase.rpc("consume_patient_invite", {
    p_code: code,
    p_patient_id: authData.user.id,
  });

  if (error) {
    console.error("Falha ao consumir convite", { errorCode: error.code });
    throw new HttpError(400, "Código inválido, expirado ou já utilizado.");
  }

  sendJson(response, 201, { relationship: data });
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  try {
    if (request.method === "POST" && request.url === "/v1/patient/invitations/consume") {
      await consumeInvite(request, response);
      return;
    }
    sendJson(response, 404, { error: "Rota não encontrada." });
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(response, error.status, { error: error.publicMessage });
      return;
    }
    console.error("Erro inesperado no backend", error);
    sendJson(response, 500, { error: "Não foi possível concluir a solicitação." });
  }
});

server.listen(port, () => {
  console.log(`Backend do EntreLaços disponível na porta ${port}.`);
});
