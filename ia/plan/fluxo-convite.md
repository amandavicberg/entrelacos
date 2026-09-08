# Task: Geração de código de convite

## Nome da task

`fluxo-convite`

## Descrição objetiva

Implementar a geração server-side do código de acesso e uma interface
provisória mínima para testar o vínculo paciente-profissional. O endpoint deve
validar a identidade e o papel do profissional, gerar um código aleatório de
uso único e expiração, persistir apenas seu digest e devolver o código original
uma única vez. A mesma interface permitirá aprovar solicitações pendentes para
que o paciente consiga testar a home.

## Objetivo e resultado esperado

O backend deverá oferecer uma operação autenticada que permita ao futuro
dashboard profissional solicitar um convite. Nesta task haverá somente uma
seção provisória na tela placeholder do profissional, sem redesenho do
dashboard. Ela permitirá gerar o código, visualizar sua validade, listar
solicitações pendentes e aprovar uma relação.

## Escopo incluído

- Validar bearer token com Supabase Auth.
- Confirmar que o usuário autenticado possui `profiles.role = professional`,
  `profiles.status = 0` e `professional_profiles.status = 0`.
- Gerar código com fonte criptograficamente segura, em formato curto e legível.
- Normalizar o código para consumo sem diferenciação entre maiúsculas e
  minúsculas.
- Persistir o digest SHA-256, validade, profissional responsável e `status = 0`
  em `professional_invites`.
- Retornar o código original e sua validade somente na resposta da criação.
- Listar solicitações `pending` do profissional autenticado.
- Aprovar uma solicitação própria, preenchendo `approved_at` e mudando o estado
  para `active`.
- Não registrar código, token, senha ou dados pessoais em logs.
- Adicionar métodos mínimos em `frontend/lib/api.ts` e uma seção provisória na
  tela profissional, sem redesenhar a área profissional.
- Reutilizar o endpoint existente de consumo do paciente sem alterá-lo.

## Fora do escopo

- Redesenhar `frontend/app/(professional)/index.tsx` ou criar o dashboard
  profissional definitivo.
- Listar, revogar, cancelar ou editar convites.
- Aprovar relações `pending` ou concluir a associação paciente-profissional.
- QR Code, envio automático por e-mail, WhatsApp, SMS ou push.
- Múltiplos profissionais ativos por paciente.
- Alteração da home ou da tela de pendência do paciente.
- Criação de tabela nova, aplicação direta de SQL ou aplicação de migration
  remotamente sem autorização explícita.

## Decisão de dados e autorização

- Reutilizar a tabela `professional_invites` da migration
  `20260823_000001_identity_and_relationships.sql`; nenhuma entidade nova é
  necessária.
- O código será gerado no backend com `crypto.randomBytes` e persistido apenas
  como digest SHA-256. A resposta conterá o código em texto puro uma única vez.
- A validade inicial será de 7 dias, documentada como decisão operacional desta
  task até que o produto defina outro prazo.
- Não será aplicado limite de convites ativos nesta task; essa regra permanece
  decisão futura do produto.
- O backend usará a chave secreta somente server-side e validará o token antes
  de qualquer operação privilegiada.
- Pacientes, profissionais desativados, usuários não autenticados e usuários
  com papel divergente devem receber erro sem acesso à operação.
- Não haverá mudança de RLS: a inserção ocorre no backend com cliente
  privilegiado após validação explícita do profissional.

## Camadas afetadas

- **Frontend:** `frontend/lib/api.ts` e seção provisória na tela profissional;
  sem redesenho da área.
- **Backend:** endpoints autenticados para gerar, listar pendências e aprovar;
  validação server-side e geração segura do código.
- **Supabase/banco:** reutilização da tabela e constraints existentes; nenhuma
  migration prevista.
- **Documentação:** este plano; nenhuma documentação funcional automática.

## Plano

### 1. Preparação e contrato

- [x] Ler constitution, skill de planejamento e instruções/documentação da
  base.
- [x] Inspecionar migrations de identidade/convite, cliente Supabase, servidor
  e cliente de API existentes.
- [x] Restringir o escopo à geração e aprovação provisórias, sem redesenho da
  tela profissional.
- [x] Definir formato do código e validade inicial de 7 dias.

### 2. Backend

- [x] Implementar geração criptograficamente segura e digest SHA-256.
- [x] Implementar validação do bearer token, perfil profissional ativo e
  perfil complementar ativo.
- [x] Implementar inserção em `professional_invites` e resposta mínima com
  código e expiração.
- [x] Garantir tratamento de erro sem exposição de detalhes internos ou do
  código persistido.
- [x] Implementar listagem e aprovação protegidas das relações `pending`.

### 3. Contrato frontend futuro

- [x] Adicionar método autenticado em `frontend/lib/api.ts` para solicitar a
  geração do convite.
- [x] Adicionar métodos de listagem/aprovação em `frontend/lib/api.ts`.
- [x] Adicionar seção provisória de geração e aprovação na tela placeholder,
  sem refatorar o dashboard profissional.

### 4. Validação e entrega

- [x] Executar typecheck/build do backend, typecheck/lint do frontend e
  `git diff --check`.
- [x] Validar respostas e logs sem segredos ou código persistido em texto puro.
- [x] Atualizar os itens executados conforme cada etapa for concluída.

## Arquivos e módulos prováveis

- `backend/src/server.ts`: rota autenticada e geração do convite, ou módulo
  auxiliar se a separação melhorar a manutenção.
- `backend/src/config/supabase.ts`: reutilização do cliente server-side.
- `frontend/lib/api.ts`: método de contrato para integração futura.
- `supabase/migrations/20260823_000001_identity_and_relationships.sql`:
  referência da tabela existente; não alterar nesta task.

## Migration necessária

Não prevista. A tabela `professional_invites` já possui `code_digest`,
`expires_at`, `used_at`, `revoked_at`, `professional_id`, `status` e as
constraints necessárias para o código de uso único e expiração. A inserção será
feita pelo backend, sem alteração direta no banco.

## Validação e critérios de pronto

- [ ] Profissional ativo autenticado recebe código e `expiresAt`.
- [ ] Código retornado não é igual ao digest armazenado.
- [ ] Convite fica vinculado ao `professional_id` autenticado e com `status = 0`.
- [ ] Paciente, usuário sem sessão, profissional desativado ou papel divergente
  não consegue gerar convite.
- [x] A tela profissional só recebeu a seção provisória prevista, sem
  refatoração do dashboard.
- [ ] Nenhum token, senha, código ou dado sensível aparece em logs.
- [x] Validações automatizadas passam.

## Checklist de testes manuais

- [ ] Chamar o endpoint com bearer token de profissional ativo e confirmar
  código e validade.
- [ ] Confirmar que o código pode ser usado pelo endpoint de consumo existente.
- [ ] Chamar com token de paciente e confirmar rejeição.
- [ ] Chamar sem token, com token inválido e com profissional desativado.
- [ ] Confirmar que duas gerações produzem códigos diferentes.
- [ ] Conferir a validade de 7 dias e a ausência do código em logs/respostas
  posteriores.
- [ ] Confirmar que a tela profissional só possui a seção provisória prevista,
  sem refatoração do dashboard.

## Riscos, dependências e decisões pendentes

- A seção provisória poderá ser substituída pelo dashboard profissional em uma
  task futura, mantendo os contratos server-side já definidos.
- A validade de 7 dias é provisória e deve ser confirmada pelo produto.
- O limite de convites ativos e os fluxos de revogação/aprovação serão tratados
  em tasks futuras.
- O backend depende das migrations já aplicadas no ambiente em que for
  testado; nenhuma migration remota será aplicada nesta task.
