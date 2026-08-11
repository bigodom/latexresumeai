# Contexto do projeto — LatexResumeAI

Leia este arquivo antes de trabalhar no repositório. Ele descreve o estado real da
alpha em 11 de agosto de 2026. Não apresente roadmap como funcionalidade pronta.

## Produto

O LatexResumeAI adapta o currículo de uma pessoa a uma vaga sem inventar
qualificações. O usuário cria uma conta, importa ou cola o currículo, cola a vaga,
escolhe um modo, consome um crédito e recebe LaTeX para revisar, baixar ou abrir no
Overleaf. A visão futura é uma plataforma por assinatura para acompanhar perfil,
candidaturas, entrevistas e desenvolvimento profissional; pagamentos ainda não
foram implementados.

## O que a alpha implementa

- Supabase Auth real: cadastro por e-mail/senha, confirmação, sessão e logout.
- Perfil com saldo persistente; novas contas começam com zero créditos.
- Créditos concedidos administrativamente e registrados em ledger.
- Extração de texto de PDF no navegador, limitada a 5 MB e 10 páginas, sem OCR.
- Três modos factualmente seguros: `faithful`, `strategic` e `gap_analysis`.
- DeepSeek, Gemini ou OpenAI chamados por adapters na Edge Function; nenhuma chave de IA no bundle.
- Provedor selecionado por `AI_PROVIDER`; prompt inteiro centralizado em `_shared/ai/prompt.ts`.
- Reserva atômica/idempotente, limite de cinco tentativas diárias e estorno em erro.
- Saída do provedor em JSON estruturado, validada e renderizada em LaTeX por código.
- Histórico persistente de versões e snapshots.
- Histórico apresentado em cards responsivos, com estados de carregamento, vazio e erro.
- Download/cópia do `.tex`; Overleaf somente após confirmação de envio a terceiro.
- Landing de alpha por convite, sem preços ou garantias comerciais.

Não existem pagamentos, assinatura, painel administrativo, OCR, compilação LaTeX,
PDF final, recuperação/exclusão de conta pela UI, comparação visual de alterações,
fila assíncrona, A/B automático ou testes E2E.

## Regras de conteúdo

Os modos são:

- **Fiel:** reorganiza e reescreve somente fatos explícitos.
- **Estratégico:** enfatiza fatos e competências transferíveis explícitas, sem
  presumir domínio, cargo, duração ou métricas.
- **Análise de lacunas:** mantém o currículo factual e separa requisitos sem
  evidência no campo `gaps`; lacunas não entram no LaTeX como competências.

Nunca crie ou altere empresa, cargo, data, duração, formação, certificação,
tecnologia, idioma, responsabilidade ou métrica sem confirmação explícita. O modelo
ainda pode errar; não descreva as proteções como garantia de fidelidade.

## Arquitetura

```text
React/Vite
  ├─ Supabase Auth
  ├─ leitura RLS de profiles e resume_versions
  ├─ PDF.js extrai texto localmente
  └─ invoke generate-resume com JWT + idempotencyKey
          │
          ▼
Supabase Edge Function
  ├─ valida JWT, origem, payload e limites
  ├─ RPC reserve_generation debita crédito
  ├─ adapter ativo retorna JSON validado pelo backend
  ├─ código escapa conteúdo e renderiza LaTeX
  ├─ RPC complete_generation persiste versão/tokens
  └─ RPC refund_generation estorna uma falha
          │
          ▼
Postgres: profiles, jobs, generation_requests, resume_versions e credit_ledger
```

O cliente usa apenas URL e publishable key. Chaves de IA e a secret/service-role
key existem somente nas Edge Functions. As tabelas são default-deny para escrita do
cliente; RLS permite ao usuário ler apenas suas próprias linhas.

## Estrutura relevante

```text
App.tsx                                  fluxo principal e histórico
context/AuthContext.tsx                  sessão/perfil Supabase
services/supabaseClient.ts               cliente público
services/resumeService.ts                contrato com a Edge Function
services/pdfService.ts                   leitura e limites do PDF
components/AuthPage.tsx                  login/cadastro
components/LieLevelSelector.tsx          AdaptationModeSelector (nome legado do arquivo)
components/LatexPreview.tsx              preview, cópia, download e Overleaf
components/ResumeHistory.tsx             cards e estados do histórico de versões
supabase/config.toml                     ambiente Supabase local
supabase/migrations/                     schema, RLS, configuração de IA e RPCs
supabase/functions/generate-resume/      orquestração multi-provider/LaTeX
supabase/functions/_shared/ai/           adapters, schema, prompt base e renderização
supabase/functions/_shared/ai/prompt.ts  fonte única do prompt e sua versão
docs/AI_PROVIDERS.md                     configuração de IA e prompt
supabase/README.md                        setup, deploy e créditos
.env.example                             configuração pública do frontend
```

## Contrato da geração

O frontend invoca `generate-resume` com:

```json
{
  "profileText": "...",
  "jobDescription": "...",
  "adaptationMode": "faithful",
  "idempotencyKey": "uuid"
}
```

Campos opcionais: `jobTitle` e `company`. Sucesso retorna:

```json
{
  "generationId": "uuid",
  "resumeVersion": {
    "id": "uuid",
    "latex": "...",
    "generated_content": {},
    "adaptation_mode": "faithful",
    "created_at": "..."
  },
  "remainingCredits": 19
}
```

Não quebre esse contrato sem atualizar frontend, função, documentação e testes.

## Banco e créditos

- `profiles.id` é igual a `auth.users.id`.
- `resume_versions` guarda `profile_snapshot`, conteúdo JSON, LaTeX, modelo e versão
  do prompt; versões antigas são imutáveis.
- `(user_id, idempotency_key)` é único.
- Reserva e checagem de saldo ocorrem sob lock do perfil.
- Ledger tem débito `generation_reserved`, estorno `generation_refunded` e concessão
  administrativa `alpha_invite`.
- Nunca altere `profiles.credits` sem criar o evento correspondente no ledger.
- Nunca permita que o navegador chame RPCs administrativas.

## Ambiente e comandos

Frontend:

```bash
npm install
cp .env.example .env.local
npm run dev
npm run check
```

Backend local:

```bash
npx supabase start
npx supabase db reset
npx supabase functions serve generate-resume --env-file supabase/functions/.env.local
```

Consulte `supabase/README.md` antes de deploy ou concessão de créditos. Variáveis
frontend: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Secrets backend:
`AI_PROVIDER`, `DEEPSEEK_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY` e `ALLOWED_ORIGINS`.
Somente a chave do provedor ativo é obrigatória.

## Segurança e privacidade obrigatórias

- Currículo e vaga são entrada não confiável e contêm PII.
- Nunca logue perfil, vaga, prompt completo, resposta, e-mail ou telefone.
- Nunca use uma variável `VITE_*` para secrets.
- Valide JWT dentro da função; não aceite `user_id` do body.
- Service role ignora RLS: toda operação administrativa deve filtrar ownership.
- Mantenha `security definer` com `search_path` vazio e permissões explícitas.
- Não compile LaTeX vindo do modelo. O template deve ser determinístico e todo texto
  deve ser escapado. Se houver compilação futura, isole sem rede/`shell-escape`, com
  allowlist e limites de CPU/memória/tempo.
- Não envie nada ao Overleaf automaticamente.
- Exclusão/exportação, política de retenção e consentimento LGPD são pendências antes
  de abrir a alpha além de amigos próximos.
- Revise os termos de tratamento de dados de cada provedor antes de processar
  currículos reais e registre o provedor e a transferência na política de privacidade.

## Limitações técnicas conhecidas

- Tailwind, PDF.js e fontes ainda são carregados por CDN no `index.html`.
- A função depende das variáveis legadas automáticas `SUPABASE_ANON_KEY` e
  `SUPABASE_SERVICE_ROLE_KEY`; revisar ao migrar para publishable/secret keys novas.
- Não há reconciliação automática de reservas presas se o runtime morrer.
- A interface ainda não mostra `gaps` nem um diff antes/depois.
- O nome da vaga/empresa não é coletado atualmente, então histórico pode ser genérico.
- O backend não compila o `.tex`; compilabilidade não é garantida.
- Não há lint, suíte automatizada ou CI. `typecheck` e `build` são as verificações
  atuais.

## Próximas prioridades

### P0 para convidar usuários

1. Aplicar migration e executar testes manuais com dois usuários, anon e service role.
2. Testar concorrência: saldo 1 + múltiplas requisições deve gerar um único débito.
3. Testar prompt injection e caracteres especiais com fixtures sintéticas.
4. Configurar SMTP, redirect URLs, domínio permitido e secrets do ambiente real.
5. Criar política de privacidade/consentimento e processo de exclusão de conta.
6. Configurar saldo/alertas dos provedores e observar custo/tokens por geração.

### P1 de produto

- Perfil profissional estruturado e reutilizável.
- Revisão/diff antes de confirmar a versão.
- Exibição das lacunas separada do currículo.
- Formulário de empresa/cargo e pipeline de candidaturas.
- Compilação segura para PDF e templates versionados.
- Painel administrativo de convites/créditos.
- Testes de banco, componentes e E2E em CI.

### Visão futura

- assinatura e entitlements via webhooks idempotentes;
- cartas e mensagens para recrutadores;
- acompanhamento de candidaturas e lembretes;
- preparação de entrevistas e plano de desenvolvimento;
- métricas de ativação, recorrência, candidaturas e entrevistas, sem PII em logs.

Uma mensalidade se sustenta melhor no acompanhamento recorrente da busca de emprego
do que apenas na geração pontual de currículos.

## Critérios de conclusão

Uma mudança só está pronta quando autorização/isolamento foram verificados, entradas
têm limites, erros não vazam segredos/PII, consumo é idempotente, textos comerciais
refletem o comportamento, `npm run check` passa e documentação/migrations foram
atualizadas. Use somente dados sintéticos em testes e exemplos.
