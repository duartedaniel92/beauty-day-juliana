// Defesa contra gravações acidentais de testes no salão real.
export function assertE2EEnvironment(env: Readonly<Record<string, string | undefined>> = process.env): void {
  const message = 'E2E exige projeto de homologação explicitamente autorizado.'
  if (env.E2E_ALLOW_MUTATIONS !== 'true' || !env.E2E_SUPABASE_PROJECT_REF) throw new Error(message)
  let url: URL
  try { url = new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? '') } catch { throw new Error(message) }
  if (env.E2E_SUPABASE_PROJECT_REF === 'dncuvkrwvrqxdltsympy' ||
    url.hostname !== `${env.E2E_SUPABASE_PROJECT_REF}.supabase.co` ||
    url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error(message)
  }
}
