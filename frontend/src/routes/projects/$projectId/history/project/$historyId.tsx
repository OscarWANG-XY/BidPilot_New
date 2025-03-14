import { createFileRoute } from '@tanstack/react-router'
import { ChangeHistoryDetail } from '@/components/change_history/ChangeHistoryDetail'

export const Route = createFileRoute('/projects/$projectId/history/project/$historyId')({
  component: () => <ChangeHistoryDetail historyType="project" />
})