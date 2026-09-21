# Revisão inicial e saneamento

## Objetivo

Consolidar a etapa inicial do EntreLaços removendo resíduos do template Expo,
implementando a recuperação de senha prevista na jornada pública, corrigindo
documentação divergente e registrando as limitações reais do MVP.

## Escopo

- Remover componentes, tema, assets, script e README remanescentes do template
  Expo que não possuem consumidores no aplicativo.
- Implementar solicitação de recuperação de senha pelo Supabase, com estados
  de envio, erro e sucesso; preservar o redirecionamento seguro para o esquema
  `entrelacos`.
- Atualizar a tela pública de recuperação para não comunicar uma funcionalidade
  inexistente.
- Corrigir a documentação de entrada e de configuração para refletir os
  endpoints, autenticação, vínculo por convite e limitações atuais.
- Validar TypeScript, testes disponíveis, lint e build quando a versão de Node
  do ambiente permitir.

## Fora do escopo

- Criar registros clínicos, agenda, materiais ou qualquer tabela nova de
  acompanhamento.
- Aplicar migrations ou alterar banco local/remoto.
- Criar processo de credenciamento de profissionais; a necessidade ficará
  registrada como decisão de produto e segurança.
- Alterar regras de convite, associação ou RLS existentes.

## Camadas e autorização

- **Frontend:** tela pública de recuperação, `lib/registration.ts`, limpeza de
  arquivos sem uso e guias de execução.
- **Backend/Supabase:** sem mudança de endpoint ou migration. A recuperação é
  solicitada pelo cliente público ao Supabase e não deve revelar se o e-mail
  existe.
- **Autorização:** somente usuário desconectado acessa a tela; sessões válidas
  são redirecionadas para a área correspondente. O fluxo não libera dados nem
  muda associação paciente-profissional.

## Plano

- [x] Revisar código, rotas, migrations, referências e validações existentes.
- [x] Remover resíduos sem consumidores e referências associadas.
- [x] Implementar solicitação e conclusão de recuperação de senha com feedback acessível.
- [x] Atualizar documentação de funcionamento e instruções locais.
- [x] Executar validações e revisar o diff.

## Validação

- [x] `backend: npm run typecheck && npm run build`.
- [x] `frontend: npm run typecheck`.
- [x] `frontend: node scripts/professional-dashboard.test.mjs`.
- [x] `frontend: npm run lint` com Node 22, invocando o CLI do Expo diretamente.
- [ ] `frontend: npm run build` com Node 22: o Metro iniciou, mas permaneceu sem conclusão no ambiente de execução após 90 segundos.

## Testes manuais (responsável pelo projeto)

- [ ] Solicitar recuperação com e-mail válido e confirmar mensagem neutra de
  envio, sem expor a existência da conta.
- [ ] Confirmar que o link recebido abre o aplicativo pelo esquema
  `entrelacos` após configurar a URL de redirecionamento no Supabase.
- [ ] Confirmar que usuário autenticado não acessa a recuperação e é
  redirecionado ao seu espaço permitido.
- [ ] Conferir fonte ampliada, leitor de tela, foco e toque na tela de
  recuperação em Android e iOS.
- [ ] Executar lint e export web usando Node 22.

## Riscos e decisões pendentes

- O Supabase precisa autorizar o esquema `entrelacos` nas URLs de
  redirecionamento e ter e-mail habilitado; sem isso, o envio falhará ou o
  retorno não abrirá o app.
- O retorno por deep link suporta o token implícito e o código PKCE fornecidos
  pelo Supabase, mas ainda requer confirmação manual em Android e iOS com o
  projeto configurado.
- O cadastro aberto de profissionais precisa de uma decisão de produto sobre
  verificação/credenciamento antes de qualquer uso real.
