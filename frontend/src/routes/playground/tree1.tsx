import { createFileRoute } from '@tanstack/react-router'
import DocumentPage from '@/playground/DocumentPage'

export const Route = createFileRoute('/playground/tree1')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <DocumentPage />
  </div>
}
