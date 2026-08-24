# Task: Cadastro de usuário

## Descrição objetiva

Implementar uma tela de cadastro na qual a pessoa possa escolher o papel
`patient` ou `professional` e preencher os dados básicos de identificação. O
formulário deve exibir campos específicos de acordo com o papel escolhido,
incluindo dados de registro e atuação profissional para profissionais.

## Objetivo e resultado esperado

Ao final, o aplicativo deverá oferecer um fluxo de cadastro claro, acessível e
validado para pacientes e profissionais, criando a autenticação e o perfil
correspondente sem misturar permissões entre os papéis.

O cadastro deve resultar em:

- uma conta de autenticação vinculada ao e-mail;
- uma solicitação de confirmação de e-mail antes do acesso ao aplicativo;
- um registro em `profiles` com exatamente um papel;
- um registro complementar em `patient_profiles` ou
  `professional_profiles`;
- tratamento explícito para erros, dados inválidos, e-mail já cadastrado e
  falhas parciais do fluxo.

## Escopo incluído

- Criar a rota e a tela de cadastro no frontend Expo Router.
- Permitir a seleção entre paciente e profissional em um controle acessível.
- Solicitar dados básicos comuns, com confirmação de senha e campos definidos
  durante a implementação:
  - nome completo;
  - data de nascimento;
  - telefone;
  - e-mail;
  - senha e confirmação de senha.
- Exibir campos específicos para profissional, incluindo atuação/especialidade,
  tipo de registro e número do registro profissional (CRM ou equivalente).
- Tornar obrigatórios todos os campos comuns e os campos específicos do
  profissional.
- Exigir o preenchimento do registro profissional, mas sem validação de área,
  órgão ou formato específico nesta versão.
- Alterar os campos específicos quando o papel selecionado mudar e limpar ou
  ignorar valores incompatíveis com o papel final.
- Validar entradas no cliente para experiência de uso e no backend/banco para
  segurança e integridade.
- Criar a conta pelo Supabase Auth com a chave pública e metadados validados por
  uma trigger versionada do banco; não enviar a chave privilegiada ao frontend.
- Exigir confirmação do e-mail e apresentar ao usuário as orientações para
  concluir essa etapa.
- Exibir uma mensagem de confirmação com orientação para verificar o e-mail e
  um botão para voltar à tela de login existente, sem implementar essa tela.
- Reutilizar a base visual do Tamagui e os componentes compartilhados já
  existentes.
- Criar ou atualizar migration versionada caso os campos necessários não
  estejam representados no modelo atual.
- Validar os cenários de paciente, profissional, usuário não associado e
  usuário desativado.

## Fora do escopo

Esta task fica delimitada ao cadastro e às estruturas indispensáveis para
concluí-lo. Ficam fora do escopo:

- implementação da tela e do fluxo de login/acesso ao aplicativo;
- convite e aprovação da associação paciente-profissional;
- recuperação de senha;
- validação externa de CRM;
- upload de documentos;
- notificações;
- registros de acompanhamento.

## Camadas afetadas

- **Frontend:** nova rota/tela, formulário por papel, validações, estados de
  carregamento/erro/sucesso e conclusão do cadastro com confirmação de e-mail.
- **Backend:** não há alteração nesta implementação; a validação server-side
  e a criação transacional dos perfis ficam na trigger versionada do Supabase.
- **Supabase/banco:** reutilização de `profiles`, `patient_profiles` e
  `professional_profiles`; migration adicional se os campos básicos ou
  constraints necessárias não forem cobertos pela migration existente;
  revisão de RLS/policies para o fluxo de criação.
- **Documentação:** atualizar a documentação consolidada do frontend e criar
  registro da task em `ia/documentation/` somente mediante autorização
  explícita do programador.

## Plano

### 1. Definir o contrato do cadastro

- Confirmar o conjunto final de campos comuns e específicos.
- Usar `birth_date` em vez de armazenar idade, pois idade é derivada e muda
  com o tempo.
- Não incluir sexo ou gênero nesta versão.
- Tornar obrigatórios nome, data de nascimento, telefone, e-mail, senha e
  confirmação de senha.
- Manter atuação/especialidade como campo de texto nesta versão.
- Reutilizar `registration_type` e `registration_number` para o tipo e o
  número do registro profissional.
- Tornar obrigatórios atuação/especialidade, tipo de registro e número do
  registro profissional, sem validação específica de área ou órgão.

### 2. Modelar e proteger a persistência

- Reutilizar `profiles` para nome, papel e status.
- Reutilizar `patient_profiles` para os dados complementares do paciente.
- Reutilizar `professional_profiles` para especialidade/atuação e registro.
- Criar a trigger de cadastro em migration versionada; não alterar o banco
  diretamente.
- Preservar `status` de soft-delete, constraints, índices e timestamps.
- Garantir que o papel de `profiles` corresponda ao perfil complementar e que
  não seja possível criar os dois perfis para a mesma conta.
- Manter a criação dos perfis dentro da transação de inserção do usuário Auth,
  sem abrir escrita ampla nas tabelas para usuários autenticados.

### 3. Implementar o fluxo de cadastro

- Criar tipos explícitos para o payload comum e os payloads de paciente e
  profissional.
- Validar obrigatoriedade, limites, formatos, confirmação de senha e
  consistência do papel no backend.
- Criar a conta pelo Supabase Auth e criar os registros de domínio pela trigger
  da migration, sem registrar senha, token ou dados sensíveis em logs.
- Retornar erros seguros e úteis para a interface, sem revelar detalhes
  internos ou confirmar indevidamente a existência de contas.
- Definir o estado apresentado após o cadastro enquanto a confirmação de
  e-mail estiver pendente.

### 4. Implementar a tela Expo/Tamagui

- Adicionar rota pública de cadastro sem reutilizar os placeholders de paciente
  e profissional como proteção de autorização.
- Reutilizar `AppScreen`, `AppHeader`, `AppInput`, `BrandButton`, `AppCard` e
  `FeedbackState` quando aplicável.
- Usar os tokens do Tamagui, com hierarquia visual acolhedora e adequada tanto
  ao paciente quanto ao profissional.
- Organizar o formulário em seções comuns e específicas do papel.
- Implementar teclado, rolagem, foco, labels, mensagens de erro associadas aos
  campos, máscara/normalização de telefone e visibilidade de senha, se
  compatível com a base existente.
- Cobrir estados de carregamento, erro, sucesso, validação inline e formulário
  vazio.
- Garantir que a troca de papel seja compreensível e não preserve dados de um
  papel que não será enviado.
- Considerar responsividade, contraste, leitores de tela e alvos de toque.

### 5. Definir navegação e autorização pós-cadastro

- O cadastro não concede acesso ao aplicativo antes da confirmação do e-mail.
- Após a confirmação, o usuário deve seguir para a tela de login existente.
- A tela de login e o redirecionamento final para as áreas do aplicativo não
  fazem parte desta task.
- A tela de cadastro não deve ser usada como mecanismo de autorização nem
  substituir as verificações do fluxo de login.

## Checklist de execução

### Preparação e decisões

- [x] Ler a constituição, as instruções do frontend e a documentação da base
  compartilhada.
- [x] Definir campos comuns obrigatórios.
- [x] Definir campos profissionais obrigatórios.
- [x] Definir data de nascimento sem campo de idade.
- [x] Excluir sexo/gênero desta versão.
- [x] Definir atuação profissional como campo de texto.
- [x] Definir confirmação de e-mail como requisito.
- [x] Manter login e funcionalidades posteriores fora do escopo.

### Persistência e autenticação

- [x] Reutilizar `profiles`, `patient_profiles` e `professional_profiles`.
- [x] Criar migration versionada para a trigger de criação dos perfis.
- [x] Validar na trigger o papel e os campos obrigatórios.
- [x] Garantir que paciente e profissional criem perfis complementares
  diferentes.
- [x] Usar `auth.signUp` com a chave pública no frontend.
- [x] Manter senha e chave privilegiada fora das tabelas/logs/frontend.
- [ ] Aplicar a migration em ambiente autorizado.

### Interface e fluxo

- [x] Criar a rota `/cadastro`.
- [x] Adicionar acesso à rota pela entrada atual.
- [x] Implementar seleção de paciente/profissional.
- [x] Implementar campos comuns e profissionais condicionais.
- [x] Limpar dados profissionais ao trocar para paciente.
- [x] Implementar validações, máscaras e mensagens de erro.
- [x] Aplicar máscara automática de data de nascimento no formato `DD/MM/AAAA`.
- [x] Implementar estados de envio, erro e sucesso.
- [x] Exibir orientação de confirmação de e-mail e retorno ao login.
- [x] Reutilizar componentes e tokens Tamagui existentes.

### Validação automatizada do agente

- [x] Executar typecheck do frontend.
- [x] Executar lint do frontend.
- [x] Executar typecheck do backend.
- [ ] Executar build web em ambiente compatível com o Expo SDK 54.
- [x] Revisar o diff e executar `git diff --check`.
- [x] Confirmar ausência de segredos no frontend e nos arquivos versionados.

## Checklist de testes humanos

- [x] Abrir a rota de cadastro pelo botão da tela inicial.
- [x] Alternar entre paciente e profissional e confirmar a exibição dos
  campos correspondentes.
- [x] Confirmar que os dados profissionais são limpos ao voltar para paciente.
- [x] Tentar enviar o formulário vazio e verificar as mensagens por campo.
- [x] Testar e-mail inválido, senha curta e senhas diferentes.
- [x] Testar data inválida/futura e telefone inválido.
- [ ] Criar uma conta de paciente com dados válidos.
- [ ] Criar uma conta de profissional com dados válidos.
- [x] Confirmar o recebimento do e-mail de confirmação.
- [ ] Confirmar a mensagem de sucesso e o botão de retorno ao login.
- [ ] Tentar cadastrar um e-mail já utilizado e verificar o erro apresentado.
- [ ] Tentar cadastrar profissional sem os dados profissionais obrigatórios.
- [ ] Verificar visualização, rolagem, teclado, contraste e leitura dos labels
  em tamanhos de tela suportados.
- [ ] Confirmar que nenhum dado profissional é persistido para paciente após
  a aplicação da migration.
- [ ] Solicitar um cadastro e confirmar que o assunto e o conteúdo do e-mail
  estão em português.
- [ ] Clicar no link de confirmação do e-mail e verificar a abertura da tela
  de login.
- [ ] Fazer login com a conta confirmada e validar o tratamento de credenciais
  inválidas.

## Arquivos e módulos prováveis

- `frontend/app/index.tsx` ou nova rota pública de cadastro;
- `frontend/app/_layout.tsx`, caso seja necessário registrar opções de rota;
- `frontend/components/app-input.tsx`, `frontend/components/brand-button.tsx`,
  `frontend/components/app-screen.tsx` e `frontend/components/feedback-state.tsx`;
- novos módulos de formulário, tipos e validação em `frontend/`;
- `frontend/lib/supabase.ts`, somente para o acesso público permitido pela
  estratégia definida;
- `backend/src/config/supabase.ts`, apenas como referência da configuração
  server-side existente;
- nova migration em `supabase/migrations/` se necessária;
- `ia/documentation/configuracao-inicial.md` e eventual registro em
  `ia/documentation/` somente mediante autorização explícita.

Os caminhos exatos devem ser confirmados antes da implementação para evitar
criar módulos concorrentes aos padrões existentes.

## Fluxo de autorização

- **Antes da autenticação:** a tela permite somente o envio dos dados do
  cadastro; não permite leitura de perfis, relacionamentos ou dados clínicos.
- **Paciente recém-cadastrado:** pode autenticar, mas sem associação `active`
  fica em pendência e não pode criar ou ler registros de acompanhamento.
- **Profissional recém-cadastrado:** pode acessar apenas seus próprios dados e
  as operações autorizadas para profissional; não recebe acesso a pacientes
  sem associação válida.
- **Usuário não associado:** não acessa dados de acompanhamento nem pode
  criar registros de domínio protegidos.
- **Usuário desativado:** não acessa dados ativos, mesmo que possua sessão
  válida.

## Migration necessária

É necessária a migration
`supabase/migrations/20260823000002_registration_profile_trigger.sql`, que
valida os metadados do cadastro e cria o perfil complementar correspondente ao
papel. Não foram criadas novas tabelas ou campos persistentes: as tabelas
`profiles`, `patient_profiles` e `professional_profiles` existentes são
reutilizadas. A migration foi criada e validada, mas não foi aplicada em banco
remoto ou local.

## Validação e critério de pronto

- Lint e typecheck do frontend passam.
- Build/typecheck do backend passam.
- Migration é revisada e validada sem aplicação direta ao banco.
- Cadastro válido de paciente cria Auth + `profiles` + `patient_profiles`.
- Cadastro válido de profissional cria Auth + `profiles` +
  `professional_profiles`.
- Conta não confirmada não consegue concluir o acesso ao aplicativo.
- Campos específicos do papel errado não são persistidos.
- Validações impedem e-mail inválido, senha inconsistente, campos obrigatórios
  ausentes e telefone inválido; o registro profissional será apenas
  obrigatório, sem validação específica de área ou órgão.
- E-mail ou registro profissional duplicado recebe erro tratável.
- Falhas de Auth ou da trigger não deixam uma conta utilizável sem perfil, pois
  a criação ocorre na mesma transação do usuário Auth.
- A interface apresenta loading, erro, sucesso e prevenção de duplo envio.
- O fluxo pós-cadastro respeita o papel, a associação ativa e o status do
  usuário.
- Não há segredo no frontend, logs ou arquivos versionados.
- Revisão do diff confirma que nenhuma alteração direta no banco foi feita.
- Documentação registra o funcionamento real, limitações e manutenção somente
  se houver autorização explícita do programador.

## Riscos e dependências

- As migrations existentes foram criadas, mas não aplicadas; o fluxo depende
  de uma estratégia autorizada para validar Auth e banco.
- O backend ainda é mínimo, então será necessário definir organização de rotas,
  tratamento de erros e integração com o login sem criar uma camada
  desnecessária.
- O contrato com a tela de login desenvolvida em paralelo precisa definir o
  destino após a confirmação do e-mail e o formato dos erros de autenticação.
- A trigger depende da configuração do Supabase Auth e deve ser aplicada antes
  de validar o cadastro em ambiente integrado.
- O fluxo de convite e associação ainda não existe, portanto o cadastro do
  paciente não pode ser apresentado como acesso imediato ao acompanhamento.
- Campos de saúde devem ser minimizados; não incluir história clínica ou
  anotações no cadastro sem decisão explícita.

## Decisões registradas

- O login será integrado posteriormente pelo outro desenvolvedor; esta task
  apenas exibe a orientação e o botão de retorno.
- O cadastro usa `auth.signUp` com chave pública e trigger versionada para
  persistir os perfis.
- A confirmação de e-mail deve estar habilitada no projeto Supabase.
- A trigger garante os campos obrigatórios e o papel único; não valida o
  registro profissional por área ou órgão.

## Extensão: confirmação de e-mail e retorno ao login

### Escopo

- [x] Personalizar o assunto e o conteúdo do e-mail de confirmação em
  português, com chamada clara para concluir o cadastro no EntreLaços.
- [x] Configurar o redirecionamento do link de confirmação para a rota de login
  do aplicativo.
- [x] Criar a tela de login com autenticação por e-mail e senha.
- [x] Configurar o esquema de deep link do aplicativo para abrir a rota de login
  após a confirmação no dispositivo.
- [x] Atualizar a configuração local do Supabase e registrar a necessidade de
  replicar o template e as URLs permitidas no projeto hospedado.
