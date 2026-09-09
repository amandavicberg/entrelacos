# Refatoração da identidade visual

## Objetivo

Aplicar a identidade visual oficial do EntreLaços ao frontend atual e tornar
esse padrão obrigatório para telas futuras por meio do `constitution.md`.

## Escopo incluído

- Consolidar a paleta oficial em tokens Tamagui e temas claro/escuro.
- Incorporar os assets oficiais de ícone e marca horizontal ao projeto Expo.
- Atualizar ícone, splash e metadados visuais do aplicativo.
- Refatorar os componentes compartilhados, a entrada pública, autenticação e
  as áreas paciente e profissional para o novo sistema visual.
- Atualizar a orientação normativa de UI no `constitution.md`.

## Fora do escopo

- Alterar regras de negócio, autenticação, autorização, backend ou banco de
  dados.
- Criar novas funcionalidades ou rotas.
- Criar ilustrações, logos ou variantes da marca além dos arquivos oficiais
  fornecidos.

## Camadas afetadas

- Frontend Expo/Tamagui e configuração de assets.
- Constitution do projeto.
- Sem impacto no backend, Supabase ou migrations.

## Autorização

Não haverá alteração de acesso. Pacientes, profissionais e usuários sem
associação mantêm exatamente os guards e fluxos existentes; a mudança é
exclusivamente visual.

## Plano

- [x] Ler o constitution, instruções do frontend e documentação da base.
- [x] Extrair paleta e diretrizes de uso dos assets oficiais fornecidos.
- [x] Definir tokens e temas Tamagui alinhados à identidade.
- [x] Migrar assets oficiais e configurar ícone, splash e favicon do Expo.
- [x] Refatorar os componentes e telas existentes para reutilizar o novo
  sistema visual, preservando comportamento e acessibilidade.
- [x] Atualizar o constitution com as regras permanentes de identidade.
- [x] Executar lint, checagem de tipos e testes disponíveis; revisar o diff.

## Validação

- [x] Executar `npm run lint` no frontend.
- [x] Executar `npx tsc --noEmit` no frontend.
- [x] Executar os testes de dashboard disponíveis, se não forem afetados por
  dependências externas.
- [ ] Concluir `npm run build` no ambiente local. As dependências foram
  sincronizadas com o `package-lock.json` e o projeto agora reporta SDK 57;
  a exportação web foi iniciada com Node 22, mas interrompida antes de
  terminar por ser uma validação demorada.

## Testes manuais para o responsável

- [ ] Conferir o ícone e a splash em Android, iOS e web após gerar uma nova
  build.
- [ ] Conferir contraste, leitura com fonte ampliada e foco por leitor de tela
  nas telas pública, de autenticação, paciente e profissional.
- [ ] Conferir os estados de carregamento, erro e vazio da área profissional.
- [ ] Confirmar que navegação e restrições de paciente/profissional continuam
  iguais às anteriores.

## Riscos e decisões

- Os PNGs oficiais possuem fundo incorporado; serão exibidos respeitando suas
  proporções e sem recoloração ou recorte do símbolo.
- A tipografia da marca é um desenho proprietário no PNG. O app preservará
  Poppins para conteúdo por já estar carregada e por favorecer legibilidade;
  títulos não tentarão imitar a tipografia do logotipo.
