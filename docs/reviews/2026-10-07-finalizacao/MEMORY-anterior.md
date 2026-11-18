# MEMORY — Decisões e retomada

Atualização: 01/10/2026. Padrão aprovado: memória curta, atualizada ao final da sessão e a cada decisão importante, com links para detalhes.

## Última sessão — skills

### Continuação — segurança

Usuário solicitou revisão e correções completas aplicáveis, mais padrão reutilizável. Auditoria local item por item e plano preparados em `reviews/2026-10-01-security/REPORT.md` e `superpowers/plans/2026-10-01-seguranca.md`. Ruflo 3.48.0 reexecutado em app/components/lib; detector Impeccable em ContactForm/Calendar sem achados mecânicos. npm audit atual encontrou Next crítico (caminho next/og não identificado no app) e brace-expansion alto. Nenhuma ENV privada rastreada nos caminhos pesquisados; segredos não impressos. Prioridades: dependências, rate limit distribuído, acesso ao comprovante por prova de posse, cookies/headers, validação e guarda de E2E. Correções de código ainda não aplicadas: plano e fronteiras de teste aguardam revisão exigida nas regras. Padrão comum de segurança já registrado. Produção e configurações do provedor não alteradas.

Impeccable solicitado e adotado para UX/UI do projeto. Contexto executado com sucesso para Calendar.tsx: DESIGN reconhecido, PRODUCT ausente, sem hook automático. Seleção por etapa em [análise de skills](reviews/2026-10-01-skills.md). Não houve edição visual, auditoria de navegador nem nova execução Ruflo; tarefa documental, com última varredura técnica em 29/09. Próximo passo continua consolidar especificação e plano de aprovação/WhatsApp; preparar init/shape ao iniciar o desenho do novo fluxo.

## Finalidade

Permitir retomar o trabalho sem repetir perguntas já respondidas. Registrar decisões e evidências, não transcrições completas nem credenciais.

## Estrutura proposta para cada sistema

- Resumo do estado atual e última verificação.
- Decisões datadas, motivo e impacto.
- Preferências confirmadas do usuário.
- Pendências, bloqueios e próximo passo.
- Links para planos e relatórios.
- Decisões substituídas, claramente marcadas como históricas.

## Decisões conhecidas

- O usuário prefere a opção recomendada, comunicação direta e sistemas modernos com identidade própria.
- O salão possui uma única profissional. Aprovação, proposta de reagendamento e recusa deverão ocorrer no painel; clientes recebem mensagens pelo WhatsApp do salão.
- Pedidos durante o expediente: prazo de 120 minutos para decisão. Fora do expediente: aguardar decisão da proprietária; não expirar simplesmente na próxima abertura. Não autorizar horários já passados.
- Número ainda não conectado à API. Conta do salão vinculada ao Instagram da proprietária; acesso à Meta dela ainda necessário. Conexão pausada a pedido do usuário.
- Recuperação automática via SMTP é pendência aceita pelo usuário.
- A especificação antiga de WhatsApp contém decisões substituídas (dois números e 60 minutos). Não usá-las como regra vigente.

## Última análise

Em 29/09/2026, Ruflo 3.48.0 analisou 77 arquivos; revisão complementar registrada em reviews/2026-09-29/analise-projeto.md. 139 testes passaram; auditoria de dependências de produção sem vulnerabilidades conhecidas. Lint com oito erros em scripts locais da pasta .vercel. Build, E2E e produção não foram revalidados nessa análise. Não houve correção funcional, commit ou publicação.

## Ponto de retomada

Validação da adaptação textual: lint concluído com exit 0; git diff --check sem erros; Ruflo analisou 19 arquivos de app. Build ainda sem resultado final na sessão 29924; não declarar sucesso de build nem publicação. Para finalizar fidelidade visual, obter fotos originais/exportação do Canva e validar o site em navegador conectado.

Última implementação: app/page.tsx recebeu o conteúdo atualizado do Canva (apresentação, quatro especialidades, depoimento Luana, contato/CTAs), catálogo continua no Supabase. CSS suavizou profundidade, adicionou composição responsiva das seções e tipografia/estados. Erro da consulta pública não expõe mensagem do banco. Ruflo executado em app; saída em `reviews/2026-10-01-security/ruflo-app-template.txt`. Lint e build iniciados, confirmar resultados. Não houve deploy. Fotos originais ainda necessárias: Canva só retornou miniaturas, e duas tentativas de navegador expiraram. Edição pelo painel permanece pendente; não confundir conteúdo integrado com CMS pronto.

Usuário escolheu o Canva **DAHWzk-pxaM** como template, abandonando a geração de proposta genérica. Confirmou edição de fotos/textos pelo **painel**. Seção “Um look para toda ocasião” deve apresentar serviços reais da Juliana. Template inspecionado pela API, duas páginas/nove imagens, original intacto (transação cancelada). Fotos novas ainda pendentes. PRD/DESIGN e spec `2026-10-01-site-editavel-canva.md` atualizados; CMS/upload ainda não implementados. Não copiar depoimento “Viva Beauty” nem alterar preços do banco pelos exemplos do Canva.

Atualização de retomada em 01/10/2026: **Canva substitui Figma**, conforme instrução explícita. Não retomar Figma nem pedir upgrade. Meta-skill Agent Skills permanece adotada. Next/eslint-config-next atualizados para 16.3.8 e brace-expansion corrigido: npm audit da instalação retornou zero vulnerabilidades conhecidas. Suíte completa executada: **15 arquivos, 148 testes passaram**, 188,10s. Lint/build anteriores perderam as sessões de execução; não há BUILD_ID novo e diagnóstico ficou em compile: resultado final não confirmado. Reexecutar verificações restantes antes de declarar a etapa concluída. Demais controles do plano de segurança permanecem pendentes.

Em 01/10/2026 o usuário aprovou o plano de segurança e pediu Taste + Impeccable + Figma. Depois identificou explicitamente o plugin Agent Skills (`using-agent-skills`, 0.6.10); a interpretação anterior de skills genéricas foi corrigida em RULES. Implementação incremental local em andamento, sem commit/deploy/migration remota. ENV: sete testes passaram após seis falhas esperadas antes da correção. Guarda E2E incluída; atualização de Next em execução. Figma criado (link em DESIGN), mas vazio por limite MCP Starter. Demais controles de segurança não estão concluídos.

Os seis documentos e o modelo reutilizável foram criados com preferências aprovadas. Regras comuns centralizadas em `../../docs/RULES.md`; modelos em `../../_templates/docs`. Próximo trabalho de produto: consolidar a especificação WhatsApp antiga e preparar plano. Não retomar conexão Meta sem o acesso necessário.

## Decisões documentais desta sessão

O usuário determinou uso do Ruflo em todos os projetos. Regra permanente registrada na fonte comum e nos modelos; a análise de 29/09 é o último uso técnico documentado neste projeto. A edição dos arquivos Markdown foi conferida diretamente, não analisada pelo scanner TypeScript do Ruflo.

Modelos para portfólio e sistemas comerciais; stack inicial flexível; identidade visual própria, 3D opcional e modo escuro por projeto; tarefas com esforço pequeno/médio/grande e histórico resumido; memória curta incluindo tentativas relevantes que falharam. Regras operacionais anteriores preservadas, inclusive plano revisado e autorização de operações externas.

## Lição útil

Ruflo apontou `db.exec` de teste e a palavra portuguesa “todo” como alertas; ambos foram conferidos como falsos positivos. Interpretar resultados da ferramenta antes de propor correções. A conta Meta aberta era de Daniel, não a da proprietária; repetir nessa conta não resolve o bloqueio de integração.

## Limites

Nunca armazenar senhas, tokens, chaves, links de recuperação ou dados pessoais de clientes. Datas e resultados de testes são históricos, não garantia de que o estado atual permanece igual.

### Canva acessível — 01/10/2026
Navegador conectado e template inspecionado visualmente. A referência escolhida usa fundo branco, texto preto sem serifa, botões pretos em formato de pílula, fotos retangulares arredondadas e rodapé amarelo-esverdeado claro. Essa referência substitui a direção creme/terracota da página atual. Recuperadas sete imagens pela capacidade pageAssets; três imagens identificadas foram preparadas em public/images/*-canva.webp para integração. Não guardar URLs assinadas do Canva no código. Ainda falta concluir a adaptação visual e implementar edição pelo painel.
Build compilou, mas falhou no TypeScript dos testes da guarda E2E (ProcessEnv exigia NODE_ENV). Assinatura corrigida para mapa readonly de variáveis; verificação TypeScript separada em andamento. Nenhuma publicação realizada.
Verificação após correção: npx tsc --noEmit terminou com exit 0. Conversão das três imagens identificadas terminou com exit 0. Build completo ainda precisa ser repetido; sucesso de TypeScript não equivale a build final.

## Retomada — 05/10/2026: painel e decisões
Implementação local retomada após interrupções: tema Canva limitado a `.admin-site`, controles arredondados, fila de pedidos, agenda ativa e reservas encerradas. Actions protegidas para autorizar/reagendar/cancelar/recusar; cliente vê situação real e Google Agenda apenas quando confirmado. Migration `202610040001_booking_decisions.sql` mantém registros antigos confirmados, registra histórico, usa versão e lock, preserva anti-overbooking, aplica 120 minutos dentro do expediente e espera sem prazo fora dele. Reagendamento exige acordo prévio com cliente no formulário; WhatsApp automático não implementado.
Ativação protegida por `BOOKING_APPROVAL_ENABLED` (false por padrão); NÃO foi alterado `.env.local` nem aplicado SQL remoto nem publicado. Plano e procedimento de ativação em `superpowers/plans/2026-10-05-painel-decisoes.md`. Não desativar cegamente a flag após começar a receber novos estados.
Evidências desta retomada: suíte completa 17 arquivos/157 testes passou; teste adicional de prazo foi adicionado depois e a suíte do banco passou com 11 testes (incluindo esse cenário). Lint dos arquivos de painel/decisões passou; TypeScript passou antes dos últimos ajustes; git diff --check passou com avisos CRLF. Ruflo analisou 12 arquivos/295 linhas de components/admin, relatório `reviews/2026-10-05-ruflo-admin.txt`; análise sintática não substitui testes. Build final em execução na sessão 9213; confirmar resultado. Revisão visual autenticada desktop/mobile pendente. Não declarar publicação nem aprovação de segurança completa: demais itens da auditoria anterior continuam pendentes.

Resultado final da compilação em 05/10/2026: npm run build terminou com exit 0; compilação, TypeScript e geração de páginas concluídos. A implementação local está compilável. Restam validação visual/autenticada em homologação, autorização e aplicação do SQL remoto e publicação; WhatsApp automático permanece pausado.

### Correção de fidelidade visual após retorno do usuário — 05/10/2026
Usuário rejeitou o login antigo e reafirmou mesma identidade do Canva. Login foi recomposto com retrato real `juliana-canva.webp`, marca Juliana Souza/Beauty Day, fundo branco, texto preto, formulário sem cartão terracota, botões pretos em pílula e rodapé verde claro. Recuperação/nova senha e marca do painel usam a mesma base. Site público e fotos existentes preservados. TypeScript passou na primeira rodada; lint e resposta HTTP da prévia em confirmação. Servidor antigo de produção (PID 4112, criado nesta sessão) foi encerrado após verificar comando e substituído por dev na porta 3000, sessão 84670, para atualizar a prévia. Ainda não houve validação visual autenticada desktop/mobile nem nova publicação. Build anterior passou ANTES destas mudanças visuais; não confundir evidências.

Validação da correção visual: lint dos arquivos de autenticação/painel alterados terminou com exit 0. GET /login retornou HTTP 200; HTML contém auth-layout e juliana-canva, e não contém o título do layout antigo. TypeScript já havia passado. Prévia dev ativa em http://localhost:3000/login. Conferência visual em navegador e painel autenticado ainda não realizada nesta rodada.

### Ativação autorizada — 05/10/2026
Usuário aprovou explicitamente aplicar `202610040001_booking_decisions.sql` no Supabase e ativar somente a prévia local; Vercel permanece fora da autorização. Antes de migrar, projeto dncuvkrwvrqxdltsympy apareceu INACTIVE. Restauração via conector retornou success; status seguinte COMING_UP. Consultas durante COMING_UP retornaram schema public ainda sem tabelas e lista de migrations vazia. NÃO inferir perda de dados nem recriar schema durante restauração: aguardar ACTIVE_HEALTHY, confirmar tabelas/funções anteriores e só depois aplicar migration aprovada. Endereço público no .env.local conferido: corresponde ao mesmo projeto; nenhum segredo exibido. Migration e flag ainda NÃO aplicadas. Ferramenta de inspeção visual não iniciou (erro de caminho do kernel, inclusive após reset); usuário confirmou login no painel, mas não há inspeção visual automatizada desta rodada.

### Ativação concluída — 05/10/2026
Após ACTIVE_HEALTHY, tabelas/funções anteriores reapareceram: ausência era transitória na restauração. Aplicada migration aprovada pelo usuário `booking_decisions`, versão remota 20261005192110, correspondente ao arquivo local 202610040001_booking_decisions.sql. Verificados no banco: RLS do histórico ativo; anon/authenticated sem EXECUTE da decisão; service_role com EXECUTE; exclusão de intervalos preservada para pending/confirmed. Ativado BOOKING_APPROVAL_ENABLED=true somente no .env.local (ignorado pelo Git); Next dev confirmou reload env. Cliente servidor local confirmou acesso às novas colunas sem erro. Nenhuma reserva de teste ou decisão sobre reserva real criada pela validação. Vercel NÃO publicada: aplicação pública ainda usa fluxo anterior; não interpretar ativação local como rollout concluído. Usuário aprovou visual do login e confirmou acesso ao painel, mas captura/inspeção visual pelo agente não foi possível por erro da ferramenta. Lint adicional de loading/error passou.

### Publicação concluída — 05/10/2026
Após pedido para concluir pendências, publicação realizada pela CLI Vercel. Deployment dpl_9MdZHZQCoP24SPb7Eqv8TBuuUYDU promovido com sucesso para https://beauty-day-juliana.vercel.app. BOOKING_APPROVAL_ENABLED=true no ambiente production. Build na Vercel passou incluindo TypeScript; lint e suíte completa de 17 arquivos/158 testes passaram antes do envio. Pacote de envio conferido sem .env e pastas privadas.
Smoke HTTP após promoção: /, /login e /agendar retornaram 200; /login contém auth-layout e juliana-canva; /painel sem sessão retornou 307 para /login; /sucesso/invalido retornou 404. Não foram criadas reservas nem alterados dados de clientes para esses checks. Validação visual automatizada e fluxo autenticado completo permanecem pendentes por falha da ferramenta de navegador; não confundir smoke HTTP com teste E2E.
WhatsApp adiado explicitamente pelo usuário: proprietária indisponível. Comunicação com clientes permanece manual; reagendamento exige acordo prévio. Sem commit/push nesta etapa. Auditoria ampla de segurança e editor de conteúdo continuam com seus próprios itens pendentes; esta publicação não conclui esses escopos. Retomada: validar operação autenticada em ambiente de testes e, com proprietária disponível, conectar Meta/WhatsApp. Não reverter para app que desconhece novos estados de reservas nem desligar a flag cegamente.

## Retomada — 07/10/2026: Ponytail e identidade pública
Usuário pediu simplificação abrangente com Ponytail. Aplicadas remoção de helper sem uso, catálogo compartilhado, FormData nativo, reaproveitamento de duração/preços/validação ENV e protocolo comum de recuperação. Redução líquida: 85 linhas, incluindo testes novos; comparação com snapshot local anterior, sem confundir com alterações anteriores do Git. Validação atual: lint sem erros, 18 arquivos/160 testes passaram, build completo incluindo TypeScript passou, git diff --check sem erros (avisos de CRLF apenas). Ruflo executado em app/components/lib; relatório em reviews/2026-10-07-ponytail/analise.md. Não houve commit, push, deploy ou migration.
Correção pública Canva está local: branco/preto, marca Oswald/Manrope, banner de corte e rodapé de cosméticos recuperados do template. Prévia compilada em localhost:3000; navegador conferiu página inicial a 375px sem overflow horizontal e CTA visível. Não declarar reprodução integral: duas fotos de resultados e CTA no lugar do formulário de contato. Editor de conteúdo, WhatsApp e SEC-02 seguem pendentes. Nenhuma reserva real criada. Próximo passo: validar fluxo autenticado em ambiente isolado e revisar/publicar correção pública quando autorizado.
