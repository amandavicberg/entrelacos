# Tela inicial com ondas

## Nome da task

Tela inicial com ondas

## Descrição objetiva

Reorganizar a tela pública inicial do EntreLaços para retirar o card atual de
acesso, apresentar a marca e a explicação do aplicativo fora da área de ondas,
e concentrar as ações de começar e acessar dentro de uma composição visual
curva e acolhedora.

## Escopo incluído

- Ajustar a composição visual de `frontend/app/index.tsx`.
- Reutilizar o tema Tamagui, a tipografia Poppins, a logo textual/ícone atual e
  a rota de login existente.
- Manter `Começar` como ação principal e `Já tenho acesso` como ação secundária.
- Garantir legibilidade, áreas de toque confortáveis e adaptação básica a
  diferentes larguras de tela.

## Fora do escopo

- Alterar autenticação, cadastro, navegação, autorização ou persistência.
- Alterar backend, Supabase, tabelas, migrations ou policies.
- Adicionar imagens, dependências ou uma nova identidade visual completa.

## Plano

- [x] Consultar constitution, instruções do frontend e documentação da base.
- [x] Definir a decisão de reaproveitar componentes, tokens e rota existentes.
- [x] Implementar logo e textos institucionais fora da área de ondas.
- [x] Implementar a área de ações com formas curvas e os dois botões.
- [x] Executar typecheck, lint e build web do frontend.
- [x] Revisar o diff; documentação específica permanece fora do escopo por
  regra do constitution que exige solicitação explícita.

## Camadas e autorização

- Camada afetada: frontend, somente apresentação da rota pública `/`.
- Backend, banco e documentação da base compartilhada não precisam de mudança
  estrutural.
- Usuários não autenticados veem a apresentação e podem seguir para `/login`.
- Usuários autenticados continuam sujeitos aos redirects já existentes para
  paciente ativo, paciente pendente ou profissional.
- Não há leitura ou escrita de dados de saúde nesta tela.

## Design system e validação

- Reutilizar tokens `$brand`, `$brandContrast`, `$background`, `$muted`,
  `$heading`, `$body` e raios existentes do Tamagui.
- Usar elipses nativas como formas decorativas, evitando dependência adicional
  de SVG ou imagem raster.
- Validar estados de carregamento e redirects preservados, contraste,
  responsividade, acessibilidade das ações e navegação dos dois botões.

Validação automatizada concluída: `npm run typecheck`, `npm run lint` e
`node ./node_modules/expo/bin/cli export --platform web` passaram. O comando
`npm run build` usa o Node 18 do npm nesta sessão e falha antes do bundling por
`configs.toReversed is not a function`; o mesmo build executado diretamente
com o Node 22.23.2 do ambiente foi concluído com sucesso.

## Migration necessária

Não há mudança persistente; nenhuma migration é necessária.

## Riscos e decisões pendentes

- As ondas são compostas por elipses absolutas e devem ser conferidas em telas
  muito estreitas e em tema escuro.
- A validação visual em dispositivo físico permanece pendente até execução
  manual pelo responsável.

## Checklist de testes manuais

- [ ] Abrir a tela inicial sem sessão e confirmar logo, textos e ondas.
- [ ] Tocar em `Começar` e confirmar navegação para o login.
- [ ] Tocar em `Já tenho acesso` e confirmar navegação para o login.
- [ ] Conferir leitura e contraste em tema claro e escuro.
- [ ] Conferir layout em tela estreita e em tela maior, sem corte de textos ou
  botões.
- [ ] Confirmar que uma sessão existente ainda redireciona para a área correta.
