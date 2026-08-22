---
name: project-documentation
description: Documentar o estado real do EntreLaços ao concluir uma task, registrando funcionamento, decisões, arquivos, integrações, limitações e manutenção futura.
metadata:
  short-description: Documentar tasks concluídas
---

# Documentação do EntreLaços

Use esta skill quando uma task estiver concluída, validada ou quando o usuário pedir a documentação do funcionamento atual do projeto. O objetivo é deixar contexto suficiente para corrigir bugs, alterar estruturas e retomar o desenvolvimento no futuro sem depender da memória da task.

## Regra principal

Leia `constitution.md` na raiz e o `AGENTS.md` mais específico da área alterada. Documente o comportamento que existe no código e nas migrations, não o comportamento desejado ou apenas planejado. Se algo não foi validado, marque como não validado ou pendente.

## Onde documentar

Prefira documentação versionada em `docs/`, organizada por assunto. Atualize um documento existente quando ele já cobrir a área; crie um documento específico apenas quando isso melhorar a localização da informação. Evite duplicar o constitution, o plano da task ou comentários óbvios do código.

Quando não houver uma estrutura de documentação definida para a área, use nomes claros como `docs/frontend.md`, `docs/backend.md`, `docs/database.md` ou `docs/features/<feature>.md`, conforme o conteúdo. A documentação deve apontar para arquivos reais do repositório usando caminhos relativos.

## Conteúdo obrigatório após uma task

Registre, conforme aplicável:

- nome e objetivo da task;
- status atual e data da atualização;
- comportamento implementado, incluindo fluxos principais e perfis afetados;
- telas, rotas, componentes, hooks, serviços e endpoints envolvidos;
- fluxo de dados entre frontend, backend e Supabase;
- tabelas, relacionamentos, RLS/policies e nome da migration — nunca afirmar que uma migration foi aplicada se ela apenas foi criada;
- variáveis de ambiente necessárias, somente pelos nomes e exemplos seguros;
- validações executadas e resultado;
- decisões técnicas e motivos relevantes;
- limitações conhecidas, riscos, débitos técnicos e melhorias futuras;
- passos de manutenção, diagnóstico ou extensão que sejam úteis.

Para funcionalidades com dados de saúde, registre também os limites de acesso por paciente/profissional e os casos de usuário não associado ou desativado.

## Regras de qualidade

- Não incluir segredos, tokens, valores reais de `.env`, dados de pacientes ou exemplos identificáveis.
- Não documentar funcionalidades futuras como se estivessem prontas.
- Não esconder erros de validação; registrar o comando, o resultado e o impacto.
- Não alterar o banco para documentar a estrutura; consultar o código/migrations e respeitar a regra de migrations do constitution.
- Explicar decisões de manutenção em linguagem objetiva, com links para arquivos e migrations reais.
- Se a task revelar uma divergência entre documentação, constitution e código, registrar a divergência e recomendar a correção adequada.

## Estrutura recomendada

Use, quando fizer sentido, as seções:

1. Visão geral
2. Funcionamento atual
3. Arquitetura e fluxo de dados
4. Autorização e segurança
5. Banco e migrations
6. Configuração
7. Validação
8. Limitações e próximos passos

Ao finalizar, revisar se outra pessoa conseguiria localizar o ponto de entrada, entender o fluxo e reproduzir o comportamento documentado sem precisar perguntar o contexto original.
