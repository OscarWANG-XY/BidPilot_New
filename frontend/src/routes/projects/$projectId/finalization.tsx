import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/$projectId/finalization')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/$projectId/finalization"!</div>
}
