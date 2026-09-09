# Conectividade do backend

## Visão geral

**Status:** corrigido em 2026-09-08.

O backend atende os fluxos de convite, incluindo a geração do código de acesso
por profissionais, em [`backend/src/server.ts`](../../backend/src/server.ts).
Ele agora escuta em IPv4 por padrão, permitindo que o Expo em um dispositivo
físico acesse a API pelo endereço de rede local configurado em
`EXPO_PUBLIC_API_URL`.

## Funcionamento atual

O servidor usa `HOST=0.0.0.0` quando a variável não é informada e a porta
`PORT=3333` por padrão. A geração do convite é solicitada em
`POST /v1/professional/invitations` e exige um bearer token de profissional
ativo.

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
