# Revisão web, autenticação e interface

Atualizado em 2026-10-05. Implementação local na `main`, sem commit, publicação
ou alteração remota de configuração nesta revisão. Nenhuma migration criada ou
aplicada. A revisão visual individual de todas as telas autenticadas ainda não
foi concluída.

## Diagnóstico do cadastro publicado

A consulta somente leitura a `/auth/v1/settings` com a configuração pública
extraída do bundle publicado retornou HTTP 401 (`Invalid API key`). A mesma
consulta com a configuração local retornou HTTP 200. A chave pública incorporada
na publicação difere da configuração local válida. Nenhum valor foi registrado
na documentação e nenhum cadastro ou e-mail foi criado para esse diagnóstico.

Corrigir `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no ambiente de build do frontend
na Vercel e reconstruir a publicação. Conferir também `EXPO_PUBLIC_SUPABASE_URL`
e `EXPO_PUBLIC_API_URL`. A API é hospedada no Render, mas o cadastro usa Supabase
Auth diretamente: publicar apenas o backend não atualiza a chave no frontend.
O SMTP personalizado estava desativado no painel consultado; a entrega a
usuários de teste externos precisa de configuração adequada de e-mail e teste
integrado. As URLs de retorno publicadas já estavam cadastradas no Supabase.
Essas configurações remotas não foram modificadas.

## Comportamento implementado

- `frontend/lib/auth-errors.ts` traduz falhas de chave, rede, confirmação,
  limites de envio, banco e SMTP. Diagnósticos usam somente operação, código
  sanitizado e status HTTP; não registram e-mail, senha, token ou corpo de erro.
- `frontend/lib/registration-form.ts` concentra validação e formatação. Cadastro,
  recuperação e reenvio tratam exceções e encerram o estado de envio. O reenvio
  possui intervalo de 60 segundos. Login permite reenviar confirmação.
- `frontend/contexts/auth-context.tsx` considera status dos perfis específicos,
  trata retorno de confirmação/recuperação antes de resolver a sessão inicial e
  remove tokens da URL na web. O guard de recuperação não redireciona para a
  mesma rota continuamente. A revisão posterior da sessão web está em
  [`feedback-perfil-profissional-2026-10-07.md`](feedback-perfil-profissional-2026-10-07.md).
- Paciente autenticado sem vínculo pode entrar na etapa de convite. Somente
  associação ativa libera as rotas de acompanhamento; associação pendente fica
  na tela de espera. Guards não substituem autorização do backend e RLS.
- `frontend/vercel.json` define exportação, URLs sem extensão e fallback para
  rotas. Precisa ser publicado com diretório raiz `frontend` para corrigir
  acesso direto/atualização de página na hospedagem. Não validado em produção.
- `frontend/scripts/check-public-env.mjs` bloqueia build com URLs inválidas,
  chave malformada ou chave privilegiada sem imprimir valores. O ambiente da
  hospedagem tem precedência sobre `.env`. Essa validação é de formato, não
  garante que a chave pertença ao projeto. Requer Node 22.
- `backend/src/http.ts` permite PUT no preflight CORS, necessário à atualização
  da mensagem de aniversário. A configuração de redirect em
  `supabase/config.toml` vale para ambiente local, não altera o remoto.

## Interface e navegação

Tokens claro/escuro em `frontend/tamagui.config.ts` mantêm índigo, ocre, aço e
marfim. `AuthScreen` dispõe apresentação e formulário lado a lado em telas
largas, com composição única em telas pequenas. Botões, inputs, cabeçalhos,
superfícies e foco compartilham a identidade atualizada.

A apresentação, cadastro, login e recuperação foram reorganizados. Na home do
paciente, o campo sem persistência foi substituído pelo acesso ao check-in real.
O painel profissional prioriza resumo e ações; erros em solicitações pendentes
não aparecem como ausência de solicitações.

`PatientScreen` padroniza agenda, orientações, materiais, histórico, documentos,
mural e check-ins com logo, cabeçalho, largura de leitura e retorno explícito
para o início. As telas reutilizam os endpoints e entidades existentes; não há
nova estrutura de dados. O envio de documento trata também falhas do seletor.

O acompanhamento profissional separa observações, agenda, registros do paciente,
materiais, histórico e aniversário em seções selecionáveis. Estados dos
formulários permanecem no componente ao alternar seções. A biblioteca de
materiais abre o formulário sob demanda, a busca de pacientes ignora acentos e
a agenda permite abrir o vínculo correspondente. Cancelamento usa confirmação
inline compartilhada, substituindo `Alert.alert` nos dois perfis.

### Logo

`frontend/components/brand-logo.tsx` usa a variante horizontal PNG com alpha em
`frontend/assets/brand/entrelacos-logo-horizontal-transparent.png`; o original e
o ícone compacto foram preservados. A imagem foi editada com a ferramenta
ImageGen a pedido do usuário. Instrução aplicada: remover o fundo claro,
preservando símbolo, letras, composição e cores, com fundo transparente. O componente posiciona o PNG sobre uma superfície marfim com borda discreta,
com área de respiro e tamanho ampliado na autenticação, para preservar o
contraste da marca no tema escuro. Subtemas de componentes Tamagui também
recebem cores semânticas: sem isso, botões e inputs no tema escuro voltavam às
cores dos tokens claros. A
variante deve ser revisada pelo responsável da marca antes da publicação final.

## Validação e limites

- TypeScript do frontend e exportação web com Node 22 passaram (33 rotas).
- 13 testes do frontend passaram: dashboard existente, cadastro, mensagens,
  privacidade de logs e validação das variáveis públicas.
- Lint e compilação do backend foram executados durante a revisão; o teste
  de CORS cobre PUT e resposta OPTIONS sem corpo.
- Navegação pública, validação de campos vazios e composição em desktop/mobile
  foram inspecionadas no navegador. A imagem possui canal alpha.
- Não houve teste integrado de cadastro, confirmação de e-mail ou recuperação
  com conta real. Falta validar as telas autenticadas com contas e dados de
  teste, fonte ampliada, teclado, tema escuro e dispositivos nativos.
- Não afirmar auditoria de autorização concluída: as policies existentes e
  operações de versionamento precisam de testes integrados próprios antes de
  dados reais de saúde. Nenhuma policy foi alterada nesta revisão.
- O servidor estático simples usado na prévia local não reproduz as regras da
  Vercel; atualização de rotas precisa ser validada na hospedagem configurada.

## Manutenção

Usar Node 22 no diretório `frontend` para `npm run typecheck`, `npm run lint`,
`npm test` e `npm run build`. Node 18 não fornece `node:util.parseEnv` e não é
compatível com o fluxo de build instalado. O teste HTTP do backend usa
`node --test scripts/http.test.mjs` após o build do backend.

Depois de corrigir a configuração e publicar, validar cadastro dos dois papéis,
recebimento/retorno de confirmação, recuperação e login. Testar atualização e
acesso direto a `/login` e `/cadastro`, convite, aprovação, check-in, documento,
consulta e compartilhamento com usuários exclusivamente de teste.
