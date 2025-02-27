import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/playground/_layout')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/playground/_layout"!</div>
}
