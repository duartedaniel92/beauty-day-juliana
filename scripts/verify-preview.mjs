import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'

// Somente prévia local: nenhum teste de gravação contra o Supabase/produção.
const origin = 'http://localhost:3000'
const checks = []
for (const [path, status] of [['/',200],['/login',200],['/agendar',200],['/privacidade',200],['/painel',307],['/painel/site',307],['/sucesso/11111111-1111-4111-8111-111111111111',404]]) {
  const response = await fetch(origin + path, { redirect: 'manual', signal: AbortSignal.timeout(30000) })
  assert.equal(response.status, status, path)
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff', path)
  assert.equal(response.headers.get('x-frame-options'), 'DENY', path)
  const html = await response.text()
  const policy = response.headers.get('content-security-policy') ?? ''
  assert.ok(!policy.includes("'unsafe-eval'"), path)
  const nonce = policy.match(/'nonce-([^']+)'/)?.[1]
  assert.ok(nonce, path)
  if (status === 200) assert.ok(html.includes(`nonce="${nonce}"`), `Nonce SSR: ${path}`)
  if (/login|agendar|painel|sucesso/.test(path)) assert.match(response.headers.get('cache-control') ?? '', /no-store/)
  if (path === '/agendar') {
    const cookie = response.headers.get('set-cookie') ?? ''
    assert.match(cookie, /bd_booking_client=[0-9a-f]{64}/)
    assert.match(cookie, /httponly/i); assert.match(cookie, /samesite=lax/i)
  }
  if (path === '/login') {
    const action = html.match(/name="(\$ACTION_ID_[^"]+)"/)?.[1]
    assert.ok(action, 'Identificador da action de login')
    const form = new FormData(); form.set(action, ''); form.set('email','invalid'); form.set('password','')
    const csrf = await fetch(origin + path, { method: 'POST', body: form, headers: { Origin: 'https://attacker.example' }, redirect: 'manual', signal: AbortSignal.timeout(30000) })
    assert.equal(csrf.status, 500, 'Next precisa rejeitar origem divergente antes da action')
    checks.push({ check: 'CSRF origem divergente rejeitada', status: csrf.status })
  }
  checks.push({ path, status: response.status, nonce: true })
}
const a = await fetch(origin), b = await fetch(origin)
assert.notEqual(a.headers.get('content-security-policy'), b.headers.get('content-security-policy'), 'Nonce novo em cada resposta')
checks.push({ check: 'nonce distinto por resposta', passed: true })
writeFileSync('docs/reviews/2026-10-07-finalizacao/http-preview.json', JSON.stringify(checks,null,2))
console.log(JSON.stringify({ passed: checks.length, origin }))
