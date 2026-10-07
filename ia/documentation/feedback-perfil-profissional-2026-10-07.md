# Correções do teste do perfil profissional

Atualizado em 2026-10-07. Implementado na `main`. Esta revisão reutiliza as tabelas e os endpoints existentes: `professional_invites`, `patient_professional_relationships`, `professional_birthday_messages`, `professional_materials`, `patient_material_shares`, `patient_documents`, observações e consultas. Nenhuma migration foi criada ou aplicada. O frontend usa a chave pública; convites, compartilhamentos e URLs assinadas continuam sob autenticação e autorização do backend.

## Fluxos corrigidos

- Convites gerados em `backend/src/invitations.ts` agora têm 10 caracteres alfanuméricos maiúsculos, 50 bits de aleatoriedade, hash SHA-256 no banco, uso único e validade de sete dias. A função SQL existente aceita tanto os códigos novos quanto os antigos.
- Cadastro e recuperação validam uma senha de no mínimo 10 caracteres com maiúscula, minúscula, número e símbolo em `frontend/lib/registration-form.ts`. `supabase/config.toml` reproduz a mesma regra no ambiente local. **A configuração do Supabase hospedado não muda com este commit:** é necessário ajustar o Auth no painel remoto para impor essa política no servidor. A política reforçada pode afetar usuários existentes com senha fraca, conforme a documentação do Supabase.
- `frontend/lib/secure-storage.ts` mantém a sessão web em `sessionStorage`, preservando-a ao recarregar a mesma aba e encerrando-a ao fechar a aba. No mobile, continua `expo-secure-store`. O acesso a storage web tem fallback em memória quando o navegador o bloqueia.
- `backend/src/birthday.ts` compara o dia de nascimento com o calendário de `America/Sao_Paulo`. A home do paciente consulta o aniversário separadamente dos demais resumos, ao receber foco e periodicamente, de modo que uma falha em agenda ou materiais não esconda a saudação.
- O resumo profissional distingue “Consultas sem resposta” de “Vínculos para aprovar”. As rotas profissional e paciente recarregam dados ao ganhar foco; consultas, documentos e materiais recebem atualização periódica enquanto as respectivas telas estão abertas. Há ação manual para atualizar materiais e acompanhamento.
- A rota de detalhe do paciente foi removida da barra inferior com `href: null`. `ProfessionalScreen` não força o conteúdo do scroll a encolher, e o cabeçalho e as seções do detalhe preservam altura natural, impedindo a sobreposição vista no teste.
- A data e hora de observações e consultas usam `DD/MM/AAAA HH:mm`, máscara e validação de calendário antes da chamada à API em `frontend/lib/date-time-input.ts`. O fuso local é convertido a ISO apenas no envio.
- O cabeçalho profissional mostra o ícone oficial sobre fundo índigo, sem a cápsula marfim isolada. O HTML web declara `pt-BR` e `translate="no"` para evitar que a tradução automática substitua rótulos como “Início” por frases incorretas.
- O backend de materiais lista compartilhamentos ativos e busca os materiais ativos por ID, sem depender da expansão relacional do PostgREST. O detalhe profissional mantém seções independentes quando uma consulta falha e exibe aviso para atualização. PDFs enviados pelo paciente são consultados pelo vínculo ativo; a tela recebe atualizações ao ganhar foco e a cada 30 segundos.
- `frontend/lib/open-external.ts` abre uma nova aba web no gesto do usuário antes de buscar a URL assinada. Materiais e PDFs abrem nela; a aba do aplicativo e sua sessão permanecem disponíveis. No mobile é usado `Linking.openURL`.

## Limites de acesso e dados

Pacientes só consultam materiais compartilhados com seu vínculo ativo e seus próprios documentos; profissionais só consultam documentos de vínculos ativos e materiais próprios. O backend continua validando papel, vínculo e status; storage privado usa URL assinada de curta duração. Usuários sem vínculo ativo permanecem bloqueados das telas de acompanhamento. Nenhuma informação clínica ou credencial foi usada nos testes automatizados.

## Validação e pendências

- `frontend`: TypeScript, lint, 15 testes e exportação estática web de 33 rotas passaram com Node 22. A exportação confirmou `lang="pt-BR"` e `translate="no"` no HTML.
- `backend`: TypeScript, compilação e 2 testes passaram, incluindo limite de data em São Paulo.
- A máquina possui um `node` 18 usado dentro de `npm run` do frontend, embora o shell indique Node 22. Por isso testes e exportação foram invocados diretamente com o executável Node 22; `npm test`/`npm run build` locais sem esse executável falham por versão do runtime. Na hospedagem, usar Node 22 conforme `frontend/package.json`.
- Ainda falta validar os fluxos completos com duas contas descartáveis no Supabase hospedado, inclusive aniversário real, confirmação de consulta, compartilhamento, PDF e recarga da sessão. As regras de senha do Auth remoto devem ser atualizadas no painel, e a publicação de frontend/backend deve ser observada antes de considerar a correção em produção. Não foi feita mudança remota no Supabase nem aplicado SQL.

Para manutenção, iniciar pelo endpoint de `backend/src/follow-up.ts` quando um material ou documento não aparecer; comparar o `relationship_id` ativo com o compartilhamento/documento sem registrar dados clínicos em logs. Para mensagens de aniversário, verificar `birth_date` em `patient_profiles`, vínculo ativo, linha de `professional_birthday_messages` e fuso do backend. Para navegação web, conferir o HTML exportado e `frontend/vercel.json`.
