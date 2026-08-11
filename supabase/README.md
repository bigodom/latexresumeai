# Backend Supabase da alpha

Este diretório contém banco, políticas e funções server-side que chamam o provedor
de IA ativo. Novas contas começam com zero créditos; a equipe concede créditos
aos convidados da alpha.

## Pré-requisitos

- Supabase CLI e Docker para desenvolvimento local;
- um projeto Supabase para deploy;
- uma chave do provedor ativo com saldo e limites de uso configurados;
- Node.js para o frontend.

## Desenvolvimento local

```bash
npx supabase start
npx supabase db reset
npx supabase functions serve --env-file supabase/functions/.env.local
```

Depois de iniciar o ambiente, execute o smoke test transacional:

```bash
docker exec -i supabase_db_latexresumeai psql -U postgres -d postgres \
  < supabase/tests/alpha_smoke.sql
```

Crie `supabase/functions/.env.local` (ignorado pelo Git) com:

```dotenv
DEEPSEEK_API_KEY=SUBSTITUA
LOCAL_ADMIN_ENABLED=true
ALLOWED_ORIGINS=http://localhost:3000
# Adicione GEMINI_API_KEY e OPENAI_API_KEY somente quando for testar esses provedores.
```

O Supabase local injeta as variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e
`SUPABASE_SERVICE_ROLE_KEY`. Nunca envie a service-role ao navegador.

No frontend, copie `.env.example` para `.env.local` e use os valores exibidos por
`npx supabase status`.

## Deploy

Vincule o projeto e aplique as migrations. Para evitar gravar a chave no histórico
do shell, crie `supabase/functions/.env.production` (ignorado pelo Git) com:

```dotenv
DEEPSEEK_API_KEY=SUBSTITUA
ALLOWED_ORIGINS=https://recurriculo.gpysolucoes.com.br
# Adicione GEMINI_API_KEY e OPENAI_API_KEY somente quando for ativá-los.
```

Depois execute:

```bash
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
npx supabase secrets set --env-file supabase/functions/.env.production
npx supabase functions deploy generate-resume
```

As chaves dos provedores inativos são opcionais. Consulte
`docs/AI_CONFIGURATION.md` para usar o painel local em `http://localhost:3000/admin`.
Não adicione `LOCAL_ADMIN_ENABLED` aos secrets remotos nem inclua `admin-ai-config`
no fluxo normal de deploy.

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
- Falha interna do provedor estorna exatamente uma vez.
- Chaves dos provedores e secret key existem somente nas Edge Functions.
- Entrada tem limites; saída é JSON validado e convertida em LaTeX por código.
- Caracteres LaTeX vindos do modelo são escapados.
- Logs registram IDs/códigos, nunca o currículo ou a descrição da vaga.

## Limitações conhecidas da alpha

- O painel local administra IA e prompts, mas não convites ou créditos.
- Qualquer provedor pode produzir uma reformulação incorreta; o usuário deve revisar o
  resultado. O produto não garante aprovação por ATS ou entrevista.
- Gerações `reserved` interrompidas depois de o processo server-side morrer podem
  exigir reconciliação administrativa. Uma rotina agendada de recuperação é etapa
  futura.
- O LaTeX é gerado, mas não compilado no servidor.
- Testes de concorrência/RLS exigem um Supabase local ativo e ainda devem entrar na CI.
