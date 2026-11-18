# PRD — Produto e requisitos

Status: padrão documental aprovado em 29/09/2026; implementação de novas funcionalidades segue plano próprio. O padrão atende portfólio e sistemas comerciais, separando primeira entrega, evolução e metas por projeto.

## Finalidade

Definir qual problema o sistema resolve, para quem e como verificar se a entrega atende ao objetivo. Detalhes técnicos ficam em ARCHITECTURE.md; execução em TASKS.md.

## Estrutura proposta para cada sistema

- Nome, contexto e problema.
- Público e perfis de acesso.
- Objetivos e indicadores de sucesso.
- Fluxos principais.
- Requisitos identificados por código, prioridade e critério de aceite.
- Escopo da primeira versão e itens explicitamente fora dele.
- Dependências, restrições e dúvidas abertas.

## Contexto já conhecido deste projeto

Beauty Day Juliana atende uma única profissional. Clientes selecionam serviços e horário; a proprietária administra agenda, catálogo e expediente, autorizando, reagendando, recusando ou cancelando reservas pelo painel. Decisões estão implementadas; notificações automáticas WhatsApp continuam adiadas pelo usuário.

## Requisitos e aceite

Evolução aprovada em 01/10/2026: adotar o template Canva DAHWzk-pxaM e permitir edição de fotos e textos no painel da proprietária. A seção “Um look para toda ocasião” passa a mostrar os serviços reais da Juliana. Aceite: proprietária edita e visualiza conteúdo; visitante não consegue modificar conteúdo ou enviar arquivos; serviços públicos e agendamento compartilham catálogo; imagens têm texto alternativo e validação no servidor. Editor implementado localmente e SQL aplicado em 07–08/10; publicação pendente. Especificação em `superpowers/specs/2026-10-01-site-editavel-canva.md`.

| ID | Requisito | Prioridade | Aceite | Estado |
| --- | --- | --- | --- | --- |
| REQ-01 | Reservar vários serviços | Alta | Duração somada, expediente respeitado, antecedência de duas horas e nenhuma sobreposição | Implementado; testes locais registrados |
| REQ-02 | Administrar agenda, serviços e expediente | Alta | Somente a proprietária acessa; horários inválidos são rejeitados | Implementado |
| REQ-03 | Aprovar, reagendar com acordo, recusar ou cancelar no painel | Alta | Pedido começa pendente; decisão persiste e atualiza disponibilidade atomicamente | Implementado e publicado em 05/10 |
| REQ-04 | Avisar cliente pelo WhatsApp | Alta | Resultado e proposta enviados pelo número do salão; distinguir envio de entrega e falha | Solicitado; conexão pendente |
| REQ-05 | Expirar pedidos conforme expediente | Alta | 120 minutos para pedidos feitos durante expediente; fora dele aguarda decisão, sem aprovar horários passados | Implementado e publicado em 05/10 |

## Objetivos e metas

Evitar conflitos de agenda, permitir decisão da proprietária e reduzir incerteza do cliente. Critérios técnicos: rejeitar todas as colisões nos cenários de teste; negar operações administrativas sem vínculo; registrar resultado de envio sem confundir com entrega. Metas comerciais de volume, conversão e tempo de resposta ainda não foram definidas; não inventar números.

## Limites

Entrega existente: solicitação pendente e decisões pelo painel; evolução local: segurança e editor com identidade Canva. Próxima integração: WhatsApp oficial. Fora do escopo atual: múltiplos salões, cobrança, campanhas de marketing e interpretação de mensagens por IA. Recuperação automática por SMTP permanece pendência aceita.

## Dúvidas específicas ainda abertas

Elegibilidade e provedor de WhatsApp, custos e templates. O reagendamento atual exige acordo prévio; um fluxo automatizado de propostas/aceite será definido somente se solicitado, sem fingir que já existe.

## Manutenção proposta

Atualizar quando o escopo mudar, distinguindo requisito aprovado, proposta e funcionalidade entregue. Não tratar intenção como implementação.
