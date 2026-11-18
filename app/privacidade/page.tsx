import Link from 'next/link'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'
import { getSiteContent } from '@/lib/site-data'

export default async function PrivacyPage() {
  const { content } = await getSiteContent()
  return <div className="public-site"><PublicHeader /><main className="mx-auto max-w-2xl space-y-6 px-6 py-12 leading-relaxed">
    <h1 className="text-3xl font-display">Seus dados e sua reserva</h1>
    <p>O Beauty Day Juliana usa seu nome, WhatsApp, e-mail e os detalhes dos serviços e horários para organizar o atendimento e falar com você sobre a reserva.</p>
    <h2 className="text-xl font-semibold">Acesso e armazenamento</h2><p>A agenda e os contatos dos clientes ficam na área protegida da proprietária. O site utiliza Supabase para autenticação, banco de dados e fotos públicas, e Vercel para hospedagem. Fotos publicadas no site podem ser vistas por qualquer visitante.</p>
    <h2 className="text-xl font-semibold">Cookies necessários</h2><p>Usamos cookies para a sessão da profissional, proteção do envio de reservas e acesso ao comprovante. O comprovante fica disponível no navegador que fez a solicitação por até sete dias; limpar os cookies encerra esse acesso. Não usamos esses cookies para anúncios.</p>
    <h2 className="text-xl font-semibold">Contato e exclusão</h2><p>Para consultar, corrigir ou solicitar a exclusão dos seus dados, fale com Juliana em <a className="underline break-all" href={`mailto:${content.email}`}>{content.email}</a>. O histórico é mantido para administrar os atendimentos; a exclusão é tratada pela proprietária conforme a necessidade de conservar o registro.</p>
    <h2 className="text-xl font-semibold">WhatsApp</h2><p>O formulário de contato abre o aplicativo para você revisar e enviar a mensagem. As notificações automáticas das reservas ainda não estão ativadas.</p>
    <Link className="public-cta" href="/agendar">Voltar ao agendamento</Link>
  </main><PublicFooter content={content} /></div>
}
