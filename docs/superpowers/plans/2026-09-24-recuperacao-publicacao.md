# Recuperação de acesso e publicação

Publicação de teste autorizada pelo usuário. Projeto Vercel criado: `beauty-day-juliana`, domínio reservado `beauty-day-juliana.vercel.app`. Nenhum commit ou push solicitado.

## Implementação

- `/recuperar-senha`: solicitação com destino fixo configurado em `SITE_URL`, erros genéricos.
- `/auth/confirm`: GET apenas apresenta confirmação; POST aceita token hash de recuperação ou código PKCE com cookie do navegador que solicitou o e-mail.
- `/nova-senha`: sessão e vínculo de proprietária obrigatórios; senha de 12–128 caracteres e confirmação.
- Logout global após a mudança, com repetição autenticada quando falha; mensagem distingue senha salva de sessão não encerrada.
- Cabeçalhos de privacidade nas rotas de recuperação e teste público mobile sem envio de e-mail.

## Configuração externa

- Site URL do Supabase salvo como `https://beauty-day-juliana.vercel.app`.
- Redirecionamento exato `/auth/confirm` salvo na lista permitida.
- Chave pública moderna e segredo moderno configurados localmente e na Vercel. Usuário confirmou em 24/09 que desativou as chaves legadas expostas.
- Template personalizado NÃO aplicado: o projeto gratuito exige SMTP próprio ou plano compatível. O fluxo PKCE funciona com o template padrão no mesmo navegador/dispositivo.
- Conta da proprietária não corresponde ao membro da equipe Supabase. Envio automático para ela depende de SMTP. Usuário informou não ter domínio nem serviço de envio.
- Alternativa para primeiro acesso: gerar link de recuperação de uso único administrativamente, salvar em arquivo local ignorado e entregar ao usuário; não altera senha nem envia e-mail. Só gerar após publicação validada para não desperdiçar sua validade.

## Validação em 24/09

Vitest de recuperação: 11 falhas reproduzidas pela função PKCE ausente; após implementação, **28 testes passaram**. TypeScript `--noEmit`: exit 0. ESLint das actions, testes e páginas alteradas: exit 0. Build local interrompido por memória disponível abaixo de 150 MB; ainda não validado nesta revisão.

## Publicação concluída

Autenticação renovada pelo usuário. Após uma falha de transferência, o build remoto reproduziu prerender indevido de `/nova-senha`; a página foi marcada dinâmica, como o painel, e o build subsequente passou.

- Deploy READY: `dpl_9fsbYmHkz39Ldyeo96ESov6rk4Gw`.
- URL pública: `https://beauty-day-juliana.vercel.app`.
- Build remoto completo com TypeScript passou; início, agendamento e login retornaram HTTP 200 sem autenticação Vercel.
- Recuperação + autorização: **44 testes passaram em 3 arquivos**.
- Playwright na URL pública: **1 teste passou**, viewport 375×812, recuperação acessível, sem overflow, cabeçalho no-referrer, link inválido rejeitado e `/nova-senha` anônima redirecionada ao login.
- Primeiro teste E2E falhou por seletor ambíguo entre alerta da página e anunciador do Next; seletor corrigido para o conteúdo principal e reteste passou.
- Link privado de recuperação gerado e salvo somente em `.vercel/recuperar-acesso.txt`, ignorado pelo Git e não publicado. Nenhum e-mail enviado e nenhuma senha alterada. Entregar exclusivamente à proprietária; link expira e tem uso único.

Pendências: confirmação manual de que a proprietária definiu a senha e entrou no painel; configurar SMTP para recuperação automática e revisar requisitos de uso comercial antes de promover a teste público definitivo. Não houve commit nem push.
