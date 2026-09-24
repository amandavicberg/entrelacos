# Tela inicial do paciente

**Status:** implementada no frontend, atualizada em 2026-09-24.

## Visão geral

A rota [`frontend/app/(patient)/index.tsx`](../../frontend/app/(patient)/index.tsx)
é a home de pacientes com associação ativa. Ela reúne um resumo autorizado do
acompanhamento, a agenda futura, atalhos para os módulos já entregues e o menu
lateral da área do paciente.

## Funcionamento atual

- O guard redireciona paciente pendente para `/(patient)/pending` e paciente
  sem associação para `/(patient)/connect`. Estados diferentes de
  `patient-active` não renderizam os dados da home.
- Ao abrir a tela, o frontend solicita em paralelo a agenda do paciente, as
  observações compartilhadas e os materiais compartilhados, usando o token da
  sessão. A próxima consulta é a primeira consulta agendada no futuro.
- A home mostra carregamento, erro recuperável com nova tentativa e estado
  vazio honesto quando não existe uma próxima sessão.
- Os atalhos levam para agenda, orientações compartilhadas, histórico e
  materiais. O menu identifica os demais itens como “Em breve”, sem simular
  documentos, chat, ferramentas ou conteúdo que ainda não existe.
- O quadro de sentimentos e anotação curta é local. Ele deixa explícito que
  não salva nem envia informações de saúde: não há migration, endpoint ou
  persistência para esse registro nesta entrega.
- O menu mantém o encerramento da sessão pelo `AuthProvider`.

## Arquitetura e segurança

As leituras usam os contratos em [`frontend/lib/api.ts`](../../frontend/lib/api.ts):
`listAppointments`, `listPatientObservations` e `listMaterials`. Os endpoints
do paciente dependem de uma associação ativa; o frontend apenas complementa
essa proteção com o guard de navegação. A autorização efetiva continua no
backend e nas policies da migration
[`supabase/migrations/20260922_000003_professional_follow_up.sql`](../../supabase/migrations/20260922_000003_professional_follow_up.sql).

Nenhum dado é escrito pela home e nenhum novo schema, policy ou migration foi
criado ou aplicado.

## Interface e acessibilidade

A tela reutiliza `AppScreen`, `AppHeader`, `AppCard`, `BrandButton` e
`FeedbackState`, além dos tokens semânticos do Tamagui. Os controles usam o
alvo mínimo `$touchTarget`; os sentimentos expõem grupo e estado de seleção
para tecnologias assistivas; o menu possui rótulos e hints para itens ainda
indisponíveis.

## Validação

- `npm run typecheck`: concluído com sucesso.
- `git diff --check`: concluído com sucesso.
- `npm run lint` e `npm run build`: bloqueados antes de analisar o projeto.
  Embora o shell informe Node 22.23.2, o Expo CLI interno resolve Node 18.20.8
  e falha em `@expo/env` (`parseEnv is not a function`). O Expo SDK 57 exige
  Node 22.13+.

## Limitações e manutenção

- Persistir o check-in diário exige uma decisão de domínio e uma migration
  própria, com periodicidade, retenção, RLS e limites de conteúdo. Não trate a
  anotação local como registro clínico.
- O protocolo de emergência continua sem fonte de conteúdo configurada. A tela
  não fornece orientação clínica nem substitui serviços de urgência.
- Ainda é necessária revisão visual em dispositivos Android/iOS, web, tema
  escuro, fonte ampliada e teclado aberto.
