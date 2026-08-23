# Tela login

## Nome da task

`tela-login`

## Descrição objetiva

Planejar a tela inicial de autenticação do EntreLaços para os papéis
`patient` e `professional`. A pessoa seleciona o tipo de acesso, informa login
e senha e pode iniciar recuperação de senha ou navegar para o cadastro. Para
paciente, a interface também apresenta o código de convite enviado por um
profissional.

O papel selecionado orienta a experiência, mas não concede autorização. Após
autenticar, o papel real deve ser lido de `profiles.role` e validado antes do
redirecionamento.

## Escopo

- Substituir a entrada provisória do aplicativo por uma tela de login.
- Oferecer seleção acessível entre **Paciente** e **Profissional**.
- Exibir login e senha para os dois perfis.
- Exibir o campo de código de convite quando **Paciente** estiver selecionado.
- Disponibilizar a ação **Esqueci minha senha** abaixo do campo de senha.
- Fazer essa ação navegar para uma rota pública de recuperação; a implementação
  da tela e do fluxo de redefinição será tratada em task posterior.
- Disponibilizar a ação de navegação para cadastro para quem estiver no
  primeiro acesso.
- Validar entradas, impedir envios repetidos e apresentar carregamento e erros
  de forma segura.
- Autenticar com Supabase Auth, conferir perfil, estado do usuário e, para
  paciente, o estado da associação antes de liberar uma área protegida.
- Preparar a integração do código de convite sem tratá-lo como credencial de
  autenticação.
- Implementar o endpoint backend transacional que valida e consome o convite e
  cria a associação `pending` no primeiro acesso do paciente.
- Implementar uma tela protegida mínima de pendência/bloqueio para pacientes
  autenticados que ainda não possuem associação `active`.

## Fora do escopo

- Implementação da tela e do fluxo de cadastro, sob responsabilidade de outro
  desenvolvedor.
- Implementação da tela e do fluxo completo de recuperação/redefinição de senha.
- Login social, biometria, MFA e QR Code.
- Geração de convite pelo profissional.
- Aprovação, recusa ou cancelamento da associação pelo profissional.
- Implementação dos dashboards definitivos de paciente e profissional.
- Funcionalidades de acompanhamento clínico.

## Plano

### 1. Fluxo de interface

1. Usar a rota inicial como tela pública de autenticação.
2. Iniciar sem inferir permissões e apresentar um controle rotulado para a
   escolha entre Paciente e Profissional. Preferir um controle segmentado ou
   radio group do Tamagui em vez de um seletor nativo fechado, por haver apenas
   duas opções e para manter as escolhas visíveis.
3. Renderizar login (e-mail) e senha nos dois modos. No modo paciente, renderizar
   também o código de convite.
4. Manter valores de formulário previsíveis ao trocar o papel, limpando o
   código quando sair do modo paciente para evitar envio acidental.
5. Posicionar **Esqueci minha senha** imediatamente após a senha e a chamada
   **Primeiro acesso? Cadastre-se** após a ação principal.
6. No envio, validar campos, exibir carregamento no botão e bloquear novo envio.
   Mensagens de autenticação não devem revelar se um e-mail existe.

### 2. Autenticação e autorização

1. Extrair a chamada `signInWithPassword` para um serviço/hook de autenticação;
   a tela deve coordenar estado visual, não concentrar regras de negócio.
2. Depois da autenticação, consultar somente o próprio registro ativo em
   `profiles`, protegido por RLS.
3. Comparar `profiles.role` com a opção escolhida. Em divergência, não abrir a
   área selecionada; encerrar a sessão e informar que o tipo de acesso não
   corresponde ao cadastro, sem expor outros dados.
4. Para profissional ativo, direcionar para a área profissional protegida.
5. Para paciente ativo, consultar suas associações:
   - com associação `active`, liberar a área do paciente sem exigir ou
     consumir novo convite;
   - com associação apenas `pending`, direcionar para uma tela de pendência;
   - sem associação, validar/consumir o código informado por operação segura,
     criar a associação `pending` e direcionar para a pendência;
   - convite inválido, usado, expirado, recusado ou cancelado não cria relação.
   Se o convite expirar antes do primeiro uso, o paciente deverá solicitar um
   novo código ao profissional. Uma associação já criada não expira apenas
   porque o paciente demorou a retornar ao aplicativo.
6. Usuário desativado (`profiles.status = -1`) ou sem perfil válido não acessa
   nenhuma área do produto. Encerrar a sessão e apresentar erro genérico com
   orientação de suporte.
7. Nunca usar apenas os grupos de rota ou a escolha visual do perfil como
   barreira de acesso. Adicionar um guard de sessão/papel nas rotas protegidas.

### 3. Tratamento do código de convite

O código é dado de onboarding/associação, não uma terceira credencial do
Supabase Auth. Ele não deve ser enviado para `signInWithPassword`, persistido
localmente nem registrado em logs.

A tabela `professional_invites` armazena somente o digest e já representa uso,
expiração, revogação e soft-delete. A tela reutilizará
`profiles`, `professional_invites` e `patient_professional_relationships`; uma
nova tabela não é justificada.

Como as policies atuais não permitem que o paciente leia/consuma convites nem
crie a associação, o processamento ocorrerá em endpoint backend transacional
com validação do JWT. A operação deve comparar o digest, travar e consumir o
convite de uso único e criar no máximo uma associação `pending`, sem expor o
convite ou a chave secreta ao frontend. O consumo e a criação da associação
devem confirmar ou falhar juntos, inclusive em requisições concorrentes.

Após a criação da associação, ou quando já existir uma associação `pending`, o
paciente será direcionado para uma tela protegida mínima. Essa tela informa que
a aprovação do profissional está pendente, permite sair da conta e não consulta
nem exibe dados de acompanhamento. Ao voltar ao app ou atualizar o estado, a
autorização deve ser revalidada; somente `active` libera a área do paciente.

### 4. Recuperação de senha e cadastro

- Nesta task, a ação **Esqueci minha senha** deve apenas navegar para uma rota
  pública estável `/forgot-password`. A tela e o envio com
  `resetPasswordForEmail` serão implementados em task posterior, com resposta
  neutra mesmo para e-mail inexistente, deep link autorizado e uma tela segura
  para definir a nova senha.
- O link de cadastro deve apontar para o contrato de rota fornecido pelo outro
  desenvolvedor. Esta task não deve criar uma segunda tela de cadastro.
- A integração deve evitar conflitos nos arquivos compartilhados
  `frontend/app/_layout.tsx` e na rota inicial; combinar previamente os nomes das
  rotas e o formato de parâmetros.

### 5. Sessão segura

- Alterar a configuração provisória `persistSession: false` somente quando o
  fluxo de autenticação for implementado.
- No aplicativo Android/iOS, persistir os tokens com um adapter baseado em
  `expo-secure-store`, nunca em armazenamento de texto simples.
- Centralizar restauração, renovação e encerramento da sessão em um provider ou
  hook de autenticação. Enquanto a sessão estiver sendo restaurada, não mostrar
  brevemente a tela de login nem uma área protegida.
- Após restaurar uma sessão, consultar novamente perfil, papel, `status` e
  associação. A existência de um token salvo não substitui autorização.
- Limpar a sessão local em logout, perfil inválido/desativado ou falha
  irrecuperável de renovação.

### 6. Design system, acessibilidade e responsividade

- Reutilizar `AppScreen`, `AppInput`, `BrandButton` e tokens do
  `tamagui.config.ts`; avaliar evolução do `AppInput` para senha, teclado/e-mail,
  autofill, erro e descrição acessível sem criar um padrão concorrente.
- Incluir rótulos persistentes, foco visível, ordem de leitura, alvos de toque
  adequados, `textContentType`/`autoComplete` coerentes e alternância acessível
  de visibilidade da senha.
- Não usar somente cor para indicar perfil, erro ou seleção.
- Usar `KeyboardAvoidingView`/scroll quando necessário, respeitar safe areas e
  testar telas pequenas, teclado aberto, orientação e tamanhos maiores de fonte.
- Preservar linguagem acolhedora e objetiva, sem sugerir atendimento de
  emergência ou garantia clínica.
- Estados previstos: inicial, campos inválidos, autenticando, credenciais
  inválidas, falha de rede, perfil divergente/desativado, convite inválido,
  redirecionamento e sessão existente. Não há estado vazio aplicável ao
  formulário; pendência de associação deve possuir tela própria.

### 7. Camadas afetadas

- **Frontend:** tela/rota pública, formulário, serviço ou hook de autenticação,
  estado de sessão, guards e contratos de navegação.
- **Backend:** endpoint seguro e transacional para validar e consumir convite e
  criar associação `pending`.
- **Supabase/banco:** reutilização das estruturas existentes; possível migration
  apenas para função/policies estritamente necessárias ao fluxo transacional.
- **Documentação:** registrar a implementação real em
  `ia/documentation/tela-login.md` ao concluir a task e atualizar a documentação
  inicial se sessão, navegação ou componentes compartilhados mudarem.

### 8. Arquivos e módulos prováveis

- `frontend/app/index.tsx` ou rota pública dedicada de login;
- rota protegida de pendência/bloqueio do paciente;
- `frontend/app/_layout.tsx` e layouts dos grupos protegidos;
- `frontend/components/app-input.tsx` e `frontend/components/brand-button.tsx`;
- novo componente de seleção de papel, somente se não houver composição
  Tamagui suficiente;
- novo serviço/hook/contexto de autenticação em estrutura coerente com o
  frontend;
- `frontend/lib/supabase.ts`, para persistência segura de sessão a ser definida;
- dependência `expo-secure-store` e adapter de armazenamento seguro, caso ainda
  não estejam presentes quando a implementação começar;
- endpoint/módulo backend de consumo transacional de convite;
- migration adicional em `supabase/migrations/`, somente se necessária;
- `ia/documentation/tela-login.md` ao final da implementação.

## Migration necessária

Não é necessária migration para desenhar a tela nem para autenticar por
e-mail/senha. As tabelas atuais representam perfil, convite e associação.

O consumo do código será implementado em endpoint backend transacional. A
princípio, ele pode reutilizar as tabelas e constraints existentes com operação
privilegiada server-side, sem abrir policies de escrita ao aplicativo. Se a
implementação identificar necessidade de função, constraint, índice, grant ou
policy adicional, a mudança deverá ser entregue em migration versionada, com
menor privilégio e testes de concorrência/uso único. Nenhuma migration deve ser
aplicada sem autorização explícita.

## Validação e critérios de pronto

- Paciente e profissional visualizam apenas os campos previstos para o modo
  selecionado, com labels e navegação por teclado/leitor de tela.
- E-mail é normalizado e validado; senha e código não aparecem em logs nem em
  mensagens de erro.
- O botão impede envio inválido e duplo clique; carregamento e falha de rede têm
  feedback recuperável.
- A seleção incorreta de papel nunca libera a área do outro perfil.
- Profissional ativo entra somente na área profissional.
- Paciente com associação ativa entra sem consumir convite novo.
- Paciente sem associação não acessa dados do produto; convite válido gera
  relação `pending` uma única vez e leva à pendência.
- A tela de pendência não lê nem escreve dados de acompanhamento, oferece logout
  e libera a área do paciente somente após revalidar uma associação `active`.
- Convite inválido, expirado, usado ou concorrente falha sem criar associação.
- Usuário desativado, sem perfil ou com papel divergente permanece bloqueado.
- Links de recuperação e cadastro usam rotas públicas existentes/acordadas.
- Sessão válida ao reabrir o app é restaurada com armazenamento seguro e
  redirecionada após revalidar papel/autorização.
- Validar em Android e iOS: tela pequena, teclado aberto, tema claro/escuro,
  fonte ampliada, leitor de tela e estados de erro/carregamento.
- Executar lint, checagem TypeScript e testes automatizados de formulário,
  autenticação, guards e consumo de convite; revisar o diff e ausência de
  segredos.

## Riscos e dependências

- O pedido de código na tela de login conflita com a natureza de uso único do
  convite se ele for obrigatório em todos os acessos. O comportamento seguro é
  usá-lo apenas quando o paciente ainda não possui associação.
- A configuração atual usa `persistSession: false`; a implementação deverá
  introduzir armazenamento seguro e ciclo de restauração/renovação da sessão
  sem expor tokens.
- A migration inicial ainda não foi aplicada e possui somente policies mínimas
  de leitura; o fluxo completo depende do endpoint backend seguro previsto.
- As áreas de paciente e profissional são placeholders e ainda não possuem
  guards reais.
- A tela de pendência/bloqueio ainda não existe e passa a integrar esta entrega;
  sem ela, o primeiro acesso do paciente não atende à constituição.
- Há risco de conflito de merge com a task de cadastro nos arquivos de
  navegação compartilhados.
- Recuperação de senha exige configuração de deep link/redirect e contrato de
  rota; apenas exibir o link sem destino não conclui o fluxo.

## Decisões definidas

1. O campo será rotulado como **Código de convite (primeiro acesso)**. Ele será
   usado somente por paciente ainda sem associação. Se o convite expirar antes
   do consumo, o paciente solicitará outro ao profissional; pacientes com
   associação `pending` ou `active` não precisam apresentar novo código no
   login.
2. O consumo do convite será feito por endpoint backend transacional. Essa
   opção mantém a chave privilegiada fora do aplicativo, concentra validações e
   permite consumir o convite e criar a associação `pending` de forma atômica.
   A tela de pendência deve ser uma rota protegida mínima, sem acesso aos dados
   de acompanhamento, e será entregue junto do fluxo de convite nesta task.
3. A tela de recuperação/redefinição de senha fica fora desta task. A tela de
   login entregará apenas a navegação para uma rota pública estável, cujo fluxo
   será implementado posteriormente.
4. A sessão móvel será persistida com adapter de armazenamento seguro baseado
   em `expo-secure-store`, com revalidação de autorização após restauração.
5. A ação de recuperação usará o contrato de rota pública
   `/forgot-password`. A implementação dessa rota permanece fora do escopo
   desta task.
6. O endpoint transacional de consumo do convite e a tela mínima de pendência
   fazem parte desta entrega funcional, pois são necessários para concluir o
   primeiro acesso do paciente sem violar a autorização definida na
   constituição.

## Decisão pendente de integração

A rota e os parâmetros da tela de cadastro serão acordados posteriormente com
a task conduzida pelo outro desenvolvedor. Esta task deve manter a chamada
visual **Primeiro acesso? Cadastre-se**, mas a integração só será considerada
concluída quando o contrato real da rota de cadastro estiver disponível. O
papel selecionado poderá ser repassado apenas como conveniência de interface e
nunca como fonte de autorização.
