# Sistema de Agendamento — Beauty Day Juliana

**Data:** 2026-09-03
**Status:** aguardando revisão

## 1. Contexto e objetivo

Salão de beleza de uma única profissional (proprietária). Hoje o agendamento
é feito por WhatsApp, manualmente — a cliente manda mensagem, a profissional
confere a agenda e responde se tem vaga. Isso consome tempo dela e depende
dela estar disponível pra responder.

**Problema real que o app resolve:** permitir que a cliente marque um
horário sozinha, 24 horas por dia, vendo só os horários realmente livres —
sem trocar mensagem pra descobrir se cabe. A profissional para de confirmar
horário manualmente e não corre risco de esquecer um encaixe e causar
overbooking.

**Habilidade técnica que este projeto demonstra:** o motor de disponibilidade
(calcular blocos de horário livre considerando a duração somada de vários
serviços escolhidos) e a garantia dessa regra no nível do banco de dados
contra condição de corrida — não só na aplicação.

**Fluxo principal, em uma frase:** a cliente escolhe um ou mais serviços, vê
os horários onde cabe a duração total, confirma nome/WhatsApp/e-mail, e
recebe um resumo com opção de adicionar ao Google Calendar.

**Parte tecnicamente difícil (vai pro topo do README):** o motor de
disponibilidade + a exclusion constraint do Postgres que impede overbooking
mesmo sob concorrência (dois cliques no mesmo milissegundo).

## 2. Escopo

**Dentro do escopo (v1):**
- Catálogo de serviços (nome, preço, duração) com CRUD no painel admin
- Cálculo dinâmico de horários livres com base na duração total dos serviços
  selecionados
- Agendamento com dados de contato (nome, WhatsApp, e-mail)
- Bloqueio manual de horário pela profissional (almoço, folga, compromisso)
- Configuração de expediente (dias da semana e horário de funcionamento)
- Agenda consolidada (dia/semana/mês) no painel admin
- Login simples da profissional (usuário único)
- Link "Adicionar ao Google Calendar" na tela de sucesso (URL gerada, sem
  integração via API)
- Antecedência mínima de 2 horas pra agendar
- Responsivo, mobile-first

**Fora do escopo (v1) — decidido explicitamente:**
- Pagamento online (Pix/cartão) — cliente paga presencialmente
- Envio automático real de e-mail/WhatsApp — o sistema salva o contato, mas
  não dispara notificação; confirmação é manual, pela profissional, se ela
  quiser (evita depender de Resend/Twilio pagos)
- Cliente cancelar ou reagendar sozinho — uma vez confirmado, só a
  profissional altera pelo painel; cliente que precisar cancelar entra em
  contato diretamente
- Múltiplas profissionais ou unidades — o sistema é hardcoded pra uma única
  profissional (premissa do projeto)

## 3. Arquitetura

- **Framework:** Next.js (App Router), TypeScript `strict: true`
- **UI:** Tailwind CSS, Server Components por padrão — Client Component só
  onde há estado/interação (seletor de serviços, calendário, formulário)
- **Auth + banco:** Supabase (Postgres + Auth integrados). Usuário único
  criado manualmente no Supabase, sem fluxo de cadastro público
- **Validação:** Zod em toda entrada externa (formulário do cliente, payload
  de Server Actions)
- **Deploy:** Vercel (projeto único, sem backend separado)
- **Testes:** Vitest (motor de disponibilidade, unitário) + Playwright
  (fluxo crítico: agendar e login)
- **Monitoramento:** Sentry

**Ativos visuais disponíveis:** `Juliana_1.jpg` e `Juliana_2.jpg`, já na raiz
do projeto — usar na tela inicial (hero / apresentação do salão) na fase de
UI.

### Estrutura de pastas

```
beauty-day-juliana/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                    # tela inicial do salão
│   │   ├── agendar/
│   │   │   └── page.tsx                # wizard: serviços → horário → contato
│   │   └── sucesso/[id]/page.tsx       # resumo + "Adicionar ao Google Calendar"
│   ├── (admin)/
│   │   ├── login/page.tsx
│   │   └── painel/
│   │       ├── layout.tsx              # protegido por middleware
│   │       ├── page.tsx                # agenda consolidada (dia/semana/mês)
│   │       ├── servicos/page.tsx       # CRUD de serviços
│   │       └── configuracoes/page.tsx  # expediente
├── components/
│   ├── booking/         # ServiceSelector, AvailabilityCalendar, SlotPicker
│   └── admin/            # AgendaCalendar, ServiceForm, BlockTimeButton
├── lib/
│   ├── supabase/{client,server,admin}.ts   # admin.ts = service role, só servidor
│   ├── availability/
│   │   ├── calculate-slots.ts      # função pura, testada primeiro (TDD)
│   │   └── calculate-slots.test.ts
│   ├── actions/           # Server Actions: bookings.ts, services.ts, schedule.ts
│   └── validation/        # schemas Zod
├── middleware.ts           # protege /painel/*
└── supabase/migrations/    # SQL versionado
```

> Ajuste em relação ao rascunho inicial: `/agendar` virou uma rota única com
> um componente client (`BookingWizard`) controlando os passos em estado
> local, em vez de sub-rotas (`/agendar/confirmar`). Evita perder a seleção
> de serviços/horário ao navegar entre páginas. `/sucesso/[id]` continua
> como rota própria — permite recarregar ou voltar ao link sem perder o
> resumo.

## 4. Modelagem do banco

**`services`** — catálogo
```sql
create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents integer not null check (price_cents > 0),
  duration_minutes integer not null check (duration_minutes > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
```
`active=false` em vez de deletar — exclusão de serviço vira "desativar", pra
não quebrar a referência de agendamentos antigos.

**`business_hours`** — expediente semanal, 7 linhas fixas
```sql
create table business_hours (
  day_of_week smallint primary key check (day_of_week between 0 and 6),
  start_time time,
  end_time time,
  is_working boolean not null default true,
  constraint working_day_has_hours
    check (not is_working or (start_time is not null and end_time is not null and end_time > start_time))
);
```
Só `update`, nunca `insert`/`delete`. Folga pontual (feriado, dia extra) não
vira tabela nova — é um `block` do dia inteiro em `appointments`.

**`appointments`** — agendamentos e bloqueios manuais, mesma tabela
```sql
create table appointments (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('booking', 'block')),
  client_name text,
  client_whatsapp text,
  client_email text,
  start_time timestamptz not null,
  end_time timestamptz not null check (end_time > start_time),
  notes text,
  created_at timestamptz not null default now(),
  constraint client_data_required_for_booking
    check (type = 'block' or (client_name is not null and client_whatsapp is not null and client_email is not null)),
  constraint no_overlap
    exclude using gist (tstzrange(start_time, end_time) with &&)
);
-- requer: create extension if not exists btree_gist;
```
Unificar `booking` e `block` é o que faz a `exclude` constraint proteger os
dois ao mesmo tempo — um agendamento não pode cair em cima de um bloqueio.

**`appointment_services`** — quais serviços compõem cada agendamento
```sql
create table appointment_services (
  appointment_id uuid references appointments(id) on delete cascade,
  service_id uuid references services(id),
  service_name_snapshot text not null,
  price_cents_snapshot integer not null,
  duration_minutes_snapshot integer not null,
  primary key (appointment_id, service_id)
);
```
Snapshot do nome/preço/duração no momento do agendamento — se o preço do
serviço mudar depois, o histórico não muda retroativamente.

**Fuso horário:** todo o app assume `America/Sao_Paulo`. `business_hours`
guarda hora local (tipo `time`, sem tz); `appointments` guarda `timestamptz`.
A conversão entre "hora local do salão" e o timestamp armazenado acontece
num único lugar (`lib/availability/calculate-slots.ts` e nas Server Actions
que gravam), pra não espalhar lógica de fuso pelo código.

**RLS (Row Level Security):**
- `services`: leitura pública (`anon`) restrita a `active = true` — serviço
  desativado não aparece pra quem não está autenticado. `authenticated`
  recebe policy própria (`for all ... using (true)`) que já cobre a leitura
  de serviços inativos no painel admin — policies do Postgres são somadas
  (OR), então a policy `anon` não limita o que `authenticated` enxerga.
  Escrita só `authenticated`.
- `business_hours`: leitura pública (`anon` + `authenticated`) — expediente
  é informação pública. Escrita só `authenticated`.
- `appointments`, `appointment_services`: **nenhuma policy, pra nenhum
  papel** — nem `anon` nem `authenticated` têm acesso direto via API do
  Supabase. RLS fica habilitada só como defesa em profundidade; por
  desenho, todo acesso a estas duas tabelas (leitura pública de horários
  ocupados, criação de agendamento, bloqueio manual pela profissional —
  inclusive as ações do painel admin) passa exclusivamente pela service
  role key dentro de Server Actions (Plano 2), nunca pelo cliente Supabase
  autenticado do browser (segredo só de servidor,
  `lib/supabase/admin.ts`, nunca importado em Client Component). É a
  Server Action que decide o que expor — o cálculo de horários livres
  devolve só `{start, end}`, nunca nome de cliente.

## 5. Motor de disponibilidade — três camadas contra overbooking

1. **Cálculo no client (UX)** — `calculate-slots.ts` roda no navegador via
   Server Action a cada troca de serviço/data, pra dar feedback rápido. Não
   é garantia, só experiência.
2. **Revalidação no servidor** — a Server Action `createBooking` roda o
   mesmo cálculo de novo, com dados frescos do banco, antes de inserir.
   Pega o caso em que o horário ficou ocupado nos segundos entre a cliente
   ver a tela e confirmar.
3. **Constraint no banco** — a rede de segurança final. Mesmo que 1 e 2
   passem ao mesmo tempo pra dois cliques simultâneos, a `exclude` constraint
   do Postgres rejeita o segundo `insert`.

**Regra de antecedência mínima (2h):** validada no client (não mostra slot
a menos de 2h de `now()`) e revalidada na Server Action (defesa em
profundidade, mesmo padrão do item 2 acima).

## 6. Server Actions (contrato, sem código ainda)

- `bookings.ts`
  - `getAvailableSlots({ serviceIds, date }) → Slot[]`
  - `createBooking({ serviceIds, clientName, clientWhatsapp, clientEmail, startTime }) → { id } | { error }`
- `services.ts` (requer sessão autenticada)
  - `createService`, `updateService`, `deactivateService`
- `schedule.ts` (requer sessão autenticada)
  - `updateBusinessHours`, `createBlock`, `deleteBlock`

## 7. Painel admin

- Login via Supabase Auth (e-mail/senha), sessão validada em
  `middleware.ts` pra proteger `/painel/*`
- Agenda consolidada com toggle dia/semana/mês — biblioteca de calendário
  fica em aberto pra decidir no plano (evitar dependência pesada se der pra
  resolver com `date-fns` + grid próprio)
- CRUD de serviços e configuração de expediente via Server Actions acima

## 8. Estratégia de testes

- **Vitest:** `calculate-slots.ts` é função pura — testar casos: nenhum
  serviço selecionado, serviços somando duração maior que o expediente,
  horário exatamente no limite do expediente, slot colidindo com bloqueio,
  antecedência mínima de 2h
- **Playwright (e2e), só nos fluxos críticos:** agendar do início ao fim
  (escolher serviço → ver horário → confirmar → tela de sucesso) e login do
  painel
- Sem meta de 100% de cobertura — cobertura dos caminhos que importam

## 9. Definição de pronto (herdado da seção 9 do CLAUDE.md)

- [ ] `npm run build` sem erro/warning de TypeScript
- [ ] Lint limpo
- [ ] Testes passam, saída colada
- [ ] Deploy na Vercel funcionando
- [ ] README com decisões técnicas e trade-offs (motor de disponibilidade +
      exclusion constraint em destaque)
- [ ] `.env.example` documentado (Supabase URL, anon key, service role key)
- [ ] Sentry conectado
- [ ] Funciona em 375px de largura
- [ ] Estados de loading/erro/vazio implementados
- [ ] Nenhum segredo no repositório
