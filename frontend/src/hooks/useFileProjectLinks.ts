import { projectApi } from '@/api/projects';
import { useMutation} from '@tanstack/react-query';

export function useFileProjectLinks() {
  const linkMutation = useMutation({
    mutationFn: ({ fileId, projectId }: { fileId: string, projectId: string }) => 
      projectApi.linkFileToProject(fileId, projectId),
  });

  const unlinkMutation = useMutation({
    mutationFn: ({ fileId, projectId }: { fileId: string, projectId: string }) => 
      projectApi.unlinkFileFromProject(fileId, projectId),
  });

  return {
    linkFileToProject: linkMutation.mutate,
    unlinkFileFromProject: unlinkMutation.mutate,
    isLinking: linkMutation.isPending,
    isUnlinking: unlinkMutation.isPending,
  };
}
