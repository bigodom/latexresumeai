# Backend Supabase da alpha

Este diretório contém o banco, as políticas de acesso e a função server-side que
chama o Gemini. Novas contas começam com zero créditos; a equipe concede créditos
aos convidados da alpha.

## Pré-requisitos

- Supabase CLI e Docker para desenvolvimento local;
- um projeto Supabase para deploy;
- uma chave paga/restrita da Gemini API para não expor currículos ao tratamento de
  dados aplicável à cota gratuita;
- Node.js para o frontend.

## Desenvolvimento local

```bash
npx supabase start
npx supabase db reset
npx supabase functions serve generate-resume --env-file supabase/functions/.env.local
```

Depois de iniciar o ambiente, execute o smoke test transacional:

```bash
docker exec -i supabase_db_latexresumeai psql -U postgres -d postgres \
  < supabase/tests/alpha_smoke.sql
```

Crie `supabase/functions/.env.local` (ignorado pelo Git) com:

```dotenv
GEMINI_API_KEY=SUBSTITUA
GEMINI_MODEL=gemini-3.5-flash-lite
ALLOWED_ORIGINS=http://localhost:3000
```

O Supabase local injeta as variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e
`SUPABASE_SERVICE_ROLE_KEY`. Nunca envie a service-role ao navegador.

No frontend, copie `.env.example` para `.env.local` e use os valores exibidos por
`npx supabase status`.

## Deploy

Vincule o projeto e aplique as migrations:

```bash
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
npx supabase secrets set GEMINI_API_KEY=SUBSTITUA
npx supabase secrets set GEMINI_MODEL=gemini-3.5-flash-lite
npx supabase secrets set ALLOWED_ORIGINS=https://SEU_DOMINIO
npx supabase functions deploy generate-resume
```

Cadastre no painel de Auth a URL pública do site e os redirect URLs permitidos.
Para mais de poucos cadastros por hora, configure SMTP próprio: o provedor de e-mail
embutido do Supabase tem limites baixos.

## Conceder créditos da alpha

Obtenha o UUID em Authentication > Users e invoque `grant_credits` somente com uma
chave administrativa. Exemplo local; não coloque a chave no histórico do terminal
em máquinas compartilhadas:

```bash
curl -X POST 'https://SEU_PROJETO.supabase.co/rest/v1/rpc/grant_credits' \
  -H 'apikey: SUA_SECRET_KEY' \
  -H 'Authorization: Bearer SUA_SECRET_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"p_user_id":"UUID_DO_USUARIO","p_amount":20,"p_reason":"alpha_invite"}'
```

A função adiciona o saldo e registra a concessão em `credit_ledger`. Não altere
`profiles.credits` isoladamente, pois isso quebraria a auditoria.

## Garantias implementadas

- RLS default-deny: usuários autenticados somente leem suas próprias linhas.
- Clientes não inserem nem alteram saldo, ledger, jobs ou versões diretamente.
- Reserva de crédito serializada e idempotente por usuário/chave.
- No máximo cinco tentativas de geração por usuário/dia.
- Falha interna ou do Gemini estorna exatamente uma vez.
- Chave Gemini e secret key existem somente na Edge Function.
- Entrada tem limites; saída é JSON validado e convertida em LaTeX por código.
- Caracteres LaTeX vindos do modelo são escapados.
- Logs registram IDs/códigos, nunca o currículo ou a descrição da vaga.

## Limitações conhecidas da alpha

- Não há painel administrativo de convites/créditos.
- O Gemini ainda pode produzir uma reformulação incorreta; o usuário deve revisar o
  resultado. O produto não garante aprovação por ATS ou entrevista.
- Gerações `reserved` interrompidas depois de o processo server-side morrer podem
  exigir reconciliação administrativa. Uma rotina agendada de recuperação é etapa
  futura.
- O LaTeX é gerado, mas não compilado no servidor.
- Testes de concorrência/RLS exigem um Supabase local ativo e ainda devem entrar na CI.
