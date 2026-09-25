# Task: Fluxo de associação entre paciente e profissional

## Nome da task

`fluxo-associacao-paciente-profissional`

## Descrição objetiva

Consolidar o fluxo de associação já iniciado no projeto para que um paciente
sem vínculo possa informar o código de um profissional dentro do aplicativo,
acompanhar o estado da solicitação e para que o profissional identifique,
aprove ou recuse a solicitação de forma segura.

## Objetivo e resultado esperado

O vínculo continuará sendo iniciado exclusivamente por convite do profissional.
Um paciente autenticado sem associação poderá informar o código sem precisar
sair da conta; o código cria uma solicitação `pending`. O profissional verá o
nome mínimo necessário para decidir e poderá aprovar (`active`) ou recusar
(`rejected`). Em todos os estados sem associação ativa, o paciente permanece
sem acesso aos dados de acompanhamento.

## Decisão de escopo posterior

Para a primeira versão do TCC, um paciente terá somente um vínculo aberto por
vez. A task passa a incluir a aplicação das migrations no projeto Supabase
remoto de homologação `ukvrhnrjdksrtpbgnndw` e uma migration incremental que
impede duas relações `pending` ou `active`, mesmo que sejam de profissionais
distintos. Relações históricas encerradas, canceladas, recusadas ou inativas
continuam preservadas.

## Escopo incluído

- Distinguir no estado de autenticação o paciente sem associação do paciente
  com solicitação pendente.
- Criar a rota protegida de conexão do paciente para informar e consumir um
  convite já autenticado, com estados de carregamento, erro e sucesso.
- Ajustar guards e redirecionamentos para que usuários sem vínculo não cheguem
  à área de acompanhamento.
- Exibir ao profissional somente o nome e a data de solicitação de cada
  paciente pendente, dados mínimos para a decisão de aprovação.
- Permitir que o profissional ativo aprove ou recuse exclusivamente suas
  próprias solicitações pendentes.
- Reutilizar `professional_invites` e
  `patient_professional_relationships`; registrar na documentação o fluxo
  efetivamente entregue.

## Fora do escopo

- QR Code, envio por e-mail, WhatsApp, SMS, push ou qualquer canal externo.
- Revogação de convite ainda não consumido, cancelamento pelo paciente e
  encerramento de relações ativas.
- Credenciamento de profissionais, notificações e novas funcionalidades de
  acompanhamento.

## Decisão de dados e autorização

- Não será criada migration: o enum `relationship_status` já contempla
  `pending`, `active` e `rejected`, e a tabela já preserva a auditoria de
  origem pelo `invite_id`.
- O backend com credencial de serviço continuará sendo o único caminho de
  escrita. Ele valida bearer token, papel e perfis ativos antes de consumir,
  aprovar ou recusar.
- Um paciente não associado pode apenas consumir um código válido; um paciente
  pendente ou ativo não recebe nova operação nesta task. Isso não cria um
  limite de cardinalidade no modelo e evita uma regra de múltiplos vínculos
  implícita antes da decisão de produto.
- O profissional recebe somente `full_name` e `requested_at` dos seus pedidos
  pendentes. Pacientes, profissionais de outro vínculo, usuários inativos e
  não autenticados não podem listar nem alterar solicitações.
- Código consumido continua inutilizável, inclusive após recusa, conforme a
  regra do produto.

## Camadas afetadas

- **Frontend:** estado de acesso, guardas, nova tela de conexão, contrato de
  API e painel de solicitações profissional.
- **Backend:** listagem com identidade mínima e endpoint autenticado de recusa.
- **Supabase/banco:** reutilização das migrations existentes, sem alteração
  persistente.
- **Documentação:** registro funcional em `ia/documentation/` após validação.

## Plano

### 1. Preparação e estado de acesso

- [x] Ler constitution, instruções do frontend, documentação da base e
  migrations/contratos existentes.
- [x] Identificar a ambiguidade atual entre paciente sem vínculo e paciente
  com solicitação pendente.
- [x] Incluir o estado `patient-unassociated` e redirecionamentos seguros.

### 2. Jornada do paciente

- [x] Criar tela protegida para informar código de convite com validação local,
  carregamento, erro e retorno para pendência após consumo.
- [x] Restringir paciente sem vínculo e paciente pendente fora da área de
  acompanhamento.
- [x] Preservar logout e ação de atualização de estado na pendência.

### 3. Decisão do profissional

- [x] Retornar nome mínimo do paciente pendente pelo backend autenticado.
- [x] Criar endpoint de recusa limitado à solicitação pendente pertencente ao
  profissional autenticado.
- [x] Atualizar contrato e painel profissional para aprovar ou recusar, com
  feedback e prevenção de duplo envio.

### 4. Regra de profissional único e aplicação remota

- [x] Criar migration incremental que substitui a unicidade por par pela
  regra de somente um vínculo aberto (`pending` ou `active`) por paciente.
- [x] Ajustar a RPC de consumo para retornar erro de domínio quando o paciente
  já possuir vínculo aberto, sem depender de violação de índice.
- [x] Vincular o CLI ao projeto remoto autorizado e simular o push das seis
  migrations pelo fluxo versionado do Supabase.
- [x] Habilitar o Storage pelo painel, reconciliar o histórico remoto das
  versões antigas e aplicar as seis migrations pelo Supabase CLI.
- [x] Confirmar no histórico remoto que as seis versões locais estão aplicadas.
- [ ] Validar no banco remoto o histórico de migrations, os índices e as
  policies criados, sem inserir dados reais.

### 5. Validação e documentação

- [x] Executar typecheck do frontend e backend, build do backend, testes
  disponíveis e revisão de diff.
- [ ] Executar lint do frontend com Node.js 20.19.4+ (o ambiente atual usa
  Node.js 18.20.8 e o Expo SDK 57 falha antes de executar o lint).
- [x] Atualizar este plano com o resultado real das validações.
- [x] Documentar a funcionalidade, limites de autorização e pendências reais.

## Validação e critérios de pronto

- [ ] Paciente autenticado sem vínculo é levado à tela de conexão, não à tela
  de pendência nem ao acompanhamento.
- [ ] Código válido cria uma única solicitação pendente e leva o paciente à
  tela correta; código inválido não muda o estado.
- [ ] Profissional ativo vê apenas suas solicitações, com nome e data mínimos,
  e consegue aprovar ou recusar uma solicitação pendente uma única vez.
- [ ] Paciente, profissional inativo, outro profissional e usuário sem sessão
  não conseguem decidir ou consultar solicitações alheias.
- [ ] Paciente ativo é liberado apenas após aprovação; paciente recusado volta
  ao fluxo de conexão sem acesso a dados de acompanhamento.
- [ ] Nenhum token, código de convite ou dado além do mínimo necessário é
  registrado em logs.

## Checklist de testes manuais

- [ ] Entrar como paciente sem vínculo e informar um código válido na tela de
  conexão.
- [ ] Conferir a pendência no app do profissional e aprovar a solicitação.
- [ ] Usar “Verificar novamente” no app do paciente e confirmar acesso após a
  aprovação.
- [ ] Repetir com outro convite e recusar; confirmar retorno seguro ao fluxo
  de conexão e impossibilidade de reutilizar o código.
- [ ] Tentar código expirado, usado, inválido e com paciente já pendente.
- [ ] Tentar aprovar/recusar com token de paciente, outro profissional e
  profissional inativo.
- [ ] Conferir foco, leitor de tela, fonte ampliada e alvos de toque em Android
  e iOS.

## Riscos, dependências e decisões pendentes

- As migrations de identidade e a RPC de consumo precisam estar aplicadas no
  ambiente que receberá os testes; esta task não as aplicará.
- A quantidade de profissionais por paciente continua uma decisão de produto.
  Por isso, não haverá suporte implícito a múltiplas solicitações simultâneas.
- Revogar um convite, cancelar um pedido e encerrar um vínculo exigem regras de
  auditoria e experiência próprias e permanecem para task futura.
