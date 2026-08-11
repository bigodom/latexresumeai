# Provedores de IA e prompt

A Edge Function possui adapters para `deepseek-v4-flash`, `gemini-3.6-flash` e
`gpt-5.6-luna`. O provider ativo é definido pelo secret `AI_PROVIDER`:

```dotenv
AI_PROVIDER=deepseek
```

Valores permitidos: `deepseek`, `gemini` e `openai`. Se a variável não existir, o
backend usa `deepseek`. A chave correspondente deve existir nos Supabase Secrets:

```dotenv
DEEPSEEK_API_KEY=
GEMINI_API_KEY=
OPENAI_API_KEY=
```

Somente a chave do provider ativo é obrigatória. Para trocar o provider, atualize
`AI_PROVIDER` e faça redeploy de `generate-resume` apenas se o código também tiver
mudado; alterações de secrets ficam disponíveis sem expor chaves ao frontend.

## Alterar o prompt

Todo o prompt está em um único arquivo:

```text
supabase/functions/_shared/ai/prompt.ts
```

Edite as instruções nesse arquivo e incremente `PROMPT_VERSION` no mesmo arquivo.
Depois publique novamente a função:

```bash
npx supabase functions deploy generate-resume
```

As regras factuais, as regras por modo, o isolamento dos dados não confiáveis e as
instruções editoriais estão juntas nesse arquivo. A validação do JSON e o escaping
de LaTeX permanecem em código separado e não devem ser removidos ao experimentar
novos prompts.

Os parâmetros específicos de cada modelo ficam em
`supabase/functions/_shared/ai/configuration.ts`. Eles não são enviados pelo
navegador.
