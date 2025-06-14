import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/$projectId/expertise')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/$projectId/expertise"!</div>
}
