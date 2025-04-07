import { createFileRoute } from '@tanstack/react-router'
import TestgroundPage from '@/playground/TiptapwithAPI/TiptapPage'

export const Route = createFileRoute('/testground')({
  component: RouteComponent,
})

function RouteComponent() {
  return <TestgroundPage />
}
