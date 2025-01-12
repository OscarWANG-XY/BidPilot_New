import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/company')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/company"!</div>
}
