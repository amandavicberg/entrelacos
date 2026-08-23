# Configuração inicial do EntreLaços

## Visão geral

Esta documentação reúne o estado final da configuração inicial do projeto e é
a referência técnica da base compartilhada, dos padrões visuais e da
organização inicial do frontend.

## Estrutura atual

- [`frontend/`](../../frontend/): aplicativo React Native com Expo SDK 54,
  TypeScript, Expo Router, React Navigation e Tamagui.
- [`backend/`](../../backend/): aplicação Node.js com TypeScript e configuração
  server-side do Supabase.
- Supabase: integração preparada para autenticação, PostgreSQL, RLS, Storage e
  Realtime conforme as funcionalidades forem implementadas.

O fluxo arquitetural previsto é:

```text
frontend → autenticação/API/Supabase → PostgreSQL (RLS)
```

## Frontend

A navegação inicial está organizada em:

- `frontend/app/index.tsx`: entrada do aplicativo;
- `frontend/app/(patient)/`: área inicial do paciente;
- `frontend/app/(professional)/`: área inicial do profissional;
- `frontend/app/_layout.tsx`: Stack principal, providers do Tamagui e tema.

As rotas de exemplo do template Expo (`(tabs)`, `explore` e `modal`) foram
removidas para evitar caminhos paralelos.

As áreas de paciente e profissional ainda são placeholders. Elas não
representam autenticação nem autorização e não devem ser usadas como proteção
de dados.

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

Também permanecem componentes auxiliares trazidos pelo template Expo, como
`ThemedText`, `ThemedView`, `ExternalLink`, `HapticTab`, `Collapsible` e
`IconSymbol`. Eles devem ser reutilizados ou removidos quando sua necessidade
for avaliada; não devem originar novos padrões concorrentes ao Tamagui.

Novas telas devem reutilizar esses componentes e os tokens do Tamagui antes de
criar estilos ou padrões paralelos. Devem considerar acessibilidade,
responsividade e estados de carregamento, erro e vazio.

## Integração com Supabase

O cliente público do frontend está em `frontend/lib/supabase.ts` e é criado sob
demanda. Ele usa `autoRefreshToken: true`, `detectSessionInUrl: false` e
`persistSession: false`. Essa configuração evita persistir sessão antes de a
estratégia de autenticação segura ser definida.

Não há leitura ou escrita de dados de usuário nesta base. A configuração
server-side do backend está em `backend/src/config/supabase.ts`.

As dependências adicionadas ao frontend para essa fundação são `tamagui`,
`@tamagui/config`, `@tamagui/metro-plugin` e `@supabase/supabase-js`.

Ainda não existem tabelas, migrations, RLS ou policies. Nenhuma alteração deve
ser feita diretamente no banco; mudanças persistentes devem ser migrations
versionadas e validadas antes de aplicação, conforme o `constitution.md`.

## Segurança e autorização

Autenticação não equivale a autorização. As futuras telas e consultas deverão
respeitar o papel do usuário, a associação explícita entre paciente e
profissional e as policies do banco.

O fluxo de associação paciente-profissional ainda precisa ser definido antes
da migration correspondente. Não deve ser criado vínculo implícito por e-mail
ou apenas pelo conhecimento de um identificador.

Os placeholders não são proteção de acesso. A autenticação e a autorização
reais deverão proteger telas, consultas e escritas, considerando paciente,
profissional, usuário não associado e usuário desativado.

## Próximos passos

- definir o fluxo de autenticação e persistência de sessão;
- definir o modelo de perfis e permissões;
- definir e implementar o fluxo explícito de associação;
- criar migrations com constraints, RLS e policies;
- substituir os placeholders pelas telas reais.

A tela de login ainda não foi implementada.

Esses itens ainda não estão implementados nesta configuração inicial.
