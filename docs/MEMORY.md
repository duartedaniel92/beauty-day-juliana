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

18/11/2026 (2): commit 396e154 em feat/painel-admin inclui todo o trabalho desde 775fa8e; build local gerou BUILD_ID às 19:55. Repositório sem remote: push não ocorreu e não existe repo no GitHub. Produção fora do ar: Supabase dncuvkrwvrqxdltsympy com status INACTIVE (pausa do plano gratuito por inatividade); restauração pendente de autorização. README reescrito para portfólio; README técnico movido para docs/DESENVOLVIMENTO.md.

Histórico arquivado: [MEMORY-anterior](reviews/2026-10-07-finalizacao/MEMORY-anterior.md). Execução atual: [TASKS](TASKS.md). Revisão item a item: [SEGURANCA](reviews/2026-10-07-finalizacao/SEGURANCA.md).

Fechamento: build final passou, lint limpo, HTTP/CSRF/nonce passaram (http-preview.json); CUA conferiu homepage, calendário e confirmação em 375px, sem enviar reserva nem mensagem. Bundle estático sem credencial privada. Usuário não consegue entrar agora: editor autenticado e refresh real pendentes. Publicação autorizada e promovida em 08/10; sete checks GET de produção passaram, com HTTPS/CSP/nonce e cookies Secure/HttpOnly/Lax. Calendário público de 85 minutos carregou em produção sem erro de console. Evidências http-production.json e producao-desktop.jpg.
