# Reteste do perfil profissional — Gustavo

**Atualizado em:** 2026-10-14. **Estado:** aguardando execução no site publicado após o deploy desta revisão. No retorno mais recente, R02, R05, R08, R09, N01, N02, N05, N07, N08 e N10 foram marcados como OK; R04 e R06 ficaram a confirmar. Este roteiro prioriza as falhas e sugestões corrigidas desde então.

## Preparação

- Usar profissional e dois pacientes **de teste** com vínculos ativos. Criar apenas consultas, observações, recados e materiais fictícios; não incluir dados clínicos, e-mails, senhas, códigos ou tokens nas capturas.
- Executar em desktop e largura de celular. Para cada item, registrar **OK / Falhou / Não testado**, navegador e data/hora. Em falha, anotar passos, resultado esperado e obtido.

## Reteste prioritário

- [ ] **G01 · Rota Materiais.** Abrir `/materials` como profissional e atualizar a página. **Esperado:** continua em Materiais, com aba correta e sessão ativa, sem voltar ao início.
- [ ] **G02 · Histórico em português.** Criar, confirmar e cancelar consultas de teste. Abrir o histórico do paciente e a agenda. **Esperado:** eventos e estados aparecem em português, inclusive após recarregar.
- [ ] **G03 · Disponibilidade e pacientes do dia.** Cadastrar ou editar dias/horários de atendimento e selecionar um dia da semana que tenha vários pacientes agendados. **Esperado:** a tela permite ver todos os pacientes daquele dia, com horários e situação claros.
- [ ] **G04 · Horário ocupado.** Tentar reservar no mesmo horário já ocupado por outro paciente de teste. **Esperado:** a segunda reserva é recusada e uma mensagem de conflito bem visível indica como escolher outro horário; nenhum agendamento duplicado é criado.
- [ ] **G05 · Materiais por paciente.** Compartilhar um material com dois pacientes e deixar outro apenas na biblioteca. **Esperado:** a biblioteca mostra com quem o primeiro foi compartilhado; na ficha de cada paciente, Materiais mostra somente o que foi enviado a ele, sem expor o restante da biblioteca.
- [ ] **G06 · Ficha e observações.** Abrir uma ficha com várias observações de dias diferentes. **Esperado:** a primeira informação da ficha aparece sem esperar todas as listas; registros anteriores ficam agrupados por data de Brasília, com total por dia e horário em cada registro. Em celular, não há texto cortado ou rolagem lateral.
- [ ] **G07 · Aniversário.** Salvar mensagem fictícia para paciente cujo aniversário seja hoje. **Esperado:** campo fica limpo após confirmação e a mensagem aparece na home do paciente na data. Se a ficha não recarregar o texto salvo para edição posterior, registrar essa limitação separadamente.
- [ ] **G08 · Contraste geral.** Conferir botões primários e secundários no painel, agenda, pacientes e materiais, em repouso, hover, foco e clique. **Esperado:** texto sempre legível, estados reconhecíveis e área de toque confortável.

## Regressão curta

- [ ] Atualizar `/`, `/agenda`, `/patients`, `/materials` e uma ficha de paciente. Confirmar que a sessão e a rota persistem na mesma aba.
- [ ] Repetir convite, uma observação privada e outra compartilhada, confirmação de consulta, compartilhamento de material e abertura de PDF fictício do paciente. O paciente não pode receber conteúdo privado nem outro vínculo pode ver dados alheios.

Registrar a quantidade de itens **OK**, **Falhou** e **Não testado**. Testes de código e build não substituem estes cenários integrados com contas autorizadas.
