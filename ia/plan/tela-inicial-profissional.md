# Tela inicial e navegação do profissional

**Status:** plano aprovado; implementação e validação do agente concluídas. Testes humanos pendentes.

## Objetivo e descrição

Substituir a tela provisória do profissional por uma tela inicial completa para validação visual, com identidade do EntreLaços e navegação inferior para Pacientes, Agenda e Materiais. Nesta entrega, essas três áreas serão telas-base navegáveis. Integrações com pacientes serão desenvolvidas posteriormente.

O prompt fornecido pelo usuário é referência estética, adaptada ao escopo definido na conversa. Suas funcionalidades adicionais não entram automaticamente nesta task.

## Escopo

- Tela inicial com identificação do profissional, indicadores, atalhos, consultas do dia e aniversariantes.
- Quatro abas fixas, com ícone e rótulo: Início, Pacientes, Agenda e Materiais.
- Telas-base de Pacientes, Agenda e Materiais com título, descrição curta, indicação de funcionalidade futura e navegação funcional.
- Leitura dos dados do próprio profissional por meio da estrutura existente, sem edição de perfil.
- Dados fictícios isolados para demonstrar indicadores, consultas e aniversários, com identificação visível de demonstração nos blocos correspondentes.
- Estados de carregamento, vazio, erro e informações opcionais ausentes.
- Preservação de login, sessão, validação de acesso e ação de sair.
- Adaptação a celulares, fontes ampliadas, tema e telas maiores.

## Fora do escopo

- Alterações nas telas do paciente ou integração com dados reais de pacientes, inclusive contagens e aniversários.
- Lista funcional, busca, ficha e convite/aprovação de pacientes.
- Cadastro, edição, cancelamento e persistência de consultas.
- Geração ou envio de links de confirmação e processamento das respostas.
- Notificações, mensagens automáticas, WhatsApp, e-mail e chat.
- Upload, download, biblioteca persistente e compartilhamento de materiais.
- Prontuário/evoluções, histórico, exames, protocolos e edição de perfil/configurações.
- Novos endpoints, migrations, tabelas, colunas, policies ou alterações no Supabase.
- Publicação, deploy ou mudanças nas regras de associação entre pacientes e profissionais.

## Experiência proposta

### Tela inicial

1. **Cabeçalho:** marca existente, saudação pelo primeiro nome e texto “Seu espaço para acompanhar e cuidar.” Não adicionar sino sem funcionalidade nem tratamento automático “Dr.”/“Dra.”.
2. **Identificação:** cartão compacto com nome completo, iniciais, especialidade e registro quando disponíveis. Como não há foto ou rota de perfil implementadas, usar iniciais e não incluir “Ver perfil” nesta etapa. Manter uma ação de sair acessível e funcional.
3. **Resumo:** “Pacientes vinculados”, “Consultas hoje” e “Aguardando confirmação”. Os números pertencem à demonstração; a contagem futura de pacientes considerará somente vínculos ativos. Os indicadores levam à aba correspondente, sem prometer filtros ainda inexistentes.
4. **Atalhos:** Pacientes, Agenda e Materiais, conectados às telas-base. Não apresentar um botão de upload nesta etapa.
5. **Consultas de hoje:** data brasileira e até três consultas fictícias, ordenadas por horário, com nome, iniciais e situação. Usar “Aguardando resposta”, “Presença confirmada” e “Não comparecerá”, sempre com texto além de cor. “Ver agenda” abre a tela-base. Não oferecer acesso à ficha individual ainda inexistente.
6. **Aniversariantes:** até três pessoas fictícias nos próximos 30 dias, priorizando hoje e ordenando por proximidade. Mostrar nome e dia/mês, sem idade. “Ver aniversariantes do mês” abre uma lista mensal demonstrativa em Sheet com rolagem e fechamento acessível.
7. **Barra inferior:** fixa durante a rolagem, respeitando áreas seguras e sem cobrir o último conteúdo. A aba ativa acompanha a rota; todas as abas permanecem disponíveis sem selecionar um paciente.

### Telas-base

| Aba | Conteúdo nesta entrega | Evolução posterior |
| --- | --- | --- |
| Pacientes | Título e explicação de que a lista estará disponível após integração | Lista, busca e acompanhamento individual |
| Agenda | Título e explicação de que as consultas serão cadastradas no EntreLaços | Cadastro e respostas à confirmação |
| Materiais | Título e explicação sobre a biblioteca do profissional | Upload e compartilhamento |

Usar texto de funcionalidade ainda indisponível, sem confundir ausência de integração com uma lista real vazia. Não criar formulários, botões sem resposta ou confirmações fictícias de salvamento.

### Identidade visual

- Reutilizar Poppins, Ionicons, componentes e tokens existentes.
- Adaptar a referência de creme, cartões brancos, verde suave, bordas discretas e cantos arredondados ao tema do projeto. O tema atual usa teal; a referência não autoriza substituir globalmente a paleta do login.
- Se forem necessários tons creme/verde específicos para a área profissional, centralizá-los em tema/tokens sem regressão nas telas existentes; fornecer equivalentes legíveis no tema escuro.
- Priorizar margens próximas de 24, espaçamento consistente e cartões sem altura fixa para textos variáveis. Reutilizar raios existentes ou centralizar os novos valores.
- Em telas estreitas e com fonte ampliada, reorganizar os três indicadores em vez de cortar rótulos.
- Limitar a largura do conteúdo em telas maiores, respeitar áreas de toque de pelo menos 44 × 44 e preferência por movimento reduzido.

## Dados, arquitetura e autorização

### Estado existente verificado

- `frontend/app/(professional)/index.tsx` é uma tela provisória com ação de sair.
- `frontend/app/(professional)/_layout.tsx` valida `accessState` e usa Stack; não há rotas de Pacientes, Agenda, Materiais ou Perfil.
- `useAuth` expõe sessão, estado de acesso e saída, mas não carrega o nome/especialidade para exibição.
- As migrations existentes representam `profiles`, `professional_profiles`, `patient_profiles`, convites e associações. Não há estrutura de consultas ou materiais identificada nesta revisão.
- A documentação da base contém trechos históricos; o código e as migrations atuais devem ser conferidos antes da implementação.

### Decisão sobre persistência

- Reutilizar `profiles.id`, `full_name`, `role`, `status` e `professional_profiles.id`, `specialty`, `registration_type`, `registration_number`, `status` para consulta do próprio profissional autenticado.
- Restringir as consultas ao ID da sessão e a registros ativos, respeitando as policies existentes de leitura do próprio perfil. Validar essas policies antes de integrar.
- Não ler `patient_profiles` nem associações para alimentar os blocos desta etapa. As associações continuam sendo consultadas pelo fluxo de autorização já existente quando aplicável.
- Não criar, editar ou inativar registros de domínio. Nenhuma migration, coluna, índice ou policy nova é necessária: a única nova leitura persistente é do próprio perfil, já representado no banco.
- Separar o carregamento do perfil real dos dados de demonstração. Uma falha de leitura não deve substituir a identidade do profissional por uma pessoa fictícia.
- Manter fixtures pequenas e determinísticas fora dos componentes. Usar uma mesma data-base local para consultas, indicadores e aniversários; centralizar a janela de 30 dias e tratar passagem de mês/ano e 29 de fevereiro. Para a demonstração, considerar 28 de fevereiro em anos não bissextos, como convenção visual revisável antes da integração real.
- Demonstração identificada: contagem de pacientes, consultas e aniversários não representam a conta conectada. Calcular os indicadores a partir do conjunto demonstrativo correspondente.
- Manter estados de carregamento/vazio/erro reproduzíveis por fixtures de desenvolvimento; não introduzir painel de depuração na experiência normal.

### Limites de acesso

- **Profissional ativo:** acessa as quatro abas e somente o próprio perfil real; pode entrar mesmo sem pacientes vinculados.
- **Paciente com associação ativa:** permanece na área do paciente e não acessa rotas profissionais, inclusive por URL direta.
- **Paciente sem associação ativa:** permanece no fluxo de pendência existente.
- **Usuário não autenticado ou com perfil desativado:** não acessa a área profissional; preservar validação e redirecionamentos existentes.
- Preservar a proteção no layout comum a todas as abas. Dados demonstrativos não justificam contornar autenticação.
- Não registrar dados pessoais, tokens ou conteúdo de saúde em logs. Não ampliar permissões para habilitar a demonstração.

### Camadas e arquivos prováveis

| Camada/arquivo | Trabalho previsto |
| --- | --- |
| `frontend/app/(professional)/_layout.tsx` | Navegação em abas com guard existente preservado |
| `frontend/app/(professional)/index.tsx` | Composição da tela inicial |
| `frontend/app/(professional)/patients.tsx` | Tela-base de Pacientes |
| `frontend/app/(professional)/agenda.tsx` | Tela-base de Agenda |
| `frontend/app/(professional)/materials.tsx` | Tela-base de Materiais |
| `frontend/components/professional/` | Componentes específicos do painel, extraídos conforme necessidade |
| `frontend/hooks/` e `frontend/lib/` | Leitura tipada do próprio perfil e dados/utilitários demonstrativos separados da interface |
| `frontend/components/app-card.tsx`, `app-header.tsx`, `app-screen.tsx`, `feedback-state.tsx`, `brand-button.tsx` | Reutilização; alterações compartilhadas apenas se necessárias |
| `frontend/tamagui.config.ts` | Tokens/tema adicionais somente se a composição exigir |
| Backend e Supabase | Sem mudanças |
| `ia/plan/tela-inicial-profissional.md` | Plano único desta task, atualizado nos marcos relevantes |

Não criar documentação de funcionamento em `ia/documentation/` nesta fase: ainda não há implementação a documentar. Quando a documentação de conclusão for aplicável/autorizada, consultar a skill de documentação e registrar somente o funcionamento real.

## Plano

- [x] Examinar constitution, skill de planejamento, instruções do frontend, documentação da base, rotas, tema, autenticação e migrations pertinentes.
- [x] Consolidar o escopo solicitado e salvar esta proposta para validação.
- [x] Incorporar a validação do usuário antes de iniciar a implementação.
- [x] Conferir o estado do repositório e preparar branch a partir da `main` atualizada, preservando trabalho existente.
- [x] Consultar a documentação oficial e as instruções do frontend: a `main` atualizada já usa SDK 57, substituindo a referência inicial ao SDK 54.
- [x] Definir tipos, fixtures e consultas do próprio profissional; validar acesso e tratamento de falhas sem novas permissões.
- [x] Implementar quatro abas no navegador existente e suas três telas-base, preservando guard e saída.
- [x] Construir a tela inicial na ordem proposta, reaproveitando componentes e tokens.
- [x] Conectar atalhos, indicadores, acesso à agenda e lista mensal de aniversariantes aos destinos previstos.
- [x] Implementar e conferir estados de carregamento, vazio, erro, ausência de dados opcionais e identificação de demonstração.
- [x] Ajustar responsividade, áreas seguras, tema escuro, fonte ampliada e acessibilidade no código; inspeção humana em dispositivos permanece na checklist abaixo.
- [x] Executar validações técnicas e revisão visual disponíveis; registrar limitações de ambiente sem considerar testes não executados como aprovados.
- [x] Revisar diff e preparar resumo, prévias e pendências de integração; atualizar este mesmo plano nos marcos relevantes.

## Validação

### Verificações do agente

- [x] Executar `npm run lint`, `npm run typecheck` e `npm run build` em `frontend/`.
- [x] Conferir transição entre quatro abas e entrada pós-login, sem navegador paralelo ou rotas quebradas.
- [x] Conferir consultas limitadas ao perfil da sessão e ausência de novas leituras de pacientes/escritas de domínio.
- [x] Validar consistência dos indicadores demonstrativos e regras de datas: hoje, amanhã, fim de mês, virada de ano e aniversário em 29 de fevereiro.
- [x] Exercitar estados visuais e repetição real da consulta de perfil em “Tentar novamente”; para fixtures, deixar claro que o cenário é demonstrativo.
- [x] Usar testes automatizados focados para regras de datas/contagens: cinco testes Node aprovados.
- [x] Revisar diff, ausência de segredos/dados reais em fixtures e preservação da autenticação e dos estilos existentes.

### Testes manuais do responsável

Itens permanecem desmarcados até confirmação humana.

- [ ] Entrar com profissional ativo e conferir nome, especialidade/registro quando disponíveis e saída da conta.
- [ ] Navegar pelas quatro abas e pelos atalhos; conferir seleção correta, retorno e botão Voltar do Android.
- [ ] Confirmar que as telas-base explicam a indisponibilidade dos recursos e que não há ações silenciosas ou salvamento simulado.
- [ ] Identificar claramente os blocos fictícios e verificar que os totais correspondem às consultas e pacientes da demonstração.
- [ ] Abrir e fechar a lista mensal de aniversariantes, inclusive com leitor de tela e lista maior que a área disponível.
- [ ] Validar carregamento, erro com nova tentativa, estado sem pacientes, sem consultas e sem aniversariantes usando os cenários de desenvolvimento.
- [ ] Conferir nome longo, iniciais, ausência de especialidade/registro e ausência de foto, sem cortes nem valores “undefined”/“null”.
- [ ] Validar em celular pequeno e tela maior, fonte ampliada e temas claro/escuro; conferir rolagem, contraste, foco e áreas de toque.
- [ ] Confirmar que a barra inferior não cobre o conteúdo e respeita as áreas seguras em Android/iOS disponíveis.
- [ ] Tentar acesso direto às quatro rotas como paciente ativo, paciente pendente, usuário desconectado e perfil desativado; confirmar bloqueio/redirecionamento.
- [ ] Confirmar que login e navegação do paciente continuam funcionando como antes.

### Critério de pronto

Tela inicial visualmente completa, quatro abas navegáveis, dados do próprio profissional tratados com autorização existente, demonstração explícita, estados e acessibilidade conferidos e verificações técnicas aprovadas. Testes humanos pendentes devem ser informados; navegação pronta não significa agenda, materiais ou integração com pacientes implementados.

## Riscos, dependências e decisões pendentes

- **Validação de escopo concluída:** o usuário autorizou a execução. A validação humana da implementação continua pendente.
- **Dependência de perfil:** sessão e RLS existentes precisam permitir ler o próprio perfil. Uma incompatibilidade deve ser relatada; não ampliar o escopo de banco silenciosamente.
- **Confusão entre demonstração e operação real:** identificar os blocos e nunca mostrar sucesso de envio ou salvamento inexistente. Na futura integração, substituir a fonte de dados e remover a indicação somente dos blocos efetivamente integrados.
- **Consistência visual:** a paleta fornecida difere do teal instalado. Preservar a identidade existente e centralizar adaptações, evitando alterações globais desnecessárias.
- **Fluxo futuro já definido pelo usuário:** agenda cadastrada pelo profissional no EntreLaços; link por consulta permite ao paciente confirmar ou recusar e atualiza a situação para o profissional. Canal de envio, abertura/autenticação do link, validade e persistência serão definidos na task correspondente, sem implementação agora.
- **Domínio futuro:** o prompt estético menciona vários profissionais por paciente, exames e protocolos. Esses pontos não alteram o constitution nesta task e dependem de decisão própria quando forem implementados.
- **Convenção de arquivo:** a skill de planejamento sugere data no nome, em conflito com o constitution. Prevalece o constitution: plano único com nome estável e sem data.

## Decisões da implementação

- Branch `feat/tela-inicial-profissional`, criada a partir de `origin/main` (`6eb0653`), preservando o plano local. A base já havia migrado para Expo 57 e adicionado o tema de login; não houve migração de versão nesta task.
- Além do guard do layout profissional, a raiz usa `Stack.Protected` para retirar a área profissional do navegador quando o papel não é autorizado. Isso evita ciclos de redirecionamento entre índices de grupos e mantém a proteção comum às quatro abas.
- O Sheet usa o driver já incluído em `@tamagui/config/v5-rn` e um Modal do React Native para foco/fechamento pelo sistema. Nenhuma dependência nova do aplicativo.
- O hook web de tema foi ajustado para acompanhar `matchMedia` por `useSyncExternalStore`, mantendo snapshot claro durante renderização estática.
- Cenários de demonstração podem ser selecionados pela variável opcional `EXPO_PUBLIC_PROFESSIONAL_SCENARIO` ou pelo parâmetro `scenario`, somente em desenvolvimento.
- A documentação autorizada pelas instruções do projeto registra o funcionamento e a validação em `ia/documentation/features/tela-inicial-profissional.md`; a base compartilhada recebeu um link para esse registro.
- Backend sem alterações: `npm ci` recompôs dependências locais; typecheck, build e smoke HTTP 404/401/204 passaram. Nenhuma migration ou operação real com pacientes foi executada.
