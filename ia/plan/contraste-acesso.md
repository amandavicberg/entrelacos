# Contraste na entrada do aplicativo

## Escopo e decisão

Corrigir a aparência apagada dos perfis no login/cadastro e da seção
“Recebeu um convite?”. Sem mudanças de autenticação, validações, papel,
convites, API, banco ou dependências. Publicar conforme autorização vigente.

Inspeção do DOM em produção encontrou opacity 0.55 em botões ativos:
a regra disabledStyle do Tamagui usa [aria-disabled], incluindo o valor false.
Normalizar aria-disabled=false para ausência do atributo no AppButton mantém
semântica habilitada e impede estilo de desabilitado indevido. Estados true
continuam preservados. Reusar tokens da marca para reforçar borda e texto.

## Plano

- [x] Ler instruções e inspecionar DOM, estilos e componentes existentes.
- [x] Corrigir estado visual habilitado e contraste de perfis/convite.
- [x] Validar TypeScript, lint, exportação e interação visual mobile.
- [ ] Publicar e confirmar resultado em produção.

## Testes humanos

- [ ] Conferir contraste e seleção nos dois perfis em login e cadastro.
- [ ] Abrir/fechar convite e conferir leitura do campo no celular.
- [ ] Conferir teclado, fonte ampliada e leitor de tela em Android/iOS.
- [ ] Validar estados de envio/desabilitado com contas de teste.

## Validação executada

TypeScript, ESLint e exportação web (39 rotas) passaram. DOM local confirmou
opacity 1 nos perfis ativos, sem aria-disabled falso. Conferidos login em
390 px, cadastro em 320 px, alternância de perfis e abertura/fechamento do
convite. Nenhuma credencial enviada ou alteração persistente realizada.
Contraste calculado pelos tokens: perfis 9,42:1; título do convite 7,40:1;
descrição do convite 10,36:1. Estados desabilitados reais mantêm a regra
existente; envio autenticado e validação nativa permanecem para teste humano.
