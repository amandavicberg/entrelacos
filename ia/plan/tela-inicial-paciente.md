# Task: Tela inicial do paciente

## Nome da task

`tela-inicial-paciente`

## Descrição objetiva

Substituir o placeholder da área do paciente por uma tela principal acolhedora,
responsiva e segura, exibida após a entrada no aplicativo. A tela deve reunir
um resumo do acompanhamento diário, a anotação para a próxima sessão, o acesso
ao menu lateral e atalhos para recursos que serão implementados em tasks
próprias.

## Objetivo e resultado esperado

O paciente autenticado com associação ativa deverá encontrar uma home clara,
com uma ação principal para registrar como está se sentindo e acesso previsível
às informações mais importantes do acompanhamento. A tela não deve fingir que
existem sessões, documentos ou materiais quando esses dados ainda não estiverem
disponíveis.

## Escopo incluído

### Conteúdo e ações da home

- Substituir `frontend/app/(patient)/index.tsx`, preservando o guard que envia
  pacientes sem associação ativa para a tela de pendência.
- Exibir saudação e resumo simples do dia, sem diagnóstico, pontuação clínica
  ou linguagem que prometa resultado terapêutico.
- Criar o quadro de registro diário com sentimentos selecionáveis e um campo
  curto para o paciente registrar como está se sentindo.
- Permitir salvar ou atualizar o registro diário e apresentar feedback de
  sucesso, erro e carregamento, conforme o modelo persistente aprovado.
- Criar o card “Próxima sessão” com espaço para uma anotação do paciente para
  discussão posterior. Enquanto o domínio de sessões não existir, exibir um
  estado vazio honesto e não inventar data, profissional ou consulta.
- Disponibilizar acesso ao protocolo de emergência em modo de leitura quando
  houver conteúdo configurado; sem substituir serviço de emergência ou
  orientação profissional.
- Criar o menu lateral e seus atalhos principais, com destinos explícitos e
  rótulos em português.
- Exibir atalhos para documentos, ferramentas de apoio, aprendizados, minha
  história, mensagem para a profissional, materiais e consultas, deixando
  estados “em breve” ou telas vazias quando a funcionalidade ainda não fizer
  parte desta task.
- Manter a ação de sair integrada ao fluxo de autenticação existente.

### Design system e experiência

- Reutilizar `AppScreen`, `AppHeader`, `AppCard`, `BrandButton`,
  `FeedbackState` e tokens semânticos do Tamagui antes de criar componentes
  novos.
- Criar componentes específicos somente para padrões claros desta home, como
  grupo de sentimentos, card de resumo e item do menu lateral.
- Usar um CTA principal por área, hierarquia visual simples, respiro funcional
  e linguagem acolhedora sem infantilizar o paciente.
- Garantir alvos de toque de pelo menos 44 pontos, labels acessíveis, foco
  visível, contraste adequado e leitura compreensível por leitor de tela.
- Adaptar a composição a telas pequenas e maiores, orientação vertical, fonte
  ampliada e teclado aberto, sem depender de alturas fixas.
- Considerar temas claro e escuro e estados pressionado, desabilitado,
  carregando, vazio e erro.

## Fora do escopo

- Upload, armazenamento, visualização, download ou gerenciamento de exames,
  laudos e documentos.
- Implementação de calendário, confirmação, cancelamento, reagendamento ou
  mensagens automáticas de consulta.
- Chat ou troca de mensagens em tempo real com a profissional.
- Criação e gerenciamento profissional de ebooks, podcasts, vídeos e outros
  materiais.
- Implementação completa das ferramentas para ansiedade, angústia ou crises,
  incluindo autoria, personalização e acompanhamento de uso.
- Construção do histórico terapêutico completo, métricas de evolução ou
  modelos clínicos para “Minha história” e aprendizados.
- Gestão de permissões avançadas ou compartilhamento com toda a equipe
  multidisciplinar.
- Notificações push, analytics clínico, diagnóstico, pronto atendimento ou
  substituição de protocolo profissional por orientação automática.
- Redesenho da área profissional, da tela pública, do login ou da tela de
  pendência, salvo ajustes de navegação estritamente necessários.
- Criação de documentação em `ia/documentation/` sem autorização explícita.

## Decisão de dados e autorização

- Reutilizar `profiles`, `patient_profiles` e
  `patient_professional_relationships` existentes para identificar o paciente
  autenticado e sua associação.
- A home só poderá ler e escrever dados do próprio paciente quando o perfil
  estiver ativo e houver associação `active` com `status = 0`.
- Usuário não associado, com associação apenas `pending`, perfil inexistente,
  papel divergente ou perfil desativado não poderá visualizar nem gravar dados
  de acompanhamento; deverá seguir o guard de bloqueio ou encerramento de
  sessão existente.
- O registro diário e a anotação para a próxima sessão são dados de domínio
  novos. A necessidade, cardinalidade e retenção devem ser confirmadas antes
  da migration: avaliar se haverá um registro por dia, atualização do mesmo
  registro e relação futura com uma sessão específica.
- Protocolos, sessões, materiais, documentos, mensagens, ferramentas e
  histórico não possuem estruturas na base atual. A home deve consumir somente
  contratos existentes ou apresentar estado vazio; cada módulo deverá receber
  sua própria decisão de dados, migration, RLS e fluxo profissional-paciente.
- Qualquer migration nova deverá conter `status` de soft-delete quando
  aplicável, constraints, índices mínimos e policies de menor privilégio. Não
  aplicar migration remotamente nem alterar o banco diretamente.
- Minimizar dados exibidos e não registrar em logs sentimentos, anotações,
  conteúdo de emergência ou outros dados de saúde.

## Camadas afetadas

- **Frontend:** rota da área do paciente, componentes da home, menu lateral,
  estados de carregamento/erro/vazio e integração com o contexto de sessão.
- **Backend:** somente se o contrato escolhido para salvar o registro diário
  exigir endpoint ou regra server-side; não duplicar regra no cliente.
- **Supabase/banco:** provável migration para o registro diário/anotação, ainda
  condicionada à decisão de modelo; incluir RLS e policies para o próprio
  paciente e revisão de acesso profissional somente quando necessário.
- **Documentação:** este plano; documentação do funcionamento real somente se
  for solicitada explicitamente.

## Plano

### 1. Preparação e contratos

- [x] Consultar novamente constitution, `frontend/AGENTS.md`, documentação da
  configuração inicial e componentes compartilhados antes da implementação.
- [x] Inspecionar o guard de autenticação, layout da área do paciente e rotas
  disponíveis para definir destinos explícitos do menu.
- [x] Confirmar que o modelo persistente do registro diário permanece pendente:
  esta implementação entrega interação local e composição visual, sem gravar
  dados de saúde.

### 2. Dados, backend e autorização

- [x] Reutilizar o estado de acesso baseado nas estruturas de identidade e
  associação existentes, sem criar tabelas por tela.
- [ ] Se aprovado o registro persistente, criar migration versionada para a
  entidade adequada, com constraints, índices, `status`, timestamps e RLS.
- [x] Manter a interação do registro local nesta etapa; serviço, hook de
  persistência e tratamento de erros de rede aguardam a definição do modelo.
- [x] Garantir que a home não faça consultas amplas nem permita acesso à
  interface para paciente sem associação `active`.
- [x] Manter documentos, sessões, materiais, mensagens e protocolos sem
  consultas fictícias até que seus contratos sejam definidos.

### 3. Interface e navegação

- [x] Criar a composição responsiva da home no lugar do placeholder atual.
- [x] Implementar o quadro de sentimentos e anotação diária com estados
  inicial, preenchido e confirmação local de registro; persistência e erros de
  rede permanecem fora até a definição do modelo.
- [x] Implementar o card da próxima sessão com anotação e estado vazio quando
  não houver dados de sessão disponíveis.
- [x] Implementar o acesso lateral e os atalhos com destinos explícitos,
  diferenciando recursos disponíveis de recursos ainda não implementados.
- [x] Adicionar o protocolo de emergência como conteúdo somente leitura quando
  houver contrato de dados; não expor texto clínico inexistente.
- [x] Reutilizar ou abstrair componentes Tamagui sem criar tokens ou cores
  hardcoded concorrentes.

### 4. Validação e entrega

- [x] Executar typecheck, lint e `git diff --check`; o build web permanece
  bloqueado pelo erro conhecido de Node 18 em `configs.toReversed`.
- [x] Confirmar que não houve migration ou alteração de policies nesta etapa.
- [x] Revisar o diff em busca de segredos, dados reais, logs sensíveis,
  marcadores de conflito e consultas sem filtro de autorização.
- [ ] Fazer revisão visual em mobile e web, temas claro/escuro, fonte ampliada
  e teclado aberto.
- [x] Atualizar este plano em marco relevante; documentação funcional fica
  pendente de autorização explícita.

## Arquivos e módulos prováveis

- `frontend/app/(patient)/index.tsx`: tela principal e integração com o guard.
- `frontend/app/(patient)/_layout.tsx`: somente se o menu ou a navegação
  lateral exigir ajuste no layout protegido.
- `frontend/components/app-card.tsx`, `app-header.tsx`, `app-screen.tsx`,
  `brand-button.tsx` e `feedback-state.tsx`: reutilização e possíveis
  extensões compatíveis.
- `frontend/contexts/auth-context.tsx`: consulta ao estado de sessão e acesso.
- `frontend/lib/api.ts` ou novo módulo de domínio do paciente: somente se a
  persistência precisar de serviço dedicado.
- `supabase/migrations/`: nova migration apenas se o registro diário for
  confirmado como persistente nesta task.

## Migration necessária

Ainda não confirmada. A base atual não representa sentimentos nem anotações do
paciente. Se a home salvar esses dados, será necessária uma migration própria
para a entidade de registro diário, com modelagem de periodicidade, soft-delete
quando aplicável, constraints, índices, RLS e policies. Não criar uma tabela
apenas para cada card e não aplicar a migration remotamente sem autorização.

## Validação e critérios de pronto

- [ ] Paciente ativo e associado acessa a home real após entrar no aplicativo.
- [ ] Paciente pendente ou não associado continua bloqueado pela tela de
  pendência, sem leitura ou escrita de dados da home.
- [ ] A home apresenta hierarquia clara, sentimentos, anotação diária, card da
  próxima sessão, protocolo/atalhos e menu lateral sem inventar dados.
- [ ] Registro diário e anotação exibem feedback correto, caso a persistência
  seja incluída após a decisão de modelo.
- [ ] Recursos fora do escopo aparecem como destinos ou estados vazios claros,
  sem aparentar que uploads, chat, agenda ou materiais já funcionam.
- [ ] Componentes e tokens Tamagui compartilhados são reutilizados, sem estilos
  paralelos desnecessários ou cores hardcoded.
- [ ] Loading, erro, vazio, acessibilidade, teclado, responsividade e temas
  claro/escuro foram considerados e validados.
- [ ] Não há exposição de dados de saúde, segredos ou permissões indevidas.

## Checklist de testes manuais

- [ ] Entrar como paciente com associação `active` e confirmar a home.
- [ ] Entrar como paciente sem associação ativa e confirmar o bloqueio.
- [ ] Confirmar que usuário desativado, perfil inválido ou papel divergente não
  acessa a tela protegida.
- [ ] Selecionar cada sentimento, preencher a anotação e confirmar feedback de
  salvamento ou o estado vazio definido para esta task.
- [ ] Reabrir a home e verificar a atualização do registro, se persistência
  tiver sido implementada.
- [ ] Abrir e fechar o menu lateral por toque, teclado quando aplicável e
  leitor de tela; conferir rótulos e destinos.
- [ ] Conferir card sem próxima sessão, sem protocolo e sem conteúdos
  configurados, sem textos enganosos.
- [ ] Conferir carregamento, erro recuperável, botão desabilitado e prevenção
  de submissão duplicada.
- [ ] Conferir alvos de toque, foco visível, contraste e leitura por leitor de
  tela.
- [ ] Conferir tela estreita, tela maior, fonte ampliada e teclado aberto.
- [ ] Conferir temas claro e escuro e layout em Android, iOS e web.
- [ ] Confirmar que nenhum dado de outro paciente aparece na home ou nos
  feedbacks.

## Riscos, dependências e decisões pendentes

- O modelo de registro diário ainda não existe; decidir periodicidade,
  atualização, sentimentos permitidos, tamanho do texto e vínculo com sessão
  antes de criar a migration.
- Não existe entidade de sessão na base atual. O card da próxima sessão só
  poderá ser funcional depois de uma task própria de consultas/agendamento.
- Protocolo de emergência, ferramentas, materiais, mensagens e histórico
  dependem de conteúdo e regras fornecidos pelo profissional; a home não deve
  criar conteúdo clínico padrão.
- Um menu lateral aumenta a superfície de navegação e deve permanecer simples
  até que os módulos tenham rotas reais; atalhos indisponíveis precisam ser
  claramente identificados.
- A quantidade de profissionais ativos por paciente continua sendo uma decisão
  pendente do produto e pode afetar a seleção do profissional e os conteúdos
  exibidos.
- A validação visual em dispositivo físico e a confirmação dos testes manuais
  permanecem pendentes até execução pelo responsável.
