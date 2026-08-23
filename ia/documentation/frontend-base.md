# Base do frontend

## Visão geral

**Task:** Preparar estrutura base do frontend e completar configuração do Supabase

**Status:** concluída em 2026-08-23.

Esta task substituiu a tela de exemplo inicial do Expo por uma base visual e de
navegação do EntreLaços, completou os componentes comuns iniciais e preparou a
configuração técnica do Supabase. Ela prepara o projeto para a implementação da
tela de login em uma branch baseada na `main` atual.

## Funcionamento atual

O ponto de entrada `/` apresenta a identidade inicial do EntreLaços e links de
desenvolvimento para dois placeholders:

- `/(patient)`: área inicial do paciente;
- `/(professional)`: área inicial do profissional.

Essas rotas não representam autenticação ou autorização. Elas existem apenas
para validar a estrutura de navegação e serão substituídas/evoluídas pelas
telas reais.

## Arquitetura e arquivos principais

- `frontend/app/_layout.tsx`: providers do Tamagui e React Navigation, além do
  Stack principal.
- `frontend/app/index.tsx`: ponto de entrada visual da base.
- `frontend/app/(patient)/`: layout e placeholder do paciente.
- `frontend/app/(professional)/`: layout e placeholder do profissional.
- As rotas de exemplo do template Expo (`(tabs)`, `explore` e `modal`) foram
  removidas para evitar caminhos paralelos.
- `frontend/components/app-screen.tsx`: container padrão de tela.
- `frontend/components/brand-button.tsx`: botão básico com identidade visual.
- `frontend/components/app-input.tsx`: campo rotulado com estado de erro.
- `frontend/components/app-card.tsx`: cartão com título opcional para conteúdo.
- `frontend/components/app-header.tsx`: cabeçalho de tela com título e descrição.
- `frontend/components/feedback-state.tsx`: estados compartilhados de carregamento,
  vazio e erro.
- `frontend/tamagui.config.ts`: configuração do Tamagui e temas claro/escuro.
- `frontend/metro.config.js`: integração do Metro com o Tamagui.
- `frontend/lib/supabase.ts`: criação sob demanda do cliente público do Supabase.
- `frontend/.env.example`: nomes das variáveis públicas esperadas pelo Expo.

## Fluxo de dados e segurança

O frontend pode criar sob demanda um cliente Supabase usando apenas
`EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. O backend
continua usando `SUPABASE_URL` e `SUPABASE_SECRET_KEY` em
`backend/src/config/supabase.ts`. Nenhum dado de usuário é lido ou escrito nesta
task, e não foram criadas migrations, tabelas, RLS ou policies. Os placeholders
não devem ser tratados como proteção de acesso; as permissões reais serão
implementadas junto da autenticação e do domínio.

## Configuração

Foram adicionadas as dependências `tamagui`, `@tamagui/config`,
`@tamagui/metro-plugin` e `@supabase/supabase-js` ao `frontend/package.json`.
Os valores reais devem permanecer em `.env`; somente os nomes estão no
`frontend/.env.example`.

## Validação

- `npx tsc --noEmit`: passou.
- `npm run lint`: passou.
- `npm run build` em `backend`: passou.
- `./node_modules/.bin/expo export --platform web`: passou e gerou as rotas do
  ponto de entrada, paciente e profissional.

O comando `npx expo export --platform web` apresentou incompatibilidade porque
o `npm exec` selecionou Node 18, enquanto o Expo SDK 54 requer Node 20.19.x ou
superior. A mesma validação passou usando o binário local do Expo com Node 22.

## Limitações e próximos passos

- A tela de login ainda não foi implementada nesta task.
- A navegação ainda não possui proteção por sessão.
- O cliente do Supabase usa `persistSession: false`; a persistência segura da
  sessão deverá ser decidida e implementada na task de autenticação.
- Ainda não existem tabelas, perfis, migrations ou policies no banco.
- Os arquivos do template antigo do Expo continuam no repositório para evitar
  remoção prematura; podem ser removidos quando não houver dependências deles.
- O export web gerou a pasta `frontend/dist`, que é artefato de build e não faz
  parte da funcionalidade fonte.
- O próximo integrante deve criar a branch da tela de login a partir da `main`
  após revisar esta base.
