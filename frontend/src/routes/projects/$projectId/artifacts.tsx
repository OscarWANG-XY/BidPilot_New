import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/$projectId/artifacts')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/$projectId/artifacts"!</div>
}
