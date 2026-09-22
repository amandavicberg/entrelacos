# Fluxo de associação entre paciente e profissional

**Status:** implementado no código; validação integrada e manual pendente.  
**Atualizado em:** 2026-09-21.

## Visão geral

A associação é iniciada exclusivamente por convite gerado por um profissional
ativo. O paciente autenticado informa o código no aplicativo, criando uma
solicitação pendente. O profissional responsável vê a identificação mínima do
pedido e decide por aprovar ou recusar. Somente uma associação `active` libera
o acesso do paciente às telas de acompanhamento.

## Funcionamento atual

O estado de acesso em
[`frontend/contexts/auth-context.tsx`](../../frontend/contexts/auth-context.tsx)
separa três situações do paciente:

- `patient-unassociated`: não há relação ativa ou pendente; o usuário é levado
  para [`/(patient)/connect`](../../frontend/app/(patient)/connect.tsx), onde
  pode informar o código recebido.
- `patient-pending`: um convite já foi consumido e o usuário aguarda decisão;
  a rota [`/(patient)/pending`](../../frontend/app/(patient)/pending.tsx) não
  expõe dados de acompanhamento e permite atualizar o estado ou sair.
- `patient-active`: existe ao menos uma associação ativa e a área do paciente é
  liberada.

Na tela de conexão, o código é normalizado no cliente e enviado ao endpoint
`POST /v1/patient/invitations/consume` com o bearer token da sessão. Após uma
resposta bem-sucedida, o estado de acesso é consultado novamente e o paciente
segue para a pendência.

No dashboard profissional, a seção “Convites e solicitações” usa
[`frontend/lib/api.ts`](../../frontend/lib/api.ts) para gerar convites, listar
pendências e decidir pedidos. Para cada solicitação pendente, a interface mostra
somente o nome do paciente e a data do pedido, e oferece as ações Aprovar e
Recusar. As ações são desabilitadas enquanto uma decisão está em andamento.

## Arquitetura e autorização

As operações privilegiadas permanecem no
[`backend/src/server.ts`](../../backend/src/server.ts):

- `POST /v1/professional/invitations` gera código aleatório e devolve o valor
  original somente na criação;
- `POST /v1/patient/invitations/consume` valida o paciente e executa a RPC de
  consumo;
- `GET /v1/professional/relationships/pending` retorna somente pedidos do
  profissional autenticado, com `full_name` e `requested_at` mínimos;
- `POST /v1/professional/relationships/:id/approve` muda um pedido próprio de
  `pending` para `active` e registra `approved_at`;
- `POST /v1/professional/relationships/:id/reject` muda um pedido próprio de
  `pending` para `rejected`.

Cada operação valida bearer token, `profiles.role`, `profiles.status` e, no
caso profissional, `professional_profiles.status`. O backend usa a credencial
server-side para a escrita; o app não recebe chave privilegiada nem policy de
escrita adicional. Erros registrados no backend contêm apenas códigos de erro,
sem token, código do convite ou nome de paciente.

## Banco e migrations

Não houve migration nesta task. O fluxo reutiliza:

- [`20260823_000001_identity_and_relationships.sql`](../../supabase/migrations/20260823_000001_identity_and_relationships.sql), que define
  `professional_invites`, `patient_professional_relationships`, RLS e o enum
  `relationship_status`;
- [`20260824_000002_consume_patient_invite.sql`](../../supabase/migrations/20260824_000002_consume_patient_invite.sql), cuja RPC consome o convite de modo atômico, cria a relação `pending` e marca o convite como usado.

Um código usado não pode ser reutilizado, inclusive se a relação for recusada.
Relações recusadas deixam de ser pendentes e o paciente retorna ao fluxo de
conexão, sem permissão para dados de acompanhamento.

## Configuração e validação

O frontend requer `EXPO_PUBLIC_API_URL` apontando para o backend acessível ao
dispositivo. O backend requer as variáveis server-side descritas no seu
`.env.example`; nenhuma credencial deve ser adicionada ao frontend.

Foram executados com sucesso:

- `frontend: npm run typecheck`;
- `frontend: node scripts/professional-dashboard.test.mjs` (5 testes aprovados);
- `backend: npm run typecheck`;
- `backend: npm run build`;
- `git diff --check`.

`frontend: npm run lint` não foi executado até o fim: o ambiente atual usa
Node.js 18.20.8, mas o Expo SDK 57 exige Node.js 20.19.4 ou superior e falha
antes de iniciar o lint.

## Limitações e próximos passos

- Falta validar o fluxo ponta a ponta em um Supabase com as migrations
  aplicadas, incluindo os cenários de código inválido, expirado, usado, recusa
  e aprovação.
- QR Code, envio de convite por canais externos, revogação de convite,
  cancelamento pelo paciente e encerramento de associação ativa não estão
  implementados.
- A política de um ou vários profissionais por paciente continua pendente de
  decisão de produto. A interface atual evita múltiplas solicitações
  simultâneas, mas não altera a cardinalidade existente no banco.
