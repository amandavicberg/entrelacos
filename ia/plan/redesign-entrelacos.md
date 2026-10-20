# Redesign do EntreLaços

## Objetivo e escopo

Refatorar a apresentação de todo o aplicativo com uma linguagem contemporânea,
acolhedora e responsiva, inspirada nas referências fornecidas e na identidade
oficial. Nome e escopo derivados da solicitação explícita do usuário.

Inclui tokens Tamagui, componentes compartilhados, entrada, autenticação,
navegação, painéis e apresentação das telas de paciente e profissional.
Não inclui regras de negócio, serviços, hooks de domínio, contratos de API,
autorização, persistência, novas funcionalidades, dependências. Publicação autorizada posteriormente, após conclusão de todas as telas.
Inicialmente o usuário pediu revisão local antes da publicação. Depois autorizou explicitamente publicar ao concluir a refatoração em todas as telas. A publicação ocorrerá somente após a revisão e validação final.

## Decisões

- Camada afetada: frontend; backend e Supabase permanecem inalterados.
- Reutilizar dados e operações existentes sem consultar dados reais para a
  validação visual. Nenhuma tabela, coluna, migration ou policy necessária.
- Manter guards por papel/vínculo: paciente ativo, pendente, não associado,
  profissional e sessão encerrada continuam com o mesmo acesso.
- Preservar logo oficial, Poppins e paleta; usar marfim como base, índigo para
  ações e blocos de destaque e ocre em pequenos detalhes.
- Reutilizar AppScreen, AppCard, BrandButton, AppInput, FeedbackState e BrandLogo.
- Responsividade por largura e escala de fonte; navegação adaptada, áreas de
  leitura limitadas, controles confortáveis e estados de foco/erro/carregamento.
- Seguir constitution quando divergir das skills: nome do plano sem data;
  documentação em ia/documentation somente após solicitação explícita.
- Branch local: codex/redesign-entrelacos, criada de origin/main atualizada.

## Plano

- [x] Ler constitution, instruções Expo 57 e documentação da base; mapear telas.
- [x] Definir direção visual e registrar escopo antes da implementação.
- [x] Refatorar tokens e componentes de interface compartilhados.
- [x] Recompor entrada e jornada de autenticação.
- [x] Refinar navegação e painéis de ambos os perfis.
- [x] Revisar listas, formulários, calendário e telas secundárias.
- [x] Validar TypeScript, lint, testes existentes e exportação web.
- [x] Inspecionar prévia local em larguras de celular e desktop.
- [x] Revisar diff para confirmar que regras e serviços não foram alterados.
- [ ] Concluir a revisão de todas as rotas e publicar na hospedagem existente, conforme autorização posterior do usuário.
- [ ] Verificar o deployment e entregar o endereço publicado.

## Validação humana

- [ ] Revisar identidade, logo, espaçamento e hierarquia visual nas telas.
- [ ] Testar login/cadastro/recuperação e mensagens de erro nos dois perfis.
- [ ] Confirmar bloqueio de paciente pendente ou sem vínculo ativo.
- [ ] Conferir navegação e rolagem em Android/iOS, teclado e áreas seguras.
- [ ] Testar fonte ampliada, leitor de tela, foco por teclado e contraste.
- [ ] Paciente: check-ins, agenda, materiais, documentos, mural e histórico.
- [ ] Profissional: agenda, pacientes, convites, observações e materiais.
- [ ] Conferir estados vazio, carregando, erro e ações desabilitadas.
- [ ] Revisar a versão publicada e registrar feedback visual (publicação já autorizada pelo usuário).

## Direção visual refinada após revisão do usuário

O usuário reforçou o foco mobile e pediu uma linguagem mais marcante, próxima
à referência com fotografia imersiva e superfícies sobrepostas. A composição
passa a priorizar 320–430 px, abertura com imagem, formulário em superfície
contínua com cantos amplos, tipografia Poppins mais leve e destaques fotográficos
nos painéis. Desktop é uma adaptação secundária.

Asset exclusivo: `frontend/assets/images/care-texture.jpg`, gerado com a
ferramenta integrada ImageGen e comprimido em JPEG para uso mobile. Não altera
nem reproduz a logo. Imagem decorativa sem dados de pacientes. Prompt usado:

> Use case: photorealistic-natural. Asset type: immersive mobile application background, portrait 1024x1536. Create one refined editorial photograph for EntreLaços, a Portuguese app connecting patients and care professionals. A sculptural fold of mineral indigo linen draped softly alongside ivory linen, a gentle warm golden beam of late afternoon sunlight across the weave, subtle shadows of leaves on a warm plaster wall. Tactile real woven fabric, restrained fashion-editorial art direction, quietly magnetic and human, warm close-up material study. The folds suggest continuity and connection without knots or literal logo shapes. Composition: calm dark indigo negative space in the upper-left and lower-left for cream interface type, ivory folds and soft golden highlights flowing across the center-right. Restrained palette mineral indigo #34465C, warm ivory #F3EBDD, muted golden ochre #BE914F, ink #292F36. Rich photographic depth, natural grain and realistic textile detail, soft daylight, elegant contrast. No people, no hands, no text, no logo, no icons, no UI, no border, no mockup devices. This is a photographic material background only, not a logo redesign.

## Riscos e limites

Mudanças compartilhadas propagam-se a todas as telas; executar build e revisar
layouts estreitos. Testes locais não substituem validação nativa e fluxos
autenticados com contas de teste. Não contornar autenticação no aplicativo.

## Validação executada pelo agente

- TypeScript e ESLint sem erros; 22 testes existentes passaram.
- Exportação web de produção concluída com 39 rotas.
- Inspeção visual em 320 e 390 px e adaptação desktop. Telas internas
  verificadas com dados fictícios em uma compilação isolada fora do projeto.
- Conferidos painéis, agenda, pacientes, detalhe do paciente, perfil, materiais,
  check-ins, espaço, documentos, recados, histórico e orientações.
- Artefato de produção sem fixtures ou bypass de autenticação; configuração
  Metro original preservada. Backend, serviços, guards e banco inalterados.
- Testes em dispositivos Android/iOS, leitor de tela e jornadas completas
  com contas reais não executados; checklist humana permanece pendente.
