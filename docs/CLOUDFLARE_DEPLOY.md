# Deploy seguro no Cloudflare Pages

O arquivo `public/_headers` é copiado pelo Vite para o build e adiciona HSTS,
proteção contra conteúdo misto e cabeçalhos defensivos às respostas estáticas do
Cloudflare Pages. O frontend também redireciona para HTTPS e se recusa a enviar
credenciais fora de um contexto seguro como defesa adicional, mas isso não
substitui o redirecionamento feito pela borda.

## Exigir HTTPS

O redirecionamento da primeira visita HTTP precisa ser habilitado na borda do
Cloudflare. O arquivo `_redirects` do Pages não oferece regras condicionais por
protocolo ou domínio, e um redirecionamento em JavaScript aconteceria tarde demais
para proteger a página recebida.

No painel do domínio `gpysolucoes.com.br`:

1. Abra **SSL/TLS > Overview** e confirme que o modo de criptografia não está em
   `Off`.
2. Abra **SSL/TLS > Edge Certificates**.
3. Ative **Always Use HTTPS**.
4. Publique novamente o site para incluir `public/_headers`.

Não habilite `includeSubDomains` ou preload de HSTS sem auditar antes todos os
outros subdomínios de `gpysolucoes.com.br`.

## Verificação após o deploy

```bash
curl -I http://recurriculo.gpysolucoes.com.br
curl -I https://recurriculo.gpysolucoes.com.br
```

A primeira resposta deve ser um redirecionamento `301` ou `308` para HTTPS. A
segunda deve conter `strict-transport-security: max-age=31536000`.

Referências oficiais: [Always Use HTTPS](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/)
e [Headers do Pages](https://developers.cloudflare.com/pages/configuration/headers/).
