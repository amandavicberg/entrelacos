import "dotenv/config";
import { createHash, randomBytes } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { supabase } from "./config/supabase.js";

const port = Number(process.env.PORT ?? 3333);
const host = process.env.HOST ?? "0.0.0.0";
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:8081";
const maxBodyBytes = 2_048;

type InviteBody = { code?: unknown };

const inviteLifetimeMs = 7 * 24 * 60 * 60 * 1000;

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

function createInviteCode(): string {
  return randomBytes(8).toString("hex").toUpperCase();
}

function digestInviteCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

async function generateProfessionalInvite(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const token = getBearerToken(request);
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) throw new HttpError(401, "Sessão inválida ou expirada.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "professional" || profile.status !== 0) {
    throw new HttpError(403, "Este usuário não pode gerar convites.");
  }

  const { data: professionalProfile, error: professionalProfileError } = await supabase
    .from("professional_profiles")
    .select("id, status")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (
    professionalProfileError
    || !professionalProfile
    || professionalProfile.status !== 0
  ) {
    throw new HttpError(403, "Este profissional não está ativo.");
  }

  const code = createInviteCode();
  const expiresAt = new Date(Date.now() + inviteLifetimeMs);
  const { error: insertError } = await supabase.from("professional_invites").insert({
    professional_id: authData.user.id,
    code_digest: digestInviteCode(code),
    expires_at: expiresAt.toISOString(),
    status: 0,
  });

  if (insertError) {
    console.error("Falha ao criar convite", { errorCode: insertError.code });
    throw new HttpError(500, "Não foi possível gerar o convite.");
  }

  sendJson(response, 201, {
    invitation: {
      code,
      expiresAt: expiresAt.toISOString(),
    },
  });
}

async function authenticateProfessional(request: IncomingMessage): Promise<string> {
  const token = getBearerToken(request);
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) throw new HttpError(401, "Sessão inválida ou expirada.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", authData.user.id)
    .maybeSingle();
  const { data: professionalProfile, error: professionalProfileError } = await supabase
    .from("professional_profiles")
    .select("status")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (
    profileError
    || professionalProfileError
    || !profile
    || !professionalProfile
    || profile.role !== "professional"
    || profile.status !== 0
    || professionalProfile.status !== 0
  ) {
    throw new HttpError(403, "Este usuário não pode gerenciar convites.");
  }

  return authData.user.id;
}

async function listPendingRelationships(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const professionalId = await authenticateProfessional(request);
  const { data, error } = await supabase
    .from("patient_professional_relationships")
    .select("id, patient_id, requested_at")
    .eq("professional_id", professionalId)
    .eq("relationship_status", "pending")
    .eq("status", 0)
    .order("requested_at", { ascending: true });

  if (error) {
    console.error("Falha ao listar solicitações de paciente", { errorCode: error.code });
    throw new HttpError(500, "Não foi possível carregar as solicitações.");
  }

  sendJson(response, 200, {
    relationships: (data ?? []).map((relationship) => ({
      id: relationship.id,
      requestedAt: relationship.requested_at,
    })),
  });
}

function getRelationshipId(request: IncomingMessage): string {
  const match = /^\/v1\/professional\/relationships\/([0-9a-f-]{36})\/approve$/i.exec(request.url ?? "");
  if (!match) throw new HttpError(400, "Solicitação inválida.");
  return match[1];
}

async function approveRelationship(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const professionalId = await authenticateProfessional(request);
  const relationshipId = getRelationshipId(request);
  const { data, error } = await supabase
    .from("patient_professional_relationships")
    .update({ relationship_status: "active", approved_at: new Date().toISOString() })
    .eq("id", relationshipId)
    .eq("professional_id", professionalId)
    .eq("relationship_status", "pending")
    .eq("status", 0)
    .select("id, relationship_status, approved_at")
    .maybeSingle();

  if (error) {
    console.error("Falha ao aprovar solicitação de paciente", { errorCode: error.code });
    throw new HttpError(500, "Não foi possível aprovar a solicitação.");
  }
  if (!data) throw new HttpError(409, "A solicitação não está mais pendente.");

  sendJson(response, 200, {
    relationship: {
      id: data.id,
      status: data.relationship_status,
      approvedAt: data.approved_at,
    },
  });
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
    if (request.method === "POST" && request.url === "/v1/professional/invitations") {
      await generateProfessionalInvite(request, response);
      return;
    }
    if (request.method === "GET" && request.url === "/v1/professional/relationships/pending") {
      await listPendingRelationships(request, response);
      return;
    }
    if (request.method === "POST" && /^\/v1\/professional\/relationships\/[0-9a-f-]{36}\/approve$/i.test(request.url ?? "")) {
      await approveRelationship(request, response);
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

server.listen(port, host, () => {
  console.log(`Backend do EntreLaços disponível em http://${host}:${port}.`);
});
