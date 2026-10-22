# Pacientes encerrados e desempenho

Atualizado em 2026-10-22. Implementado e validado localmente; publicação em andamento.

## Funcionamento

Em Pacientes, o profissional alterna Ativos e Encerrados e pesquisa por nome.
A ficha oferece Encerrar acompanhamento e confirmação explícita. Consultas
futuras ou em andamento precisam ser canceladas antes (resposta 409 com orientação).
O vínculo passa a ended com ended_at, mantendo status=0 e todos os registros.
O encerramento repetido é idempotente. A ficha encerrada é somente leitura:
observações, consultas, documentos/PDFs, recados, check-ins, materiais e linha do
tempo continuam disponíveis ao profissional original. Um novo atendimento exige
convite e aprovação; o vínculo anterior permanece em Encerrados, inclusive se
outro profissional receber o novo vínculo. Não existe exclusão física ou exportador.

## Arquivos e autorização

- `frontend/app/(professional)/patients/index.tsx`: filtro por estado e busca.
- `frontend/app/(professional)/patients/[relationshipId].tsx`: confirmação,
  leitura histórica e carregamento por seção.
- `frontend/lib/api.ts`: parâmetro state, POST de encerramento, paginação das
  observações e aquecimento inicial da API.
- `backend/src/auth.ts`: readableRelationship admite active/ended somente ao
  profissional proprietário. activeRelationship permanece obrigatório nas escritas.
- `backend/src/follow-up.ts`: GET patients?state=active|ended, POST
  /v1/professional/patients/:id/end e leituras históricas.
- `backend/src/patient-space.ts`: leitura histórica pelo profissional; paciente
  sem vínculo ativo não consegue consultar documentos, recados ou check-ins via API.

A API usa o cliente privilegiado somente após validar autenticação, perfil ativo,
perfil complementar e titularidade do vínculo. Nenhuma permissão direta no banco
foi ampliada. As migrations existentes já contêm relationship_status=ended e
ended_at. A migration `20261022000001_relationship_ending_guards.sql` adiciona
proteção transacional contra corrida entre encerramento e agendamento, usando
o advisory lock profissional existente; aplicada ao projeto remoto vinculado após dry-run que listou somente esse
arquivo. `supabase db lint --linked --level error` passou e o histórico remoto
confirmou a versão. Nenhum registro real foi
encerrado para testar. PDFs continuam privados, com URL assinada de 60 segundos.
Respostas da API usam Cache-Control: no-store.

## Desempenho

A ficha deixa de carregar oito recursos a cada abertura: a seção padrão carrega
identidade e observações (duas requisições para a primeira página). Registros
carrega identidade + documentos/recados/check-ins; as outras seções buscam apenas
seus dados. Paginação de observações não limita a consulta às primeiras 30 linhas.
Trocas rápidas/saída da tela invalidam respostas antigas; a seção selecionada
não pode ficar presa em loading ao ser pressionada novamente. Atualização
periódica busca somente a seção visível após concluir a consulta anterior.

A autenticação da API compartilha apenas validações simultâneas do mesmo token,
indexadas por SHA-256, sem cache persistente de acesso. Perfil principal e
complementar são consultados juntos. A entrada do aplicativo chama GET /health
uma vez para iniciar a conexão antes da área autenticada, sem polling permanente.
O health também expõe a revisão de deploy via RENDER_GIT_COMMIT, quando disponível.

Variáveis existentes: EXPO_PUBLIC_API_URL, EXPO_PUBLIC_SUPABASE_URL,
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY; no backend SUPABASE_URL,
SUPABASE_SECRET_KEY e CORS_ORIGIN. Nenhum segredo no frontend ou neste documento.

## Validação

13 testes do backend passaram, incluindo 11 novos cenários de encerramento,
isolamento, preservação, idempotência, consultas futuras, bloqueio de escrita,
paciente sem vínculo, revogação de perfil e deduplicação concorrente.
A prévia web com serviços e conta fictícios confirmou: manter acompanhamento,
confirmar encerramento, remover de Ativos, listar em Encerrados, manter observação
e histórico legíveis e esconder ações de escrita. Clicar na seção já selecionada
não travou o carregamento.

22 testes do frontend passaram; TypeScript nas duas camadas, ESLint e exportação
web passaram. A consulta de perfis com relacionamentos foi validada no Supabase
remoto com UUID inexistente, sem leitura de dados de pacientes.

A instalação de Node herdada pelo npm aponta para Node 18 em uma pasta ancestral.
Para validação do Expo foi usado diretamente o executável Node 22 da instalação
nvm, com ESLint, testes e exportação; não alterar dependências para contornar isso.

## Limites e manutenção

O cold start da hospedagem ainda pode afetar a primeira chamada. Reduzir consultas
não garante um tempo fixo em rede móvel. Não houve troca de plano de hospedagem.
O encerramento e a criação/reagendamento de consultas usam o mesmo advisory
lock no banco. O trigger de consultas revalida o vínculo depois de adquirir esse
lock. Não apresentar o teste com fixtures como teste
integrado de concorrência do PostgreSQL. Reteste com contas de homologação e em
Android/iOS está na checklist humana do plano.
