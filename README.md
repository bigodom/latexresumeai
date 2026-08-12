# LatexResumeAI

Alpha de uma plataforma que adapta currículos a vagas usando somente informações
confirmadas pelo candidato. A aplicação importa texto de PDF, envia perfil e vaga a
uma Edge Function protegida, usa o provedor de IA configurado para gerar conteúdo e renderiza
um currículo LaTeX consistente.

## Funcionalidades da alpha

- cadastro, confirmação de e-mail, login, sessão e logout pelo Supabase Auth;
- currículo base editável e persistente, carregado automaticamente no gerador;
- perfil e saldo persistentes;
- importação client-side de PDFs de até 5 MB e 10 páginas;
- modos Fiel, Estratégico e Análise de Lacunas, sem fabricação intencional de fatos;
- consumo atômico de créditos com idempotência e estorno em falhas;
- DeepSeek, Gemini ou OpenAI chamados somente pelo backend, conforme `AI_PROVIDER`;
- prompt centralizado e versionado em um único arquivo;
- histórico das versões geradas;
- cópia, download `.tex` e envio opcional ao Overleaf com confirmação.

Pagamentos ainda não existem. Novos usuários começam com zero créditos e a equipe
concede saldo manualmente aos convidados.

## Stack

- React 19, TypeScript e Vite;
- Supabase Auth, Postgres, RLS e Edge Functions;
- adapters para DeepSeek V4 Flash, Gemini 3.6 Flash e GPT-5.6 Luna;
- PDF.js no navegador;
- build estático com Vite, publicável em qualquer hospedagem de SPA.

## Executar o frontend

```bash
npm install
cp .env.example .env.local
npm run dev
```

Preencha no `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUBSTITUA
```

Não coloque `DEEPSEEK_API_KEY` ou uma chave administrativa do Supabase em variáveis
`VITE_*`: tudo com esse prefixo é público no bundle.

## Backend

As instruções de ambiente local, deploy, secrets e concessão de créditos estão em
[supabase/README.md](supabase/README.md). A migration inicial está em
`supabase/migrations/` e a função de geração em `supabase/functions/`.
A configuração de provedores e do prompt está em
[docs/AI_PROVIDERS.md](docs/AI_PROVIDERS.md).

## Verificações

```bash
npm run typecheck
npm run build
npm run check
npm audit --omit=dev
```

Ainda faltam testes automatizados de RLS, concorrência de créditos, componentes e
fluxo E2E. Não use dados pessoais reais como fixtures.

## Segurança e privacidade

- O currículo e a vaga são dados pessoais e não devem aparecer em logs.
- O PDF é lido no navegador; o backend armazena somente o texto que o usuário revisa e salva.
- A publishable key pode estar no cliente porque as tabelas têm RLS; a secret key
  nunca pode sair do backend.
- O usuário precisa revisar todo conteúdo gerado por IA.
- Abrir no Overleaf envia o currículo a um terceiro e, por isso, exige confirmação.
- A alpha não promete score ATS, entrevista ou contratação.

Antes de contribuir, leia [AGENTS.md](AGENTS.md).
