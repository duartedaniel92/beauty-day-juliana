// Grava docs/images/painel-demo.gif: login, agenda, autorização de um pedido e botão do WhatsApp.
// Roda SÓ contra o app local ligado ao Supabase de DEMONSTRAÇÃO, nunca o do salão:
// cria um pedido fictício e o autoriza.
//
// Uso, com `npm run dev` rodando e .env.local apontando para o projeto de demonstração:
//   DEMO_EMAIL=... DEMO_PASSWORD=... node scripts/gravar-gif-painel.mjs
// Precisa de ffmpeg instalado.
import { config } from 'dotenv'
import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

config({ path: '.env.local', quiet: true })

const PROJETO_DO_SALAO = 'dncuvkrwvrqxdltsympy'
const base = process.env.BASE_URL ?? 'http://localhost:3000'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const { DEMO_EMAIL: email, DEMO_PASSWORD: password } = process.env
const CLIENTE = 'Cliente Demonstração'

function parar(mensagem) {
  console.error(mensagem)
  process.exit(1)
}

if (!supabaseUrl || supabaseUrl.includes(PROJETO_DO_SALAO)) parar('O .env.local está vazio ou aponta para o Supabase do salão. Use o projeto de demonstração.')
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(base)) parar('BASE_URL precisa ser o app local (http://localhost:3000).')
if (process.env.BOOKING_APPROVAL_ENABLED !== 'true') parar('Coloque BOOKING_APPROVAL_ENABLED=true no .env.local, para o pedido ficar aguardando autorização.')
if (!email || !password) parar('Defina DEMO_EMAIL e DEMO_PASSWORD com o login da proprietária no projeto de demonstração.')

const contexto = { locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' }
const browser = await chromium.launch()

// 1. Pedido fictício feito como cliente (fora da gravação).
const cliente = await (await browser.newContext({ ...contexto, viewport: { width: 500, height: 900 } })).newPage()
await cliente.goto(`${base}/agendar`)
await cliente.getByText('Escova', { exact: true }).click()
await cliente.getByText('Corte', { exact: true }).click()
await cliente.getByRole('button', { name: 'Continuar' }).click()

let dia
let hora
for (let i = 1; i <= 14 && !dia; i++) {
  const data = new Date(Date.now() + i * 86_400_000).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
  await cliente.locator('input[type="date"]').fill(data)
  await cliente.getByRole('heading', { name: 'Escolha o horário' }).click()
  await cliente.waitForTimeout(300)
  await cliente.getByText('Buscando horários').waitFor({ state: 'detached', timeout: 30_000 }).catch(() => {})
  const horarios = cliente.locator('button').filter({ hasText: /^\d\d:\d\d$/ })
  if (await horarios.count()) {
    const preferido = horarios.filter({ hasText: /^14:00$/ })
    const escolhido = (await preferido.count()) ? preferido : horarios.first()
    hora = (await escolhido.innerText()).trim()
    dia = data
    await escolhido.click()
  }
}
if (!dia) parar('Nenhum horário livre nos próximos 14 dias do projeto de demonstração.')

await cliente.getByLabel('Nome completo').fill(CLIENTE)
await cliente.getByLabel('WhatsApp').fill('(11) 98888-7777')
await cliente.getByLabel('E-mail').fill('cliente.demo@example.com')
await cliente.getByRole('button', { name: 'Enviar agendamento' }).click()
await cliente.waitForURL('**/sucesso/**', { timeout: 30_000 })
console.log(`Pedido fictício criado: ${dia} às ${hora}`)

// 2. Gravação do painel.
const pastaVideo = mkdtempSync(join(tmpdir(), 'gif-painel-'))
const gravacao = await browser.newContext({
  ...contexto,
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: pastaVideo, size: { width: 1280, height: 800 } },
})
const painel = await gravacao.newPage()
await painel.goto(`${base}/login`)
await painel.getByLabel('E-mail').pressSequentially(email, { delay: 40 })
await painel.getByLabel('Senha').fill(password)
await painel.getByRole('button', { name: 'Entrar no painel' }).click()
await painel.waitForURL('**/painel**', { timeout: 30_000 })
await painel.waitForTimeout(1500)

await painel.goto(`${base}/painel?date=${dia}&view=day`)
await painel.waitForTimeout(1500)
await painel.getByRole('button').filter({ hasText: CLIENTE }).filter({ hasText: 'Aguardando autorização' }).filter({ hasText: hora }).first().click()
await painel.waitForTimeout(1500)
await painel.getByRole('button', { name: 'Autorizar reserva' }).click()
await painel.waitForTimeout(1000)
await painel.getByRole('button', { name: 'Confirmar decisão' }).click()
const whatsapp = painel.getByRole('link', { name: 'Avisar cliente no WhatsApp' })
await whatsapp.waitFor({ timeout: 30_000 })
await whatsapp.hover() // sem clicar: o clique abriria o WhatsApp
await painel.waitForTimeout(3000)

await gravacao.close() // fecha o vídeo
await browser.close()

const video = join(pastaVideo, readdirSync(pastaVideo).find(arquivo => arquivo.endsWith('.webm')))
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-vf',
  'fps=10,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5',
  'docs/images/painel-demo.gif'], { stdio: 'inherit' })
rmSync(pastaVideo, { recursive: true, force: true })
console.log('GIF salvo em docs/images/painel-demo.gif')
