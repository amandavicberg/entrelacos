# Task: Completar base compartilhada do frontend e Supabase

## Descrição objetiva

Completar a fundação comum do EntreLaços antes do desenvolvimento das telas de
login e das funcionalidades de cada perfil.

## Escopo

- Consolidar a navegação inicial para paciente e profissional.
- Criar componentes visuais compartilhados para telas futuras.
- Configurar o cliente público do Supabase no frontend.
- Revisar a configuração existente do Supabase no backend.
- Organizar exemplos seguros de variáveis de ambiente.

## Fora do escopo

- Implementar login, cadastro ou recuperação de senha.
- Criar tabelas, perfis, migrations, RLS ou policies.
- Definir o fluxo de associação paciente-profissional.
- Persistir dados reais de usuários.
- Criar telas completas de acompanhamento.

## Camadas afetadas

- **Frontend:** rotas, Tamagui, componentes compartilhados e cliente público do Supabase.
- **Backend:** configuração e validação do cliente server-side, sem endpoints de domínio.
- **Supabase/banco:** nenhuma alteração; não há migration nesta task.
- **Documentação:** registrar funcionamento e limitações da base.

## Autorização e segurança

O frontend utilizará somente `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` por
meio de variáveis públicas do Expo. `SUPABASE_SECRET_KEY` continuará exclusiva
do backend. Nenhuma rota de placeholder será considerada proteção de acesso.

## Plano

1. Revisar a navegação, o tema e os componentes já criados.
2. Adicionar os componentes compartilhados que cobrem os padrões básicos de UI.
3. Configurar o cliente público do Supabase sem inicializá-lo com segredo.
4. Validar a configuração do backend e os exemplos de ambiente.
5. Executar TypeScript, lint, build e exportação web quando aplicável.
6. Atualizar a documentação da base compartilhada.

## Critérios de pronto

- Rotas inicial, paciente e profissional continuam funcionando.
- Componentes compartilhados possuem estados visuais básicos e são reutilizáveis.
- O cliente público do Supabase não depende de chave secreta.
- O backend falha com mensagem segura quando configuração obrigatória está ausente.
- Nenhuma migration ou alteração direta no banco foi feita.
- Validações executadas e limitações registradas.

## Decisões pendentes

- Estratégia de persistência de sessão no aplicativo.
- Fluxo de autenticação.
- Modelo de perfis e permissões.
- Fluxo explícito de associação paciente-profissional.
