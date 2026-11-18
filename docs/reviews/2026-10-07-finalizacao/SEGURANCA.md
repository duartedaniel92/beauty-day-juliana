# Revisão de segurança — 07–08/10/2026

Escopo: Next.js, Server Actions, Supabase Auth/PostgreSQL/Storage e preparação para Vercel. Código local não equivale a publicação. Sem teste ofensivo ou gravação de reservas no projeto real. Testes de SQL usam PGlite isolado.

| Item solicitado | Controle e evidência | Limite / estado |
| --- | --- | --- |
| ENV exposta | Validação distingue chave pública de credencial privada; admin client e funções criptográficas server-only; arquivos ENV ignorados | Chaves antigas foram revogadas conforme confirmação anterior do usuário; conferir artefatos finais |
| Validação frontend/backend | Inputs limitados, Zod nas actions e constraints/RPC no banco; seleção de serviços com preço/duração esperados | Nunca confiar no total ou duração do navegador |
| SQL injection | Queries parametrizadas Supabase/RPC; SQL estático nas migrations | Testes com SQL dinâmico contêm somente fixtures; nenhum executor SQL público |
| Autenticação fraca | getUser e vínculo obrigatório com proprietária em cada action; nova senha mínima 12; destinos fixos | Proteção de senha vazada desativada no provedor; recurso exige Pro. Não contratado. MFA não ativado |
| IDOR | Comprovante exige cookie assinado, escopo máximo oito IDs, expira em sete dias; valida antes da query privilegiada | UUID sozinho e links antigos sem prova retornam 404; rotação da chave invalida comprovantes |
| Senhas no banco | Aplicação delega hashes/sessões ao Supabase Auth; não grava senha em tabelas próprias | Nenhuma senha foi lida ou copiada nesta revisão |
| Força bruta / abuso | Limites compartilhados no PostgreSQL para login, recuperação, reserva, horários e CMS; incrementos atômicos e falha fechada | Limites da aplicação não substituem os controles da API Auth direta do provedor |
| CSRF | Server Actions usam proteção Origin/Host do Next; cookies SameSite Lax | Conferir POST de origem divergente na prévia antes da publicação |
| Upload | Autorização antes de ler arquivo; 4 MB; magic bytes, decodificação Sharp, 24 MP, formato raster, WebP novo sem EXIF, UUID de servidor | Somente fotos destinadas à publicação; não aceitar documentos ou dados de clientes |
| Exposição de informações | Mensagens genéricas; disponibilidade retorna horários, sem contatos; banco privado fechado; páginas privadas sem cache/indexação/referrer | Logs do provedor precisam continuar sem bodies/credenciais |
| Dependências vulneráveis | Sharp atualizado 0.35.5 e source-map-js 1.2.2; audit runtime com zero alertas | Cinco alertas altos na cadeia **dev** de lint, originados em braces <=3.0.3 sem versão corrigida; não removidos controles nem aplicado downgrade incompatível |
| Tokens | Cookie de comprovante HMAC SHA-256 com comparação constante, limite de tamanho/IDs, expiração; cookies de sessão definidos explicitamente | Credencial privada usada só no servidor, com separação de propósito. Rotação exige novas sessões de comprovante |
| Rate limit | IP somente do cabeçalho confiável da Vercel; identidade HMAC, sem PII na tabela; validade/index/limpeza limitada | ALLOW_LOCAL_SECURITY só usa bucket local compartilhado fora da Vercel; não desativa limite |
| Dados sensíveis | RLS em reservas, snapshots, histórico, idempotência e limites; sem políticas públicas de leitura; campos explícitos | Retenção e backup/restauração precisam de procedimento operacional; não houve exclusão automática |
| SSRF | Sem importação de fotos por URL; caminho gerenciado e origem Supabase fixa; Next Image restrito ao bucket/caminho | Não existe proxy/fetch arbitrário fornecido por cliente |
| Cookies inseguros | HttpOnly, Lax, Secure em HTTPS, duração/escopo explícitos; cookies SDK de remoção preservados | Login/refresh com sessão real deve ser conferido na prévia; ambiente HTTP local não usa Secure |
| CORS | Sem API com wildcard/credenciais nem origens extras em Server Actions | Não abrir CORS para solucionar erro de autenticação |
| XSS / headers | React escapa texto; sem HTML livre; CSP com nonce por resposta, scripts strict-dynamic; DENY/nosniff/no-referrer e HSTS em HTTPS | style-src-attr permite styles de layout Next Image; scripts não têm unsafe-inline em produção |
| Overbooking / cotação | Exclusion constraint e lock transacional; duração/snapshot do servidor; preço alterado exige nova seleção | Lock global suficiente para uma profissional; revisar se houver múltiplos salões |
| Reenvio / concorrência | Chave idempotente HMAC vinculada ao navegador; fingerprint; gravação com reserva na mesma transação; edição do site usa versão | Idempotência 24h; requisição incompatível não cria outra reserva |
| Storage / RLS | Bucket público somente para imagens intencionais; nenhum upload direto de authenticated; servidor valida antes de gravar | Objetos substituídos não são apagados automaticamente. Planejar limpeza de órfãos sem remover referências válidas |

## Provedor verificado

Supabase saudável; as quatro tabelas novas têm RLS. Funções consume_rate_limit e submit_appointment negam execução a anon/authenticated e permitem service_role. Storage não possui políticas para gravação de authenticated.

Advisor: ausência de políticas nas tabelas privadas é intencional (deny-by-default). Aviso btree_gist no schema public é melhoria de manutenção: anon/authenticated **não** têm CREATE nesse schema. Sem mudança arriscada de extensão apenas para zerar avisos. Outro aviso: proteção contra senhas vazadas desativada.

## Fontes e evidências

- [Senhas e recurso Pro](https://supabase.com/docs/guides/auth/password-security).
- [braces sem patch publicado](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
- [Correção Sharp](https://github.com/advisories/GHSA-wq5f-xc86-pv6w).
- [Nonce CSP](https://nextjs.org/docs/app/guides/content-security-policy).
- [Cabeçalhos confiáveis Vercel](https://vercel.com/docs/headers/request-headers).
- [RLS privado sem política](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
- [Extensões no schema público](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public).
- Ruflo: ruflo-security.json (50 arquivos de lib); análise posterior lib/actions: 10 arquivos/546 linhas, nenhum achado mecânico. A análise não equivale a pentest.
- Impeccable detect: app/page.tsx, SiteEditor.tsx, ContactForm.tsx — nenhum achado mecânico.
- Suíte: 25 arquivos/195 testes passaram; 11 testes dos controles alterados passaram na rodada posterior. Build final, HTTP e revisão visual devem constar na entrega.

## Validação de entrega — 08/10/2026

- Build final passou: Next.js 16.3.8, TypeScript e todas as rotas dinâmicas, incluindo /painel/site e /privacidade.
- Lint passou sem erros/avisos na rodada final.
- 25 arquivos / 195 testes na suíte completa; 11 testes dos controles posteriormente ajustados passaram. Preservadas validações de colisão, expediente, cotação, idempotência, RLS, autenticação e uploads.
- scripts/verify-preview.mjs: nove checks HTTP passaram; páginas 200, painel/editor 307 sem sessão, UUID sem prova 404; no-store, cookies de agendamento HttpOnly/Lax; POST de origem divergente 500 pelo bloqueio de Server Actions; nonce novo por resposta. Evidência http-preview.json.
- Varredura dos 40 arquivos .next/static: credencial privada do ambiente não encontrada. Nenhum .env privado rastreado pelo Git. Nenhum valor de chave foi impresso.
- CUA: início desktop e mobile 375px, navegação, calendário e formulário final sem overflow/erro de console. Escova + Corte = 85 min/R$140, horários carregados. Nenhuma reserva enviada. Rodapé/fotos carregados e imagem otimizada HTTP 200. Screenshot previa-desktop.jpg.
- Usuário informou não conseguir entrar agora: revisão visual do editor autenticado, login/refresh da conta real e upload via painel continuam pendentes. Não usar esse limite para inventar confirmação.
- Publicação autorizada explicitamente pelo usuário em 08/10 e concluída após build remoto/smoke. Deployment dpl_3DKWdU3HYB6ifYfXVgRUWPnc9yNS promovido para https://beauty-day-juliana.vercel.app. Sem commit/push.
- Sete GETs em produção passaram com status esperado, CSP/HSTS, nonce de scripts e cookies de agendamento Secure/HttpOnly/Lax; painel e editor redirecionam para login com no-store; UUID sem prova retorna 404. Evidência http-production.json, sem cookies ou tokens registrados.
- CUA em produção: identidade Canva visível; Escova + Corte totalizaram 85 minutos e horários disponíveis carregaram sem erros de console. Nenhuma reserva criada. Evidência producao-desktop.jpg. Sessão real da proprietária permanece pendente.
