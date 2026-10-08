# Biblioteca de materiais do profissional

**Atualizado em:** 2026-10-07. **Estado:** refatoração da interface implementada na `main`.

## Funcionamento

A rota `frontend/app/(professional)/materials.tsx` mantém a biblioteca de conteúdos de apoio do profissional. A tela mostra primeiro busca por título ou descrição, filtros locais (Todos, Links e Arquivos) e a lista de materiais. Cada cartão informa tipo e origem, permite abrir o conteúdo e inicia o compartilhamento daquele material específico. Esse comando abre uma janela com pacientes de vínculo ativo, busca por nome sem diferenciar maiúsculas ou acentos, seleção individual ou de todos os resultados visíveis e confirmação explícita em **Enviar material**. A seleção pertence apenas ao material aberto; buscar outro nome mantém as seleções anteriores, e cancelar descarta tudo. Sem pacientes ativos ou sem resultado para a busca, a janela mostra uma mensagem apropriada.

O cadastro abre sob demanda e aceita links HTTP/HTTPS classificados como e-book, podcast ou vídeo, ou arquivos privados PDF/áudio. O cliente verifica título, presença do arquivo e formato básico do endereço antes da chamada à API; o backend continua responsável pela validação definitiva. Erros do cadastro e do compartilhamento aparecem junto à ação. A lista inclui carregamento, erro com nova tentativa, biblioteca vazia e busca sem resultados. O uso de arquivos é exibido ao final como informação secundária. A lista é atualizada ao receber foco e após cadastro sem substituir toda a tela por um carregamento.

## Dados e segurança

A tela reutiliza as funções de `frontend/lib/api.ts`: listagem de materiais e pacientes ativos, cadastro de link, preparação/upload/confirmação de arquivo, abertura por URL autorizada e compartilhamento com vínculos selecionados. A lista de pacientes percorre páginas de 100 itens no endpoint `GET /v1/professional/patients`, para que profissionais com muitos vínculos encontrem todos os nomes. Em `backend/src/follow-up.ts`, o endpoint filtra relacionamentos com `relationship_status = active` e `status = 0`, inclui somente perfis de paciente com `status = 0` e retorna `hasMore` com base na página original de relacionamentos. O frontend filtra os nomes recebidos; a API de compartilhamento continua verificando autorização e vínculo ativo no momento do envio. Os dados persistidos continuam nas estruturas existentes; não houve migration ou mudança no banco. Pacientes e usuários desativados não acessam esta rota profissional.

## Validação e manutenção

- Validados TypeScript, lint, 18 testes do frontend, build e 2 testes do backend, e exportação web com Node 22.
- Prévia local inspecionada em desktop e largura de celular; filtros, busca vazia, alternância entre link/arquivo, busca por nome e seleção de paciente para compartilhar foram exercitados sem salvar ou compartilhar dados reais. O campo de busca agora exibe uma única borda ao receber foco; o botão de envio ocupa a largura da janela no celular.
- Ao estender o cadastro, manter limites e tipos de arquivo sincronizados com a validação do backend. Ao alterar compartilhamento, preservar a seleção por material e autorização por vínculo.
