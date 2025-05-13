import { createFileRoute } from '@tanstack/react-router'
import { Account } from '@/components/user/Acount'

export const Route = createFileRoute('/users/account')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Account />
}
