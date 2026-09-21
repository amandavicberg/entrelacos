# Conectividade do backend

## Visão geral

**Status:** atualizado em 2026-09-09.

O backend atende os fluxos de convite — geração do código por profissionais,
consumo pelo paciente, listagem de solicitações e aprovação — em
[`backend/src/server.ts`](../../backend/src/server.ts).
Ele agora escuta em IPv4 por padrão, permitindo que o Expo em um dispositivo
físico acesse a API pelo endereço de rede local configurado em
`EXPO_PUBLIC_API_URL`.

## Funcionamento atual

O servidor usa `HOST=0.0.0.0` quando a variável não é informada e a porta
`PORT=3333` por padrão. A geração do convite é solicitada em
`POST /v1/professional/invitations` e exige um bearer token de profissional
ativo.

As rotas exigem bearer token e validam perfil ativo:

- `POST /v1/professional/invitations`: gera código de uso único com validade
  de sete dias para profissional ativo;
- `POST /v1/patient/invitations/consume`: consome o código e cria a associação
  `pending` de forma atômica;
- `GET /v1/professional/relationships/pending`: lista solicitações pendentes
  do profissional autenticado;
- `POST /v1/professional/relationships/:id/approve`: aprova somente uma
  solicitação pendente pertencente ao profissional autenticado.

Para desenvolvimento em celular, `frontend/.env` deve definir
`EXPO_PUBLIC_API_URL` com o IPv4 local da máquina e a porta do backend, por
exemplo `http://192.168.x.x:3333`. O processo do backend deve estar em
execução e o dispositivo deve estar na mesma rede.

## Segurança e limites

O host de escuta não altera a autorização: o endpoint continua validando a
sessão, o papel `professional` e os perfis ativos antes de gravar o convite.
Não exponha `SUPABASE_SECRET_KEY`; ela permanece somente no `.env` do backend.

## Validação

- `npm run typecheck` no diretório `backend/`: concluído sem erros.
- `npm run build` no diretório `backend/`: concluído sem erros.

## Diagnóstico

Se a tela ainda mostrar erro de rede, confirme que `npm run dev` está ativo no
diretório `backend/`, que `EXPO_PUBLIC_API_URL` usa o IP atual da máquina e que
a porta `3333` não está bloqueada pelo firewall. Depois de alterar variáveis
`EXPO_PUBLIC_*`, reinicie o Expo para que elas sejam recarregadas.
