# Configuração de IA e prompts

O backend possui adapters para `deepseek-v4-flash`, `gemini-3.6-flash` e
`gpt-5.6-luna`. Apenas uma configuração fica ativa por vez. Cada geração guarda o
ID da configuração, provedor, modelo e versão do prompt existentes no momento da
reserva do crédito.

## Painel local

Execute `npm run dev` e abra `http://localhost:3000/admin`. Entre com qualquer conta
autenticada do ambiente. A função administrativa recusa qualquer origem diferente
de `localhost:3000` e `127.0.0.1:3000`.

No arquivo `supabase/functions/.env.local`, habilite explicitamente a função:

```dotenv
LOCAL_ADMIN_ENABLED=true
```

Essa variável não deve existir nos secrets do projeto remoto. A verificação por
role foi removida somente desse fluxo local; um JWT autenticado ainda é obrigatório.

O painel permite criar versões imutáveis de prompt e configuração, ativar uma
configuração por vez e verificar apenas a presença das chaves. As regras factuais e
o schema permanecem no código: o texto editável não desativa validação, escaping de
LaTeX ou a proibição de inventar fatos.

## Parâmetros suportados

| Modelo | Parâmetros do painel |
| --- | --- |
| DeepSeek V4 Flash | thinking, reasoning effort, temperature ou top_p, máximo de tokens |
| Gemini 3.6 Flash | thinking level e máximo de tokens |
| GPT-5.6 Luna | reasoning effort, standard/pro, text verbosity e máximo de tokens |

No DeepSeek, amostragem é enviada apenas com thinking desativado e usa temperature
ou top_p, nunca ambos. No Gemini 3.6 Flash, `temperature`, `top_p` e `top_k` foram
descontinuados. No GPT-5.6 Luna, a integração usa Responses API, Structured Outputs,
identificador de segurança pseudonimizado e `store: false`.

## Ambiente local das funções

```dotenv
DEEPSEEK_API_KEY=
GEMINI_API_KEY=
OPENAI_API_KEY=
LOCAL_ADMIN_ENABLED=true
ALLOWED_ORIGINS=http://localhost:3000
```

É permitido deixar as chaves de provedores inativos ausentes. Uma configuração não
pode ser ativada sem a chave correspondente.

## Publicação

```bash
npx supabase db push
npx supabase secrets set --env-file supabase/functions/.env.production
npx supabase functions deploy generate-resume
```

`admin-ai-config` não deve ser publicado como parte do deploy normal. Se uma versão
anterior já tiver sido publicada, publique esta versão uma vez sem configurar
`LOCAL_ADMIN_ENABLED`; ela responderá 404 no ambiente remoto. Depois de trocar a
configuração no painel local não é necessário redeployar a função de geração.

Por enquanto a comparação é manual; distribuição A/B automática e avaliação
quantitativa ainda não foram implementadas.
