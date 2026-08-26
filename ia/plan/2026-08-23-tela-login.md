# Tela de login

## Nome da task

`tela-login`

## Descrição objetiva

Reformular a tela de login conforme o Constitution v1.3.0 e integrá-la ao
cadastro de usuário existente. O acesso deve autenticar por e-mail e senha,
validar o papel real do perfil e respeitar o bloqueio do paciente sem associação
ativa.

## Escopo

- Reaproveitar o design system Tamagui, `AppScreen`, `AppHeader`, `AppInput`,
  `BrandButton` e `FeedbackState`, seguindo o padrão visual do cadastro.
- Permitir selecionar paciente ou profissional, informar e-mail e senha e
  mostrar/ocultar a senha.
- Autenticar com Supabase Auth e validar `profiles.role` antes de redirecionar.
- Direcionar profissional ativo à área profissional, paciente associado à área
  do paciente e paciente sem associação ativa à tela de pendência.
- Aceitar código de convite somente no primeiro acesso do paciente que ainda
  não possui associação, sem tratá-lo como credencial.
- Integrar a ação de primeiro acesso à rota pública `/cadastro` já existente.
- Manter estados de restauração de sessão, envio, validação e erro acessíveis.
- Resolver o conflito atual de `frontend/app/index.tsx` preservando cadastro e
  login.

## Fora do escopo

- Implementar recuperação ou redefinição de senha; permanece apenas a rota
  pública já preparada.
- Alterar o cadastro de usuário, salvo integração estritamente necessária com
  sua rota.
- Criar ou aplicar migrations, tabelas, policies ou alterações diretas no banco.
- Implementar convite profissional, aprovação de associação ou dashboards
  definitivos.
- Login social, biometria, MFA, QR Code e funcionalidades clínicas.
- Criar ou atualizar documentação em `ia/documentation/` sem autorização
  explícita.

## Decisão de dados e autorização

- O login reutiliza `auth.users` por meio do Supabase Auth, `profiles.role` e
  `profiles.status`, além de `patient_professional_relationships` para verificar
  associações `active` ou `pending` com `status = 0`.
- Nenhuma nova entidade ou atributo é necessário; portanto, não será criada
  estrutura persistente nem migration nesta task.
- A escolha visual do papel não autoriza acesso. O papel autenticado deve
  coincidir com `profiles.role`.
- Profissional autenticado e ativo acessa apenas o grupo profissional.
- Paciente autenticado com associação `active` acessa o grupo paciente.
- Paciente sem associação ativa permanece na tela protegida de pendência, sem
  leitura ou escrita de dados do produto.
- Perfil inexistente, inválido ou desativado não deve acessar área protegida e a
  sessão deve ser encerrada.

## Camadas afetadas

- **Frontend:** rota inicial, integração com `/cadastro`, formulário, contexto
  de autenticação, guards e componentes compartilhados já existentes.
- **Backend:** reutilização do consumo de convite existente, sem mudança
  planejada.
- **Supabase/banco:** somente leitura/autenticação pelas estruturas atuais; sem
  migration.
- **Documentação:** fora do escopo até autorização explícita.

## Plano

- [x] Ler o Constitution v1.3.0, as instruções do frontend, a documentação da
  base compartilhada e a documentação oficial do Expo SDK 54.
- [x] Inspecionar o cadastro funcional, o login existente, o contexto de
  autenticação, as rotas e o conflito de merge.
- [x] Registrar a decisão de reutilização dos dados e os limites de autorização.
- [x] Resolver o conflito da rota inicial preservando o formulário de login e
  conectando-o à rota `/cadastro`.
- [x] Harmonizar a tela de login com o padrão visual e de acessibilidade do
  cadastro, sem duplicar componentes compartilhados.
- [x] Confirmar que estados de sessão, erro, carregamento e redirecionamento
  continuam coerentes para paciente e profissional.
- [x] Executar lint, checagem TypeScript e build web; revisar o diff e a ausência
  de marcadores de conflito e segredos.

## Validação automatizada e critério de pronto

- [x] `npm run lint` concluído sem erro relacionado à task.
- [x] `npm run typecheck` concluído sem erro.
- [x] `npm run build` concluído sem erro.
- [x] Nenhum marcador de conflito permanece no repositório.
- [x] A rota inicial oferece login funcional e navegação para `/cadastro`.
- [x] O papel selecionado nunca substitui a autorização baseada no perfil real.

## Checklist de testes manuais

Estes itens devem permanecer desmarcados até confirmação do responsável:

- [ ] Entrar como profissional com credenciais válidas e confirmar o destino.
- [ ] Entrar como paciente com associação ativa e confirmar o destino.
- [ ] Entrar como paciente com associação pendente e confirmar o bloqueio.
- [ ] Tentar papel divergente, credenciais inválidas e perfil desativado.
- [ ] Validar campos vazios, e-mail inválido, exibição da senha e duplo toque.
- [ ] Abrir o cadastro pelo link do login e voltar ao login após o cadastro.
- [ ] Conferir tela pequena, teclado aberto, fonte ampliada e temas claro/escuro.
- [ ] Conferir rótulos, ordem de foco, leitor de tela e mensagens de erro.

## Riscos e dependências

- O conflito de merge da rota inicial foi resolvido preservando tanto o login
  quanto o acesso ao cadastro recém-integrado.
- O fluxo depende das migrations de identidade/cadastro e das policies já
  existentes no ambiente utilizado, mas esta task não as aplica.
- A recuperação de senha continua incompleta e não deve ser apresentada como
  funcionalidade concluída.
- Os dashboards são placeholders; os guards continuam sendo a barreira de
  acesso relevante nesta etapa.

## Decisões pendentes

- Nenhuma decisão de modelo de dados é necessária para esta entrega.
- A confirmação dos testes manuais em dispositivos permanece sob
  responsabilidade do programador ou responsável pela validação.
