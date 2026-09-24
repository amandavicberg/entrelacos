# Task: Acompanhamento profissional e paciente

## Descrição objetiva

Concluir a área profissional do EntreLaços com uma lista autorizada de
pacientes, prontuário de acompanhamento por paciente (observações e histórico),
agenda com confirmação ou cancelamento pelo paciente e materiais individuais.
O paciente terá acesso somente de leitura aos conteúdos compartilhados e poderá
confirmar ou cancelar seus próprios agendamentos.

## Objetivo e resultado esperado

Um profissional ativo consegue selecionar somente pacientes com associação
ativa, registrar e consultar o acompanhamento daquele vínculo, marcar consultas
e disponibilizar materiais. O paciente ativo vê apenas seu próprio conteúdo,
confirma ou cancela suas consultas e nunca altera observações, agenda ou
materiais.

## Escopo incluído

- Substituir a aba profissional de pacientes pela lista real de pacientes com
  associação `active` e busca local por nome; exibir apenas identidade mínima.
- Criar detalhe protegido do paciente para concentrar resumo, observações,
  histórico cronológico, agenda e materiais compartilhados naquele vínculo.
- Permitir ao profissional criar observações com data e, quando necessário,
  corrigir preservando versão; não expor notas privadas ao paciente.
- Construir histórico cronológico a partir de observações, criação/alteração de
  agenda, confirmações/cancelamentos e compartilhamentos de materiais.
- Permitir ao profissional criar, reagendar e cancelar consultas; o paciente
  ativo confirma ou cancela somente consultas do próprio vínculo.
- Permitir ao profissional cadastrar materiais por link externo (e-book,
  podcast e vídeo) e fazer upload de PDF e áudio para um bucket privado;
  associar o material a um ou mais pacientes ativos.
- Implementar as telas de leitura do paciente para agenda, observações
  compartilhadas e materiais, retirando os atalhos correspondentes do estado
  “em breve”.
- Criar migrations versionadas para entidades, índices, constraints, RLS e
  policies; preparar e validar, mas não aplicar em banco sem autorização
  expressa.

## Fora do escopo

- Chat, anexos enviados pelo paciente, notificações por push/e-mail/WhatsApp,
  prescrição, pagamento, teleconsulta e compartilhamento público de arquivos.
- Upload de vídeo, imagens, arquivos clínicos/exames ou mídia sem limite.
- Exclusão física de dados, revogação/encerramento de vínculos e mudança da
  regra de convite.
- Integrações com calendários externos e disponibilidade/recorrência de agenda.
- Diagnóstico, prescrição, prontuário médico regulado ou qualquer garantia de
  atendimento de emergência.

## Decisões de produto e dados

### Reuso e novas entidades

- Reutilizar `profiles`, `patient_profiles`, `professional_profiles` e
  `patient_professional_relationships`. A lista usa somente relações ativas,
  o nome do paciente e, na tela individual, dados estritamente necessários.
- Criar `professional_observations`, vinculada a uma associação; cada entrada
  possui conteúdo, visibilidade (`professional` ou `patient`), data de
  ocorrência, autor, `status`, timestamps e versão. A correção gera uma nova
  versão e preserva a anterior inativa para não apagar o histórico.
- Criar `appointments`, vinculada à associação, com início/fim, status de
  agendamento e estado de resposta do paciente; cancelamento deve registrar
  quem cancelou, quando e motivo opcional limitado. Criar
  `appointment_events` somente para registrar transições imutáveis relevantes
  e permitir o histórico auditável.
- Criar `professional_materials` (catálogo do profissional: título,
  descrição, tipo, origem `external` ou `storage`, URL externa ou caminho
  privado, MIME, tamanho, status) e `patient_material_shares` (material,
  associação, data de compartilhamento, status). Assim, um material pode ser
  compartilhado com vários pacientes sem duplicar o arquivo.
- O histórico será uma composição no backend, ordenando observações visíveis ao
  profissional, eventos de agenda e compartilhamentos. Não criar uma tabela
  genérica de “histórico” que duplique dados e possa divergir da origem.

### Privacidade, autorização e RLS

- A associação `active` é a fronteira obrigatória de todos os registros. Cada
  consulta e escrita filtra a associação, o paciente e o profissional; um
  paciente com outro profissional não obtém dados deste vínculo.
- Profissional ativo: lê seus próprios pacientes ativos, cria/edita/inativa
  observações, agenda e materiais próprios, e compartilha somente com pacientes
  vinculados a ele.
- Paciente ativo: lê somente observações marcadas como compartilhadas, seus
  agendamentos e materiais que lhe foram compartilhados; pode apenas confirmar
  ou cancelar seus próprios agendamentos. Não cria, edita ou remove conteúdos
  profissionais.
- Profissional inativo, paciente sem vínculo, pendente, recusado, usuário
  inativo e não autenticado não têm leitura ou escrita nessas entidades.
- Todas as tabelas possuem `status smallint not null default 0` com constraint
  `status in (0, -1)`. Não haverá `DELETE` ou `ON DELETE CASCADE` para dados de
  domínio. Policies de Storage e banco devem seguir a mesma relação ativa.
- Observações serão privadas por padrão. A opção explícita “Compartilhar com o
  paciente” evita expor notas técnicas por engano; o profissional continua como
  único autor e editor.

### Arquivos e limite do Supabase gratuito

O Supabase Free atualmente inclui 1 GB de Storage e 5 GB de egress comum mais
5 GB em cache; o limite máximo de upload configurável no plano é 50 MB.
([preços](https://supabase.com/pricing),
[limites](https://supabase.com/docs/guides/storage/uploads/file-limits)). Para
preservar esse orçamento, o MVP adotará:

- bucket privado `professional-materials`, nunca público; download por URL
  assinada de curta duração emitida pelo backend depois da autorização. Buckets
  privados aplicam RLS e não expõem URL pública
  ([documentação](https://supabase.com/docs/guides/storage/buckets/fundamentals)).
- somente PDF e áudio compactado (`audio/mpeg`, `audio/mp4` ou `audio/aac`),
  com tamanho individual inicial de até 10 MB para PDF e 15 MB para áudio;
  bloqueio de MIME/extensão e conferência de tamanho antes da assinatura e no
  bucket. Vídeo, imagens e arquivos clínicos ficam fora desta etapa.
- priorizar URL externa para podcasts, vídeos e e-books já hospedados; o app
  armazena o link e seus metadados, não duplica mídia de terceiros no Storage.
- upload direto ao Storage com URL assinada de uso único, solicitada ao backend
  por profissional autorizado; o arquivo não atravessa o backend. O backend
  registra o material apenas após confirmar o objeto, e o frontend não recebe
  credencial privilegiada.
- caminho opaco com UUID (sem nome, e-mail ou dado de saúde), por exemplo
  `{professionalId}/{materialId}/{uuid}.pdf`; tamanho e tipo ficam nos
  metadados para controle de cota. Inativar material impede novas URLs; remoção
  física do objeto só será tratada em uma rotina administrativa futura, após
  política de retenção definida.
- tela administrativa de uso (quantidade e tamanho de materiais do próprio
  profissional), alerta preventivo configurável ao atingir 80% da cota de 1 GB
  e limites de paginação. O alerta é orientação, não uma medição global secreta
  exposta ao usuário.

## Camadas, módulos e fluxo de implementação

### 1. Modelo, migrations e policies

- [x] Modelar enums, tabelas, constraints, índices e triggers acima em uma ou
  mais migrations novas em `supabase/migrations/`.
- [x] Criar policies de leitura/escrita para banco e `storage.objects` usando
  a associação ativa e o proprietário do material; validar acessos cruzados e
  soft-delete.
- [x] Revisar o modelo contra múltiplos profissionais por paciente: todos os
  registros pertencem à associação, não somente ao paciente.
- [x] Validar a migration localmente e com lint, sem aplicá-la a ambiente local
  ou remoto sem autorização.

### 2. Backend e contratos

- [x] Extrair autenticação/autorização repetida de `backend/src/server.ts` em
  módulo próprio e criar rotas de pacientes, detalhe, observações, timeline,
  agenda, materiais, compartilhamentos e URLs assinadas.
- [x] Validar payloads, UUIDs, datas em ISO, intervalos de agenda, transições
  permitidas e tamanho/MIME; limitar corpo de requisição, paginação e erros
  públicos.
- [x] Manter logs sem conteúdo de observações, nomes, URLs assinadas, tokens ou
  metadados sensíveis; registrar somente códigos técnicos necessários.
- [x] Atualizar `frontend/lib/api.ts` com contratos tipados e sem colocar regras
  de autorização na interface.

### 3. Área profissional

- [x] Implementar lista de pacientes reais em `/(professional)/patients`, com
  loading, erro, vazio e busca acessível; remover os dados fictícios dessa aba.
- [x] Criar rota de detalhe protegida por paciente e componentes reutilizáveis
  para cabeçalho, timeline, observação, agenda e materiais.
- [x] Implementar criação/correção versionada de observações, escolha explícita
  de visibilidade e feedback de sucesso/erro.
- [x] Implementar calendário/lista de agenda, criação, reagendamento,
  cancelamento e apresentação clara dos estados de confirmação.
- [x] Implementar catálogo de materiais, formulário de link/upload, progresso,
  falha recuperável e compartilhamento por paciente selecionado.
- [x] Ajustar dashboard para que cartões e atalhos reflitam dados reais quando
  os endpoints estiverem disponíveis; remover a prévia demonstrativa somente
  daquilo que passou a ser real.

### 4. Área do paciente

- [x] Substituir os atalhos correspondentes por rotas protegidas de agenda,
  observações compartilhadas, histórico legível e materiais individuais.
- [x] Implementar confirmação/cancelamento de consulta com confirmação de ação,
  motivo opcional limitado e prevenção de duplo envio.
- [x] Garantir que estados sem associação ativa continuem restritos ao fluxo de
  conexão/pendência e não renderizem dados armazenados localmente.

### 5. Interface, acessibilidade e responsividade

- [x] Reutilizar Tamagui, `AppScreen`, `AppCard`, `AppHeader`, `BrandButton`,
  `AppInput`, `FeedbackState` e tokens semânticos existentes; não introduzir
  hexadecimais ou padrões paralelos.
- [x] Garantir alvo de toque mínimo de 44 px, labels para leitor de tela, foco,
  contraste, textos escaláveis, ordem de leitura e layouts de lista/calendário
  adaptados a telas estreitas e fonte ampliada.
- [x] Cobrir explicitamente loading, erro, vazio, sem permissão, upload em
  progresso, material indisponível e falha de conexão.

## Arquivos prováveis

- `supabase/migrations/*_professional_follow_up.sql` e migration de Storage/RLS;
- `backend/src/server.ts` e novos módulos de autenticação, validação e domínio;
- `frontend/lib/api.ts` e hooks de dados por feature;
- `frontend/app/(professional)/patients.tsx`, `agenda.tsx`, `materials.tsx` e
  novas rotas de detalhe do paciente;
- `frontend/app/(patient)/` e novas rotas protegidas de leitura;
- componentes em `frontend/components/professional/` e componentes de paciente
  apenas quando surgir padrão reutilizável;
- testes de domínio, API e componentes relevantes.

## Validação e critério de pronto

- [x] Typecheck, lint, build e testes disponíveis em frontend e backend;
  validação de migration/policies com Supabase local, sem aplicação remota.
- [ ] Testar que profissional A não lista nem acessa paciente, observação,
  consulta ou material de profissional B; testar paciente ativo, pendente,
  sem vínculo, inativo e anônimo.
- [ ] Testar transições de agenda: criar, confirmar, cancelar pelo paciente,
  cancelar pelo profissional, reagendar e tentativas repetidas/conflitantes.
- [ ] Testar upload aceito e recusado por MIME, extensão, limite e autorização;
  confirmar que URL assinada expira e que bucket não é público.
- [ ] Testar paginação, histórico ordenado, observação privada versus
  compartilhada, soft-delete e versão corrigida.
- [x] Revisar diff, logs e variáveis para garantir ausência de segredos e dados
  sensíveis desnecessários.

## Checklist de testes manuais

- [ ] Entrar como profissional ativo e confirmar que a lista contém apenas seus
  pacientes ativos, com busca, vazio, erro e fonte ampliada.
- [ ] Registrar uma observação privada e uma compartilhada; confirmar que o
  paciente só vê a compartilhada e não possui controles de edição.
- [ ] Criar, reagendar e cancelar consulta como profissional; confirmar e
  cancelar somente a própria consulta como paciente.
- [ ] Enviar PDF e áudio dentro do limite, vincular a um paciente e abrir como
  paciente autorizado; testar arquivo/tipo acima do limite e paciente alheio.
- [ ] Abrir a área com paciente pendente, sem vínculo e sessão encerrada; todos
  devem permanecer fora dos dados de acompanhamento.
- [ ] Verificar navegação por teclado/leitor de tela, foco, contraste, toque e
  responsividade em Android, iOS e web.

## Riscos, dependências e decisões pendentes

- A tarefa é ampla e deve ser implementada em incrementos: (1) migrations e
  lista/detalhe, (2) observações e timeline, (3) agenda, (4) materiais e
  paciente. Cada incremento só avança após validar autorização.
- Migrations anteriores ainda precisam estar aplicadas no ambiente destinado a
  testes. Esta task não autoriza aplicação em Supabase local ou remoto.
- O plano assume que notas privadas são necessárias por segurança; se toda
  observação precisar ser visível ao paciente, essa decisão deve ser confirmada
  antes da migration, pois altera RLS, UX e expectativa clínica.
- A hospedagem gratuita é adequada para PDFs e áudios curtos do MVP, não para
  biblioteca de podcasts/vídeos. A cota real deve ser monitorada no painel do
  Supabase e os links externos devem ser a opção padrão para mídia longa.
- O significado clínico, prazo de retenção e possibilidade de exportação de
  observações ainda requerem definição antes de qualquer uso além de demonstração
  acadêmica.
