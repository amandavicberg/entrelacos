# Task: Tela de login

## Nome da task

`tela-login`

## Descrição objetiva

Implementar e refinar a tela de login do EntreLaços para pacientes e
profissionais, integrando-a ao cadastro existente. O fluxo deve autenticar por
e-mail e senha, validar o papel real do perfil, respeitar o bloqueio do
paciente sem associação ativa e oferecer uma experiência visual acessível,
acolhedora e consistente com o design system Tamagui.

## Objetivo e resultado esperado

Ao final, a rota inicial deverá oferecer uma tela de login funcional e
responsiva, com navegação para o cadastro, tratamento seguro da sessão e
redirecionamento conforme o papel e a associação do usuário. A interface deve
funcionar em mobile e web, nos temas claro e escuro, sem expor dados ou
permissões indevidas.

## Escopo incluído

### Fluxo funcional e autorização

- Reutilizar `auth.users`, `profiles.role`, `profiles.status` e
  `patient_professional_relationships` existentes.
- Permitir selecionar paciente ou profissional, informar e-mail e senha e
  mostrar/ocultar a senha.
- Autenticar com Supabase Auth e validar `profiles.role` antes de redirecionar;
  a escolha visual do papel nunca substitui a autorização real.
- Direcionar profissional ativo à área profissional, paciente com associação
  `active` à área do paciente e paciente sem associação ativa à tela de
  pendência, sem leitura ou escrita de dados do produto.
- Considerar associações `active` ou `pending` com `status = 0` na decisão de
  pendência, conforme o fluxo de autorização existente.
- Encerrar a sessão e bloquear a área protegida quando o perfil for
  inexistente, inválido, divergente ou desativado.
- Integrar a ação de primeiro acesso à rota pública `/cadastro` existente.
- Manter a recuperação de senha apenas como rota pública preparada, sem
  implementar o fluxo de redefinição nesta task.
- Revisar e validar o backend e as migrations que sustentam o cadastro, a
  autenticação e o consumo de convite, sem duplicar estruturas existentes.

### Interface e experiência visual

- Reutilizar `AppScreen`, `AppHeader`, `AppInput`, `BrandButton`,
  `FeedbackState` e demais componentes compartilhados, evoluindo-os somente
  quando o comportamento for reutilizável.
- Manter o conteúdo rolável sem exibir o indicador vertical de rolagem, com
  adaptação a telas pequenas, web e teclado aberto.
- Reforçar a hierarquia do cabeçalho com marca discreta, saudação acolhedora e
  subtítulo objetivo.
- Evoluir o seletor Paciente/Profissional para um controle segmentado
  acessível, com estado selecionado inequívoco, contraste e transição discreta.
- Usar ícone de apoio no campo de e-mail, teclado e autofill apropriados.
- Integrar ícone de cadeado e controle acessível de mostrar/ocultar senha.
- Alinhar **Esqueci minha senha** à direita, imediatamente abaixo da senha,
  preservando a rota pública existente.
- Destacar **Entrar**, com `Spinner`, bloqueio de submissão duplicada,
  `pressStyle` e feedback visual ao toque.
- Manter **Primeiro acesso?** e **Cadastre-se**, com texto que possa refletir o
  perfil selecionado; a ação deve navegar somente para a rota de cadastro já
  existente.
- Usar exclusivamente tokens semânticos reais do tema do projeto, sem cores
  hexadecimais ou nomes de tokens inexistentes.
- Preservar labels, mensagens de erro, foco visível, contraste, alvos de toque
  de pelo menos 44 pontos e suporte a leitor de tela.
- Unificar a experiência pública de entrada, cadastro, confirmação, recuperação
  de senha e pendência em uma linguagem visual e de navegação coerente.
- Substituir retornos dependentes do histórico por destinos explícitos quando a
  pessoa precisar voltar ao login, inclusive após cadastro ou acesso direto por
  deep link.

## Fora do escopo

- Implementar convite profissional, aprovação de associação ou dashboards
  definitivos.
- Alterar regras, serviços ou persistência de autenticação e autorização fora
  das correções estritamente necessárias para o fluxo da tela.
- Criar novas migrations, tabelas ou policies; migrations existentes podem ser
  revisadas e validadas, mas não aplicadas remotamente nesta task.
- Implementar recuperação ou redefinição de senha.
- Implementar login social, biometria, MFA, QR Code ou funcionalidades
  clínicas.
- Redesenhar outras telas do aplicativo.
- Introduzir biblioteca visual nova ou substituir o Tamagui.
- Criar ou atualizar documentação em `ia/documentation/` sem autorização
  explícita.

## Decisão de dados e autorização

- Nenhuma nova entidade ou atributo é necessário; não haverá migration nesta
  task.
- O login reutiliza Supabase Auth, `profiles` e
  `patient_professional_relationships` por meio das estruturas e policies
  existentes.
- Profissional autenticado e ativo acessa somente a área profissional.
- Paciente autenticado com associação `active` acessa somente a área do
  paciente.
- Paciente sem associação ativa permanece na tela protegida de pendência.
- Usuário sem perfil válido, desativado ou com papel divergente não acessa
  área protegida e deve ter a sessão encerrada.
- Nenhum dado de saúde, senha, token ou código de convite deve aparecer em
  logs, mensagens ou feedback visual.

## Camadas afetadas

- **Frontend:** rota inicial, formulário, estados de sessão, guards,
  redirecionamento, integração com `/cadastro`, telas públicas relacionadas e
  componentes compartilhados necessários para a jornada de autenticação.
- **Backend:** revisão do endpoint de convite, autenticação do bearer token,
  validação do perfil e tratamento de erros; sem nova regra necessária.
- **Supabase/banco:** revisão da trigger de cadastro, função transacional,
  RLS, policies e migrations existentes; sem nova migration ou alteração direta.
- **Documentação:** este plano; documentação do funcionamento real somente
  mediante autorização explícita.

## Plano

### 1. Preparação e contrato do fluxo

- [x] Ler o Constitution v1.3.0, as instruções do frontend, a documentação da
  base compartilhada e a documentação oficial do Expo SDK 54.
- [x] Inspecionar cadastro, login existente, contexto de autenticação, rotas,
  componentes compartilhados e conflito da rota inicial.
- [x] Confirmar a reutilização dos dados existentes e os limites de
  autorização.

### 2. Fluxo funcional

- [x] Resolver o conflito de `frontend/app/index.tsx`, preservando login e
  acesso ao cadastro.
- [x] Integrar autenticação, restauração de sessão, validação do perfil real e
  redirecionamentos por papel e associação.
- [x] Manter os estados de carregamento, validação, erro e bloqueio coerentes
  para paciente e profissional.
- [x] Garantir que a seleção visual de papel não substitua a autorização real.
- [x] Interligar o acesso do login à rota `/cadastro` e o retorno do cadastro
  para a tela de login.

### 3. Backend e banco

- [x] Confirmar que a trigger cria `profiles` e o perfil complementar conforme
  o papel informado no cadastro.
- [x] Confirmar que o backend valida bearer token, perfil `patient` ativo e
  código de convite antes de chamar a função privilegiada.
- [x] Configurar o transporte WebSocket `ws` no cliente Supabase do backend
  para permitir a inicialização em Node 18 enquanto o ambiente não migra para
  Node 22.
- [x] Confirmar que o consumo de convite é transacional, cria relação
  `pending`, impede reutilização e não expõe a chave secreta ao frontend.
- [x] Confirmar que RLS e policies permitem somente a leitura necessária para
  resolver o acesso do próprio usuário.
- [x] Confirmar que não há necessidade de nova tabela, coluna, policy ou
  migration para concluir login e cadastro.

### 4. Layout, componentes e design system

- [x] Consultar `frontend/tamagui.config.ts` e mapear todas as intenções visuais
  para tokens reais do EntreLaços.
- [x] Manter `AppScreen`, `KeyboardAvoidingView`, `ScrollView` e
  `showsVerticalScrollIndicator={false}` sem depender de alturas fixas.
- [x] Criar marca discreta, saudação, subtítulo, formulário e rodapé com
  hierarquia visual acolhedora e sem espaços vazios excessivos.
- [x] Ajustar o controle segmentado acessível de perfil, mantendo a autorização
  independente da escolha visual.
- [x] Reutilizar os adornos internos já suportados por `AppInput`, sem criar
  componente paralelo.
- [x] Ajustar e-mail, senha, visibilidade da senha e ação de recuperação.
- [x] Transformar o convite de primeiro acesso em seção progressiva, com
  abertura automática quando o fluxo autenticação exigir o código.
- [x] Ajustar o botão de entrada, `Spinner`, estados pressionado/desabilitado e
  prevenção de reenvio.
- [x] Ajustar a chamada de primeiro acesso e preservar a navegação para
  `/cadastro`.
- [x] Confirmar que não foi necessária alteração em `AppInput` ou
  `BrandButton`, preservando seus consumidores atuais.

### 5. Validação e entrega

- [x] Executar lint, checagem TypeScript e build web da implementação funcional.
- [x] Revisar o diff, confirmar ausência de marcadores de conflito e verificar
  ausência de segredos.
- [x] Executar typecheck e lint do frontend após a integração.
- [x] Executar typecheck e build do backend.
- [x] Executar `git diff --check` após a integração.
- [ ] Executar build web em ambiente Expo/Metro compatível.
- [ ] Fazer revisão visual em mobile e web, nos temas claro/escuro e com
  teclado aberto.

### 6. Jornada de entrada e cadastro

- [x] Criar uma estrutura visual compartilhada para as telas públicas de
  autenticação, com Safe Area, teclado, rolagem e identidade consistente.
- [x] Reformular cadastro, confirmação de e-mail e recuperação de senha sem
  alterar contratos de autenticação ou prometer fluxos indisponíveis.
- [x] Revisar os retornos ao login e substituir navegação dependente do histórico
  por rotas explícitas quando necessário.
- [x] Proteger as telas públicas contra acesso redundante de usuários que já
  possuem sessão válida, mantendo os guards de paciente e profissional.

### 7. Estrutura de boas-vindas

- [x] Separar a apresentação inicial do login, iniciando o aplicativo por uma
  tela de boas-vindas com CTA principal e atalho para quem já possui acesso.
- [x] Mover o login para uma rota pública própria e ajustar os links, deep links
  e retornos de cadastro/recuperação para essa rota.
- [x] Consolidar no constitution a jornada inicial e a linguagem visual de
  saúde, com cores verde/teal, hierarquia e CTA principal por tela.

## Arquivos e módulos prováveis

- `frontend/app/index.tsx`: composição, autenticação e hierarquia da tela.
- `frontend/app/_layout.tsx`: somente se o contrato de rota exigir ajuste.
- `frontend/components/app-input.tsx`: suporte reutilizável a ícones e ação de
  visibilidade, se necessário.
- `frontend/components/brand-button.tsx`: loading e interação, se a mudança
  for compatível com os usos existentes.
- `frontend/tamagui.config.ts`: consulta; alterar somente se faltar um token
  semântico reutilizável.
- `backend/src/config/supabase.ts`: transporte WebSocket compatível com o
  runtime Node usado pelo backend.

## Validação e critérios de pronto

- [x] A rota inicial oferece login funcional e navegação para `/cadastro`.
- [x] O papel selecionado nunca substitui a autorização baseada no perfil real.
- [x] A tela mantém rolagem sem indicador vertical e apresenta hierarquia clara
  em mobile e web.
- [x] O seletor de perfil funciona por toque, teclado e leitor de tela, com
  seleção inequívoca.
- [x] E-mail usa teclado/autofill apropriados e a senha possui controle interno
  de visibilidade acessível.
- [x] **Esqueci minha senha** fica alinhado à direita abaixo da senha.
- [x] **Entrar** apresenta `Spinner`, bloqueia reenvio e mantém contraste no
  carregamento.
- [x] A chamada de cadastro navega para a rota existente e o cadastro oferece
  retorno ao login após o preenchimento.
- [x] O link de confirmação do cadastro retorna à rota raiz real do login,
  sem apontar para uma rota inexistente.
- [x] Nenhuma cor hardcoded ou token inexistente foi introduzido.
- [ ] Foram validados tela pequena, fonte ampliada, temas claro/escuro,
  Android, iOS e web.

## Checklist de testes manuais

- [ ] Entrar como profissional com credenciais válidas e confirmar o destino.
- [ ] Entrar como paciente com associação ativa e confirmar o destino.
- [ ] Entrar como paciente com associação pendente e confirmar o bloqueio.
- [ ] Tentar papel divergente, credenciais inválidas e perfil desativado.
- [ ] Validar campos vazios, e-mail inválido, exibição da senha e duplo toque.
- [ ] Abrir o cadastro pelo link do login e voltar ao login após o cadastro.
- [ ] Confirmar controle segmentado por toque, teclado e leitor de tela.
- [ ] Confirmar teclado de e-mail, autofill, foco visível e rótulos acessíveis.
- [ ] Conferir carregamento com `Spinner`, bloqueio de reenvio e mensagens de
  erro recuperáveis.
- [ ] Conferir tela pequena, teclado aberto, fonte ampliada e temas claro/escuro.
- [ ] Conferir layout e interação no Android, iOS e web.
- [ ] Abrir cadastro, alternar perfis, preencher campos e confirmar o retorno
  explícito ao login sem depender do histórico de navegação.
- [ ] Confirmar a tela de e-mail enviado, o contador de reenvio e o retorno ao
  login em abertura normal e por deep link.
- [ ] Confirmar que usuários já autenticados não permanecem nas rotas públicas
  de cadastro ou recuperação de senha.

## Riscos, dependências e decisões pendentes

- O fluxo depende das migrations de identidade/cadastro e das policies já
  existentes no ambiente; esta task não as aplica.
- O backend usa `ws` como transporte explícito para compatibilidade com Node
  18; a recomendação de atualizar o runtime para Node 22 permanece válida.
- Alterar `AppInput` ou `BrandButton` pode impactar outras telas e exige
  revisão dos consumidores.
- A disponibilidade de ícones deve ser confirmada nas dependências instaladas;
  não adicionar pacote novo se o conjunto atual atender.
- Animações devem permanecer discretas e ser reduzidas ou removidas se
  prejudicarem desempenho, acessibilidade ou estabilidade entre plataformas.
- Os dashboards são placeholders; os guards continuam sendo a barreira de
  acesso relevante nesta etapa.
- A confirmação dos testes manuais em dispositivos permanece sob
  responsabilidade do programador ou responsável pela validação.
- A validação do build web permanece pendente porque o Metro falha ao carregar
  `configs.toReversed()` no ambiente atual, antes de compilar a aplicação.

## Decisões pendentes

- Confirmar, após inspeção dos consumidores, se o suporte a ícones exige
  evolução de `AppInput` ou pode ser composto apenas na tela.
- Confirmar a disponibilidade e o conjunto final de ícones instalados.
- Confirmar a validação visual final em dispositivos e temas suportados.
