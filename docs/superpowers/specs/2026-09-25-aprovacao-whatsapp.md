# Aprovação pelo painel e notificações WhatsApp

Atualização: 08/10/2026. Esta versão substitui as propostas de segundo número e decisões pela conversa após a escolha explícita posterior do usuário. Estado real em TASKS.md.

## Decisões vigentes

- Um número do WhatsApp Business do salão: +5519971580111.
- A proprietária autoriza, reagenda, recusa ou cancela no painel protegido. Não enviar alertas da API ao próprio número remetente nem exigir um segundo número administrativo.
- A cliente deve receber confirmação, reagendamento, recusa ou cancelamento pelo WhatsApp quando a integração oficial estiver ativada. Hoje essa comunicação é manual; a aplicação não anuncia envio automático.
- Pedidos recebidos durante o expediente: prazo de 120 minutos. Fora dele: aguardam decisão sem prazo de expiração, mas horário passado não pode ser autorizado.
- Estados atuais: pending, confirmed, rejected, cancelled, expired. Bloqueios são independentes da aprovação.
- Reagendamento no painel exige acordo prévio com a cliente; não criar estado fictício de proposta/aceite já implementado.

## Fluxo já implementado

Cliente escolhe serviços/horário e informa contatos; solicitação fica pendente. Intervalo fica ocupado provisoriamente. Painel mostra fila de todas as datas. Decisão e histórico têm versão e lock; reserva e bloqueio nunca sobrepõem. Recusa/cancelamento/expiração liberam o intervalo. Cliente vê a situação no comprovante autorizado por cookie; Google Agenda somente quando confirmado.

Duração, preço e snapshots são calculados no servidor; criação exige duas horas de antecedência. Alteração do catálogo pede nova seleção. Reenvio do mesmo formulário não cria outra reserva. Não excluir histórico para simular cancelamento.

## Integração ainda adiada

1. Verificar conta Meta/Business da proprietária, acesso ao número, elegibilidade e coexistência com aplicativo, usando integração oficial; nenhuma migração do número ou contratação automática.
2. Escolher provedor/custos e aprovar templates de recebimento, confirmação, reagendamento, recusa e cancelamento em português. Não prometer gratuidade nem entrega imediata.
3. Registrar finalidade/consentimento de comunicação na solicitação; mensagens sobre a reserva, sem campanhas não solicitadas.
4. Outbox transacional e worker durável com tentativas limitadas, deduplicação, estados de envio/entrega/falha. Falha do WhatsApp não desfaz decisão da reserva.
5. Webhook com assinatura sobre bytes originais, tamanho limitado, WABA/número permitido, idempotência e callbacks fora de ordem tratados. Não aceitar ID de botão como autorização.
6. Indicar falhas/repetir envio no painel; nunca retornar chave do provedor nem dados de outra cliente.
7. Testar com fixtures e ambiente isolado; primeiro envio real depende da conexão/validação da proprietária. Não enviar mensagens reais automaticamente durante auditoria.

## Dependência de retomada

O usuário adiou WhatsApp até estar próximo da proprietária. Todo o restante pode avançar sem repetir as perguntas resolvidas. Notificações futuras não devem usar links UUID públicos: se houver acompanhamento por outro dispositivo, desenhar token próprio com validade/escopo e proteção de dados.
