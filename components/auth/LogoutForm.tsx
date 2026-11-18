import { logout } from '../../lib/actions/auth'
import { SubmitButton } from './SubmitButton'

export function LogoutForm(): React.JSX.Element {
  return <form action={logout}><SubmitButton pendingLabel="Saindo…">Sair da conta</SubmitButton></form>
}
