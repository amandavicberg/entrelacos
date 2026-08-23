# Constitution do EntreLaços

**Versão:** 1.3.0
**Status:** documento normativo do projeto  
**Última atualização:** 2026-08-23

Este documento é a fonte de verdade para decisões técnicas e de produto do EntreLaços. Toda nova tarefa deve começar pela leitura deste arquivo. Decisões que alterem arquitetura, domínio ou segurança devem atualizar o documento junto com a implementação.

## 1. Identidade e propósito

O EntreLaços é um aplicativo mobile para organizar o acompanhamento contínuo entre pacientes e profissionais de saúde. Seu foco é centralizar registros, observações, orientações e materiais de apoio que normalmente ficam dispersos em canais informais.

O produto deve favorecer uma comunicação organizada, acessível, humanizada e segura. Não substitui consulta, pronto atendimento, diagnóstico, prescrição ou serviço de emergência, e não deve ser tratado como um aplicativo genérico de mensagens instantâneas.

O projeto é um TCC do curso de Sistemas de Informação do UniFOA. O desenvolvimento combina PjBL, Lean Startup e ciclos de feedback/validação do MVP.

## 2. Usuários e autorização

Existem dois perfis principais, com acessos separados:

- **Paciente:** registra sua história, anotações, sintomas/evolução e observações relevantes; consulta orientações, materiais e histórico disponibilizados.
- **Profissional:** acompanha pacientes associados, visualiza registros permitidos, registra observações profissionais, organiza o histórico e compartilha materiais/orientações.

Cada usuário deve possuir exatamente um papel: `patient` ou `professional`. O
papel deve ser definido no perfil do usuário e não pode ser inferido apenas
pela existência de dados em uma tabela complementar.

Um paciente só acessa o aplicativo e os dados de acompanhamento depois de
possuir uma associação ativa com um profissional. A autenticação pode ser
concluída antes disso, mas um usuário sem associação ativa deve permanecer
restrito a uma tela de pendência/bloqueio, sem leitura ou escrita de dados do
produto.

A associação deve ocorrer por um fluxo explícito, auditável e iniciado por um
convite do profissional. A implementação inicial será feita por código de
convite com as seguintes regras:

- o profissional gera o código para convidar o paciente;
- o código deve ser aleatório, de uso único e possuir expiração;
- o paciente informa o código durante o cadastro ou onboarding;
- a relação é criada inicialmente como `pending`;
- o profissional aprova a relação, que então passa para `active`;
- código usado, expirado, recusado ou cancelado não pode ser reutilizado;
- não criar associação implícita por e-mail ou pelo conhecimento de um ID.

O uso de QR Code pode ser adicionado posteriormente como outra forma de
transportar o mesmo convite, sem alterar as regras de autorização.

Um paciente não pode criar registros de acompanhamento antes de possuir uma
associação `active`. A quantidade de profissionais que um paciente pode ter
associados ainda deve ser definida pelo produto; o modelo não deve assumir
uma limitação sem essa decisão.

Autenticação não equivale a autorização. Toda leitura e escrita deve respeitar papel, associação paciente-profissional e políticas do banco.

## 3. Escopo do MVP

O MVP prioriza cadastro e autenticação; separação de telas e permissões por perfil; associação paciente-profissional; anotações do paciente; observações do profissional; histórico cronológico; e compartilhamento organizado de orientações e materiais de apoio.

Notificações, anexos/documentos, relatórios, confirmação de presença, métricas de evolução e recursos complementares são extensões futuras, salvo decisão explícita. Toda funcionalidade deve servir ao acompanhamento sem transformar o produto em WhatsApp ou prontuário eletrônico completo.

## 4. Arquitetura

1. **Aplicativo mobile (`frontend/`):** React Native com Expo, TypeScript e Expo Router. Responsável por telas, navegação, estado de interface, validações de entrada e experiência de cada perfil.
2. **Backend (`backend/`):** Node.js com TypeScript. Responsável por configurações, integrações server-side e regras que não devem ficar no cliente. É o ponto inicial e evolui incrementalmente.
3. **Supabase:** provê PostgreSQL, autenticação, RLS, Storage e, quando necessário, Realtime. O app só usa chave pública e policies corretas; operações privilegiadas ficam no backend.

Fluxo esperado: `frontend → autenticação/API/Supabase → PostgreSQL (RLS)`. Não adicionar camadas ou serviços sem necessidade comprovada.

## 5. Tecnologias oficiais

- TypeScript no frontend e backend;
- React Native + Expo para Android/iOS;
- Expo Router e React Navigation;
- Node.js no backend;
- Supabase e PostgreSQL;
- `.env` localmente; versionar somente `.env.example`, nunca segredos.

As versões instaladas no repositório são a referência operacional. Antes de alterar o frontend Expo, seguir `frontend/AGENTS.md` e a documentação da versão instalada.

## 6. Banco de dados e migrations

**Nunca alterar o banco diretamente.** Não executar SQL destrutivo, criar tabela, alterar coluna, policy ou função manualmente no Supabase.

Toda mudança persistente deve ser uma migration versionada, revisável e idempotente quando aplicável, incluindo tabelas, constraints, índices, RLS e policies mínimas por papel/associação. Durante a tarefa, a migration pode ser criada e validada, mas não aplicada a banco remoto ou local sem autorização explícita.

A primeira migration de domínio deve priorizar os perfis de usuário, os perfis
específicos de paciente e profissional, os convites e as associações
paciente-profissional. Registros, consultas, arquivos, grupos e materiais
devem ser adicionados em migrations posteriores, conforme as funcionalidades
forem definidas.

### Soft-delete e preservação de dados

As migrations devem preservar os dados persistidos e utilizar soft-delete para
desativação lógica. Toda tabela de domínio que possa ser desativada deve ter um
campo `status` do tipo inteiro pequeno, com os valores normativos:

- `0`: ativo;
- `-1`: inativo ou removido logicamente.

O campo deve ser `not null`, possuir valor padrão `0` e uma constraint que
aceite somente `0` ou `-1`. Consultas e policies devem considerar apenas
registros com `status = 0` quando o comportamento esperado for trabalhar com
dados ativos. A inativação deve preservar o registro e, quando necessário,
registrar data, motivo ou responsável em campos próprios.

Não executar `DELETE` físico em dados de domínio nem usar `ON DELETE CASCADE`
em relacionamentos que possam apagar dados importantes. Estados de negócio,
como `pending`, `active`, `ended` ou `cancelled` de uma associação, devem ser
modelados em uma coluna própria e não substituir o `status` de soft-delete.

### Evolução do modelo de dados por funcionalidade

Ao iniciar uma nova tela ou funcionalidade, a IA e o integrante responsável
devem verificar primeiro, nesta ordem:

1. quais dados a funcionalidade lê, cria, altera ou inativa;
2. quais tabelas, colunas, relacionamentos e migrations existentes representam
   esses dados;
3. se a tela pode reutilizar a estrutura atual por meio de consulta, filtro,
   hook ou serviço, sem mudança persistente;
4. se a necessidade é apenas um novo atributo de uma entidade existente, caso
   em que deve ser avaliada uma nova coluna;
5. se existe uma nova entidade de domínio, ciclo de vida, relacionamento,
   regra de autorização ou conjunto de dados que justifique uma nova tabela.

Não criar uma tabela por tela. Tabelas representam entidades, relacionamentos
ou conceitos do domínio, e devem ser decididas com base nas regras de negócio.
Uma nova tabela só deve ser criada quando a estrutura existente não representar
corretamente a entidade, a cardinalidade, o histórico, a autorização ou o
ciclo de vida necessários.

Antes de implementar a tela, registrar a decisão técnica:

- tabelas e campos existentes que serão reutilizados;
- campos ou relacionamentos novos, se necessários;
- operações de leitura, criação, alteração e soft-delete;
- limites de acesso para paciente, profissional, usuário não associado e
  usuário desativado;
- migration, constraints, índices, `status` e RLS/policies necessários;
- motivo para não criar estrutura nova, quando a estrutura existente for
  suficiente.

Exemplos: login e dashboard normalmente reutilizam autenticação, perfis e
consultas existentes; o código de convite reutiliza convites e associações;
um histórico cronológico pode justificar uma nova tabela de registros; uma
nova tela, por si só, nunca é justificativa suficiente.

Como os dados podem conter informações de saúde, aplicar minimização de dados, menor privilégio, validação server-side e cuidado com logs, fixtures e testes. Nunca colocar `SUPABASE_SECRET_KEY` no frontend, logs ou commits.

## 7. Configuração e segredos

Manter `.env.example` com nomes, não valores reais. Variáveis previstas: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` e `SUPABASE_JWKS_URL`.

O frontend recebe apenas valores públicos. A chave secreta permanece no backend. Variáveis obrigatórias devem falhar cedo sem revelar seus valores.

## 8. Postura de desenvolvimento

As decisões e implementações devem ser feitas com postura de desenvolvedor sênior: entender o problema antes de codificar, avaliar impactos entre camadas, antecipar falhas e custos de manutenção e entregar uma solução sustentável, não apenas algo que funcione no caso feliz.

Em toda task, considerar a experiência do usuário, acessibilidade, estados de carregamento/erro/vazio, segurança, desempenho, evolução futura e consistência com o restante do produto. Quando houver risco, ambiguidade ou uma solução melhor, explicar o motivo e apresentar sugestões de melhoria de forma proativa. Não esconder problemas conhecidos nem escolher atalhos que criem dívida técnica sem registrá-la.

O agente deve questionar requisitos quando eles puderem causar problemas de usabilidade, autorização, privacidade ou arquitetura. A sugestão deve respeitar o escopo do usuário; melhorias fora do escopo devem ser apresentadas como recomendação, não implementadas silenciosamente.

## 9. UI e design system

O aplicativo deve ter aparência moderna, humana e consistente, sem aparência genérica ou de interface gerada automaticamente. A biblioteca oficial de UI será o **Tamagui**, escolhida por oferecer componentes multiplataforma, tokens de design, temas, composição e compatibilidade com React Native 0.81+, React 19 e TypeScript 5+, versões presentes no frontend.

O Tamagui será usado como base técnica, não como identidade visual pronta. Antes de construir telas, definir e reutilizar tokens de cores, tipografia, espaçamento, raio, elevação, estados e componentes do EntreLaços. Evitar estilos isolados e valores mágicos espalhados pelo código. Componentes recorrentes devem ser abstraídos apenas quando o padrão estiver claro.

Priorizar hierarquia visual, legibilidade, feedback de ações, navegação previsível, acessibilidade e adaptação a diferentes tamanhos de tela. A escolha de cores e textos deve transmitir acolhimento e confiança, sem infantilizar o paciente ou sugerir diagnóstico/garantia clínica.

O Tamagui está configurado no frontend como base visual compartilhada. Sua configuração, tokens e componentes comuns devem ser reutilizados antes da criação de estilos ou componentes específicos de uma feature.

### Base compartilhada do frontend

A navegação inicial, os tokens visuais e os componentes compartilhados devem
servir como fundação para todas as telas. O funcionamento real dessa base está
registrado em [`ia/documentation/configuracao-inicial.md`](ia/documentation/configuracao-inicial.md).

Antes de iniciar ou alterar uma task do frontend, ler a documentação
consolidada da configuração inicial:

- [`ia/documentation/configuracao-inicial.md`](ia/documentation/configuracao-inicial.md);
- `frontend/AGENTS.md`, incluindo a documentação oficial da versão do Expo instalada.

Depois:

- criar a branch a partir da `main` atualizada;
- consultar e reutilizar a navegação, o tema e os componentes existentes;
- evitar duplicar botões, campos, cartões, cabeçalhos, mensagens ou padrões de rota;
- atualizar a documentação da base quando uma mudança compartilhada alterar seu funcionamento;
- consultar a documentação consolidada antes de alterar a estrutura compartilhada.

## 10. Padrões de implementação

- Preferir TypeScript estrito, tipos de domínio explícitos e módulos pequenos.
- Validar entrada no cliente para UX e no backend/banco para segurança.
- Proteger telas por autorização real, não apenas ocultando botões.
- Concentrar regras de negócio em serviços, hooks ou módulos de domínio, não em telas.
- Código pode usar nomes em inglês para consistência; textos visíveis devem ser em português do Brasil.
- Não expor dados de um paciente em consultas amplas; buscar somente o necessário e autorizado.

## 11. Qualidade e validação

Validar proporcionalmente ao risco: lint/build/testes disponíveis para a área alterada e revisão do diff. Para banco, validar migration, RLS/policies e cenários de paciente, profissional, usuário não associado e usuário desativado.

O pronto inclui comportamento funcional, estados de carregamento/erro/vazio,
acessibilidade básica, ausência de segredos, migration atualizada quando
necessária e nenhuma alteração direta no banco. Documentação só entra no
pronto quando tiver sido autorizada explicitamente.

## 12. Processo de decisão

Ao iniciar uma tarefa: ler este constitution e instruções locais; identificar camadas afetadas; consultar a documentação da base compartilhada quando a task envolver o frontend; montar plano curto com escopo, riscos, arquivos e validação; implementar somente o escopo; criar migrations quando necessário; validar; e informar o que foi alterado, preparado ou ficou pendente.

Se uma solicitação conflitar com segurança, autorização ou integridade dos dados, sinalizar antes de implementar. Mudanças intencionais nas regras devem atualizar este constitution.

## 13. Registro de trabalho

Todo plano deve ser salvo em `ia/plan/` antes da implementação. O plano deve
conter etapas em formato de checklist, cobrindo tudo o que será feito, e uma
checklist separada de testes manuais para execução e confirmação pelo
programador ou responsável pela validação. Conforme o trabalho avança, os
itens executados devem ser marcados no próprio plano; itens não executados ou
bloqueados devem permanecer identificados.

A documentação em `ia/documentation/` só deve ser criada ou alterada quando
houver autorização explícita do programador/responsável pela task. Não criar
documentação automaticamente ao concluir uma implementação. Quando autorizada,
a documentação deve descrever o funcionamento real, decisões, validações,
limitações e orientações de manutenção.

Esses diretórios fazem parte do histórico oficial do projeto e não devem
conter segredos, dados reais de pacientes ou funcionalidades apenas planejadas.

## 14. Checklists de implementação e testes humanos

Os planos devem usar a convenção:

- `[ ]` item ainda não executado;
- `[x]` item executado e validado pelo agente;
- `[ ]` itens de teste humano permanecem desmarcados até serem confirmados
  pelo programador ou responsável pela validação.

A checklist de testes humanos deve ser específica para a funcionalidade e
conter cenários de sucesso, erro, vazio, acessibilidade, autorização e
responsividade quando aplicável. A validação automatizada do agente não
substitui a confirmação manual.
