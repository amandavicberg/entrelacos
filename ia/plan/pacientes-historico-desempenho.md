# Pacientes encerrados e desempenho

## Escopo e decisão

Reduzir espera na ficha e consultas redundantes; encerrar vínculo por ação explícita
com confirmação, separar ativos/encerrados e consultar histórico encerrado somente
pelo profissional responsável. Publicar frontend/backend e registrar validações.
Fora do escopo: apagar dados, transferir histórico a outro profissional, exportação
clínica, mudar hospedagem paga ou adicionar dependências.

Reutilizar patient_professional_relationships (relationship_status, ended_at,
approved_at, status), observações, consultas/eventos, materiais, documentos,
recados e check-ins. Encerramento altera somente estado e data do vínculo,
preserva status=0 e todos os registros. Sem tabelas/colunas novas:
a API privilegiada valida autoria; RLS direta permanece restritiva. Leituras
históricas usam autorização própria; escritas continuam exigindo vínculo ativo.
Paciente sem vínculo ativo permanece bloqueado, inclusive nas APIs de registros.
Retorno ocorre por novo convite; vínculo anterior permanece em Encerrados.
Consultas futuras do vínculo encerrado não devem bloquear a agenda: impedir
encerramento enquanto houver consultas futuras agendadas, orientando cancelar.

Migration 20261022000001_relationship_ending_guards.sql serializa encerramento
e agendamento com o advisory lock profissional existente. Não altera RLS ou dados.
Publicação solicitada inclui aplicar essa proteção após dry-run do CLI.

## Plano

- [x] Ler constitution, instruções, skills e documentação do Expo SDK 57.
- [x] Inspecionar consultas, domínio existente e criar branch da main atualizada.
- [x] Implementar encerramento e leitura histórica com autorização e confirmação.
- [x] Carregar ficha por seção; eliminar validações simultâneas duplicadas sem cache de autorização persistente.
- [x] Validar testes de autorização, TypeScript, lint e build.
- [x] Validar/aplicar migration de proteção da agenda.
- [x] Documentar funcionamento real e limites.
- [ ] Publicar e verificar deployments.

## Validação e riscos

Testes automatizados com dados fictícios: proprietário/outro profissional,
paciente/desativado, encerramento repetido, histórico e proibição de escrita,
consultas futuras e concorrência de carregamento. Não usar dados clínicos reais.
Primeira conexão da hospedagem pode continuar sujeita a cold start.

## Testes humanos

- [ ] Confirmar/cancelar encerramento; paciente sai de Ativos e aparece em Encerrados.
- [ ] Abrir todas as seções históricas e PDF; conferir ausência de ações de escrita.
- [ ] Retornar com novo convite e consultar vínculo anterior em Encerrados.
- [ ] Confirmar bloqueio do paciente sem vínculo e isolamento entre profissionais.
- [ ] Testar erro de rede, lista vazia, busca, teclado, fonte ampliada e celular.
- [ ] Comparar abertura e troca das seções com a versão anterior.
