import { createFileRoute } from '@tanstack/react-router'
import { Subscription } from '@/components/user/Subscription'

export const Route = createFileRoute('/users/subscription')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Subscription />
}
