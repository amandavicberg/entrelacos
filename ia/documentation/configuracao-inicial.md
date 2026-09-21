# Configuração inicial do EntreLaços

## Visão geral

Esta documentação reúne o estado final da configuração inicial do projeto e é
a referência técnica da base compartilhada, dos padrões visuais e da
organização inicial do frontend.

**Status:** atualizado em 2026-09-09.

## Estrutura atual

- [`frontend/`](../../frontend/): aplicativo React Native com Expo SDK 57,
  TypeScript, Expo Router e Tamagui.
- [`backend/`](../../backend/): aplicação Node.js com TypeScript e configuração
  server-side do Supabase.
- Supabase: integração preparada para autenticação, PostgreSQL, RLS, Storage e
  Realtime conforme as funcionalidades forem implementadas.

O fluxo arquitetural previsto é:

```text
frontend → autenticação/API/Supabase → PostgreSQL (RLS)
```

## Frontend

A área profissional possui painel inicial e quatro abas protegidas. Os dados
demonstrativos ficam separados da interface em
`frontend/lib/professional-dashboard.ts`, e os testes correspondentes estão em
`frontend/scripts/professional-dashboard.test.mjs`. Essa entrega também
habilita o driver de animação já incluído em
`@tamagui/config/v5-rn` para o Sheet e permite propriedades visuais adicionais
no `AppCard`, preservando seus valores padrão.

A navegação inicial está organizada em:

- `frontend/app/index.tsx`: entrada do aplicativo;
- `frontend/app/(patient)/`: área inicial do paciente;
- `frontend/app/(professional)/`: área inicial do profissional;
- `frontend/app/_layout.tsx`: Stack principal, providers do Tamagui e tema.

As rotas de exemplo do template Expo (`(tabs)`, `explore` e `modal`) foram
removidas para evitar caminhos paralelos.

As áreas de paciente e profissional possuem guards por sessão, perfil e estado
da associação. Eles não substituem RLS, que continua sendo a camada de
autorização dos dados. A tela do paciente é uma composição local: os campos de
sentimento e anotação ainda não persistem porque o modelo de acompanhamento não
foi criado. O painel profissional apresenta dados demonstrativos identificados
como fictícios, exceto perfil próprio e fluxo de convites.

O Tamagui está configurado em `frontend/tamagui.config.ts` com temas claro e
escuro e tokens de identidade do EntreLaços. A integração com o Metro está em
`frontend/metro.config.js`.

Componentes compartilhados disponíveis:

- `AppScreen`: container padrão de tela;
- `AppHeader`: cabeçalho com título e descrição;
- `BrandButton`: botão com identidade visual;
- `AppInput`: campo rotulado com estado de erro;
- `AppCard`: cartão de conteúdo;
- `FeedbackState`: estados de carregamento, vazio e erro.
- `BrandLogo`: uso exclusivo dos assets oficiais de marca.

Novas telas devem reutilizar esses componentes e os tokens do Tamagui antes de
criar estilos ou padrões paralelos. Devem considerar acessibilidade,
responsividade e estados de carregamento, erro e vazio.

## Integração com Supabase

O cliente público do frontend está em `frontend/lib/supabase.ts` e é criado sob
demanda. Ele usa `autoRefreshToken: true`, `detectSessionInUrl: false` e
persistência em `expo-secure-store` no mobile; na web, a sessão fica apenas em
memória. O `AuthProvider` trata o retorno do deep link de recuperação de senha
e não armazena a chave secreta do Supabase.

O aplicativo lê somente o perfil da pessoa autenticada, suas relações e o
perfil profissional próprio, sujeitos às policies existentes. Geração,
consumo e aprovação de convite usam o backend, cuja configuração server-side
está em `backend/src/config/supabase.ts`.

As dependências adicionadas ao frontend para essa fundação são `tamagui`,
`@tamagui/config`, `@tamagui/metro-plugin` e `@supabase/supabase-js`.

A migration inicial em
[`supabase/migrations/20260823_000001_identity_and_relationships.sql`](../../supabase/migrations/20260823_000001_identity_and_relationships.sql)
define perfis, perfis específicos de paciente e profissional, convites e
associações. Ela inclui constraints, índices, triggers de atualização, RLS e
policies mínimas de leitura. A migration foi aplicada ao Supabase local em
2026-08-24, mas não a projeto remoto.

As tabelas criadas pela migration são:

- `profiles`: identidade ligada a `auth.users`, papel único e status ativo;
- `patient_profiles`: dados complementares do paciente e status de soft-delete;
- `professional_profiles`: dados complementares do profissional e status de
  soft-delete;
- `professional_invites`: convites com digest do código, expiração, controle
  de uso e status de soft-delete;
- `patient_professional_relationships`: status de soft-delete e estado de
  negócio `pending`, `active`, `rejected`, `ended` ou `cancelled`.

Em todas essas tabelas, `status = 0` significa ativo e `status = -1` significa
inativo ou removido logicamente. Não há exclusão física prevista para os dados
de domínio.

Nenhuma alteração deve ser feita diretamente no banco; mudanças persistentes
devem ser migrations versionadas e validadas antes de aplicação, conforme o
`constitution.md`.

## Segurança e autorização

Cada usuário possui somente um papel: `patient` ou `professional`. Autenticação
não equivale a autorização. As futuras telas e consultas deverão respeitar o
papel do usuário, a associação explícita entre paciente e profissional e as
policies do banco.

O fluxo definido para a associação é baseado em convite do profissional por
código aleatório, de uso único e com expiração. O paciente informa o código,
a relação é criada como `pending` e o profissional deve aprová-la para que
fique `active`. Código usado, expirado, recusado ou cancelado não pode ser
reutilizado. QR Code pode ser adicionado depois como outra forma de transportar
o mesmo convite.

Um usuário pode concluir a autenticação sem associação ativa, mas fica restrito
a uma tela de pendência/bloqueio e não acessa dados do produto. O paciente não
pode criar registros antes de possuir uma associação `active`. A quantidade de
profissionais associados por paciente ainda está pendente de decisão.

O `AuthProvider` resolve o perfil autenticado e as relações ativas ou
pendentes. Profissionais entram na área profissional; pacientes ativos entram
na área de paciente; pacientes sem relação ativa permanecem em `/(patient)/pending`.
Falha na validação encerra a sessão local. As policies do banco permanecem
necessárias para toda leitura ou escrita.

## Próximos passos

- completar os testes integrados com Supabase local e a configuração de URLs
  de redirecionamento para confirmação e recuperação de senha;
- decidir se um paciente pode ter um ou vários profissionais ativos;
- adicionar migrations de acompanhamento com constraints, RLS e policies;
- substituir dados demonstrativos por consultas autorizadas quando as tabelas
  correspondentes existirem;
- definir verificação ou credenciamento antes de permitir uso real do cadastro
  de profissionais.

A entrada do aplicativo possui cadastro, confirmação de e-mail, autenticação
por e-mail e senha e recuperação de senha para paciente e profissional,
persistência móvel com `expo-secure-store`, validação do papel em `profiles` e
guards nas áreas protegidas. A recuperação solicita o link pelo Supabase para
`entrelacos://reset-password`, troca a senha somente após uma sessão de
recuperação válida e encerra essa sessão antes de retornar ao login.

O consumo do código de convite e a criação da associação `pending` foram
preparados no backend e na migration
`20260824_000002_consume_patient_invite.sql`. A migration foi aplicada somente
ao Supabase local em 2026-08-24 e validada por `supabase db lint --local`, sem
erros de schema; não foi aplicada remotamente. A geração de convites, o
consumo pelo paciente e a aprovação profissional são operações server-side;
nenhuma policy de escrita foi aberta ao aplicativo público.

Registros de acompanhamento, consultas, arquivos, grupos e materiais ainda
não possuem tabelas e devem ser adicionados em migrations próprias quando as
respectivas funcionalidades forem implementadas.

## Manutenção do lockfile e CI

O workflow usa Node 22 e `npm ci` no Ubuntu. Em 2026-08-24, o
`frontend/package-lock.json` foi regenerado com npm 10 e dependências opcionais
incluídas para corrigir a ausência das variantes `@emnapi` necessárias no
Linux/WASM. A validação equivalente ao runner foi executada com
`npm@10 ci --dry-run --ignore-scripts --os=linux --cpu=x64` e concluída com
sucesso.

Ao adicionar dependências nativas a partir do Windows, não remover do lockfile
pacotes opcionais de outras plataformas. Antes de enviar um PR, validar o
lockfile com a versão principal do npm usada pelo Node configurado em `.nvmrc`.
