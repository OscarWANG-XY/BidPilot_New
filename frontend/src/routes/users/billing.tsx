import { createFileRoute } from '@tanstack/react-router'
import { Billing } from '@/components/user/Billing'

export const Route = createFileRoute('/users/billing')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Billing />
}
