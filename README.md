# entrelacos
Plataforma digital para acompanhamento entre pacientes e profissionais, desenvolvido como TCC.

## Requisitos

- Node.js 22 (o Expo SDK 54 requer Node.js 20.19 ou superior);
- npm;
- uma configuração do Supabase para executar as integrações.

Use o arquivo `.nvmrc` para selecionar a versão recomendada quando estiver
usando nvm ou uma ferramenta compatível.

## Configuração inicial

Clone o repositório, entre na pasta do projeto e instale as dependências de
cada aplicação:

```bash
cd frontend
npm ci
cp .env.example .env
```

Preencha no `frontend/.env` somente:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Depois configure o backend:

```bash
cd ../backend
npm ci
cp .env.example .env
```

Preencha no `backend/.env` as variáveis necessárias para o ambiente local:

```env
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_JWKS_URL=
```

Arquivos `.env` são locais e não devem ser commitados. Nunca use
`SUPABASE_SECRET_KEY` no frontend.

## Executando

Em um terminal, inicie o frontend:

```bash
cd frontend
npm start
```

Em outro terminal, inicie o backend:

```bash
cd backend
npm run dev
```

O backend atual é apenas a inicialização da configuração do Supabase; ainda
não há endpoints HTTP de domínio.

## Banco local e migrations

O projeto usa o Supabase CLI para reproduzir o banco localmente. Depois de
instalar o CLI e ter o Docker em execução, cada integrante deve executar uma
vez:

```bash
supabase start
supabase db reset
```

O `db reset` recria somente o banco local e aplica automaticamente todas as
migrations versionadas em `supabase/migrations/`. Não é necessário criar as
tabelas manualmente. O Studio local fica disponível em
`http://127.0.0.1:54323`.

Use `supabase status` para obter a URL e a chave publicável locais e preencher
o `frontend/.env`. Se o backend for executado localmente, use também as
informações locais correspondentes no `backend/.env`; nunca versione esses
valores.

O projeto remoto não precisa ser vinculado para o desenvolvimento local. Para
aplicar migrations em um projeto remoto, o responsável deve vincular o projeto
com `supabase link`, revisar `supabase db push --dry-run` e só então executar
`supabase db push`. Nunca usar `supabase db reset --linked` em produção.

## Validação

Execute os comandos antes de abrir um pull request:

```bash
cd frontend
npm run typecheck
npm run lint
npm run build

cd ../backend
npm run build
```

O `frontend` usa Expo Router, Tamagui e TypeScript. O `backend` usa Node.js,
TypeScript e configuração server-side do Supabase.

## Documentação de desenvolvimento

- [`constitution.md`](constitution.md): regras normativas de arquitetura, domínio, segurança e banco de dados.
- [`docs/guia-ambiente-local-e-migrations.md`](docs/guia-ambiente-local-e-migrations.md): instalação do Docker e Supabase CLI, ambiente local e fluxo de migrations.
- [`skills/documentation/SKILL.md`](skills/documentation/SKILL.md): documentação do funcionamento e das decisões após tasks concluídas.
- [`ia/documentation/configuracao-inicial.md`](ia/documentation/configuracao-inicial.md): configuração final da base inicial e orientações para manutenção.
