# Plano 4 — Painel da profissional e identidade com profundidade

Status: proposta para revisão do proprietário. Nenhuma implementação ou migration remota autorizada por este documento isoladamente.

## Objetivo e limites

Completar o produto de uma única profissional: login, agenda dia/semana/mês, bloqueios, catálogo e expediente. Evoluir a experiência visual para um produto com acabamento de SaaS, preservando fotos reais, personalidade e desempenho mobile.

Não inclui multi-tenant, assinaturas, cobrança, onboarding de outros salões, notificações automáticas ou cancelamento pelo cliente. Um SaaS comercial para vários salões exigirá isolamento por estabelecimento em tabelas, permissões e constraints; o schema atual não serve para isso sem alterações.

## Auditoria do código existente

- `lib/actions/bookings.ts`: appointment e snapshots são escritos em duas requisições. O delete compensatório não garante atomicidade: interrupção do processo ou falha de rede pode deixar reserva incompleta. Substituir por transação SQL via RPC.
- `supabase/migrations/0001_initial_schema.sql`: policies de escrita em services/business_hours autorizam qualquer authenticated. Identificar explicitamente a proprietária; cadastro público desativado não substitui autorização.
- `lib/supabase/server.ts`: pressupõe renovação de cookies por middleware, mas proxy ainda não existe. Completar SSR antes do login.
- Clientes Supabase sem Database genérico e coerção `as ServiceTeaser[]` na home: gerar tipos reais antes de ampliar consultas administrativas.
- `components/booking/SlotPicker.tsx`: resultado antigo da mesma chave pode reaparecer durante nova busca e ocultar erro posterior. Usar estado por tentativa, com retry explícito e resposta antiga descartada.
- `lib/actions/bookings.ts`: limite superior do dia é 23:59:59. Usar meia-noite local do próximo dia, intervalo semiaberto.
- `app/page.tsx`: WhatsApp fictício e Instagram não verificado. Parametrizar contatos; não exibir links falsos quando configuração estiver ausente.
- `e2e/booking-flow.spec.ts`: próximo dia útil presume expediente do seed e timezone da máquina; ficará incorreto ao permitir editar expediente. Isolar fixtures em projeto de testes e calcular datas no fuso do salão.
- Testes existentes cobrem motor, validação e mappers; não demonstram atomicidade, concorrência real nem autorização do futuro painel.

Esta é uma revisão estática dos arquivos indicados, não uma auditoria da configuração remota nem uma avaliação visual em navegador nesta sessão.

## Direção visual: ateliê contemporâneo

Manter Fraunces nos títulos e Manrope na interface. Paleta marfim, café, terracota e metal champanhe. Fotografias reais continuam sendo o elemento de identidade.

Profundidade 3D por CSS: moldura de fotografia com perspectiva discreta, planos sobrepostos, luz lateral e sombra de contato coerente. Reservar o efeito para apresentação, login e cabeçalho. Inputs, horários e texto permanecem planos e legíveis. Não adicionar Three.js/WebGL nesta etapa: o objetivo é profundidade visual sem um canvas pesado.

Desktop: navegação lateral estreita, data e seletor Dia/Semana/Mês no topo, agenda central, painel contextual para cliente/bloqueio. Mobile: navegação compacta e visão Dia inicial; mês como seletor e lista do dia; semana acessível sem reduzir texto a tamanhos ilegíveis. Sem métricas fictícias, gráficos decorativos ou cartões repetidos sem função.

Compartilhar marca e navegação entre home, agendamento, sucesso e painel. CTA de agendamento visível na primeira tela de 375×740, controles de toque com mínimo de 44px, foco visível, contraste AA, estados vazio/loading/erro e `prefers-reduced-motion`. Animações só em transform/opacity, sem movimento contínuo nem dependência de hover.

## Etapa 1 — Integridade e tipos

Arquivos: migrations novas, `lib/supabase/database.types.ts`, clientes Supabase, `lib/actions/bookings.ts`, testes de integração.

1. Gerar tipos a partir do schema real; validar ambiente com Zod sem imprimir valores secretos.
2. Criar RPC de reserva atômica: recebe IDs únicos, início e contato; lê preço/duração no banco, valida serviços ativos, expediente e antecedência mínima, insere reserva e snapshots na mesma transação. Não aceitar total/preço do navegador.
3. Preservar exclusion constraint `[)` para reservas e bloqueios. Serializar alterações de serviços/expediente e criação de reserva em uma ordem de locks documentada, evitando confirmação contra expediente alterado durante a transação.
4. Restringir execução da RPC a service_role, revogando PUBLIC/anon/authenticated; fixar search_path e qualificar objetos. Action pública mantém validação e retorna mensagens seguras. Mapear conflito SQLSTATE 23P01 para horário indisponível.
5. Exibir SQL completo antes de aplicar no Supabase, conforme CLAUDE.md. Não editar migrations já aplicadas.

Aceite: falha de snapshot não deixa reserva; duas requisições simultâneas no mesmo intervalo produzem exatamente uma reserva completa; intervalos adjacentes passam; 2h de antecedência, bloqueio e serviços inativos são respeitados. Testes usam banco separado, nunca limpeza ampla em dados reais.

## Etapa 2 — Login e autorização

Arquivos: `proxy.ts`, `lib/supabase/proxy.ts`, `lib/auth/require-owner.ts`, `lib/actions/auth.ts`, `app/login/page.tsx`, `app/painel/layout.tsx`, migration de permissões.

Criar tabela mínima de autorização com uma única proprietária referenciada por UUID de auth.users (não por email nem user_metadata). Nenhuma escrita de permissões disponível para clientes. Policies de catálogo/expediente verificam essa associação; não presumir que authenticated significa admin.

Proxy renova sessão e preserva cookies/cache headers; não é a barreira de autorização. `requireOwner` valida usuário no servidor e associação em cada leitura/mutação protegida, antes de qualquer uso de service role. Login usa email/senha, erro genérico e retorno interno permitido; logout remove sessão. Nada de credenciais no chat, fixtures ou git. Não cachear respostas administrativas publicamente.

Aceite: anon e autenticado não proprietário são recusados tanto por URL quanto por chamada direta de Action/Data API; proprietária acessa; expiração e logout funcionam. Testar sem depender apenas do layout.

## Etapa 3 — Estrutura visual e agenda

Arquivos: `components/ui/*`, `components/admin/*`, `app/painel/page.tsx`, loading/error do painel, helpers de calendário e testes.

Implementar primeiro layout e tokens com dados reais, depois visões Dia/Semana/Mês. Persistir data e visão em searchParams validados. Buscar só intervalo visível, usar America/Sao_Paulo em conversões e tratar virada de mês/ano. Mostrar cliente, serviços, início/fim e distinguir bloqueios sem usar apenas cor. Detalhes em painel/dialog acessível com retorno de foco. Não carregar dados de clientes no layout público.

Aceite: navegação por teclado, telas em 375/768/1440px, estado vazio útil, nenhum overflow involuntário, links preservam seleção, nenhum dado pessoal aparece para não autorizados.

## Etapa 4 — Bloqueios e catálogo

Arquivos: actions/validação admin, `app/painel/servicos/page.tsx`, formulários e testes.

Bloqueio recebe intervalo e motivo opcional, inclusive dia inteiro; usa a mesma constraint e não substitui agendamentos existentes. Remover bloqueio apenas após confirmação contextual, filtrando também type=block no servidor. Mensagem explícita em colisão.

Catálogo permite criar, editar e desativar serviços. Exclusão lógica preserva histórico; explicar na UI que o serviço deixa de aparecer para novos agendamentos. Preço convertido de reais para centavos com validação, duração inteira positiva. Revalidar páginas afetadas após sucesso.

Aceite: serviço desativado desaparece do público; snapshot antigo mantém preço/nome; chamada sem autorização falha; bloqueio impede agendamento público no mesmo minuto e sua remoção libera horário.

## Etapa 5 — Expediente

Arquivos: `app/painel/configuracoes/page.tsx`, action/validação, RPC para salvar semana, testes.

Editar sete dias, ligado/desligado e abertura/fechamento. Salvar semana inteira atomicamente. Horários noturnos atravessando meia-noite fora desta versão; UI informa limite. Rejeitar mudança que deixe reserva futura fora do expediente, mostrando conflito à profissional. Folgas excepcionais usam bloqueios.

Aceite: nenhum salvamento parcial; dia fechado não oferece slots; mudanças conflitantes não apagam reservas; preço/duração/expediente concorrentes com reserva seguem a mesma estratégia de locks da etapa 1.

## Etapa 6 — Acabamento público e verificação

Aplicar profundidade visual à home/login; navegação compartilhada, contatos configuráveis, loading global, retry do seletor. Não reescrever backend por motivo estético.

Executar testes de autorização e concorrência, Vitest, lint, build e Playwright dos fluxos público/admin. Validar login→bloqueio→indisponibilidade pública, edição do catálogo, expediente e logout. Incluir reduced-motion e navegação por teclado; registrar screenshots reais desktop/mobile. Conferir limpeza por IDs da execução com erros de cleanup tratados.

Não considerar texto do plano como prova de qualidade: revisão deve procurar bugs e requisitos ausentes, não apenas equivalência ao código proposto. Comandos devem preservar exit code, sem pipelines que mascarem falhas.

## Execução e aprovação

Preferência mantida: subagentes em tarefas independentes e revisão separada quando disponíveis. Evitar dois agentes editando os mesmos arquivos. Branch de implementação `feat/painel-admin`; commits, merge e deploy só quando solicitados. SQL remoto precisa ser mostrado previamente.

Antes de implementar, aprovar este plano e a direção visual, exigência expressa das seções 4 e 10 de `C:/dev/portfolio/CLAUDE.md`. Neste momento somente o documento foi criado.

Plano 5 continua dedicado a publicação: Sentry, README, configuração Vercel, política de abuso/rate limiting e verificação de produção. A service_role foi compartilhada no histórico anterior; confirmar sua rotação antes de publicação, sem reproduzi-la ou pedi-la no chat.

## Referências consultadas

- Documentação local Next 16: `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`: proxy não substitui autorização.
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://nextjs.org/docs/app/guides/authentication
