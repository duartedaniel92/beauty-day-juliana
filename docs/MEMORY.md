# MEMORY — Retomada em 08/10/2026

## Objetivo e decisões

Finalizar em etapas, usando as recomendações e preservando identidade do Canva DAHWzk-pxaM: branco/preto, Oswald/Manrope, botões em pílula e rodapé verde claro. Uma profissional, sem multi-salão/cobrança. Textos e fotos editáveis pelo painel. Nenhum depoimento fictício nem nova direção 3D imposta sobre o template escolhido.

WhatsApp Business +5519971580111: um número, decisões no painel; integração oficial adiada até a proprietária estar disponível. Não usar a conta Meta de Daniel como se fosse a dela. SMTP/domínio próprios pendentes aceitos. Não enviar senhas/chaves pelo chat.

## Estado técnico

Branch feat/painel-admin com alterações anteriores preservadas. Sem commit ou push. Publicação autorizada concluída em 08/10/2026: https://beauty-day-juliana.vercel.app, deployment dpl_3DKWdU3HYB6ifYfXVgRUWPnc9yNS. BOOKING_APPROVAL_ENABLED ativo localmente e em produção.

Migrations desta sessão: security_limits, booking_submission e site_content aplicadas no Supabase dncuvkrwvrqxdltsympy após apresentação do SQL e testes em PGlite. RLS confirmado; novas funções privadas negam execução a anon/authenticated. Storage sem políticas de escrita direta por authenticated. Não reaplicar migrations.

Código: cookies HttpOnly/Lax/Secure em HTTPS; comprovante assinado (sete dias, oito IDs), limites PostgreSQL confiando somente no IP da Vercel, nonce CSP dinâmico, reconfirmação de preço e chave idempotente vinculada ao navegador. Editor /painel/site com texto estruturado, fotos e descrições por serviço, versão contra sobrescrita de aba antiga. Upload raster reprocessado sem EXIF: **4 MB** e 24 MP, compatível com limite de payload Vercel. Fotos antigas não são apagadas automaticamente.

## Evidências e próximo passo

25 arquivos / 195 testes passaram; rodada posterior de controles alterados: 11 testes passaram. Lint e builds finais local/remoto passaram. Impeccable detect sem achados mecânicos. Ruflo em lib e lib/actions (10 arquivos/546 linhas sem achados mecânicos nesta última); não equivale a pentest.

Sharp 0.35.5 e source-map-js 1.2.2 atualizados; audit runtime zero. Cinco alertas dev de braces ainda sem patch; não remover lint nem fazer downgrade incompatível. Advisor Supabase: tabelas privadas sem políticas intencionais, btree_gist no public sem permissão CREATE de anon/authenticated, proteção de senhas vazadas desativada (Pro).

Próximo passo: conferir editor, upload e refresh com login real quando a proprietária puder entrar. Depois retomar WhatsApp oficial quando ela estiver disponível; SMTP e operação seguem TASKS.md. Não criar reservas reais como teste.

18/11/2026: usuário escolheu link wa.me em vez da API oficial para avisar a cliente; projeto serve para uso real da Juliana e para portfólio. Adicionados lib/whatsapp-message.ts (+ teste) e botão no detalhe da reserva (EntryDetails). Sem commit/publicação. Próximos: commit, suíte completa/lint/build, conferência com login real, README de portfólio com conta demo.

18/11/2026 (2): commit 396e154 em feat/painel-admin inclui todo o trabalho desde 775fa8e; build local gerou BUILD_ID às 19:55. Remote no GitHub criado depois; main é a branch padrão (antes feat/painel-admin). Produção fora do ar: Supabase dncuvkrwvrqxdltsympy com status INACTIVE (pausa do plano gratuito por inatividade); restaurado no mesmo dia com autorização do usuário (ACTIVE_HEALTHY; home e /agendar conferidos, nenhum pedido enviado). Plano gratuito pode pausar de novo após inatividade. README reescrito para portfólio; README técnico movido para docs/DESENVOLVIMENTO.md.

19/11/2026: publicado em produção (main 781c820, deploy pela CLI): next/eslint-config-next 16.4.6 e zod 4.6.7 (audit produção zero). Bug corrigido: decidir pela lista "Aguardando sua decisão" (ou cancelar/reagendar) desmontava o diálogo antes do botão do WhatsApp, porque decideBooking chamava revalidatePath e o Next recarrega a página atual. Agora decideBooking não revalida (todas as rotas são dinâmicas via connection()), o diálogo mostra o novo estado (decidedBooking em lib/booking-status.ts) e o painel recarrega ao fechar. GIF docs/images/painel-demo.gif gravado no projeto Supabase demo vubfpfdapjhsxmnxqlsm (só dados fictícios; credenciais em .env.demo.local, gitignored; legacy keys desativadas). Lint, 207 testes e build passaram; e2e não rodou (exige homologação autorizada). Usuário confirmou: painel e login real verificados, WhatsApp oficial descartado (wa.me basta), domínio próprio depois, Juliana avisada da pausa do Supabase.

19/11/2026 (2): deploy é pela CLI (`npx vercel deploy --prod` a partir da main); push no GitHub não publica. Cron diário contra a pausa do Supabase em produção (main ff96304): /api/keepalive protegido por CRON_SECRET (só Production na Vercel), 401 sem segredo, disparo manual confirmado no log do Supabase. Projeto Supabase demo pausado após o GIF; para regravar, restaurar e usar .env.demo.local. Pendentes: teste da Juliana no celular (diálogo + wa.me), e2e (precisa homologação autorizada), Ruflo, domínio próprio.

Histórico arquivado: [MEMORY-anterior](reviews/2026-10-07-finalizacao/MEMORY-anterior.md). Execução atual: [TASKS](TASKS.md). Revisão item a item: [SEGURANCA](reviews/2026-10-07-finalizacao/SEGURANCA.md).

Fechamento: build final passou, lint limpo, HTTP/CSRF/nonce passaram (http-preview.json); CUA conferiu homepage, calendário e confirmação em 375px, sem enviar reserva nem mensagem. Bundle estático sem credencial privada. Usuário não consegue entrar agora: editor autenticado e refresh real pendentes. Publicação autorizada e promovida em 08/10; sete checks GET de produção passaram, com HTTPS/CSP/nonce e cookies Secure/HttpOnly/Lax. Calendário público de 85 minutos carregou em produção sem erro de console. Evidências http-production.json e producao-desktop.jpg.
