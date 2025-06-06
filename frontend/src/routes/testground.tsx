import { createFileRoute } from '@tanstack/react-router'
// import TestgroundPage from '@/playground/TiptapwithAPI/TiptapPage'
import TiptapEditor_Pro from '@/components/TiptapEditor_Pro/TiptapEditor_pro'
// import TipTapEditor from '@/components/TiptapEditor_Pro/Example'
import AgentStateDataBoard from '@/components/projects/Agents/data/agentStateDataBoard'
import SSEHistoryDataBoard from '@/components/projects/Agents/data/sseHistoryDataBoard'

export const Route = createFileRoute('/testground')({
  component: RouteComponent,
})

function RouteComponent() {

  const projectId = 'f6db0cbe-e7af-4300-8335-01ba4ffdbb93'
  // return <TipTapEditor />
  return (
    <div>
      <div>
        <br />
        <AgentStateDataBoard projectId={projectId} />
        <br />
        <br />
        <SSEHistoryDataBoard projectId={projectId} />
        <br />
        <br />
        {/* <TiptapEditor_Pro />         */}
      </div>
    </div>

  )
}
