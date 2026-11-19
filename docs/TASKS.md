# TASKS — Estado vigente em 08/10/2026

Cada etapa tem aceite verificável. Código local, SQL remoto e publicação são estados diferentes. Histórico anterior: [TASKS-anterior](reviews/2026-10-07-finalizacao/TASKS-anterior.md).

| Ordem / ID | Etapa | Prioridade / esforço | Estado | Aceite e evidência |
| --- | --- | --- | --- | --- |
| 1 SEC-02 | Corrigir segurança e concorrência | Alta / grande | Implementada e publicada | RLS, prova do comprovante, limites distribuídos, cookies/CSP, idempotência, reconfirmação de preço; SEGURANCA.md e testes |
| 2 CMS-01 | Editar textos e fotos no painel | Alta / médio | Publicada; conferência com proprietária pendente | /painel/site, validação/Sharp, texto alternativo, fotos de serviços, versão contra aba antiga; testes negativos de autorização |
| 3 UX-03 | Identidade Canva pública e profissional | Alta / médio | Publicada; conferência do painel autenticado pendente | Referência existente escolhida pelo usuário; contato por WhatsApp manual, catálogo real e fotos editáveis; sem depoimento fictício |
| 4 QA-01 | Verificar entrega completa | Alta / médio | Automatizado e público concluídos; sessão real pendente | 195 testes, 11 pontuais, lint/build local/remoto, HTTP e CUA passaram; proprietário indisponível para editor/upload/refresh |
| 5 REL-01 | Publicar versão revisada | Alta / pequeno | Concluída em 08/10/2026 | Autorização explícita; build remoto, smoke e promoção; dpl_3DKWdU3HYB6ifYfXVgRUWPnc9yNS; sem commit/push |
| 5b WA-00 | Aviso à cliente por link wa.me | Alta / pequeno | Implementado localmente em 18/11/2026; não publicado | Decisão do usuário: Juliana aprova no painel e envia pelo botão "Avisar cliente no WhatsApp" (mensagem pronta por status, número da cliente com 55). Nada é enviado sem ela tocar em enviar. 8 testes em lib/whatsapp-message.test.ts passaram; suíte completa, lint, build e teste com sessão real pendentes no PC |
| 5c OPS-00 | Restaurar produção e evitar nova pausa | Alta / pequeno | Restaurado em 18/11/2026; prevenção pendente | Supabase estava INACTIVE e todas as páginas mostravam erro. Restaurado com autorização do usuário; status ACTIVE_HEALTHY, home e /agendar carregaram com serviços e horários reais. Falta definir como evitar nova pausa (uso real ou plano pago) |
| 5d DOC-01 | README de portfólio | Média / pequeno | Implementado localmente em 18/11/2026 | README voltado a recrutador; guia técnico preservado em docs/DESENVOLVIMENTO.md. Prints do fluxo público (3 passos, sem enviar pedido) incluídos. Repo no GitHub criado; GIF do painel gravado em 19/11 no Supabase demo (dados fictícios) |
| 6 WA-01 | WhatsApp oficial para clientes | Alta / médio | Descartada pelo usuário em 18/11/2026: link wa.me com mensagem por ação basta | Proprietária disponível, conta Meta/Business correta, elegibilidade de um número +5519971580111, provedor/templates/custos; decisões no painel |
| 7 OPS-01 | Operação contínua | Média / pequeno | Pendente de configuração | Backup/restauração testados, retenção aprovada, limpeza segura de fotos órfãs; não apagar dados automaticamente |
| 8 SMTP-01 | Recuperação automática para e-mail da proprietária | Média / pequeno | Pendência aceita pelo usuário | Domínio e SMTP futuros; senha já alterada e login validado na sessão anterior |
| 9 DEP-01 | Atualizar cadeia de lint quando houver patch | Média / pequeno | Dependência externa | Audit runtime zero; cinco alertas dev originados em braces sem versão corrigida. Sem downgrade forçado |

## Concluído anteriormente

- Fundação Next.js/Supabase, CRUD e expediente, catálogo único, agendamento com serviços múltiplos, duração e disponibilidade.
- Proteção contra sobreposição e antecedência mínima de duas horas na criação.
- Aprovar, reagendar com acordo, recusar e cancelar pelo painel, com histórico/versão; pedidos duram 120 minutos durante expediente e aguardam sem prazo fora dele.
- Fluxo de decisões publicado em 05/10/2026; editor e controles de segurança publicados em 08/10/2026.
- Padrão reutilizável dos seis documentos; Agent Skills por fase; Ruflo obrigatório; Ponytail para simplificação; Impeccable para UX.

## Bloqueios que não devem ser escondidos

WhatsApp automático não envia mensagens nesta entrega. Recuperação por SMTP permanece aceita como pendente. Proteção de senhas vazadas depende do Pro do Supabase; não houve contratação. Testes de gravação nunca devem usar o Supabase real como fixture.

## Fechamento de QA em 08/10

Build final, lint, checks HTTP/CSRF/nonce e navegação pública mobile/desktop passaram; credencial privada ausente dos 40 arquivos estáticos analisados. Sem gravação de reservas reais. Usuário não consegue entrar agora: sessão/editor autenticado pendentes. Publicação autorizada e concluída: https://beauty-day-juliana.vercel.app. Sete GETs de produção com status esperado, HTTPS/CSP/nonce, cookies Secure/HttpOnly/Lax e painel no-store; calendário de 85 minutos carregou sem erros. Evidências: http-production.json e producao-desktop.jpg em reviews/2026-10-07-finalizacao.
