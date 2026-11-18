import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const owner = '11111111-1111-4111-8111-111111111111'
const other = '22222222-2222-4222-8222-222222222222'
const service = '33333333-3333-4333-8333-333333333333'
const db = new PGlite({ extensions: { btree_gist } })
const sqlFile = (name: string): string => readFileSync(resolve('supabase/migrations', name), 'utf8')
// Escolhe terça futura no relógio do banco, independente do dia de execução.
const start = `(date_trunc('week', now() at time zone 'America/Sao_Paulo') + interval '8 days 10 hours') at time zone 'America/Sao_Paulo'`
const book = (time = start): string => `select public.book_appointment(array['${service}']::uuid[], ${time}, 'Cliente teste', '11999999999', 'fixture@example.test') as id`

beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated;
    insert into auth.users values ('${owner}');`)
  await db.exec(sqlFile('0001_initial_schema.sql'))
  await db.exec(sqlFile('20260917030419_owner_and_atomic_booking.sql'))
  await db.exec(sqlFile('202610040001_booking_decisions.sql'))
  await db.exec(sqlFile('202610070001_security_limits.sql'))
  await db.exec(sqlFile('202610070002_booking_submission.sql'))
  // Storage isolado: nenhum teste escreve no projeto real.
  await db.exec(`create schema storage; create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);`)
  await db.exec(sqlFile('202610070003_site_content.sql'))
  await db.exec(`insert into auth.users values ('${other}');
    insert into services(id,name,price_cents,duration_minutes) values ('${service}', 'Corte teste',8000,45);`)
// A inicialização do Postgres WASM pode exceder um minuto em máquinas de 4 GB.
// O limite dos testes de comportamento continua inalterado.
}, 180_000)
afterAll(async () => { await db.close() })

describe('conteúdo público e fotos', () => {
  it('permite leitura, mas visitantes e autenticados não podem gravar', async () => {
    for (const role of ['anon','authenticated']) {
      await db.exec(`set role ${role}`)
      try {
        expect((await db.query('select version from site_content')).rows).toHaveLength(1)
        await expect(db.query("update site_content set content='{}'::jsonb")).rejects.toMatchObject({ code:'42501' })
        await expect(db.query('delete from service_media')).rejects.toMatchObject({ code:'42501' })
      } finally { await db.exec('reset role') }
    }
  })
  it('protege a versão contra salvamento concorrente e oculta fotos de serviços inativos', async () => {
    const update = () => db.query('update site_content set version=version+1 where version=0 returning version')
    expect((await Promise.all([update(), update()])).map(result => result.rows.length)).toEqual([1,0])
    await db.query("insert into service_media values ($1,$2,'Foto teste')", [service,'site/11111111-1111-4111-8111-111111111111.webp'])
    await db.query('update services set active=false where id=$1', [service])
    await db.exec('set role anon')
    try { expect((await db.query('select * from service_media')).rows).toHaveLength(0) }
    finally { await db.exec('reset role'); await db.query('update services set active=true where id=$1', [service]) }
  })
})

describe('limites distribuídos de tentativas', () => {
  it('limita chamadas concorrentes e renova somente após expiração', async () => {
    const query = () => db.query<{ result: { allowed: boolean } }>("select consume_rate_limit('fixture',$1,2,60) as result", ['a'.repeat(64)])
    const results = await Promise.all([query(), query(), query()])
    expect(results.map(x => x.rows[0].result.allowed)).toEqual([true,true,false])
    await db.query('update rate_limit_buckets set expires_at=now()-interval \'1 second\' where identity_hash=$1', ['a'.repeat(64)])
    expect((await query()).rows[0].result.allowed).toBe(true)
  })
  it('nega a RPC e a tabela a anon e authenticated', async () => {
    for (const role of ['anon','authenticated']) {
      await db.exec(`set role ${role}`)
      try {
        await expect(db.query('select * from rate_limit_buckets')).rejects.toMatchObject({ code:'42501' })
        await expect(db.query("select consume_rate_limit('fixture',$1,2,60)", ['a'.repeat(64)])).rejects.toMatchObject({ code:'42501' })
      } finally { await db.exec('reset role') }
    }
  })
})

describe('reenvio e reconfirmação de serviços', () => {
  const quote = JSON.stringify([{ id: service, priceCents:8000, durationMinutes:45 }])
  const submit = (key: string, fingerprint = 'c'.repeat(64), expected = quote) => db.query<{ id:string }>(
    `select submit_appointment($1,$2,array['${service}']::uuid[],(${start})+interval '28 days','Cliente teste','11999999999','fixture@example.test',$3::jsonb,true) as id`,
    [key,fingerprint,expected])
  it('reenvio devolve a mesma reserva; mudança de conteúdo com a mesma chave é recusada', async () => {
    const a = await submit('d'.repeat(64))
    const b = await submit('d'.repeat(64))
    expect(a.rows[0].id).toBe(b.rows[0].id)
    await expect(submit('d'.repeat(64),'e'.repeat(64))).rejects.toMatchObject({ code:'22023' })
    expect((await db.query('select * from booking_submissions')).rows).toHaveLength(1)
  })
  it('recusa preço alterado sem criar reserva nem consumir a chave da tentativa', async () => {
    await db.exec('begin')
    try {
      await db.query('update services set price_cents=9000 where id=$1',[service])
      await expect(submit('f'.repeat(64))).rejects.toMatchObject({ code:'BD001' })
    } finally { await db.exec('rollback') }
    expect((await db.query('select * from booking_submissions where request_key=$1',['f'.repeat(64)])).rows).toHaveLength(0)
  })
})

describe('decisões da profissional', () => {
  it('aplica 120 minutos no expediente e nenhum prazo fora dele', async () => {
    // Transações isolam o expediente de teste e não alteram o restante dos cenários.
    for (const working of [true, false]) {
      await db.exec('begin')
      try {
        await db.exec("update business_hours set is_working=true,start_time='00:00',end_time='23:59:59'")
        if (!working) await db.exec("update business_hours set is_working=false where day_of_week=extract(dow from now() at time zone 'America/Sao_Paulo')")
        // Escolhe um dia aberto, inclusive quando hoje for terça e estiver fechado.
        const openDay = `(case when extract(dow from now() at time zone 'America/Sao_Paulo')=2 then (${start})+interval '1 day' else (${start}) end)`
        const { rows: [{ id }] } = await db.query<{ id: string }>(book(openDay).replace('book_appointment','request_appointment'))
        const { rows: [row] } = await db.query<{ expires_at: string | null; seconds: number | null }>('select expires_at,extract(epoch from(expires_at-clock_timestamp()))::integer as seconds from appointments where id=$1',[id])
        if (working) { expect(row.seconds).toBeGreaterThan(7190); expect(row.seconds).toBeLessThanOrEqual(7200) }
        else expect(row.expires_at).toBeNull()
      } finally { await db.exec('rollback') }
    }
  })
  it('autoriza um pedido e rejeita decisão baseada em versão antiga', async () => {
    const request = book(`(${start}) + interval '7 days'`).replace('book_appointment', 'request_appointment')
    const { rows: [{ id }] } = await db.query<{ id: string }>(request)
    expect((await db.query<{ status: string }>('select status from appointments where id=$1', [id])).rows[0].status).toBe('pending')
    await db.query('select decide_appointment($1,0,\'approve\',$2)', [id,owner])
    await expect(db.query('select decide_appointment($1,0,\'cancel\',$2,null,\'Imprevisto\')', [id,owner])).rejects.toMatchObject({ code: '40001' })
    expect((await db.query<{ status: string }>('select status from appointments where id=$1', [id])).rows[0].status).toBe('confirmed')
  })
  it('reagendamento mantém duração; colisão reverte alteração; cancelamento libera vaga sem excluir', async () => {
    const time = `(${start}) + interval '14 days'`
    const { rows: [{ id }] } = await db.query<{ id: string }>(book(time))
    await db.query(book(`(${time}) + interval '1 hour'`))
    await expect(db.query(`select decide_appointment($1,0,'reschedule',$2,(${time})+interval '1 hour')`, [id,owner])).rejects.toMatchObject({ code: '23P01' })
    await db.query(`select decide_appointment($1,0,'reschedule',$2,(${time})+interval '2 hours')`, [id,owner])
    expect((await db.query<{ minutes: number }>('select (extract(epoch from(end_time-start_time))/60)::integer as minutes from appointments where id=$1', [id])).rows[0].minutes).toBe(45)
    await db.query("select decide_appointment($1,1,'cancel',$2,null,'Cliente solicitou')", [id,owner])
    await expect(db.query(book(`(${time}) + interval '2 hours'`))).resolves.toBeDefined()
    expect((await db.query('select * from appointment_history where appointment_id=$1', [id])).rows).toHaveLength(2)
  })
  it('recusa ator que não é proprietária e pedidos expirados', async () => {
    const { rows: [{ id }] } = await db.query<{ id: string }>(book(`(${start}) + interval '21 days'`).replace('book_appointment','request_appointment'))
    await expect(db.query("select decide_appointment($1,0,'approve',$2)",[id,other])).rejects.toMatchObject({ code:'42501' })
    await db.query("update appointments set expires_at=now()-interval '1 minute' where id=$1",[id])
    await expect(db.query("select decide_appointment($1,0,'approve',$2)",[id,owner])).rejects.toMatchObject({ code:'40001' })
    await expect(db.query(book(`(${start}) + interval '21 days'`))).resolves.toBeDefined()
  })
})

describe('reservas atômicas e autorização no Postgres', () => {
  it('grava reserva e snapshot, rejeita colisão e permite intervalo adjacente', async () => {
    const result = await db.query<{ id: string }>(book())
    const snapshot = await db.query<{ price_cents_snapshot: number }>('select price_cents_snapshot from appointment_services where appointment_id=$1', [result.rows[0].id])
    expect(snapshot.rows[0].price_cents_snapshot).toBe(8000)
    await expect(db.query(book())).rejects.toMatchObject({ code: '23P01' })
    await expect(db.query(book(`(${start}) + interval '45 minutes'`))).resolves.toBeDefined()
  })
  it('reverte appointment quando a gravação de snapshots falha', async () => {
    await db.exec(`create function fail_snapshot() returns trigger language plpgsql as $$ begin raise exception 'falha de teste'; end $$;
      create trigger test_failure before insert on appointment_services for each row execute function fail_snapshot();`)
    const before = await db.query('select id from appointments')
    try {
      await expect(db.query(book(`(${start}) + interval '2 hours'`))).rejects.toThrow('falha de teste')
      expect((await db.query('select id from appointments')).rows).toEqual(before.rows)
    } finally { await db.exec('drop trigger test_failure on appointment_services; drop function fail_snapshot();') }
  })
  it('recusa dias fechados e menos de duas horas de antecedência', async () => {
    await expect(db.query(book(`(${start}) - interval '1 day'`))).rejects.toMatchObject({ code: '22023' })
    await expect(db.query(book(`now() + interval '1 hour'`))).rejects.toMatchObject({ code: '22023' })
  })
  it('bloqueia a reserva sobre compromisso pessoal', async () => {
    await db.exec(`insert into appointments(type,start_time,end_time) values ('block', (${start}) + interval '3 hours', (${start}) + interval '4 hours');`)
    await expect(db.query(book(`(${start}) + interval '3 hours'`))).rejects.toMatchObject({ code: '23P01' })
  })
  it('impede expediente que invalida reserva futura', async () => {
    await expect(db.exec('update business_hours set is_working=false where day_of_week=2')).rejects.toMatchObject({ code: '23514' })
    expect((await db.query<{ is_working: boolean }>('select is_working from business_hours where day_of_week=2')).rows[0].is_working).toBe(true)
  })
  it('não permite que outro autenticado escreva ou execute RPC privilegiada', async () => {
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${other}',false);`)
    try {
      await expect(db.exec("insert into services(name,price_cents,duration_minutes) values ('Invasão',100,10)")).rejects.toMatchObject({ code: '42501' })
      await expect(db.query(book(`(${start}) + interval '5 hours'`))).rejects.toMatchObject({ code: '42501' })
      expect((await db.query('select * from salon_owner')).rows).toHaveLength(0)
    } finally { await db.exec('reset role') }
  })
  it('permite catálogo à proprietária e preserva snapshot antigo', async () => {
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${owner}',false);`)
    try { await db.exec(`update services set price_cents=9000 where id='${service}'`) }
    finally { await db.exec('reset role') }
    const snapshots = await db.query<{ price_cents_snapshot: number }>('select price_cents_snapshot from appointment_services')
    expect(snapshots.rows.every(row => row.price_cents_snapshot === 8000)).toBe(true)
  })
})
