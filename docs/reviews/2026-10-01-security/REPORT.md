# Segurança — análise item por item

Data: 01/10/2026. Estado: auditoria local e plano preparados; correções de aplicação ainda não implementadas. Esta revisão não certifica ausência de vulnerabilidades.

## Escopo e evidências

Revisão dos pontos de entrada em app, components, lib, proxy, configuração e migrations. Ruflo 3.48.0 executou análise estática de segurança em app/components/lib (73 arquivos, incluindo testes em lib); relatórios brutos nesta pasta. Impeccable carregou o contexto do calendário e seu detector examinou ContactForm/Calendar: resultado vazio, que não prova acessibilidade nem segurança. Leitura manual verificou autenticação, autorização, dados enviados ao navegador e uso do SDK.

Não houve ataque, reserva de teste, leitura de dados de clientes, migration, configuração de conta ou publicação em produção. Não houve inspeção dos cabeçalhos efetivos do site nem das configurações atuais do Supabase/Vercel. Essa validação operacional permanece pendente.

## Matriz

| Item solicitado | Resultado local | Evidência e correção necessária |
| --- | --- | --- |
| ENV exposta | Nenhuma exposição encontrada no escopo pesquisado; reforço necessário | Zero arquivos .env privados rastreados e zero commits desses caminhos em refs locais. .env.local ignorado. Busca por sb_secret/private key fora de artefatos privados sem achados. Chave pública local é publishable e chave de servidor é secret; valores não foram impressos. lib/env.ts aceita qualquer string não vazia: rejeitar secret/service_role no campo público. Scanner não cobre todos os padrões, nomes históricos ou refs remotas |
| Validação frontend | Parcial | ContactForm usa required/types, mas não espelha limites e não anuncia erro com role=alert. Adicionar limites, mensagens e validação coerente, preservando backend como autoridade |
| Validação backend | Boa base, lacunas | Zod em actions; RPC revalida serviços, horário e contato. WhatsApp remove qualquer não dígito e não limita texto antes da transformação; entradas inválidas podem virar número plausível. Endurecer formato/tamanho e deduplicar IDs na consulta de horários. Reconfirmar preço/duração se catálogo mudar durante fluxo |
| SQL injection | Não identificada nos caminhos revisados | Supabase usa filtros/RPC com parâmetros; migrations usam SQL estático, sem EXECUTE construído com entrada externa. A interpolação em teste PGlite usa fixtures internas, não parâmetros públicos. Preservar consultas parametrizadas e testar payloads maliciosos como dados |
| Autenticação fraca | Autorização existente; MFA ausente | requireOwner chama getUser e confere salon_owner; não basta ter conta. Login retorna erro genérico. Senha nova exige 12–128 caracteres. Não há MFA/reauth explícita; política de senha, cadastro público e sessões no provedor não verificados |
| IDOR | Admin protegido; acesso público por UUID a endurecer | /sucesso/[id] usa credencial privilegiada e UUID como único requisito. Não seleciona nome, telefone ou e-mail, mas expõe horário/serviços/preços a quem obtiver o link. UUID aleatório dificulta adivinhar, mas não comprova autorização. Recomenda-se prova de posse temporária no navegador e eventual link externo assinado de escopo mínimo |
| Senhas diretamente no banco | Não há armazenamento próprio em texto claro | Senhas vão a Supabase Auth; tabelas públicas não têm campo de senha. Não inspecionado auth.users em produção. Supabase documenta hashing; não criar mecanismo paralelo de senha |
| Força bruta | Defesa do provedor; falta proteção adicional da aplicação | Login/recuperação não têm limite próprio. Supabase Auth possui limites, mas configurações reais e IP visto atrás do servidor não foram verificados. Aplicar limite distribuído por origem confiável e identificador com hash; não criar bloqueio permanente fácil de abusar |
| CSRF | Proteção do framework presente; confirmar integração | Next usa POST e verifica Origin versus Host/X-Forwarded-Host; não há allowedOrigins amplo no projeto. Recuperação só consome token em POST. Não inferir que CORS evita CSRF. Testar rejeição de origem divergente e tratar ausência/forjamento de cabeçalhos conforme proxy confiável |
| Upload sem validação | Não aplicável atualmente | Nenhum endpoint/formulário de upload encontrado. Não construir upload apenas para auditar. Padrão futuro exige tamanho, tipo real, autorização, armazenamento privado e conteúdo não executável |
| Revelação de informação | UI genérica; reduzir detalhes internos e reforçar headers | Error boundaries não imprimem error.message, mas bookings/sucesso incorporam mensagem do banco em exceções. Next normalmente mascara erros server em produção; não foi comprovado vazamento ao visitante. Padronizar códigos internos sem contatos/tokens e mensagens públicas genéricas |
| Dependências vulneráveis | Dois pacotes sinalizados | npm audit completo: Next crítico e brace-expansion alto. Next 16.3.4 pertence ao intervalo vulnerável; não encontrado next/og/ImageResponse no código, então caminho específico do advisory não identificado como exposto. Atualizar Next/eslint-config-next e dependência transitiva com lockfile e testes; não usar audit fix --force |
| Tokens e sessões | Verificação no servidor; endurecer ciclo de vida | Não encontrado armazenamento manual em localStorage. Recuperação valida token/formato, usa PKCE ou verifyOtp e vínculo de proprietária. Logout global solicitado, mas JWT emitido pode continuar válido até expirar. TTL, rotação e exigência de sessão recente precisam de validação no provedor; não inventar tokens próprios de autenticação |
| Rate limit | Ausente nas reservas/consulta pública | createBooking e getAvailableSlots não têm limite persistente. Um atacante pode ocupar horários diferentes; exclusion constraint não impede esse abuso. Implementar controle atômico distribuído, sem Map local de processo como proteção de produção |
| Dados sensíveis expostos | Minimização parcial e proteção administrativa | Agenda devolve contatos somente após requireOwner. RLS habilitada; snapshots privados. Sucesso público precisa controle de acesso/cache/indexação. Não existe política implementada de retenção; definir antes de exclusão automática. Não habilitar analytics que capturem formulários/URLs de recuperação |
| SSRF | Nenhum destino remoto derivado de entrada pública encontrado | Destinos vêm de configuração de servidor; Instagram/WhatsApp são links validados, não fetch do servidor. URL Supabase aceita z.url: restringir configuração a HTTPS sem credenciais e exceção local explícita. Futuras integrações devem usar destinos fixos/permitidos, limites e timeouts |
| Cookies inseguros | Reforço necessário | SDK instalado usa SameSite=Lax, httpOnly=false, maxAge=400 dias e não define Secure; wrappers não sobrescrevem. Duração do cookie não equivale à validade do JWT. Nenhum consumidor do cliente Supabase de navegador encontrado; avaliar fluxo só servidor para HttpOnly, Secure em HTTPS e duração alinhada à política de sessão, com teste de login/refresh/recuperação/logout |
| CORS | Sem abertura ampla no código | Não encontrado Access-Control-Allow-Origin:*. App é same-origin. Não adicionar CORS irrestrito; verificar cabeçalhos efetivos de hosting e API Supabase na validação operacional |

## Riscos complementares relevantes

- Cabeçalhos globais contra framing, MIME sniffing e política de conteúdo não estão configurados em next.config.ts. Propor CSP compatível com Next, frame-ancestors, nosniff, referrer policy e no-store para rotas privadas. CSP não deve quebrar hidratação nem virar uma política permissiva sem efeito.
- Troca de senha depende de sessão válida de proprietária, sem comprovação explícita de autenticação recente na aplicação. Revisar secure password change no provedor e implementar reautenticação ou fluxo de recuperação restrito, sem bloquear a conta sem plano de recuperação.
- E2E carrega .env.local e pode gravar no banco real. Adicionar trava de projeto de homologação antes de qualquer mutação.
- .claude-flow contém estado local da ferramenta e não é ignorado; excluir de versionamento e publicação. Scripts .vercel são ignorados pelo Git, mas entram no lint; separar corretamente.
- Snapshot usa preço atual no banco, enquanto formulário mostra cotação antiga. Adicionar versão/aceite do orçamento e idempotência, preservando proteção contra colisão.

## Dependências — evidência atual

`npm audit --json`: exit 1; 1 pacote critical (next), 1 high (brace-expansion). Relatório preservado em npm-audit.json. A verificação sem alertas de 29/09 é histórica e não contradiz a atualização da base de advisories.

[Advisory Next.js](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j): faixa 16.2.0 até antes de 16.3.6; correção em 16.3.6. A recomendação do npm nesta execução é 16.3.8. O cenário exige ImageResponse Node com dados do atacante em SVG; não foi encontrado esse uso no projeto.

## Referências verificadas

- Documentação instalada: node_modules/next/dist/docs/01-app/02-guides/server-actions.md (POST, origem e limite de corpo).
- SDK instalado: node_modules/@supabase/ssr/src/utils/constants.ts (opções padrão de cookies).
- [Limites de autenticação Supabase](https://supabase.com/docs/guides/auth/rate-limits).
- [Sessões SSR e cookies Supabase](https://supabase.com/docs/guides/auth/server-side/advanced-guide).
- [Segurança de senhas Supabase](https://supabase.com/docs/guides/auth/password-security).

## Limitações e próxima execução

Achados por leitura não equivalem a exploits reproduzidos. Não foram executados novos testes da aplicação, build, navegador ou teste de penetração nesta etapa. Correções terão ciclos de teste falhando/passando nos pontos de entrada acordados no plano. Ver `../../superpowers/plans/2026-10-01-seguranca.md`.
