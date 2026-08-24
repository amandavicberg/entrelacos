# Tela de login

## Visão geral

**Task:** `tela-login`

**Status:** implementada no código, dependente da aplicação autorizada das
migrations e de dados de autenticação para teste integrado

**Atualização:** 2026-08-24

A entrada do EntreLaços autentica pacientes e profissionais por e-mail/senha,
valida o papel real do perfil e protege as áreas de cada papel. Pacientes sem
associação ativa permanecem na tela de pendência, sem acesso aos dados de
acompanhamento.

## Funcionamento atual

- `frontend/app/index.tsx` contém o formulário responsivo em Tamagui, a seleção
  Paciente/Profissional, e-mail, senha, alternância de visibilidade, código de
  convite de primeiro acesso e feedback de validação/autenticação.
- A tela permanece rolável em dispositivos menores e com o teclado aberto, mas
  o indicador vertical de rolagem fica oculto para evitar a barra visual. A
  chamada de primeiro acesso permanece no rodapé do formulário.
- O seletor de perfil possui aparência segmentada e mantém semântica de radio
  group, seleção permanente e feedback de toque.
- E-mail e senha usam ícones do conjunto já instalado em `@expo/vector-icons`.
  O controle mostrar/ocultar fica integrado ao campo de senha, com nome
  acessível dinâmico; **Esqueci minha senha** fica alinhado à direita.
- Durante a autenticação, o botão **Entrar** fica desabilitado e apresenta
  `Spinner` com o texto **Entrando...**. A chamada desabilitada de cadastro
  informa **Cadastre-se como paciente** ou **Cadastre-se como profissional** de
  acordo com a seleção visual.
- `frontend/components/app-input.tsx` aceita `startAdornment` e `endAdornment`
  opcionais. Sem esses elementos, preserva a renderização anterior; com eles,
  agrupa ícones/ações e o `Input` na mesma borda, usando tokens do Tamagui.
- O código aparece apenas no modo paciente e só é exigido depois da
  autenticação quando não existe associação `pending` ou `active`.
- `frontend/app/forgot-password.tsx` é apenas o shell da rota pública
  `/forgot-password`; o envio e a redefinição permanecem fora desta task.
- O botão de cadastro está visível, mas desabilitado até que a rota produzida
  pela outra task seja acordada. Nenhuma tela de cadastro paralela foi criada.
- `frontend/app/(patient)/pending.tsx` permite verificar novamente a associação
  ou sair. Ela não lê nem escreve dados de acompanhamento.
- As áreas placeholder de paciente e profissional agora oferecem logout e são
  protegidas por seus layouts.

## Arquitetura e fluxo de dados

1. `AuthProvider`, em `frontend/contexts/auth-context.tsx`, restaura ou cria a
   sessão do Supabase Auth.
2. Após autenticar, consulta o próprio `profiles.role` via RLS e rejeita um tipo
   de acesso diferente do escolhido.
3. Para paciente, consulta somente associações próprias ativas ou pendentes.
4. Sem associação aberta, envia o código e o bearer token para
   `POST /v1/patient/invitations/consume`.
5. O backend valida o token com Supabase Auth, confirma que o perfil é um
   paciente ativo e chama `consume_patient_invite` com o cliente privilegiado.
6. A função bloqueia o convite, valida expiração/uso/revogação, cria a relação
   `pending` e marca o convite como usado na mesma transação.

O código de convite é normalizado com `trim` e letras maiúsculas e comparado ao
digest SHA-256 hexadecimal armazenado. A futura geração de convites deve usar a
mesma normalização.

## Autorização e segurança

- A seleção visual nunca define o papel; `profiles.role` é a fonte de verdade.
- Perfil inexistente, inativo ou divergente encerra a sessão e não acessa área
  protegida.
- Profissional ativo acessa apenas `/(professional)`.
- Paciente com associação `active` acessa `/(patient)`.
- Paciente sem associação ativa acessa somente `/(patient)/pending`.
- O endpoint aceita apenas bearer token válido de perfil `patient` ativo.
- A função transacional é revogada de `public`, `anon` e `authenticated` e
  concedida apenas ao `service_role`.
- Senha, token e código não são registrados em logs. O frontend nunca recebe a
  chave secreta.
- A sessão é persistida no Android/iOS com `expo-secure-store`; na exportação
  web, a sessão permanece apenas em memória e não é persistida em texto simples.

## Banco e migrations

- Reutiliza `profiles`, `patient_profiles`, `professional_invites` e
  `patient_professional_relationships` da migration inicial.
- Adiciona
  `supabase/migrations/20260824_000002_consume_patient_invite.sql`, com
  `pgcrypto` e a função transacional `consume_patient_invite`.
- Nenhuma nova tabela foi necessária.
- As migrations `20260823` e `20260824` foram aplicadas ao Supabase local em
  2026-08-24. Nenhuma delas foi aplicada a projeto remoto por esta task.

## Configuração

Frontend:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_API_URL` (exemplo local: `http://localhost:3333`)

Backend:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `PORT` (padrão: `3333`)
- `CORS_ORIGIN` (exemplo local: `http://localhost:8081`)

## Validação

- Redesign visual de 2026-08-24: `npm.cmd run typecheck` — aprovado.
- Redesign visual de 2026-08-24: `npm.cmd run lint` — aprovado.
- Redesign visual de 2026-08-24: `npm.cmd run build` — aprovado; oito rotas
  estáticas exportadas. Após exportar, o Expo informou que algo impediu a saída
  normal e encerrou o processo à força, mas retornou código `0`.
- Validação visual manual em Android, iOS e dispositivo físico — não executada
  neste ambiente.
- Ajuste visual de 2026-08-24: `npm.cmd run typecheck` — aprovado.
- Ajuste visual de 2026-08-24: `npm.cmd run lint` — aprovado.
- Ajuste visual de 2026-08-24: `git diff --check` — aprovado, somente com
  avisos de normalização LF/CRLF em arquivos já modificados no worktree.
- `frontend: npm.cmd run typecheck` — aprovado.
- `frontend: npm.cmd run lint` — aprovado.
- `frontend: npm.cmd run build` — aprovado após tornar o script compatível com
  Windows; oito rotas estáticas exportadas.
- `backend: npm.cmd run typecheck` — aprovado.
- `backend: npm.cmd run build` — aprovado.
- `git diff --check` — aprovado, somente avisos de normalização LF/CRLF.
- `npx.cmd supabase migration up --local` — aprovado; aplicou a migration
  `20260824_000002_consume_patient_invite.sql`. A migration inicial já constava
  no histórico local.
- `npx.cmd supabase migration list --local` — aprovado; migrations `20260823`
  e `20260824` presentes no histórico local.
- `npx.cmd supabase db lint --local` — aprovado; nenhum erro de schema encontrado.

## Limitações e próximos passos

- Manter migrations remotas pendentes até autorização específica para o
  ambiente de desenvolvimento remoto.
- Criar usuários, perfis e convites de teste sem dados reais de pacientes.
- Implementar geração de convite com a mesma normalização SHA-256.
- Implementar aprovação profissional da associação.
- Conectar a rota de cadastro quando a task responsável entregar o contrato.
- Implementar o fluxo real de recuperação de senha e deep link.
- Adicionar testes automatizados do provider, guards, endpoint e concorrência do
  consumo de convite.
- O script depende do backend acessível pelo dispositivo; em aparelho físico,
  `localhost` deve ser substituído pelo endereço alcançável da máquina de
  desenvolvimento.
- A instalação reportou 20 alertas no grafo npm (1 baixo, 10 moderados e 9
  altos). Eles não foram corrigidos automaticamente nesta task para evitar
  atualizações potencialmente incompatíveis; devem ser triados separadamente.
