# Reteste do perfil paciente — Aline

**Atualizado em:** 2026-10-14. **Estado:** aguardando execução no site publicado após o deploy desta revisão. O relatório `TCC Testes.pdf` marcou A02–A07, N01–N08, N10, V01 e V02 como OK; N09 não foi testado. A01 apontou contraste ruim no hover de **Criar minha conta**. Os itens abaixo concentram as correções e a única lacuna, sem repetir toda a rodada aprovada.

## Preparação

- Usar contas de teste e dados fictícios, sem conteúdo clínico real. Não incluir e-mail, senha, token, código de convite ou conteúdo de PDF em capturas e relatórios.
- Testar em desktop e largura de celular. Anotar **OK / Falhou / Não testado**, navegador, dispositivo e data/hora. Em falhas, registrar passos, resultado esperado e obtido.

## Reteste prioritário

- [ ] **A01 · Botão inicial.** Sem sessão, abrir `/`, passar o mouse sobre **Criar minha conta**, focar com o teclado e clicar. **Esperado:** texto e seta continuam legíveis em repouso, hover, foco e clique; abre `/cadastro`.
- [ ] **A08 · E-mail já usado.** Em `/cadastro`, tentar um e-mail de uma conta de teste existente sem usar dados pessoais reais. **Esperado:** o app não afirma que criou outra conta nem promete envio de e-mail; explica que a solicitação foi recebida e oferece **Entrar** e **Recuperar senha**. O Supabase pode ocultar a existência da conta deliberadamente, portanto não exigir aviso explícito de duplicidade. Não repetir tentativas em sequência para evitar limite de e-mails.
- [ ] **A09 · Nome com espaços.** Digitar um nome fictício com espaços no início, fim e entre as palavras; sair do campo. **Esperado:** o campo mostra o nome normalizado. Em cadastro novo autorizado para teste, o perfil criado também não contém esses espaços extras.
- [ ] **A10 · Sair da conta antes do vínculo.** Entrar com paciente de teste sem vínculo e depois com vínculo pendente. Em ambas as telas, observar **Sair da conta** sem hover, com hover e usando teclado; clicar. **Esperado:** botão, ícone e texto visíveis em todos os estados, área de toque confortável e retorno ao login.
- [ ] **N09 · Erros de rede, ainda não testado.** Com instabilidade controlada, abrir agenda, materiais e documentos. **Esperado:** carregamento, erro e nova tentativa são claros; falha temporária não parece lista vazia nem apaga silenciosamente conteúdo já exibido. Não alterar o banco para simular erro.

## Regressão curta

- [ ] Atualizar `/cadastro`, `/login`, `/minha-agenda`, `/meus-materiais` e `/space` no navegador. A rota e a sessão devem permanecer corretas na mesma aba. Conferir que o paciente vê apenas os materiais compartilhados com seu vínculo.
- [ ] Confirmar uma consulta de teste, abrir um material compartilhado e sair por **Meu espaço**. As ações continuam funcionando após o ajuste visual compartilhado dos botões.

Registrar a quantidade de itens **OK**, **Falhou** e **Não testado**. A exportação web e os testes automatizados validam código e rotas, mas não substituem o reteste autenticado com o Supabase remoto.
