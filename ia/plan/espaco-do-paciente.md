# Task: Espaço do paciente

## Descrição objetiva

Criar um espaço privado de acompanhamento em que o paciente ativo envia PDFs
clínicos, registra check-ins e recados assíncronos para a próxima sessão,
visualiza todo conteúdo liberado pelo profissional e recebe uma mensagem de
aniversário personalizada quando houver.

## Objetivo e resultado esperado

Paciente e profissional vinculados ativamente conseguem trocar informações de
acompanhamento sem criar chat: o paciente publica recados e check-ins para o
vínculo, envia PDFs privados que o profissional autorizado pode consultar, e
vê orientações, materiais, agenda e mensagens de aniversário permitidas.

## Escopo incluído

- Upload de PDF de exame, laudo, diagnóstico ou outro documento de apoio pelo
  paciente, com título, categoria, tamanho máximo de 10 MB e acesso privado.
- Mural assíncrono de recados para a próxima sessão, criado pelo paciente e
  visível ao profissional do vínculo; não há respostas em thread ou presença
  em tempo real.
- Check-in de sentimento com nota curta, gravado pelo paciente e visível ao
  profissional do vínculo.
- Mensagem de aniversário: texto padrão no app e personalização opcional pelo
  profissional para um paciente. A mensagem personalizada tem precedência na
  data de aniversário do paciente.
- Área do paciente para documentos enviados, mural, check-ins e visão unificada
  dos conteúdos que o profissional já compartilha.
- Ajuste da área profissional para visualizar documentos, check-ins e recados
  do paciente e editar a mensagem de aniversário.
- Migration, RLS, bucket privado, backend, contratos, telas e validações.

## Fora do escopo

- Chat, respostas a recados, presença, notificações push/e-mail/WhatsApp e
  automações de aniversário fora da abertura do app.
- Imagens, vídeos, áudio e tipos de arquivo além de PDF; documentos acima de
  10 MB; exclusão física do Storage ou dos dados de domínio.
- Diagnóstico, prescrição, interpretação de exames, prontuário regulado,
  orientação de emergência, integrações externas e compartilhamento público.
- Encerramento de vínculo, múltiplos profissionais simultâneos como regra de
  produto ou alteração do fluxo de convites.

## Decisões de dados e autorização

- Reutilizar `profiles`, `patient_profiles`,
  `patient_professional_relationships`, `professional_materials` e
  `patient_material_shares` para identidade, associação e conteúdo já
  compartilhado.
- Criar `patient_documents`, `patient_messages`, `patient_check_ins` e
  `professional_birthday_messages`. Cada registro pertence a uma associação
  ativa, tem `status`, timestamps e não pode ser removido fisicamente.
- `patient_documents` armazena apenas metadados mínimos e caminho opaco no
  bucket privado `patient-documents`; o PDF segue por URL assinada de upload
  emitida pelo backend. O backend confirma o objeto antes de registrar o
  metadado e gera URL de leitura por até 60 segundos.
- Paciente ativo cria e lê somente seus documentos, recados e check-ins do
  vínculo ativo; profissional ativo lê esses itens exclusivamente nas próprias
  relações ativas. Somente o profissional cria/altera sua personalização de
  aniversário. Usuário pendente, sem vínculo, inativo ou anônimo não lê nem
  grava nenhum destes dados.
- Um check-in é um registro cronológico, não um diagnóstico. Um recado não é
  conversa: não há resposta, edição posterior ou alerta de entrega. A tela
  deve dizer isso explicitamente.
- A mensagem padrão de aniversário será uma constante de interface. Quando a
  data local do paciente coincide com mês e dia de `patient_profiles.birth_date`,
  a API retorna a personalização ativa, se existir; caso contrário, a tela usa
  a mensagem padrão. Não há consulta ampla de datas de nascimento no frontend.

## Camadas afetadas

- **Constitution:** registrar explicitamente PDFs clínicos privados e mural
  assíncrono como extensão aprovada do MVP, mantendo limites de segurança.
- **Supabase/banco:** migration com tabelas, constraints, índices, triggers,
  RLS e bucket privado; sem aplicação local ou remota sem autorização.
- **Backend:** rotas autenticadas, validação de UUID, conteúdo e MIME/tamanho,
  autorização por associação e URLs assinadas.
- **Frontend:** contratos, rotas protegidas de paciente, visualização no
  detalhe profissional e atalhos da home.
- **Documentação:** somente se solicitada explicitamente após a implementação.

## Plano

- [x] Atualizar o constitution para registrar a decisão de escopo e segurança.
- [x] Criar migration versionada para documentos, mural, check-ins e mensagens
  de aniversário, incluindo RLS, bucket privado e policies de Storage.
- [x] Criar serviços e rotas backend com autenticação, validação, minimização
  de logs, paginação e emissão de URLs assinadas.
- [x] Estender contratos do frontend e implementar as rotas do paciente com
  loading, erro, vazio, envio com progresso e prevenção de duplo envio.
- [x] Integrar o detalhe do paciente na área profissional para ler conteúdo
  autorizado e editar a mensagem de aniversário.
- [x] Atualizar a home do paciente para links reais e aviso de aniversário.
- [x] Validar typecheck e build do backend, typecheck do frontend e
  migration/RLS local; lint/build web do Expo permanecem bloqueados pelo Node
  18 interno do CLI.
  migration/RLS local sem aplicar banco e revisar o diff.

## Experiência e acessibilidade

- Reutilizar Tamagui, `AppScreen`, `AppHeader`, `AppCard`, `AppInput`,
  `BrandButton` e `FeedbackState`, com tokens semânticos.
- Garantir alvos de 44 px, labels, foco, mensagens de estado anunciáveis,
  fonte ampliada, teclado, telas estreitas e tema claro/escuro.
- Separar visualmente o conteúdo que o paciente envia do conteúdo que recebe,
  sem prometer leitura imediata ou atendimento fora da sessão.

## Validação e critério de pronto

- [ ] Paciente ativo envia apenas PDF até 10 MB e enxerga somente seus próprios
  documentos; arquivo inválido, grande ou upload interrompido falha de forma
  recuperável.
- [ ] Profissional A lê somente documentos, mural e check-ins dos seus
  pacientes ativos; profissional B, paciente alheio, pendente e anônimo não
  obtêm dados ou URLs assinadas.
- [ ] Recado e check-in são persistidos uma vez, respeitam limites e aparecem
  no detalhe correto; não há endpoint de resposta ou chat.
- [ ] Personalização de aniversário aparece somente na data de nascimento e
  substitui a mensagem padrão; fora da data, nada é exposto.
- [ ] Paciente continua acessando apenas agenda, orientações e materiais que
  lhe foram compartilhados, além do conteúdo próprio autorizado.
- [ ] Typecheck, testes, lint/build disponíveis e validação de migration/RLS
  são executados; nenhum segredo, conteúdo clínico ou URL assinada aparece em
  logs ou fixtures.

## Checklist de testes manuais

- [ ] Enviar PDF válido e inválido como paciente ativo; testar acima de 10 MB,
  MIME/extensão forjados, interrupção e nova tentativa.
- [ ] Abrir documento com paciente, profissional vinculado e outro profissional;
  confirmar expiração da URL e ausência de bucket público.
- [ ] Criar check-in e recado, conferir a listagem no profissional e a ausência
  de controles de chat/resposta.
- [ ] Definir, editar e limpar mensagem de aniversário; testar aniversário hoje
  e uma data diferente com e sem personalização.
- [ ] Conferir paciente pendente, sem vínculo, inativo e sessão encerrada.
- [ ] Conferir leitor de tela, foco, toque, fonte ampliada, teclado e layout em
  Android, iOS e web.

## Riscos, dependências e decisões pendentes

- PDFs clínicos são dados altamente sensíveis: o uso real exige política de
  retenção, consentimento, revisão jurídica/LGPD e operação segura além do
  escopo acadêmico. O MVP deve minimizar metadados e nunca registrar conteúdo
  ou URLs nos logs.
- O Storage gratuito continua limitado. PDFs de paciente usam 10 MB por arquivo
  e não possuem remoção física automática; cota e retenção devem ser definidas
  antes de produção.
- O produto ainda não define múltiplos profissionais ativos. Todas as novas
  entidades pertencem à relação para não vazar dados se essa decisão evoluir.
