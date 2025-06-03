import { createFileRoute } from '@tanstack/react-router'
// import TestgroundPage from '@/playground/TiptapwithAPI/TiptapPage'
import TiptapEditor_Pro from '@/components/TiptapEditor_Pro/TiptapEditor_pro'
// import TipTapEditor from '@/components/TiptapEditor_Pro/Example'
export const Route = createFileRoute('/testground')({
  component: RouteComponent,
})

function RouteComponent() {
  // return <TipTapEditor />
  return <TiptapEditor_Pro />
}
