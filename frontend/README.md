# Aplicativo mobile EntreLaços

Aplicativo React Native construído com Expo SDK 57, Expo Router, TypeScript e
Tamagui. Ele atende a jornada pública de cadastro, confirmação de e-mail,
login e recuperação de senha, além dos acessos protegidos de paciente e
profissional.

## Desenvolvimento

Use Node.js 22.13 ou superior, conforme a referência do Expo SDK 57.

```bash
npm ci
cp .env.example .env
npm start
```

Preencha no `.env` somente variáveis públicas:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_API_URL=http://localhost:3333
```

Para testar em um dispositivo físico, `EXPO_PUBLIC_API_URL` precisa apontar
para o IPv4 acessível da máquina que executa o backend, e não para
`localhost`.

## Validação

```bash
npm run typecheck
npm run lint
npm run build
node scripts/professional-dashboard.test.mjs
```

Configure o esquema `entrelacos` nas URLs de redirecionamento do Supabase para
que confirmação e recuperação de senha retornem ao aplicativo. A tela de
recuperação não informa se um endereço de e-mail possui conta cadastrada.
