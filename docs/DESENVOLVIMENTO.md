# Beauty Day Juliana — guia de desenvolvimento

Agendamento para um salão com uma única profissional. Clientes combinam serviços e reservam um intervalo livre. A proprietária administra agenda, bloqueios, catálogo e expediente em um painel protegido.

## Rodar localmente

Requisitos: Node.js 22+, npm e um projeto Supabase.

1. Execute `npm ci`.
2. Copie `.env.example` para `.env.local` e preencha as credenciais. A chave `service_role` é exclusivamente do servidor.
3. Aplique as migrations de `supabase/migrations` em ordem. Antes da migration de proprietário, crie um usuário confirmado no Supabase Auth. A migration vincula esse usuário a `salon_owner`; se houver vários usuários, recusa uma atribuição ambígua.
4. Cadastre serviços pelo painel; a migration inicial já cria os sete dias de expediente.
5. Execute `npm run dev` e abra http://localhost:3000. Entre em `/login` com o e-mail e a senha da proprietária.

### Banco novo ou reset local

Em um banco vazio, aplique primeiro `0001_initial_schema.sql` e `0002_seed_services.sql`. Depois crie a conta confirmada da proprietária em Authentication, confira o UUID e certifique-se de que ela é a única conta desse ambiente. Só então aplique `20260917030419_owner_and_atomic_booking.sql` e confira se `salon_owner.user_id` corresponde ao UUID verificado. Não apague outras contas para satisfazer esse pré-requisito.

A migration de autorização recusa ambientes com zero ou múltiplas contas; por isso, um reset que tente aplicar todas as migrations antes de provisionar o Auth falha. Essa preparação é necessária em cada ambiente novo. Migrations já aplicadas devem ser preservadas.

Textos, fotos e contatos são editados em `/painel/site`; serviços, preços e duração permanecem em `/painel/servicos`. Os valores iniciais de apresentação vêm do Canva escolhido para este salão. Em outro projeto, substitua `DEFAULT_SITE_CONTENT` por dados próprios antes de publicar. Ative `BOOKING_APPROVAL_ENABLED=true` somente após aplicar as migrations de decisões.

## Decisões técnicas e trade-offs

- **Next.js + TypeScript:** Server Components buscam dados no servidor; Server Actions recebem interações validadas com Zod. Um projeto evita manter uma API Express separada sem necessidade.
- **PostgreSQL + Supabase Auth:** a sessão identifica; a associação a `salon_owner` autoriza. Cada ação administrativa verifica essa associação antes de acessar credenciais privilegiadas. RLS restringe também o acesso direto.
- **Reserva atômica:** `submit_appointment` revalida a cotação e registra idempotência junto da reserva; delega para `request_appointment` quando a aprovação está ativa. Expediente, serviços, antecedência e snapshots são verificados no banco; exclusion constraint impede sobreposição inclusive com bloqueios.
- **Concorrência:** agenda, serviços e expediente compartilham um advisory lock transacional. Uma reserva não pode confirmar com duração ou expediente alterado durante a operação. Em uma versão com múltiplos salões, o lock precisaria ser por estabelecimento.
- **Histórico:** preços, nomes e durações ficam congelados na reserva. Serviços são arquivados, preservando o histórico. Alterações de expediente não podem deixar reservas futuras fora dos horários de atendimento.
- **Fuso:** intervalos persistidos em UTC e exibidos em `America/Sao_Paulo`. Intervalos são semiabertos: um atendimento pode começar exatamente quando o anterior termina.
- **Visual:** referência Canva escolhida, branco/preto, Oswald/Manrope e rodapé verde claro. Movimento reduzido e navegação por teclado são respeitados; sem motor 3D imposto sobre o design aprovado.
- **Segurança:** comprovante assinado por cookie, rate limit compartilhado PostgreSQL, SSR com nonce CSP e autorização antes de cada operação privilegiada. Fotos raster até 4 MB/24 MP são reprocessadas em WebP sem EXIF; escrita Storage só pelo servidor. Salvamento de conteúdo verifica versão para não sobrescrever outra aba.

## Verificação

```bash
npm test -- --maxWorkers=1
npm run lint
npm run build
npm run test:e2e
```

Vitest cobre disponibilidade, validação, autorização, sessão SSR e transações PostgreSQL isoladas via PGlite, sem dados reais. PGlite usa uma conexão: os testes de exclusão não substituem carga com conexões concorrentes.

O Playwright de escrita exige ambiente de homologação separado e guarda explícita (`E2E_ALLOW_MUTATIONS` e `E2E_SUPABASE_PROJECT_REF`). Não executar contra o Supabase do salão. PGlite cobre gravação/constraints localmente sem tocar nos dados reais.

O teste de concorrência usa duas chamadas RPC independentes no Supabase e verifica que apenas uma reserva completa é persistida. Os testes de layout verificam 375/768/1440 px. Instale o navegador de testes com `npx playwright install chromium --only-shell` antes da primeira execução. Resultados e limitações da última revisão: `superpowers/plans/2026-09-17-painel-admin-verificacao.md`.

## Escopo e próximos passos

### Recuperação de senha e publicação

Configure `SITE_URL` com a origem HTTPS pública (sem caminho). `http://localhost:3000` serve apenas para desenvolvimento no próprio computador; links locais não abrem o aplicativo no celular de outra pessoa.

No Supabase, configure **Authentication → URL Configuration → Site URL** com a mesma origem e adicione a URL exata `https://SEU-DOMINIO/auth/confirm` aos redirecionamentos permitidos. Com o e-mail padrão, o fluxo usa PKCE: solicite o link na aplicação e abra-o no mesmo navegador/dispositivo. Links enviados diretamente pelo painel administrativo não substituem esse fluxo. Solicite uma nova mensagem depois de alterar a configuração.

O template opcional `supabase/templates/recovery.html` usa `TokenHash` para permitir abrir a mensagem em outro dispositivo. Sua ativação exige SMTP próprio ou plano que permita personalizar e-mails; não foi ativado no projeto gratuito. O serviço de e-mail padrão também limita destinatários e frequência: para enviar à proprietária fora da equipe Supabase, configure um provedor SMTP antes do uso real.

O GET da confirmação não consome o token: o botão envia um POST, evitando o consumo por scanners de e-mail. A atualização exige sessão válida e vínculo com a proprietária. Após a alteração, o sistema solicita o encerramento global das sessões; tokens de acesso já emitidos continuam sujeitos à expiração do provedor. Falhas são mostradas sem expor detalhes internos. Nunca registre tokens de recuperação, senhas ou chaves.

Na Vercel, configure as variáveis do `.env.example`; `SUPABASE_SERVICE_ROLE_KEY` é exclusivamente do servidor. Credenciais expostas devem ser substituídas e revogadas antes da publicação. A solicitação de recuperação usa os limites de envio do Supabase e não informa se uma conta existe. Os testes automatizados simulam o envio e a alteração de senha, sem enviar e-mails reais.

Uma única proprietária. Não inclui assinaturas SaaS, múltiplos salões, pagamentos, cancelamento pelo cliente ou notificações automáticas. Decisões pelo painel e rate limit estão implementados. WhatsApp oficial permanece adiado pelo usuário; SMTP aceito como pendência. Backup/restauração, retenção e acompanhamento operacional precisam ser configurados. Deploy depende de solicitação.

Estado atual e limitações: [tarefas](TASKS.md), [segurança item por item](reviews/2026-10-07-finalizacao/SEGURANCA.md). Para validar a prévia local de produção, execute `node scripts/verify-preview.mjs` após `npm run build` e `npm run start`; o script não cria reservas nem envia mensagens.

Plano aprovado: `superpowers/plans/2026-09-16-painel-admin-design.md`.
