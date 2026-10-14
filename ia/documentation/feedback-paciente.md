# Revisão do fluxo do paciente

**Atualizado em:** 2026-10-14
**Status:** correções implementadas e verificadas localmente; reteste integrado no site publicado pendente.

## Complemento do teste de Aline em 2026-10-14

O novo relatório aprovou A02–A07, N01–N08, N10, V01 e V02; N09 não foi executado. Foram tratados o contraste do botão inicial, o texto após tentar cadastrar e-mail já existente, os espaços no nome e a visibilidade de **Sair da conta** nas telas de conexão e aprovação pendente.

`BrandButton` mantém fundo e texto de alto contraste também em hover/press, usando tokens semânticos. As telas `frontend/app/(patient)/connect.tsx` e `pending.tsx` usam botão secundário com superfície, borda e ícone visíveis sem hover. `frontend/lib/registration-form.ts` normaliza espaços no nome; o formulário mostra o valor normalizado ao perder o foco, e `frontend/lib/registration.ts` envia o mesmo valor ao Supabase. A trigger `supabase/migrations/20260823000002_registration_profile_trigger.sql` já removia espaços nas pontas antes de gravar `profiles.full_name`; não foi necessária migration nova.

Com confirmação de e-mail ativada, o Supabase pode responder a um cadastro repetido sem revelar que a conta existe. Em configurações que retornem `user_already_exists`, o app converte esse caso no mesmo retorno neutro; o cliente não consulta a lista de usuários nem deduz a existência da conta por metadados. A conclusão explica de forma direta que um e-mail já cadastrado não cria segunda conta e pode não receber nova confirmação; oferece **Entrar** e **Recuperar senha**, sem afirmar que aquele endereço específico existe. O reenvio também informa apenas que a solicitação foi recebida. `frontend/lib/auth-errors.ts` mantém erros de transporte, limite e configuração separados e não registra dados pessoais nos logs.

O reteste específico está em `ia/documentation/roteiro-reteste-paciente-aline.md`; a conferência profissional das alterações ainda locais está em `ia/documentation/roteiro-reteste-profissional-gustavo.md`. TypeScript, lint, 22 testes de frontend, exportação web, TypeScript e 2 testes de backend passaram. A entrada pública e o cadastro foram conferidos visualmente em desktop e largura de celular; normalização do nome foi conferida no navegador. Não houve login com credenciais do relatório nem teste autenticado remoto nesta validação.

## Objetivo e funcionamento

Esta revisão atende aos pontos observados no teste da área do paciente: campos de autenticação, contagem da senha, contraste e navegação, carregamento de materiais, visibilidade dos documentos e mensagem de aniversário. A interface do paciente também passou a seguir a linguagem visual clara da área profissional.

- Login e cadastro usam o modo preenchido de `AppInput`, sem contorno no estado normal. Foco e erro mantêm indicação visual. O campo de e-mail não quebra a linha do texto em largura estreita.
- O mínimo de dez caracteres da senha desconsidera espaços. Maiúscula, minúscula, número e símbolo continuam obrigatórios. O mesmo validador atende cadastro e redefinição de senha.
- Pacientes com vínculo ativo têm quatro abas persistentes: **Início**, **Agenda**, **Materiais** e **Meu espaço**. O antigo menu lateral foi substituído por essas abas; documentos, mural, check-ins, orientações e histórico ficam no hub **Meu espaço**. As subtelas têm retorno explícito a esse hub. Pacientes pendentes ou sem vínculo continuam no fluxo protegido de conexão/aprovação, sem acesso às abas ativas.
- As telas usam tema claro, logomarca PNG, cabeçalho e cartões responsivos alinhados à linguagem da área profissional. A home prioriza check-in, próxima consulta e conteúdos compartilhados. **Meu espaço** mostra ações e conta com saída visível; falha ao sair produz mensagem. A agenda tem calendário e horários do dia selecionado, seguidos pelas próximas consultas e ações de confirmação/cancelamento.
- A agenda da home é carregada independentemente de orientações e materiais. Falha em uma consulta de conteúdo não oculta a agenda nem a contagem dos conteúdos que carregaram. A tela de materiais mantém a lista já carregada durante uma atualização, inclui busca, exibe a quantidade recebida e distingue falha de carregamento de lista vazia. A biblioteca profissional deixa explícito que salvar um material não equivale a compartilhá-lo.
- Documentos, mural e check-ins usam cartões, estados vazios e erros com tentativa de atualização. Quando há mais de um vínculo ativo, a lista acompanha o profissional selecionado. O envio de PDF informa que o upload começa ao selecionar o arquivo e confirma quando o documento foi registrado para o vínculo.
- O cliente percorre as páginas de documentos, recados e check-ins dos endpoints do paciente e do profissional em lotes de 100, em vez de mostrar apenas os 30 primeiros. Na ficha profissional, falha ao buscar PDFs tem aviso próprio e ação para tentar novamente.

## Dados e autorização

A implementação reutiliza `patient_professional_relationships`, `patient_material_shares`, `professional_materials`, `patient_documents`, `patient_profiles` e `professional_birthday_messages` das migrations existentes. Não houve mudança de banco ou policy. As rotas de materiais e documentos continuam restritas ao paciente com vínculo ativo ou ao profissional do vínculo; pacientes sem vínculo ativo e perfis desativados não recebem esses dados.

O backend em `backend/src/patient-space.ts` retorna a mensagem de aniversário somente na data de nascimento no fuso de São Paulo. A mensagem personalizada cadastrada pelo profissional substitui a mensagem padrão nessa data. Ela não é uma notificação recorrente fora do aniversário.

Com autorização específica para consulta somente de metadados no projeto remoto, a biblioteca profissional tinha três registros, mas a tabela de compartilhamentos tinha apenas um registro ativo; portanto, só um material estava disponível para o paciente naquela verificação. A tabela de documentos tinha um PDF ativo associado ao mesmo vínculo. Essa verificação não incluiu a abertura de conteúdo clínico. O registro do PDF no banco não comprova, por si, sua exibição na ficha profissional: esse caminho ainda requer teste integrado com as duas contas.

## Pontos de manutenção

- UI e navegação: `frontend/app/(patient)/index.tsx`, `frontend/app/(patient)/minha-agenda.tsx`, `frontend/app/(patient)/space.tsx`, `frontend/components/patient/patient-screen.tsx`, `frontend/app/(patient)/_layout.tsx`, `frontend/tamagui.config.ts`.
- Cadastro: `frontend/components/app-input.tsx`, `frontend/lib/registration-form.ts`, `frontend/app/login.tsx`, `frontend/app/cadastro.tsx`.
- Conteúdo: `frontend/components/patient/follow-up-section.tsx`, `frontend/components/patient/patient-space-section.tsx`, `frontend/lib/api.ts`, `frontend/app/(professional)/patients/[relationshipId].tsx`, `frontend/app/(professional)/materials.tsx`.
- O tempo limite da API passou de 15 para 60 segundos para permitir o primeiro acesso após a API hospedada estar inativa. Se a hospedagem continuar lenta, investigar métricas do serviço e não aumentar indefinidamente esse limite.

## Validação e limites

TypeScript e lint do frontend passaram após os ajustes finais; os 19 testes do frontend, incluindo o caso de espaços na senha, a exportação web e TypeScript do backend também passaram. O diff foi revisado sem erros de whitespace. A prévia local abriu com sessão profissional e falha de conexão à API, então não houve validação visual das telas autenticadas do paciente nesse ambiente.

Ainda é necessário testar em duas contas vinculadas, com a API acessível: compartilhar mais de um material e confirmar o total na tela do paciente; abrir o PDF existente na ficha do profissional; usar as abas, voltar das subtelas por **Meu espaço** e sair da conta; verificar a mensagem de aniversário no dia correto. Um PDF ativo está registrado no banco, mas a tela do profissional pode falhar na consulta ou na abertura; o frontend agora mostra um erro específico e permite repetir a busca. A primeira checagem nesses casos é confirmar vínculo e estado do registro, sem registrar conteúdo clínico em logs.

Na versão publicada anterior à revisão, a sessão de teste do paciente mostrava um único material tanto no resumo quanto na lista, coerente com o único compartilhamento ativo identificado. O primeiro acesso à API hospedada pode demorar após inatividade; o cliente aguarda até 60 segundos antes de informar falha.
