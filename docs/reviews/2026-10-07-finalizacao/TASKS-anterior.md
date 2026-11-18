# TASKS — Execução e prioridades

Atualização: 01/10/2026. Estrutura aprovada; itens de implementação ainda dependem do plano correspondente.

## Finalidade

Mostrar o que falta, a ordem de execução e como comprovar a conclusão.

## Formato proposto

Cada tarefa contém ID, objetivo, prioridade, status, dependências, critérios de aceite e evidência de validação. Estados sugeridos: a fazer, em andamento, bloqueada, em revisão, concluída. Uma tarefa só fica concluída quando seu aceite é verificado.

## Pendências conhecidas do projeto

| ID | Fase / tarefa | Prioridade | Esforço | Status | Dependência / aceite |
| --- | --- | --- | --- | --- | --- |
| DOC-01 | Fundação: seis documentos e modelo reutilizável | Alta | Pequeno | Concluída | Respostas registradas; arquivos criados e referências verificadas |
| SKILL-01 | Planejamento: incluir Impeccable e selecionar skills | Alta | Pequeno | Concluída | Contexto executado e análise em reviews/2026-10-01-skills.md |
| SEC-01 | Segurança: auditoria local item por item e padrão comum | Alta | Médio | Concluída | Matriz e relatórios em reviews/2026-10-01-security; limitações explícitas |
| SEC-02 | Segurança: implementar e validar correções | Alta | Grande | Em andamento | Plano aprovado; validação ENV passou em 7 testes; guarda E2E adicionada; demais controles e validação final pendentes |
| UX-02 | Design: mockups no Canva com Taste e Impeccable | Alta | Médio | Em andamento | Canva substitui Figma por instrução do usuário; preparar telas mobile/desktop e revisar resultado; nenhum mockup concluído ainda |
| UX-01 | Planejamento: contexto de produto e fluxo de aprovação com Impeccable | Alta | Médio | A fazer | DOC-02; reutilizar PRD/RULES, definir estados e erros sem redesign implícito |
| DOC-02 | Planejamento: consolidar especificação WhatsApp antiga | Alta | Pequeno | A fazer | Reescrever fluxo inteiro conforme PRD e RULES vigentes |
| PLAN-01 | Planejamento: aprovação e WhatsApp | Alta | Médio | A fazer | DOC-02; plano revisado pelo usuário |
| META-01 | Integração: verificar conta e número | Alta | Médio | Bloqueada | Acesso da proprietária; comprovar elegibilidade e conexão |
| REVIEW-01 | Qualidade: planejar correções da análise | Alta | Médio | A fazer | Priorizar abuso, cotação, isolamento de testes e agenda; definir testes de aceite |

Relatório: reviews/2026-09-29/analise-projeto.md. Esta tabela não afirma que as recomendações foram implementadas.

## Convenções aprovadas

Estimar esforço em pequeno/médio/grande, sem confundir com prazo. Manter concluídas resumidas aqui; arquivar em documento histórico com link quando o volume prejudicar a leitura. Prioridades e esforço são avaliações de planejamento, não autorização de execução.

## Manutenção proposta

Atualizar status quando houver evidência; registrar bloqueio e próximo passo concreto. Não converter sugestões automaticamente em trabalho autorizado.

## Painel e decisões — 05/10/2026
Em implementação local: tema Canva, fila de pedidos, autorizar/reagendar/cancelar/recusar e migration com histórico e controle de versão. Plano: superpowers/plans/2026-10-05-painel-decisoes.md. Pendentes: concluir verificações, revisão visual autenticada, autorização para migration remota e publicação. WhatsApp automático continua pendente.

Validação local concluída: build exit 0, lint exit 0, 157 testes na suíte completa e 11 testes do banco na rodada posterior (incluindo prazo dentro/fora do expediente). Não aplicado em produção.

Atualização de ativação: migration booking_decisions aplicada com autorização (versão 20261005192110); flag local ligada e acesso servidor conferido. Pendentes: validação visual pelo agente quando ferramenta voltar, validação funcional autenticada e publicação autorizada. Não executar E2E de escrita contra o projeto real.

## Estado vigente após publicação — 05/10/2026
- [x] Migration booking_decisions aplicada e permissões conferidas.
- [x] Fluxo de aprovação ativado localmente e em production.
- [x] Lint, 158 testes e build Vercel concluídos sem erros.
- [x] Painel com identidade aprovada publicado: https://beauty-day-juliana.vercel.app (dpl_9MdZHZQCoP24SPb7Eqv8TBuuUYDU).
- [x] Smoke público: páginas 200, login novo presente, painel exige sessão, comprovante inválido 404.
- [ ] Revisão visual automatizada e fluxo autenticado completo em ambiente de testes; ferramenta indisponível nesta rodada.
- [ ] WhatsApp automático: adiado pelo usuário até proprietária estar disponível; atendimento manual por enquanto.
- [ ] Demais itens SEC-02, editor de conteúdo e consolidação da especificação antiga continuam pendentes; não cobertos pela conclusão desta publicação.

## Simplificação e site público — 07/10/2026
- [x] CODE-01: revisão Ponytail; duplicações removidas e controles preservados; 85 linhas líquidas a menos. Relatório: reviews/2026-10-07-ponytail/analise.md.
- [x] Validar código atualizado: lint, 160 testes e build completo passaram; Ruflo em app/components/lib.
- [x] Identidade pública Canva corrigida localmente e página inicial conferida em 375px.
- [ ] Concluir fidelidade do conteúdo público: demais fotos de resultados, contato e editor de conteúdo.
- [ ] Publicar correção pública após revisão/autorização; versão local não equivale à Vercel.
- [ ] Fluxo autenticado em ambiente isolado e demais controles SEC-02. WhatsApp continua adiado.
