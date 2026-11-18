# Segurança do Beauty Day Juliana — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Sem commits/push automáticos: prevalece a regra do usuário.

**Goal:** Corrigir riscos aplicáveis ao fluxo público e painel, com regressões verificadas e padrão reutilizável.

**Architecture:** Preservar Next/Supabase e autorização por proprietária. Endurecer pontos de entrada, sessão e acesso ao comprovante. Rate limiting distribuído no Postgres existente por RPC atômica de acesso restrito, sem novo serviço pago; não usar memória local como limite de produção.

**Tech Stack:** Next.js/React/TypeScript/Zod, Supabase/PostgreSQL, Vitest/PGlite/Playwright, Ruflo e Impeccable.

**Spec:** docs/reviews/2026-10-01-security/REPORT.md.

**Status:** aprovado pelo usuário em 01/10/2026; implementação local em andamento. Inclui testes isolados; não publicação, migrations remotas, inscrição MFA da proprietária ou contratação. Taste, Impeccable e Figma solicitados para UX; skills instaladas selecionadas por tarefa.

## Restrições e pontos de teste propostos

- Preservar alterações locais anteriores; permanecer em branch de trabalho; não editar migrations aplicadas.
- Frontend complementa, nunca substitui validação/autorização backend.
- Testar interfaces públicas: actions de reserva/login/recuperação/admin; RPCs de limite/gravação; navegação/HTTP de comprovante e sessão; configuração que recusa segredo no campo público.
- Nenhum teste ofensivo ou gravação contra produção. E2E exige homologação explícita.
- Fluxo de WhatsApp continua separado; aplicar padrões de webhook quando for implementado.

## 1. Dependências e ambiente — alta prioridade

Arquivos: package.json, package-lock.json, lib/env.ts, novo lib/env.test.ts, .gitignore, .vercelignore, eslint.config.mjs, playwright.config.ts e novo helper e2e de ambiente.

- [ ] Atualizar Next e eslint-config-next juntos para patch corrigido (16.3.8 sugerido pelo audit; conferir versão na execução); atualizar brace-expansion via árvore compatível, sem force e sem salto major indiscriminado.
- [ ] Teste vermelho: rejeitar chave secret/service_role no campo público, URL remota HTTP ou com credenciais; aceitar publishable e localhost permitido em desenvolvimento.
- [ ] Implementar validação e testar sucesso/erro; não exibir valores secretos em mensagens.
- [ ] Teste vermelho de E2E: recusar mutação sem projeto de homologação explicitamente permitido; implementar guarda antes da criação do cliente privilegiado.
- [ ] Excluir .claude-flow e artefatos operacionais dos fluxos de commit/publicação/lint pertinentes. Preservar arquivos locais.
- [ ] Aceite: audit atualizado, instalação reprodutível e nenhuma credencial nos resultados gerados.

## 2. Sessão, cookies e cabeçalhos

Arquivos: lib/supabase/server.ts, lib/supabase/proxy.ts, lib/supabase/client.ts, proxy.ts, next.config.ts, lib/auth/proxy.test.ts e novos testes de cookies/headers.

- [ ] Ler documentação da versão instalada de Next/Supabase antes de editar.
- [ ] Teste vermelho: cookies seguros em HTTPS, SameSite e escopo coerentes; renovação preserva múltiplos cookies e headers anticache.
- [ ] Confirmar que não existe autenticação Supabase no navegador. Adotar HttpOnly no fluxo só servidor, retirar cliente sem uso ou impedir uso incompatível. Não forçar HttpOnly sem validar recuperação PKCE e refresh.
- [ ] Garantir no-store/noindex/referrer restrito em comprovantes e rotas privadas. Acrescentar nosniff e proteção contra framing.
- [ ] Planejar CSP compatível com Next: validar scripts/hidratação e nonce quando necessário, sem unsafe-eval em produção; verificar efeitos sobre cache. Não usar política que quebra scripts e imagens.
- [ ] Testar origem divergente de POST, origem legítima e proxy confiável. Não liberar origens por curinga nem confiar em Origin fornecido para autenticação.
- [ ] Aceite: login, refresh, recuperação e logout continuam funcionando; teste HTTP verifica flags/cabeçalhos efetivos em ambiente local de produção/homologação.

## 3. Rate limit distribuído e força bruta

Arquivos: novo lib/security/rate-limit.ts e testes; nova migration de contadores/RPC; lib/actions/auth.ts, password-recovery.ts e bookings.ts; .env.example para segredo HMAC se necessário.

Interface proposta: `enforceRateLimit(scope, identity): Promise<{ allowed: boolean; retryAfterSeconds: number }>`; identidade extraída somente de contexto confiável, nunca IP arbitrário recebido do formulário.

- [ ] Definir testes de limite e concorrência antes da implementação. Proposta inicial: login 10 tentativas/15min por IP+conta e 50/15min por IP; recuperação 3/h por identificador e 10/h por IP; reserva 5/15min por IP e limite adicional por contato; disponibilidade 60/min por IP. São valores ajustáveis, não garantias contra DDoS.
- [ ] Implementar incremento/expiração atômicos, limites de cardinalidade, limpeza de contadores e RLS/revokes. Persistir HMAC do identificador, não contato/IP em claro; retenção curta.
- [ ] Verificar contrato do IP na Vercel; não confiar cegamente em X-Forwarded-For arbitrário. Desenvolvimento usa contexto local explícito. Falha de configuração/armazenamento não deve liberar silenciosamente mutação protegida.
- [ ] Testar limite, janela, duas requisições concorrentes, erro do backend e resposta pública sem enumeração de conta. Evitar bloqueio permanente por conta que permita negação de serviço contra a proprietária.
- [ ] Apresentar SQL e procedimento de ativação antes de migration remota. Aceite local não significa proteção ativa em produção.

## 4. Comprovante, cotação e dados pessoais

Arquivos: lib/actions/bookings.ts, app/sucesso/[id]/page.tsx, novo lib/security/booking-access.ts e testes, components/booking/ContactForm.tsx, nova migration de cotação/idempotência se exigida.

- [ ] Teste vermelho: navegador sem prova de posse não lê reserva apenas pelo UUID; token expirado, modificado ou de outra reserva é recusado.
- [ ] Emitir recibo assinado e limitado ao agendamento em cookie HttpOnly após criação, com validade curta documentada (proposta 24h). Não usar UUID como segredo; suporte a múltiplos agendamentos sem cookie ilimitado.
- [ ] A proprietária autenticada pode consultar pelo painel. Links antigos sem prova não terão dados; prever mensagem clara sem revelar existência. Compartilhamento entre dispositivos requer futuro link assinado próprio, não relaxar a proteção.
- [ ] Testar mudança de preço/duração entre seleção e envio; exigir reconfirmação do cliente. Manter totais calculados no banco.
- [ ] Adicionar idempotência transacional para repetição da mesma solicitação, sem permitir recuperar reserva de outro visitante pelo identificador da tentativa.
- [ ] Aceite: dados pessoais não aparecem em HTML público/logs; servidor não envia dados além do necessário; concorrência continua sem sobreposição.

## 5. Formulários e informação de erro

Arquivos: lib/validation/booking.ts e testes, components/booking/ContactForm.tsx, SlotPicker.tsx, páginas/actions de login e recuperação.

- [ ] Testes vermelhos com texto excessivo, número malformado, IDs repetidos, datas inválidas e strings de tentativa SQL/XSS.
- [ ] Limitar entrada antes de normalizar, preservar formato aceito e usar erros genéricos para infraestrutura. Não expor códigos/consultas/tokens ao usuário.
- [ ] Frontend com limites, autocomplete e mensagens acessíveis; impedir repetição involuntária e preservar campos após erro. Sem inventar CAPTCHA contratado.
- [ ] Impeccable craft-floor antes de UI; detector após lote de mudanças, inspeção agrupada mobile/desktop e confirmação limitada. Preservar identidade visual.

## 6. Verificação e operação

- [ ] Executar testes isolados de cada correção (vermelho→verde), depois suíte completa, lint, tipos e build em sequência para a máquina de 4GB.
- [ ] Atualizar audit completo e produção; triagem manual de alertas, com evidências.
- [ ] Executar Ruflo e revisão semântica do diff incluindo arquivos novos; registrar falsos positivos.
- [ ] E2E apenas em ambiente de teste: usuário não proprietário, token expirado, CSRF, cookies, comprovante e erros. Não usar contas/dados reais para ataques.
- [ ] Preparar checklist remoto: política de senha e cadastro, MFA/reauth, TTL/revogação, headers de produção, RLS/grants, variáveis e WAF. Não forçar MFA sem participação/recuperação da proprietária.
- [ ] Entregar matriz corrigido/verificado/pendente/não aplicável; atualizar TASKS/MEMORY. Sem afirmar segurança total.

## Critério de conclusão

Código local validado, migrações novas revisáveis, padrão de segurança reutilizável e evidências atualizadas. Publicação e configuração remota são etapa posterior autorizada explicitamente; não confundir mitigação preparada com mitigação ativa.
