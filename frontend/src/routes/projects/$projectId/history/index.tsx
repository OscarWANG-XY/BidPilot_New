import { createFileRoute } from '@tanstack/react-router'
import { ProjectHistoryPage } from '@/components/change_history/ChangeHistoryPage'

export const Route = createFileRoute('/projects/$projectId/history/')({
  component: ProjectHistoryPage
})