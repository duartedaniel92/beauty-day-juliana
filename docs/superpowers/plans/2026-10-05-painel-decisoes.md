# Painel da profissional e decisões de reservas

Escopo solicitado: preservar o site público aprovado e levar a identidade Canva ao painel; manter serviços e expediente; autorizar, reagendar, recusar e cancelar reservas. Implementação local autorizada pelo pedido de continuidade. Publicação e aplicação remota do SQL ainda não realizadas.

## Entrega local

- Tema do painel branco/preto, botões arredondados, navegação com superfície verde clara; mesma base de componentes para agenda, serviços e expediente.
- Fila dos primeiros 100 pedidos pendentes, de todas as datas; agenda ativa separada das reservas encerradas do período.
- Pedidos em expediente aguardam 120 minutos; fora do expediente não têm expiração automática. Horários passados não podem ser aprovados.
- Reagendamento operacional exige confirmação de acordo prévio com a cliente. Não implementa proposta automática/aceite por WhatsApp. Preserva duração e preços originais, valida expediente, antecedência de duas horas, grade de 15 minutos e conflitos no banco.
- Cancelar/recusar exige motivo e confirmação; preserva registro e snapshots, libera a vaga e registra histórico interno.
- Autorização por sessão e vínculo de proprietária, validação Zod, versão para recusar decisões desatualizadas, lock e exclusão por intervalo no Postgres.
- Resumo público mostra o estado real e só oferece Google Agenda para reserva confirmada. Envio automático de WhatsApp continua pendente.

## Ativação (pendente)

1. Revisar `supabase/migrations/202610040001_booking_decisions.sql`; obter autorização antes de aplicar no Supabase.
2. Aplicar em homologação e verificar fluxos autenticados, desktop e celular.
3. Aplicar no banco de produção autorizado e publicar a aplicação com `BOOKING_APPROVAL_ENABLED=true` no servidor.
4. Validar com a proprietária. A flag fica desligada por padrão para não acessar colunas/RPCs ausentes antes da migration.

Reservas antigas permanecem confirmadas. A migration não apaga dados. Após ativação e decisões reais, não fazer downgrade cego: a versão antiga interpreta cancelamentos como ocupações e não conhece pedidos pendentes. Reversão deve preservar novos estados e histórico, com plano revisado; não remover colunas/tabela para reverter.

## Verificação

Testes de banco isolado com PGlite: colisão, adjacência, autorização, versão obsoleta, reagendamento, cancelamento e prazo. Testes das actions verificam identidade da sessão, entradas inválidas e mensagens sem detalhes internos. Resultados finais são registrados em MEMORY; não considerar esta lista como prova de execução.

## Publicação — 05/10/2026
Concluída após pedido de finalizar pendências. Deployment dpl_9MdZHZQCoP24SPb7Eqv8TBuuUYDU promovido para https://beauty-day-juliana.vercel.app com BOOKING_APPROVAL_ENABLED=true. Build/TypeScript Vercel, lint e 158 testes passaram. Smoke público confirmou login novo e proteção anônima do painel. Revisão visual automatizada e operação autenticada ponta a ponta não concluídas. WhatsApp adiado explicitamente; mensagens continuam manuais. Detalhes e limites em docs/MEMORY.md e docs/TASKS.md.
