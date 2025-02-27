import { createFileRoute } from '@tanstack/react-router'
import AIAnalysisDashboard from '@/playground/AIAnalysisDashboard'

export const Route = createFileRoute('/playground/AIAnalysisDashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
  <div>
    <div>Hello "/playground/AIAnalysisDashboard"!</div>
    <div>
      <AIAnalysisDashboard />
    </div>
  </div>
)}
