import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, updateUser } from '@/_api/auth_api/user_api';
import { UserUpdateInput } from '@/_types/user_dt_stru';

// Query keys
export const userKeys = {
  all: ['user'] as const,
  current: () => [...userKeys.all, 'current'] as const,
};

/**
 * Hook for managing user data
 * @returns Object containing user data and mutation functions
 */
export const useUser = () => {
  const queryClient = useQueryClient();

  // Query for getting current user
  const {
    data: user,
    isLoading,
    error,
    refetch: refetchUser,
  } = useQuery({
    queryKey: userKeys.current(),
    queryFn: getCurrentUser,
  });

  // Mutation for updating user
  const { mutate: updateUserMutation, isPending: isUpdating } = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UserUpdateInput }) =>
      updateUser(userId, data),
    onSuccess: (updatedUser) => {
      // Update the cache with the new user data
      queryClient.setQueryData(userKeys.current(), updatedUser);
    },
  });

  return {
    user,
    isLoading,
    error,
    refetchUser,
    updateUser: updateUserMutation,
    isUpdating,
  };
};
