import { createFileRoute } from '@tanstack/react-router'
import TestContainer from '@/components/projects/Agents/data/TestContainer'
// import  TestContainer from '@/_api/project_agent_api/tests/TestContainer'

export const Route = createFileRoute('/projects/$projectId/raw_data')({
  component: TestContainerComponent,
})

function TestContainerComponent() {

  //const projectId = 'f6db0cbe-e7af-4300-8335-01ba4ffdbb93'

  const { projectId } = Route.useParams()


  return <TestContainer projectId={projectId} />
}
