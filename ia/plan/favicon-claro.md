# Favicon com fundo claro

## Escopo

Usar fundo marfim claro no favicon PNG, opção aceita pelo usuário. Preservar o símbolo, proporções e cores azul/dourado da marca.
Alteração exclusiva do favicon web; ícones nativos e logos originais intactos.
Sem alteração de regras, permissões, backend, dados, migrations ou dependências.
Publicação segue a autorização do redesign nesta conversa.

## Plano

- [x] Inspecionar favicon atual, identidade oficial e configuração Expo.
- [x] Preparar variante PNG com fundo marfim a partir do arquivo existente.
- [x] Configurar favicon, exportar e conferir o arquivo entregue nas rotas.
- [ ] Publicar e verificar o favicon em produção.

## Validação humana

- [ ] Conferir o favicon nas abas em tema claro e escuro.
- [ ] Conferir favoritos no navegador mobile.

## Limites

O símbolo detalhado mantém suas características em tamanho pequeno. Alguns
navegadores mantêm cache de favicon; usar endereço versionado se necessário.

## Asset e configuração

Variante gerada com ImageGen integrado, inspecionada e reduzida proporcionalmente
a 64 × 64 px em `frontend/public/favicon-marfim.png`. A logo e os ícones
nativos originais permanecem intactos. `app/+html.tsx` declara o PNG em todas
as rotas; retirada a geração automática do ICO antigo em `app.json` para
evitar favicons concorrentes. Nome novo reduz reutilização de cache antigo.

Prompt final:

> Precise background-only edit of this official EntreLaços app icon for use as a favicon PNG. Replace ONLY the dark blue background with a flat solid warm ivory #F3EBDD background, including background gaps around and through the ribbons. Keep the existing central ribbon cross and gold curved ribbon symbol EXACTLY unchanged: same blue and gold colors, fabric detail, silhouette, proportions, arrangement and placement. Do not redraw, simplify, distort, recolor or crop the symbol. Preserve square canvas and existing margins. No text, no new shapes, no shadows added, no border, no other changes. Deliver a single square PNG image.

TypeScript, lint e exportação web passaram. As 39 páginas HTML exportadas
referenciam um único favicon PNG e o asset é idêntico ao arquivo aprovado.
