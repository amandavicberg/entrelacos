# Lista e ficha de pacientes do profissional

**Atualizado em:** 2026-10-07. **Estado:** implementação validada na `main`.

## Funcionamento

- A rota `frontend/app/(professional)/patients/index.tsx` lista apenas vínculos ativos retornados pela API, permite busca por nome sem diferenciar acentos e abre a ficha tocando em qualquer ponto da linha. Exibe data de aprovação quando disponível, estados de carregamento, erro, lista vazia e busca sem resultado. A lista é atualizada ao receber foco sem substituir os dados já visíveis por um carregamento.
- A rota `frontend/app/(professional)/patients/[relationshipId].tsx` mostra a identidade do paciente, o próximo agendamento futuro quando houver e seis áreas: observações, consultas, registros enviados pelo paciente, materiais, histórico e mensagem de aniversário. Os botões de navegação se organizam em seis, três ou duas colunas conforme largura e escala de fonte. Os formulários de observação e consulta são abertos sob demanda, deixando os registros existentes visíveis primeiro. Após salvar, a atualização dos dados não substitui a ficha inteira por uma tela de carregamento.
- A ficha mantém correção versionada de observações, criação/reagendamento/cancelamento de consultas, compartilhamento de materiais, acesso a PDFs por URL assinada, leitura de recados e check-ins, histórico cronológico e gravação de mensagem de aniversário. A consulta é apenas exibida no resumo da ficha; sua gestão continua na área Consultas.

## Dados e acesso

As telas usam `frontend/lib/api.ts` e a sessão do `AuthProvider`. A lista consulta `GET /v1/professional/patients?limit=100`; a ficha busca o vínculo por ID e carrega observações, consultas, linha do tempo, materiais, documentos, recados e check-ins por endpoints existentes. O backend valida o papel profissional e o vínculo ativo. O guard em `frontend/app/(professional)/_layout.tsx` protege a navegação, mas a autorização de dados permanece no backend e nas policies do Supabase. Paciente, usuário sem vínculo ativo ou desativado não deve ter acesso à ficha profissional.

Esta revisão reutilizou as tabelas e endpoints já existentes. Não houve migration nem alteração de banco. Os dados exibidos podem conter informações de saúde; não são copiados para fixtures, logs ou documentação.

## Validação e manutenção

- Frontend: `tsc --noEmit`, lint, 18 testes de scripts e `expo export --platform web` passaram com Node 22.
- Prévia local: lista e ficha verificadas no navegador em largura desktop e 390 px; abertura da ficha, troca para Consultas e ausência de rolagem horizontal verificadas. Não foram criados, alterados ou excluídos registros reais durante a conferência visual.
- Ao alterar a ficha, preservar a associação entre `relationshipId` e cada chamada de dados. Ao acrescentar conteúdo clínico, conferir limites de acesso e estados de carregamento parcial.

**Limitação existente:** a API permite salvar a mensagem de aniversário, mas a ficha ainda não carrega a mensagem já salva para edição posterior. A revisão atual não alterou esse endpoint.
