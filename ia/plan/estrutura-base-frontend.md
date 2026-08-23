# Task: Preparar estrutura base do frontend

## Descrição objetiva

Organizar a base visual e de navegação do aplicativo EntreLaços para que as
próximas telas, incluindo o login, sejam desenvolvidas sobre uma estrutura
consistente.

## Objetivo e resultado esperado

Ao final, o frontend deve possuir uma estrutura inicial de navegação para os
perfis paciente e profissional, tokens visuais definidos e componentes básicos
reutilizáveis, sem implementar autenticação ou a tela de login.

## Escopo incluído

- Revisar e organizar a navegação inicial com Expo Router.
- Separar a estrutura prevista para paciente e profissional.
- Definir tokens de cores, tipografia, espaçamento, bordas e estados.
- Preparar a adoção do Tamagui conforme as versões instaladas.
- Criar componentes básicos reutilizáveis quando o padrão estiver claro.
- Criar placeholders para validar a navegação.
- Manter a experiência adaptável a diferentes tamanhos de tela e com acessibilidade básica.

## Fora do escopo

- Implementar login, cadastro ou autenticação.
- Implementar autorização real ou associação paciente-profissional.
- Criar tabelas, migrations, policies ou alterações no banco.
- Criar telas completas de acompanhamento, anotações ou observações.
- Adicionar funcionalidades futuras como notificações, anexos ou relatórios.

## Camadas afetadas

- **Frontend:** navegação, tema, componentes e placeholders.
- **Backend:** não afetado.
- **Supabase/banco:** não afetado; nenhuma migration é necessária.
- **Documentação:** este plano registra a decisão e o escopo.

## Plano

1. Consultar a documentação oficial compatível com Expo SDK 54 e verificar a
   configuração atual do projeto.
2. Definir os tokens visuais do EntreLaços a partir do tema inicial existente.
3. Organizar as rotas e layouts para permitir a evolução separada dos perfis.
4. Criar os componentes básicos necessários sem antecipar abstrações complexas.
5. Substituir a tela de exemplo por placeholders do produto para validar a base.
6. Validar o resultado e revisar o diff antes de disponibilizar a `main` para a
   branch da tela de login.

## Autorização e segurança

Esta task não acessa dados de usuários nem implementa autorização. Os
placeholders não devem sugerir que esconder uma rota constitui proteção de
acesso; as permissões reais serão implementadas em task própria.

## Validação e critério de pronto

- O frontend inicia sem erro.
- A navegação entre os placeholders funciona.
- O tema visual é centralizado e não depende de valores mágicos espalhados.
- Os componentes básicos possuem estados visuais necessários.
- A interface é legível em tamanhos de tela diferentes.
- O lint passa.
- Não há segredos, dados reais ou alterações no backend/banco.

## Riscos e dependências

- O Tamagui ainda não está instalado; a configuração deve ser validada antes de
  migrar telas ou criar componentes dependentes da biblioteca.
- A estrutura final de autenticação pode exigir ajustes nas rotas, mas não deve
  ser antecipada nesta task.
- A tela de login deverá nascer de uma branch baseada na `main` após esta base
  ser revisada.

## Decisões pendentes

- Definição final do fluxo de autenticação.
- Definição do fluxo de associação paciente-profissional.
- Definição das permissões reais por perfil.
