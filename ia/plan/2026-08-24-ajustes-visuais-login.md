# Ajustes visuais da tela de login

## Nome da task

`ajustes-visuais-login`

## Descrição objetiva

Modernizar e refinar a experiência visual da tela de login para paciente e
profissional, mantendo uma aparência limpa, acolhedora e coerente com a área da
saúde. A tela deve funcionar bem em mobile e web, preservar o fluxo seguro de
autenticação existente e usar o Tamagui e os tokens reais do EntreLaços.

## Escopo

- Manter a tela rolável sem exibir o indicador vertical de rolagem.
- Reforçar a hierarquia do cabeçalho com marca discreta, saudação acolhedora e
  subtítulo objetivo.
- Evoluir o seletor Paciente/Profissional para um controle segmentado acessível,
  com estado selecionado evidente e transição suave.
- Apresentar ícone de apoio no campo de e-mail e teclado/configurações de
  preenchimento apropriados.
- Integrar ao campo de senha os ícones de senha e de mostrar/ocultar conteúdo.
- Alinhar **Esqueci minha senha** à direita, imediatamente abaixo da senha.
- Destacar o botão **Entrar**, incluindo feedback de carregamento com `Spinner`,
  bloqueio de reenvio e resposta visual ao toque.
- Manter **Primeiro acesso?** com a ação **Cadastre-se** e preparar o texto da
  ação para refletir o perfil selecionado, sem criar ou habilitar a rota nesta
  task.
- Usar exclusivamente os tokens semânticos realmente definidos no tema do
  projeto, sem cores hexadecimais ou nomes de tokens inexistentes.
- Preservar responsividade, teclado, temas claro/escuro e acessibilidade.
- Validar lint, TypeScript, comportamento visual e diff.

## Fora do escopo

- Alterar regras, serviços ou persistência de autenticação e autorização.
- Implementar ou habilitar a tela/rota de cadastro.
- Implementar o fluxo real de recuperação ou redefinição de senha.
- Alterar backend, Supabase, banco, migrations ou políticas RLS.
- Introduzir uma nova biblioteca visual ou substituir o Tamagui.
- Redesenhar outras telas do aplicativo.

## Plano

### 1. Layout e hierarquia

1. Manter `AppScreen`, `KeyboardAvoidingView` e `ScrollView`, com conteúdo
   adaptável a telas pequenas, web e teclado aberto.
2. Preservar `showsVerticalScrollIndicator={false}` sem desativar a rolagem.
3. Organizar marca **ENTRELAÇOS**, título **Bem-vindo de volta** e subtítulo em
   uma hierarquia compacta, legível e acolhedora.
4. Distribuir formulário, ação principal e rodapé sem depender de alturas fixas
   ou valores mágicos.

### 2. Seletor de perfil

1. Usar `ToggleGroup`, radio group ou composição Tamagui equivalente como
   segmented control entre **Paciente** e **Profissional**.
2. Manter uma opção sempre ativa e expor `accessibilityRole`, rótulo do grupo e
   `accessibilityState` apropriados.
3. Diferenciar o estado ativo por mais de uma pista visual, combinando cor,
   contraste, borda e peso tipográfico.
4. Aplicar animação curta e discreta somente se não prejudicar desempenho,
   acessibilidade ou previsibilidade.

### 3. Campos e interações

1. Evoluir `AppInput` ou criar uma composição compatível para suportar ícones
   internos sem duplicar o padrão compartilhado de campos.
2. No e-mail, usar ícone de correio, `keyboardType="email-address"`,
   `autoCapitalize="none"`, autofill e tipo de conteúdo coerentes.
3. Na senha, integrar ícone de cadeado e botão de visibilidade com ícones de
   olho/olho fechado, área de toque mínima e rótulo acessível que muda conforme
   o estado.
4. Posicionar **Esqueci minha senha** à direita logo após o campo, preservando a
   rota pública existente e sem alterar o fluxo funcional.
5. Manter validações e mensagens seguras, com foco visível e leitura adequada
   por tecnologia assistiva.

### 4. Ações e feedback

1. Manter **Entrar** como ação primária larga, com raio e cores oriundos dos
   tokens do EntreLaços.
2. Durante o envio, desabilitar a ação, impedir submissão duplicada e mostrar
   `Spinner` acompanhado por texto ou rótulo acessível de carregamento.
3. Aplicar `pressStyle` e animação breve, respeitando estados disabled e
   contraste nos temas claro e escuro.
4. Organizar o rodapé em uma chamada amigável com **Primeiro acesso?** e
   **Cadastre-se**. Preparar uma variação textual por perfil, como **Cadastrar
   como paciente** ou **Cadastrar como profissional**, mas manter a ação
   desabilitada enquanto a rota de cadastro não estiver disponível.

### 5. Design system Tamagui

1. Consultar `frontend/tamagui.config.ts` antes da implementação e mapear as
   intenções do prompt para tokens existentes, como `$background`, `$color`,
   `$muted`, `$brand`, `$brandContrast`, `$borderColor`, espaços, raios e
   tamanhos configurados.
2. Não copiar literalmente tokens ilustrativos do prompt, como `$primary`,
   `$colorMuted` ou `$colorInverse`, se eles não existirem no tema real.
3. Reutilizar `AppScreen`, `AppInput`, `BrandButton` e demais componentes
   compartilhados. Evoluir esses componentes somente quando o comportamento for
   reutilizável e não causar regressões em outras telas.
4. Não usar cores hardcoded. Validar contraste, foco, estados pressionado,
   desabilitado, erro e carregamento nos temas claro e escuro.

### 6. Arquivos e módulos prováveis

- `frontend/app/index.tsx`: composição e hierarquia da tela.
- `frontend/components/app-input.tsx`: suporte reutilizável a ícones internos e
  ação de visibilidade, se necessário.
- `frontend/components/brand-button.tsx`: loading/animação somente se a mudança
  for compartilhável e compatível com usos existentes.
- `frontend/tamagui.config.ts`: apenas consulta; alteração somente se faltar um
  token semântico realmente reutilizável.
- `ia/documentation/features/tela-login.md`: atualização após implementação e
  validação, não durante esta etapa de planejamento.

## Camadas afetadas

- **Frontend:** apresentação e interações visuais da rota inicial e, se
  necessário, evolução compatível de componentes compartilhados.
- **Backend:** sem alteração.
- **Supabase/banco:** sem alteração e sem migration.
- **Documentação:** este plano agora; documentação do funcionamento real somente
  depois da implementação.

## Autorização e dados

O redesign não muda autorização. A seleção visual continua sendo apenas uma
preferência de entrada: o papel real vem de `profiles.role`. Profissional acessa
somente a área profissional; paciente com associação ativa acessa a área do
paciente; paciente sem associação ativa permanece na pendência; usuário sem
perfil válido, desativado ou com papel divergente continua bloqueado. Nenhum
dado de saúde, token, senha ou código de convite deve ser incluído em logs ou
feedback visual.

## Migration necessária

Nenhuma. A task modifica somente apresentação e interação no frontend e deve
reutilizar o fluxo de autenticação existente.

## Estados, acessibilidade e responsividade

- Estados previstos: inicial, perfil selecionado, foco, campo inválido,
  mostrando/ocultando senha, enviando, erro recuperável e ação desabilitada.
- Não há estado vazio aplicável ao formulário.
- Manter labels persistentes, ordem de leitura lógica, foco visível, contraste e
  alvos de toque de pelo menos 44 pontos.
- Ícones são apoio e não substituem rótulos; botões somente com ícone precisam
  de nome acessível.
- Validar fontes ampliadas, teclado aberto, telas pequenas, orientação,
  Android, iOS, web e temas claro/escuro.
- Paciente e profissional devem receber a mesma qualidade visual; diferenças de
  texto ou campos não podem sugerir permissões que ainda não foram validadas.

## Validação e critérios de pronto

- A tela mantém sua rolagem, sem exibir o indicador vertical.
- Cabeçalho, formulário, ação principal e rodapé possuem hierarquia clara em
  mobile e web.
- O seletor de perfil funciona por toque, teclado e leitor de tela, com seleção
  inequívoca.
- E-mail usa teclado/autofill apropriados; a senha possui controle interno de
  visibilidade acessível.
- **Esqueci minha senha** fica alinhado à direita abaixo da senha.
- **Entrar** apresenta `Spinner`, bloqueia reenvio e mantém contraste durante o
  carregamento.
- A chamada de cadastro reflete o perfil selecionado, mas permanece sem navegar
  até existir contrato de rota.
- Nenhuma cor hardcoded ou token inexistente é introduzido.
- Layout validado em Android, iOS e web, com teclado, tela pequena, fonte
  ampliada e temas claro/escuro.
- Executar `npm.cmd run typecheck`, `npm.cmd run lint`, build web, revisão visual
  e `git diff --check`.

## Riscos, dependências e decisões pendentes

- O prompt contém nomes de tokens ilustrativos que podem não existir; a fonte de
  verdade será `frontend/tamagui.config.ts`.
- Alterar `AppInput` ou `BrandButton` pode impactar outras telas e exige revisão
  de todos os consumidores.
- Animações devem permanecer discretas e ser reduzidas ou removidas se causarem
  instabilidade entre plataformas ou prejudicarem acessibilidade.
- O texto dinâmico de cadastro pode ser preparado visualmente, mas a navegação
  depende do contrato da futura rota de cadastro.
- A disponibilidade de ícones deve ser confirmada nas dependências instaladas;
  não adicionar pacote novo se o conjunto atual atender.
- A decisão sobre evolução de componentes compartilhados deve ser tomada após
  inspecionar seus consumidores, evitando padrões paralelos.
