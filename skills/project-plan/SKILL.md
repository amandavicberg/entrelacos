---
name: project-plan
description: Planejar tarefas do EntreLaços a partir do constitution, cobrindo escopo, camadas afetadas, autorização, migrations e validação antes da implementação.
metadata:
  short-description: Planejar mudanças no EntreLaços
---

# Planejamento do EntreLaços

Use esta skill ao iniciar uma tarefa nova ou quando o usuário pedir um plano.

## Regra principal

Leia `constitution.md` na raiz do projeto antes de planejar e consulte o `AGENTS.md` mais específico do diretório alterado. O constitution é a fonte de verdade; conflitos devem ser declarados.

## Informações obrigatórias antes do plano

Sempre peça ao usuário que informe, confirme ou complete estes quatro itens antes de montar o plano:

- **Nome da task:** título curto e identificável.
- **Descrição objetiva:** o que precisa ser resolvido ou construído.
- **Escopo:** o que deve ser incluído nesta task.
- **Fora do escopo:** o que explicitamente não deve ser feito agora.

Se algum item estiver ausente ou vago, solicite somente as informações faltantes. Não iniciar o planejamento detalhado ou a implementação enquanto o escopo e o fora do escopo não estiverem claros.

## Plano obrigatório

Inclua objetivo/resultado; escopo incluído e excluído; camadas afetadas (`frontend`, `backend`, `Supabase/banco`, documentação); fluxo de autorização para paciente, profissional e não associado; arquivos/módulos prováveis; migration necessária; validações/critério de pronto; riscos, dependências e decisões pendentes.

Para tarefas de interface, inclua impacto no design system Tamagui, tokens/componentes reutilizados, acessibilidade, estados de carregamento/erro/vazio, responsividade e validação visual. Avalie a experiência do paciente e do profissional separadamente.

## Regras

- Não implementar nem alterar arquivos apenas por produzir um plano, salvo solicitação explícita de implementação.
- Não incluir funcionalidades futuras do TCC sem necessidade; marque-as fora do MVP.
- Mudanças persistentes exigem migration com RLS/policies e testes de autorização. Nunca planeje alteração direta no banco e nunca aplique migration sem autorização explícita.
- Para dados de saúde, inclua minimização, menor privilégio, tratamento de erro e revisão de logs.
- Se uma decisão essencial alterar o modelo de dados ou o acesso, declare-a pendente em vez de inventá-la.
- Pense como desenvolvedor sênior: antecipe problemas futuros, dívida técnica, manutenção e impactos entre camadas; registre sugestões de melhoria sem ampliar silenciosamente o escopo.

Use as seções “Plano”, “Validação” e, quando necessário, “Decisões pendentes”.
