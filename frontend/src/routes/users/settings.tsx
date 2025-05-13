import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/users/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/users/settings"!</div>
}
