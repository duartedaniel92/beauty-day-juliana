# Análise do projeto — 29/09/2026

## Resultado

A base de agendamento tem boas proteções transacionais e de autorização. Há lacunas operacionais e de experiência que devem ser tratadas antes da integração automática com WhatsApp. Esta revisão não alterou funcionalidades, banco remoto, configurações da Meta ou produção.

## Método e limites

Ruflo 3.48.0 executado pelo pacote oficial npm, em cache local, sem inicializar hooks ou substituir instruções do projeto. Comando `analyze code --path <diretório> --format json` executado separadamente em app, components, lib e e2e. Os relatórios brutos estão nesta pasta.

Foram analisados automaticamente 77 arquivos, com 3.083 linhas contabilizadas pelo Ruflo. A implementação desse comando usa padrões textuais e métricas: não é uma revisão semântica por múltiplos agentes. Complementação manual: fluxo de reserva, autenticação/recuperação, migrations e permissões, painel, configuração e documentação. SQL e CSS não fazem parte da varredura automática do Ruflo.

Não foram acessados valores de credenciais nem enviados arquivos privados a um provedor de IA adicional. Não houve validação visual nova, teste de carga, auditoria do banco remoto ou revalidação da publicação. Build e E2E não foram executados nesta revisão. Resultados antigos não são apresentados como verificações novas.

## Achados prioritários

### P1 — Criação pública permite ocupar a agenda repetidamente

Referência: `lib/actions/bookings.ts:76` e RPC `book_appointment`.

A action valida os dados e impede sobreposição, mas não limita a frequência de criação nem verifica a posse do contato. Chamadas anônimas com dados sintaticamente válidos podem ocupar vários horários diferentes. A proteção de colisões não evita esse abuso. Não foi feito ataque de carga ao ambiente real; conclusão por leitura do caminho completo de gravação.

Recomendação: limite persistente de requisições, controles proporcionais contra automação e identificação idempotente de cada tentativa. Antes de ativar mensagens cobradas, aplicar também limites por destinatário e orçamento de envio. Não depender apenas de desabilitar o botão.

### P2 — Preço e duração apresentados podem divergir da reserva salva

Referências: `components/booking/ContactForm.tsx:25`, `lib/actions/bookings.ts:84`, `supabase/migrations/20260917030419_owner_and_atomic_booking.sql`.

O formulário conserva os serviços recebidos ao abrir o fluxo. Se a proprietária alterar preço ou duração antes do envio, a RPC usa os valores atuais e grava os novos snapshots sem solicitar novo aceite. Exemplo: o cliente vê R$80, o catálogo muda para R$90 e a confirmação registra R$90. A revalidação evita sobreposição, mas não assegura concordância com o orçamento exibido.

Recomendação: enviar uma versão da cotação e comparar no servidor, retornando os valores atualizados para confirmação explícita quando houver mudança. Testar preço, duração e inativação entre seleção e envio.

### P2 — Especificação de WhatsApp contradiz decisões posteriores

Referência: `docs/superpowers/specs/2026-09-25-aprovacao-whatsapp.md:3` e linha 26.

O documento ainda exige segundo número, decisões administrativas na conversa e 60 minutos de espera. Decisões vigentes do usuário: um número do salão (+5519971580111), aprovação/reagendamento/recusa no painel, avisos ao cliente pelo WhatsApp, prazo de 120 minutos para pedidos durante o expediente e espera pela proprietária para pedidos fora dele. Impedir decisões sobre horários já passados. A regra de prazo de resposta do cliente a uma proposta deve ser explicitada separadamente, sem inventar uma decisão já aprovada.

A integração está pausada aguardando acesso à conta Meta da proprietária; o número não está conectado à API. O sistema atual ainda confirma diretamente. Isso é uma funcionalidade pendente, não uma falha introduzida pela revisão.

### P2 — E2E pode gravar no banco de produção por configuração acidental

Referências: `playwright.config.ts:4`, `e2e/booking-race.spec.ts:9` e `e2e/booking-flow.spec.ts`.

O runner carrega `.env.local` e os testes criam reservas usando a credencial privilegiada. O README orienta homologação, mas não existe uma trava programática que recuse produção. A limpeza posterior não elimina a ocupação temporária nem garante limpeza após interrupção do processo.

Recomendação: ambiente separado e validação explícita do identificador permitido para testes antes da primeira gravação. Não executar esses testes no banco do salão.

### P2 — Grade visual não representa toda a duração ocupada

Referência: `components/admin/Calendar.tsx:39`.

O compromisso aparece apenas no grupo da hora inicial. Uma reserva das 09h às 12h deixa as linhas de 10h e 11h sem indicação visual de ocupação, embora o banco continue bloqueando corretamente o intervalo. Isso pode induzir leitura errada da agenda pela profissional.

Recomendação: representar a extensão temporal do compromisso ou marcar as horas seguintes como ocupadas. Validar reservas longas, horários fracionados e bloqueios que atravessam dias em celular.

### P3 — Falta anúncio acessível de erro no formulário de contato

Referência: `components/booking/ContactForm.tsx`, mensagem de erro após os campos.

O erro assíncrono é um parágrafo sem `role="alert"` ou região viva, e não recebe foco. Leitores de tela podem não anunciar que a confirmação falhou. Aplicar anúncio acessível e verificar navegação por teclado e foco entre etapas.

## Operação e manutenção

- Sentry/observabilidade não está integrado no código ou dependências examinados. Mensagens genéricas protegem detalhes internos, mas faltam registros estruturados para investigar falhas. Registrar contexto e identificadores sem contatos, tokens ou senhas.
- Há numerosas alterações locais anteriores, incluindo arquivos não rastreados. Elas foram preservadas. O estado do Git não comprova que produção e checkout são idênticos. Não foi feito commit ou push.
- A recuperação automática por SMTP continua sendo pendência aceita pelo usuário; não foi reaberta como bloqueador.
- O projeto é de uma única profissional. Não há isolamento multiempresa ou assinaturas, conforme escopo atual. Uma expansão para SaaS multiempresa exigiria desenho próprio.
- A direção visual atual já utiliza profundidade CSS, fotografia e tipografia próprias. A revisão não indica necessidade de adicionar um motor 3D; priorizar clareza da agenda e fluxo de aprovação. Aparência e responsividade não foram revalidadas no navegador nesta sessão.

## O que está bem estruturado

- Reserva e snapshots na mesma transação; exclusion constraint contra sobreposição, inclusive bloqueios.
- Lock compartilhado para reservas, serviços e expediente; verificação de antecedência e duração no banco.
- Associação explícita com a proprietária, checada antes das actions administrativas; RLS adicional.
- Chave privilegiada em módulo `server-only`; dados pessoais não selecionados na página pública de sucesso.
- Testes de rollback, autorização, horários e snapshots; calendário com fuso do salão explícito.

## Resultados do Ruflo conferidos manualmente

- Alerta `exec()` em `lib/database/booking.integration.test.ts`: falso positivo. É `db.exec` do PostgreSQL isolado, não execução de shell.
- Um TODO em `components/booking/SlotPicker.tsx`: falso positivo. A busca sem distinção de maiúsculas conta a palavra portuguesa “todo” no comentário “todo setState”.
- Nenhum outro padrão de segurança sinalizado nesses relatórios. Isso não demonstra ausência de vulnerabilidades; os achados de negócio acima não são detectados por essa varredura.

## Verificações desta sessão

```text
npm test -- --maxWorkers=1
Test Files  13 passed (13)
Tests       139 passed (139)
Duration    102.92s

npm audit --omit=dev --json
0 vulnerabilidades conhecidas nas dependências de produção
exit code 0
```

```text
npm run lint
8 errors, 0 warnings — exit code 1
```

Os oito erros são `@typescript-eslint/no-require-imports` em scripts locais ignorados pelo Git: `.vercel/check-connection.cjs` (2), `.vercel/configure-production.cjs` (3) e `.vercel/owner-recovery.cjs` (3). A configuração ESLint não exclui `.vercel`, então o comando padrão falha no checkout atual. Não apareceram erros nas pastas da aplicação nessa execução. Recomenda-se excluir artefatos operacionais locais explicitamente ou definir uma configuração própria para os scripts CommonJS; não desabilitar a regra globalmente. Nenhum desses scripts foi executado na revisão.

Não executados: build de produção, E2E, piloto WhatsApp, testes concorrentes remotos. A suíte PGlite não substitui concorrência real entre conexões.

## Ordem recomendada

1. Consolidar a especificação com as decisões vigentes e aprovar plano de implementação.
2. Proteger criação contra abuso, garantir aceite de alterações da cotação e separar testes de produção.
3. Implementar estados e decisões no painel com testes transacionais e expiração.
4. Conectar número/Coexistence quando a proprietária estiver disponível; implementar envio durável e respostas verificadas.
5. Ajustar representação temporal e acessibilidade; validar visualmente, executar build e piloto em homologação.
