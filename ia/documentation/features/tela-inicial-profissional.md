# Tela inicial e navegação do profissional

Atualização: 2026-09-07. Implementação disponível para validação humana.

## Funcionamento

A [área profissional](../../../frontend/app/(professional)/index.tsx) apresenta marca, saudação, cartão com os dados do próprio profissional e ação de sair. Em seguida, exibe uma demonstração identificada com seis pacientes fictícios, três consultas em situações diferentes de confirmação e aniversários próximos.

A barra inferior conecta Início, Pacientes, Agenda e Materiais. As três últimas são telas-base explicativas, com retorno ao início. Elas não cadastram consultas, não geram links, não fazem upload e não leem pacientes reais. A lista mensal de aniversariantes é demonstrativa e abre em um Sheet do Tamagui dentro de um Modal do React Native, com botão de fechar e suporte ao fechamento pelo sistema.

Os indicadores são calculados a partir das fixtures; “Aguardando confirmação” conta somente consultas sem resposta. Recusa e ausência de resposta são situações distintas. Os aniversários usam dias de calendário, janela inclusiva de 30 dias e convenção de 28 de fevereiro para nascidos em 29 de fevereiro em anos não bissextos. A lista mensal inclui os aniversários já passados do mês.

## Arquitetura e manutenção

- [Layout profissional](../../../frontend/app/(professional)/_layout.tsx): `Tabs` de `expo-router/js-tabs`, tema da área e guard. Destinos recusados são explícitos para evitar ambiguidade entre as rotas `index` dos grupos.
- [Componentes profissionais](../../../frontend/components/professional/): estrutura de página, cartão de perfil, indicadores, consultas, aniversariantes e telas-base.
- [Hook de perfil](../../../frontend/hooks/use-professional-profile.ts): leitura com cancelamento ao desmontar/trocar a sessão e repetição real da consulta em caso de erro. Uma falha não substitui a identidade por uma pessoa fictícia.
- [Dados e regras demonstrativas](../../../frontend/lib/professional-dashboard.ts): fixtures isoladas e funções de datas/contagens. A data-base fica estável durante a montagem da tela, sem valores aleatórios por renderização.
- [Tema](../../../frontend/tamagui.config.ts): `light_professional` e `dark_professional`, tokens semânticos e raio `panel`. Mantém o tema próprio do login. O driver de animação é importado de `@tamagui/config/v5-rn`, já presente nas dependências, e permite usar Sheet. A preferência por movimento reduzido desativa a duração da transição do Sheet.
- [AppCard](../../../frontend/components/app-card.tsx): aceita propriedades do Card para compor superfícies da área profissional, preservando os valores padrão dos consumidores antigos.

Base usada: `origin/main` no commit `6eb0653`, que já usa Expo 57, React 19.2.3 e React Native 0.86.3. A referência a Expo 54 no planejamento inicial foi substituída pela versão real da base atualizada. As [instruções do frontend](../../../frontend/AGENTS.md) e a [referência oficial do SDK 57](https://docs.expo.dev/versions/v57.0.0/) foram consultadas.

## Dados e autorização

Fluxo: frontend → cliente público autenticado do Supabase → leitura de `profiles` e `professional_profiles` sob RLS. O backend Node não participa do carregamento deste painel.

As consultas usam `id` da sessão e `status = 0`; a identidade também exige `role = professional`. Campos lidos: `full_name`, `specialty`, `registration_type`, `registration_number`. São reutilizadas as policies `profiles_select_own` e `professional_profiles_select_own` da [migration inicial](../../../supabase/migrations/20260823_000001_identity_and_relationships.sql). Nenhuma migration foi criada ou aplicada nesta task.

Profissional ativo pode acessar mesmo sem pacientes. Paciente ativo é direcionado à sua própria área; paciente pendente, à tela de pendência; usuário sem acesso profissional, ao login. A verificação de perfil desativado continua no contexto de autenticação existente. As fixtures não removem guards nem concedem acesso a dados reais.

Nenhum endpoint, operação de escrita ou policy foi adicionado. Materiais, agenda funcional e integrações com pacientes continuam pendentes.

## Como validar o frontend

No PowerShell:

```powershell
cd C:\tcc\entrelacos\frontend
npm.cmd ci
npm.cmd run typecheck
npm.cmd run lint
node --test scripts/professional-dashboard.test.mjs
npm.cmd run build
npm.cmd run web -- --port 8081
```

`npm.cmd` evita o bloqueio de `npm.ps1` em máquinas com política restrita de execução de scripts. Usar Node compatível com a base atual; os testes foram executados com Node 24.11.0.

O `.env` do frontend deve ter `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` do ambiente de desenvolvimento já configurado. Use o `.env.example` como lista de nomes, sem substituir um `.env` existente. O login exige uma conta de teste com perfil profissional ativo no Supabase; a demonstração não contorna a autenticação. Não é necessário iniciar o backend Node para testar o painel profissional.

Abra `http://localhost:8081/login`, selecione Profissional e entre com a conta de teste. Confira o nome/registro, as quatro abas, os atalhos, a lista mensal e a saída. Confirme que apenas os dados do perfil são reais e que o aviso de demonstração aparece antes dos indicadores. Na web, a sessão usa memória: recarregar a página pode exigir novo login.

Para conferir estados visuais, pare o Expo e inicie com um cenário opcional:

```powershell
$env:EXPO_PUBLIC_PROFESSIONAL_SCENARIO = 'empty'
npm.cmd run web -- --port 8081
```

Valores: `empty`, `loading`, `error` ou `ready`. A variável só afeta a demonstração em desenvolvimento; não altera o perfil real. Entre normalmente após iniciar o app. No cenário de erro, “Recarregar demonstração” retorna ao conteúdo fictício. Para voltar ao normal, pare o Expo, execute `Remove-Item Env:EXPO_PUBLIC_PROFESSIONAL_SCENARIO` e inicie novamente. O parâmetro de rota `scenario` também é aceito em desenvolvimento e tem precedência sobre a variável.

Para celular/emulador, execute `npm.cmd start` e use o cliente compatível com o Expo instalado. Testar fonte ampliada, leitor de tela, áreas seguras, Voltar do Android e ambos os temas. As credenciais e URLs precisam estar acessíveis pelo dispositivo; `localhost` no celular aponta para o próprio celular.

## Como validar o backend

Em outro terminal:

```powershell
cd C:\tcc\entrelacos\backend
npm.cmd ci
npm.cmd run typecheck
npm.cmd run build
npm.cmd run dev
```

O backend carrega `SUPABASE_URL` e `SUPABASE_SECRET_KEY` do `.env`; `PORT` tem padrão 3333 e `CORS_ORIGIN` tem padrão `http://localhost:8081`. A chave secreta permanece somente no backend. Consultar [`.env.example`](../../../backend/.env.example) para os demais nomes previstos pela base.

Com o servidor ativo, em um terceiro terminal:

```powershell
curl.exe -i http://localhost:3333/
curl.exe -i -X POST http://localhost:3333/v1/patient/invitations/consume
curl.exe -i -X OPTIONS http://localhost:3333/v1/patient/invitations/consume
```

Resultados esperados: `404` para `/` (não existe endpoint de saúde), `401` para o POST sem autenticação e `204` para OPTIONS. Esses comandos não consomem convites nem alteram dados. Eles verificam inicialização, roteamento e rejeição de requisições sem sessão; não comprovam integração autenticada com o Supabase. O fluxo real de convite continua fora da validação desta task.

## Evidências e limites da validação

- Frontend: TypeScript, lint e exportação web aprovados durante a implementação.
- Regras demonstrativas: cinco testes Node aprovados, cobrindo contagens, referência dos pacientes, mudança de mês/ano, ano bissexto, lista mensal e bloqueio de cenários em produção.
- Backend: TypeScript e build aprovados após `npm ci` corrigir dependências locais incompletas. Smoke HTTP em processo temporário na porta 3334: `404`, `401` e `204`, sem acesso externo nem escrita em banco.
- Navegador: automação local em Edge headless com APIs de autenticação e perfil interceptadas por fixtures, sem contas criadas. Foram conferidos abas, atalhos, lista mensal, estados demonstrativos e repetição da consulta de perfil após falha simulada.
- Layouts inspecionados em 320, 390 e 1280 pixels. Tema escuro na inicialização e atualização dinâmica do tema do sistema na web foram conferidos após adaptar o hook compartilhado para uma assinatura estável de `matchMedia`.
- Dois `accessibilityHint` preexistentes no login foram convertidos em rótulos ARIA equivalentes. Isso remove o aviso React que criava um toast de erro na versão web sem alterar o fluxo ou a apresentação do login.
- Validação com conta real de desenvolvimento, RLS em execução, Android/iOS, leitor de tela e fonte ampliada permanece para o responsável. Testes com respostas interceptadas não comprovam autorização no servidor.

O [plano da task](../../plan/tela-inicial-profissional.md) mantém a checklist humana pendente. As ferramentas temporárias de navegador e capturas ficam em `.cache/professional-validation/`, fora do versionamento e sem dependências adicionadas ao aplicativo.
