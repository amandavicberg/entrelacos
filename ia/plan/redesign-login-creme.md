# Redesign acolhedor do login em tons creme

## Nome da task

`redesign-login-creme`

## Descrição objetiva

Redesenhar a apresentação do login do EntreLaços a partir do prompt fornecido,
substituindo a direção verde por creme, areia e caramelo escuro. Entregar uma
interface clara, acolhedora, compacta e legível em celular e web, reutilizando
React Native e Tamagui e preservando o fluxo de autenticação existente.

**Status em 2026-09-07:** redesign implementado e migração para SDK 57 concluída;
validações técnicas aprovadas, confirmação no iPhone pendente com o usuário.
O usuário confirmou: “Somente login, como no prompt (recomendado)”.
Comentário de revisão incorporado ao plano: nova saudação e definição do espaço
da marca.

### Adequação à main atualizada antes de implementar

A branch `redesign-login-creme` foi criada a partir de `origin/main` em
`c7c1afd`, após fetch. A main já separou a entrada `/` do login `/login`, adotou
Poppins e extraiu `AuthScreen`. Portanto, as referências anteriores a
`frontend/app/index.tsx` como login passam a apontar para `frontend/app/login.tsx`.
A composição da tela de boas-vindas permanece intacta. O convite do paciente agora é
expansível e abre automaticamente quando solicitado pela autenticação;
esse comportamento atual será preservado. A implementação reutiliza
`AuthScreen` com opções visuais locais, sem alterar cadastro e recuperação.

Na validação web foi identificado que `disableInjectCSS` no provider global
impedia a aplicação dos estilos Tamagui, sem stylesheet alternativo carregado.
Foi removido esse bloqueio em `app/_layout.tsx`: a web passa a renderizar os
estilos existentes em todas as rotas. Essa correção de infraestrutura é necessária
para validar o login e não troca a paleta global nem afeta a injeção de CSS nativa.
O Tamagui 2.7.7 também exige `role`/`aria-*` na web e ignora `secureTextEntry`
no input web; o login usa as propriedades correspondentes, incluindo `type`.

## Escopo

- Compatibilidade com o Expo Go SDK 57 no iPhone, incluindo dependências,
  configuração e adaptações exigidas na navegação, preservando o redesign.
- Apresentação da rota de login `/login`, incluindo paciente e profissional.
- Marca tipográfica, boas-vindas, seletor de perfil, campos, ações e feedback.
- Tema claro em tons creme aplicado somente ao login, inclusive quando o sistema
  operacional estiver em modo escuro, conforme a direção clara do prompt.
- Tokens de cores e dimensões centralizados no Tamagui; ajustes opcionais em
  componentes compartilhados apenas para atender ao login sem alterar os demais usos.
- Área segura, teclado, rolagem, responsividade, acessibilidade e estados visuais.
- Preservação dos campos, regras de convite, validações e redirecionamentos reais.
- Prévia da implementação, quando o ambiente permitir, e validações proporcionais.

## Fora do escopo

- Redesign de cadastro, recuperação de senha, pendência ou áreas autenticadas.
- Troca global da identidade visual ou reformulação do tema escuro do aplicativo.
- Novas telas, símbolo de marca, ilustrações, fontes ou dependências sem relação
  com a compatibilidade do SDK.
- Mudanças em serviços de autenticação, persistência de sessão, backend, banco ou RLS.
- Implementação de recuperação de senha ou passagem de perfil para o cadastro.
- Aplicação de migrations, publicação, deploy ou criação de usuários reais.
- Atualização em `ia/documentation/`, sem autorização explícita para documentação.

## Levantamento do estado atual

- `frontend/app/login.tsx` já contém login, seleção de perfil, ícones de e-mail e
  senha, visibilidade da senha, convite exclusivo de paciente, erros e loading.
- `AuthScreen` possui largura máxima padrão de 500; o alvo visual do login é 440.
- `frontend/tamagui.config.ts` define cores verde-azuladas globais e a fonte Poppins.
- `AppInput` já suporta adornos, mas usa o fundo do tema no contêiner com ícones;
  os campos com e sem adornos precisam receber tratamento visual consistente.
- `AppScreen` aplica espaçamento padrão; `AuthScreen` já cuida dos insets superior
  e inferior e do teclado. Reutilizar essa base, incluindo insets laterais no login.
- `BrandButton`, `AppHeader`, `AppInput`, `AppScreen` e `FeedbackState` são reutilizáveis.
- Os assets `icon.png` e `splash-icon.png` inspecionados são do template; não foi
  identificada uma logo própria. Usar “EntreLaços” em texto, sem inventar símbolo.
- `/forgot-password` existe, mas exibe somente uma mensagem sobre implementação futura.
- `/cadastro` existe e está conectado ao login. Atualmente começa como paciente,
  permite escolher o perfil e não recebe o perfil selecionado no login. Preservar
  essa navegação; o requisito do prompt de carregar o perfil fica como limitação.
- O botão de envio desabilita durante loading e `handleSubmit` verifica o estado
  `submitting`. Acrescentar trava síncrona por referência para fechar a janela
  antes do próximo render, sem mudar o contrato de autenticação.
- A documentação anterior do login ainda descreve cadastro desabilitado. Para este
  plano, o código atual é a referência operacional dessa integração.

## Direção visual

Uma base creme quente com campos brancos e acentos caramelo escuro. Usar areia
nos agrupamentos e no fundo do seletor. Textos em marrom profundo e taupe mantêm
a leitura e combinam com o restante da composição.

| Uso | Cor proposta | Aplicação |
| --- | --- | --- |
| Fundo creme | `#F8F3EA` | Tela inteira |
| Superfície branca | `#FFFFFF` | Campos e texto sobre ação principal |
| Caramelo escuro | `#79583D` | Entrar, perfil selecionado, marca e links |
| Areia suave | `#EEE3D3` | Fundo do seletor e superfícies de apoio |
| Texto principal | `#342C26` | Título, rótulos e conteúdo preenchido |
| Texto secundário | `#706459` | Subtítulo e mensagens auxiliares |
| Borda decorativa | `#D9CDBD` | Separações discretas sem função de controle |
| Borda de campo | `#9A8571` | Limite perceptível dos controles |
| Foco | `#95704D` | Contorno de foco visível |

Os nomes finais dos tokens devem seguir o sistema existente. As cores novas
ficam na configuração, e os componentes consomem tokens semânticos.
Preservar um token de erro legível; erro não deve ser convertido em bege.

Contrastes calculados nesta etapa, com cores sólidas: branco sobre caramelo
escuro 6,41:1; texto principal sobre creme 12,38:1; texto secundário sobre creme
5,20:1; caramelo sobre creme 5,80:1. Esses cálculos não substituem a validação
da tela renderizada, especialmente com opacidade, foco e estados desabilitados.
A borda decorativa clara não deve ser a única indicação de um campo interativo.

### Composição proposta

1. Área compacta de marca no topo, preenchida agora com “EntreLaços” em texto,
   usando a fonte existente e destaque moderado. Quando houver uma logo própria,
   ela poderá substituir o texto mantendo sua proporção. Não deixar um espaço
   vazio, moldura de placeholder ou símbolo provisório visível para o usuário.
2. Título “Seu cuidado continua aqui” e subtítulo “Selecione seu perfil para acessar sua conta.”,
   alinhados à esquerda, com espaçamento compacto.
3. “Entrar como” e seletor Paciente/Profissional de larguras iguais; seleção com
   caramelo escuro, texto branco e pista adicional de borda/peso, além de semântica acessível.
4. Campos brancos com rótulos persistentes, altura mínima próxima de 54 e raio de
   14–16, respeitando crescimento de fonte. Ícones existentes discretos.
5. Controle de senha com texto visível “Mostrar”/“Ocultar”, nome acessível
   “Mostrar senha”/“Ocultar senha” e área de toque mínima de 44 × 44. O ícone
   pode acompanhar o texto para atender à exigência do prompt de botões rotulados.
6. “Esqueci minha senha” alinhado à direita e seção expansível de convite abaixo
   no modo paciente, preservando o comportamento existente na main atualizada.
7. Botão “Entrar” de largura total, altura mínima próxima de 54; durante envio,
   spinner acompanhado de “Entrando...”.
8. Rodapé “Ainda não tem conta? Cadastre-se”, com ação secundária identificável.

A saudação proposta conecta o login ao acompanhamento pós-consulta, acolhe
também quem está acessando pela primeira vez e evita prometer resultado clínico.
Ela será a mesma nos dois perfis, mantendo uma apresentação consistente.
A área de marca identifica o aplicativo; sua altura deve acompanhar o conteúdo,
sem reservar um bloco grande para uma logo que ainda não existe.

Manter margens próximas de 24, largura máxima de 440 e uma escala curta de
espaçamentos. Evitar decoração excessiva, painel adicional que comprima o
formulário em celular, alturas fixas de conteúdo ou navegação inferior.

## Camadas, dados e autorização

**Frontend:** tela inicial e configuração de tema; componentes compartilhados
somente quando necessários, com opções que preservem os consumidores atuais.

**Backend e Supabase/banco:** nenhuma alteração. O formulário reutiliza Supabase
Auth e o contexto atual. As leituras continuam usando `profiles.id/role` e
`patient_professional_relationships.patient_id/status/relationship_status`.
O fluxo de convite existente usa `professional_invites` e cria associação
`pending` por meio do endpoint e da função já existentes. Nenhuma nova operação
de leitura, criação, alteração ou soft-delete será adicionada pelo redesign.
Não há novos campos, tabelas, relacionamentos, índices ou policies necessários:
uma mudança de apresentação não acrescenta entidade nem regra de domínio.

**Migration:** nenhuma, e nenhuma migration existente será aplicada nesta task.

**Autorização:** seleção visual não altera o papel real. Preservar os guards e
a validação do perfil: profissional segue para sua área; paciente com associação
ativa segue para sua área; paciente sem associação ativa permanece no fluxo
restrito de convite/pendência. Perfil divergente, inválido ou desativado deve
continuar sem acesso aos dados protegidos, conforme regras e RLS existentes.

**Documentação:** este plano em `ia/plan/`. A skill de documentação exige registro
ao concluir, mas o constitution, seções 11 e 13, condiciona alterações em
`ia/documentation/` à autorização explícita e impede registrar planos como
funcionalidade pronta. Prevalece o constitution; não atualizar documentação de
funcionamento nesta entrega.

## Arquivos prováveis da implementação

| Arquivo | Mudança prevista |
| --- | --- |
| `frontend/app/login.tsx` | Tema restrito ao login, composição visual, textos, dimensões, área segura e estados |
| `frontend/tamagui.config.ts` | Tema nomeado do login com cores e tokens necessários, preservando temas globais |
| `frontend/components/app-input.tsx` | Opção visual compatível para superfície branca, raio, dimensões e estados com/sem ícones |
| `frontend/components/app-screen.tsx` | Opções de espaçamento somente se necessárias; preservar padrão dos demais usos |
| `frontend/components/auth-screen.tsx` | Marca substituível e opção compacta para o login; defaults preservados |
| `frontend/app/_layout.tsx` | Reativar injeção de CSS Tamagui na web, sem mudar os temas globais |
| `frontend/components/brand-button.tsx` | Alterar apenas se as props existentes forem insuficientes |
| Este plano | Marcar etapas executadas e registrar resultados/limitações |

`AppHeader`, `FeedbackState`, `auth-context.tsx`, rotas de cadastro/recuperação e
layouts protegidos são referências para reutilização e revisão de regressões.
Não se prevê mudar suas regras. Evitar alterar o provider global para aplicar
a paleta: o tema local precisa envolver também os componentes que leem
`useTheme`, incluindo ícones e a apresentação de sessão em carregamento.

## Plano

- [x] Ler constitution, skill de planejamento, instruções do frontend e documentação da base.
- [x] Ler o prompt e confirmar com o usuário a abrangência exclusiva do login.
- [x] Inspecionar login, tema, componentes, assets, rotas e fluxo de autenticação.
- [x] Definir paleta proposta e calcular contraste das combinações principais.
- [x] Incorporar o comentário de revisão: propor “Seu cuidado continua aqui”,
  definir a marca tipográfica como conteúdo atual do espaço da logo e remover o comentário.
- [x] Salvar plano com escopo, limitações, etapas e checklist de testes humanos.
- [x] Antes de implementar, preparar branch a partir da `main` atualizada,
  preservando trabalho local, conforme o fluxo do projeto.
- [x] Confirmar as APIs necessárias nas versões instaladas e na documentação
  oficial do Expo SDK 54 e Tamagui, sem atualizar dependências para o redesign.
- [x] Criar o tema claro local do login e centralizar cores/dimensões reutilizáveis.
- [x] Ajustar composição, marca, hierarquia, largura e espaçamentos.
- [x] Refinar seletor e campos, incluindo convite e mostrar/ocultar senha.
- [x] Refinar ações, links, mensagens de erro, foco, pressionado, desabilitado e loading.
- [x] Verificar bloqueio de reenvio por botão e teclado, aplicando trava local se necessário.
- [x] Implementar insets, barra de status escura enquanto o login está em foco,
  acomodação de teclado e rolagem; confirmação em aparelho permanece nos testes humanos.
- [x] Revisar os consumidores dos componentes alterados para evitar efeitos fora do login.
- [x] Executar validações técnicas e produzir prévia/capturas web.
- [x] Atualizar este plano com resultados reais e entregar arquivos alterados e pendências.

## Validação

### Verificação do agente durante a implementação

- [x] Executar `npm.cmd run typecheck` em `frontend/`.
- [x] Executar `npm.cmd run lint` em `frontend/`.
- [x] Executar `npm.cmd run build` em `frontend/`.
- [x] Executar `git diff --check` e revisar o diff para confirmar o escopo visual
  e a correção necessária de CSS na web.
- [x] Gerar bundles Android e iOS com `npx.cmd expo export --platform android
  --platform ios --output-dir .cache/native-export`.
- [x] Conferir contraste em estados finais, especialmente bordas, foco e loading.
- [x] Conferir a prévia web nos dois perfis e registrar o que não foi possível validar.
- [x] Caso uma trava de envio seja adicionada, verificar que acionamentos repetidos
  pelo teclado e botão não disparam autenticações concorrentes.

Não criar testes que apenas reproduzam estilos. Build/lint não comprovam o
comportamento visual nem o fluxo integrado. Autenticação exige ambiente e contas
de teste apropriados; não aplicar migrations nem usar dados reais para viabilizá-la.

### Checklist separada de testes humanos

Os itens abaixo permanecem desmarcados até confirmação do responsável.

- [ ] Validar visualmente o login de paciente e profissional em celular e navegador.
- [ ] Conferir larguras de 320, 375/390 e 440, além de desktop com formulário centralizado.
- [ ] Conferir Android/iOS, teclado aberto, rolagem até convite e Entrar e área segura.
- [ ] Expandir/recolher o convite de paciente e verificar abertura automática
  quando houver erro do campo, inclusive se ele tiver sido recolhido antes do envio.
- [ ] Ativar modo escuro do sistema: login permanece claro e barra de status legível;
  ao sair do login, outras telas mantêm seu comportamento de tema anterior.
- [ ] Aumentar fonte/zoom para 200%: títulos, seletor, controles e mensagens sem cortes.
- [ ] Navegar com teclado e leitor de tela; verificar ordem, labels, seleção,
  anúncio de erros, foco e alvos de toque de pelo menos 44 × 44.
- [ ] Trocar perfis: e-mail/senha preservados; erros limpos; convite oculto e limpo
  ao selecionar profissional, conforme comportamento atual.
- [ ] Mostrar e ocultar senha sem apagar seu conteúdo e conferir o rótulo da ação.
- [ ] Enviar campos vazios, e-mail inválido e convite inválido: erros próximos aos campos.
- [ ] Simular credenciais inválidas e falha de rede: mensagem visível e possibilidade de tentar novamente.
- [ ] Conferir “Entrando...” com spinner, texto visível e prevenção de envios duplicados.
- [ ] Entrar como profissional e como paciente associado: redirecionamentos corretos.
- [ ] Conferir paciente sem associação ativa/pendente e casos de convite inválido ou expirado.
- [ ] Conferir conta com papel divergente e perfil desativado: acesso protegido continua negado.
- [ ] Abrir recuperação de senha: preservar a tela informativa existente, sem promessa de envio.
- [ ] Abrir cadastro pelos dois perfis: rota existente abre; registrar que a seleção
  inicial continua paciente, pois passagem automática do perfil está fora do escopo.
- [ ] Conferir cadastro, recuperação e áreas autenticadas para regressões dos componentes compartilhados.

Estado vazio de listagem não se aplica ao login; formulário inicialmente vazio
e sessão em validação são os cenários correspondentes a verificar.

## Critério de pronto

A implementação estará pronta quando o login reproduzir a direção creme,
mantiver comportamentos e campos existentes, apresentar estados acessíveis e
funcionar em telas pequenas sem esconder ações. As verificações executadas e
pendentes devem ser reportadas separadamente, com prévia quando disponível e
sem efeitos visuais globais não solicitados.

## Riscos, dependências e decisões

- A paleta é uma proposta concreta para implementação e pode ser refinada na
  prévia, mantendo a direção creme solicitada.
- Escolha definida pelo prompt: tema claro restrito ao login. Uma versão escura
  da nova identidade pode ser planejada separadamente.
- Temas de componentes Tamagui podem sobrepor cores; verificar campos, botões e
  ícones no tema local, incluindo foco e hover na web.
- Estados com opacidade podem reduzir contraste; avaliar cores renderizadas.
- Componentes compartilhados exigem opções compatíveis, sem mudar defaults de outras telas.
- A documentação antiga de cadastro está desatualizada; recomendar sua correção
  quando houver autorização para documentação de funcionamento real.
- Recuperação funcional e passagem de perfil ao cadastro permanecem limitações
  conhecidas, sem impedir o redesign visual definido pelo usuário.
- Dispositivos/emuladores e ambiente de autenticação podem não estar disponíveis;
  registrar essa condição sem marcar testes humanos como concluídos.

## Referências consultadas

- `constitution.md`, `skills/project-plan/SKILL.md`, `frontend/AGENTS.md`.
- `ia/documentation/configuracao-inicial.md` e `ia/documentation/features/tela-login.md`.
- `skills/documentation/SKILL.md`, para conferir as regras de registro final.
- Código atual e `frontend/package.json`: Expo 54, React Native 0.81.5 e Tamagui declarado como `^2.7.7`.
- [Documentação oficial do Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/), consultada em 2026-09-07.
- Prompt anexado pelo usuário e confirmação de escopo nesta conversa.

## Resultados da implementação

- Branch: `redesign-login-creme`, baseada na main atualizada (`c7c1afd`).
- Dependências sincronizadas com `npm.cmd ci --no-audit --no-fund`; nenhuma
  dependência nova ou alteração no lockfile. Poppins já fazia parte da main.
- Tema `light_login`, cores e dimensões centralizadas; marca tipográfica,
  nova saudação, formulário de até 440 e ações rotuladas.
- `AuthScreen` oferece `brand` e `compact`; `AppScreen` aceita props de layout;
  `AppInput` oferece `appearance="outlined"`, foco rastreado para nativo/web e
  ação final em outra linha quando a fonte nativa estiver ampliada.
- Senha oculta por padrão na web e no nativo; o botão “Mostrar”/“Ocultar” altera
  a apresentação sem limpar o campo. Inputs têm nomes acessíveis explícitos.
- `submissionInFlight` impede reentrada antes do próximo render; erro de convite
  abre a seção para que o campo e a mensagem permaneçam acessíveis.
- TypeScript e lint aprovados. Exportação web aprovada, com dez rotas; o Expo
  informou encerramento forçado após exportar, com código final 0.
- Bundles Hermes de Android e iOS gerados com sucesso em `.cache/native-export`;
  isso confirma compilação, sem substituir execução em dispositivo.
- Verificação automatizada em Edge via CDP com autenticação totalmente simulada:
  paciente/profissional, preservação de e-mail/senha, convite expansível e limpeza
  ao trocar perfil, validações, visibilidade de senha, loading e somente uma
  chamada de login após acionamentos repetidos por botão/teclado: aprovados.
- Web em 390 e 320, rolagem até Entrar com convite expandido, desktop 1440,
  zoom CSS de 200%, sistema escuro e isolamento do tema ao abrir cadastro:
  aprovados. Sem exceções JavaScript nos cenários exercitados.
- Capturas locais em `frontend/.cache/login-*.png`, fora do versionamento,
  incluindo `login-patient-390.png`, `login-professional-390.png`,
  `login-loading-390.png`, `login-invite-320-scrolled.png` e `login-desktop.png`.
- Testes humanos, teclado físico/virtual em aparelho, fonte ampliada nativa,
  VoiceOver/TalkBack e autenticação integrada com contas de teste continuam pendentes.
  Os testes simulados não comprovam login real, RLS ou redirecionamentos autenticados.
- Recuperação de senha permanece informativa e cadastro mantém o comportamento
  atual de escolha de perfil; serviços de autenticação e banco não foram alterados.

### Acesso pelo Expo Go

No PowerShell:

```powershell
cd C:\tcc\entrelacos\frontend
npx.cmd expo start --go --lan --clear
```

Após concluir a migração, usar Expo Go compatível com o SDK 57 e celular/computador na mesma rede.
Escanear o QR code; na tela de boas-vindas, tocar em “Já tenho acesso” para
abrir o login redesenhado. As opções foram conferidas na CLI instalada.
O servidor de desenvolvimento deve permanecer aberto durante a validação.

## Complemento: compatibilidade com o Expo Go do iPhone

O usuário relatou incompatibilidade com SDK 57 e confirmou uso de iPhone.
A instalação atual do app de desenvolvimento exige alinhamento do projeto.
Esta correção integra a mesma tarefa de disponibilizar o redesign no Expo Go;
o arquivo foi renomeado sem data conforme a regra atual do constitution.

Escopo técnico: atualizar Expo e módulos nativos para a matriz do SDK 57,
React/React Native correspondentes e adaptar imports de navegação migrados no
SDK 56. Preservar autenticação, papéis, bloqueio de paciente sem associação,
RLS e integrações existentes. Nenhuma alteração de banco ou migration.
Arquivos prováveis: `frontend/package.json`, lockfile, `frontend/app.json`,
`frontend/AGENTS.md`, imports de navegação, `constitution.md` apenas onde a
descrição da arquitetura precisar refletir a mudança da biblioteca.

- [x] Confirmar SDK atual e aparelho; consultar matriz e notas oficiais dos SDKs 55, 56 e 57.
- [x] Confirmar `expo@57.0.20` publicado no npm; preservar a branch e mudanças do redesign.
- [x] Alinhar dependências sem `--force` ou `--legacy-peer-deps`.
- [x] Remover opções obsoletas e migrar APIs de navegação exigidas pelo SDK 57.
- [x] Atualizar referência da versão em `frontend/AGENTS.md` e regras arquiteturais afetadas.
- [x] Executar verificação de dependências Expo, Expo Doctor, TypeScript e lint.
- [x] Exportar web e bundles nativos; conferir a tela e navegação web com o SDK novo.
- [x] Informar o comando atualizado e as limitações reais de validação.

### Testes humanos adicionais

- [ ] Encerrar o Metro anterior, iniciar com cache limpo e escanear o QR code pelo iPhone.
- [ ] Confirmar ausência de aviso de incompatibilidade de SDK no Expo Go.
- [ ] Confirmar boas-vindas → login → cadastro/recuperação e retorno.
- [ ] Conferir fontes, ícones, área segura, teclado, senha e convite no aparelho.
- [ ] Conferir login real e permissões dos dois perfis em ambiente de teste.

Referências: [matriz SDK 57](https://docs.expo.dev/versions/v57.0.0/),
[atualização de SDK](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/),
[SDK 55](https://expo.dev/changelog/sdk-55),
[SDK 56](https://expo.dev/changelog/sdk-56) e [SDK 57](https://expo.dev/changelog/sdk-57).
As validações registradas acima desta seção referem-se à implementação no SDK 54;
os resultados da nova versão estão registrados a seguir.

### Resultados da migração para SDK 57

- Expo `57.0.20`, React Native `0.86.3`, React/React DOM `19.2.3`, Expo Router
  `57.0.19`, Reanimated `4.5.1`, Worklets `0.10.1` e TypeScript `6.0.3`.
  Os demais módulos Expo foram alinhados pelo instalador oficial.
- Os imports de React Navigation foram migrados para os exports do Expo Router;
  dependências diretas antigas removidas. `newArchEnabled` e `edgeToEdgeEnabled`
  removidos da configuração por obsolescência. Plugins indicados pelo instalador
  (`expo-font`, `expo-image`, `expo-status-bar`, `expo-web-browser`) adicionados.
- O hook de tema normaliza o novo estado `unspecified` para claro. O mapa de
  ícones aceita apenas nomes string suportados, respeitando os tipos atuais de
  `expo-symbols`. O contador de confirmação do cadastro inicia após sucesso do
  envio, mantendo os 60 segundos sem atualização síncrona dentro do efeito.
- `frontend/AGENTS.md` referencia a documentação SDK 57. Constitution `1.3.1`
  explicita a navegação fornecida pelo Expo Router. Nenhuma documentação de
  funcionamento foi modificada, conforme a regra de autorização vigente.
- Expo Doctor: **21/21 verificações aprovadas**. Conferência local contra
  `expo/bundledNativeModules.json`: nenhuma dependência incompatível.
- `npm.cmd run typecheck` e `npm.cmd run lint`: aprovados.
- `npx.cmd expo export --platform all`: aprovado; bundles Hermes de iOS e
  Android e dez rotas estáticas web. O processo encerrou com código 0 após o
  aviso de encerramento forçado já observado na versão anterior.
- O teste Linux com npm 10 detectou opcionais `@emnapi/core` e `@emnapi/runtime`
  ausentes no lockfile gerado no Windows. Corrigido com atualização apenas do
  lockfile incluindo opcionais; a repetição de `npm@10 ci --dry-run
  --ignore-scripts --os=linux --cpu=x64 --no-audit --no-fund` foi aprovada.
- Teste de interface em Edge repetido com o novo bundle: aprovado para ambos os
  perfis, convite, validações, mostrar/ocultar senha, loading, trava de reenvio,
  320/390 px, desktop, zoom 200%, sistema escuro e isolamento do tema no cadastro.
  Autenticação simulada, sem chamadas reais ao Supabase nesses testes.
- Confirmação de execução no iPhone e autenticação real permanecem pendentes.
  É necessário encerrar o Metro do SDK 54 com **Ctrl+C**, fechar o projeto no
  Expo Go e executar novamente o comando desta seção, escaneando o novo QR code.
