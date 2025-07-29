// client/hooks/useQueries.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import {
  apiService,
  Family,
  Member,
  Message,
  CreateFamilyDto,
  JoinFamilyDto,
  CreateMessageDto,
} from "../services/api.service";

// Query Keys
export const queryKeys = {
  families: ["families"] as const,
  family: (id: string) => ["families", id] as const,
  familyMembers: (familyId: string) =>
    ["families", familyId, "members"] as const,
  messages: (familyId: string) => ["families", familyId, "messages"] as const,
  member: (familyId: string, userId: string) =>
    ["families", familyId, "members", userId] as const,
};

// ============================================================================
// FAMILY HOOKS
// ============================================================================

export const useFamilies = (): UseQueryResult<Family[], Error> => {
  return useQuery({
    queryKey: queryKeys.families,
    queryFn: apiService.getFamilies,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useFamily = (id: string): UseQueryResult<Family, Error> => {
  return useQuery({
    queryKey: queryKeys.family(id),
    queryFn: () => apiService.getFamily(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useCreateFamily = (): UseMutationResult<
  Family,
  Error,
  CreateFamilyDto
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiService.createFamily,
    onSuccess: (newFamily) => {
      // Update families list
      queryClient.setQueryData<Family[]>(queryKeys.families, (old = []) => {
        return [...old, newFamily];
      });

      // Set individual family data
      queryClient.setQueryData(queryKeys.family(newFamily.id), newFamily);
    },
    onError: (error) => {
      console.error("Failed to create family:", error);
    },
  });
};

export const useDeleteFamily = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiService.deleteFamily,
    onSuccess: (_, familyId) => {
      // Remove from families list
      queryClient.setQueryData<Family[]>(queryKeys.families, (old = []) => {
        return old.filter((family) => family.id !== familyId);
      });

      // Remove individual family data
      queryClient.removeQueries({ queryKey: queryKeys.family(familyId) });
      queryClient.removeQueries({
        queryKey: queryKeys.familyMembers(familyId),
      });
      queryClient.removeQueries({ queryKey: queryKeys.messages(familyId) });
    },
  });
};

// ============================================================================
// MEMBER HOOKS
// ============================================================================

export const useFamilyMembers = (
  familyId: string
): UseQueryResult<Member[], Error> => {
  return useQuery({
    queryKey: queryKeys.familyMembers(familyId),
    queryFn: () => apiService.getFamilyMembers(familyId),
    enabled: !!familyId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 30, // Refetch every 30 seconds for online status
  });
};

export const useMember = (
  familyId: string,
  userId: string
): UseQueryResult<Member, Error> => {
  return useQuery({
    queryKey: queryKeys.member(familyId, userId),
    queryFn: () => apiService.getMember(familyId, userId),
    enabled: !!familyId && !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useJoinFamily = (): UseMutationResult<
  Member,
  Error,
  JoinFamilyDto
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiService.joinFamily,
    onSuccess: (newMember, variables) => {
      // Update family members list
      queryClient.setQueryData<Member[]>(
        queryKeys.familyMembers(variables.familyId),
        (old = []) => {
          const filtered = old.filter(
            (member) => member.userId !== variables.userId
          );
          return [...filtered, newMember];
        }
      );

      // Update family member count
      queryClient.setQueryData<Family>(
        queryKeys.family(variables.familyId),
        (old) => {
          if (old) {
            return { ...old, memberCount: old.memberCount + 1 };
          }
          return old;
        }
      );

      // Set individual member data
      queryClient.setQueryData(
        queryKeys.member(variables.familyId, variables.userId),
        newMember
      );
    },
  });
};

export const useLeaveFamily = (): UseMutationResult<
  void,
  Error,
  { familyId: string; userId: string }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ familyId, userId }) =>
      apiService.leaveFamily(familyId, userId),
    onSuccess: (_, { familyId, userId }) => {
      // Remove from family members list
      queryClient.setQueryData<Member[]>(
        queryKeys.familyMembers(familyId),
        (old = []) => old.filter((member) => member.userId !== userId)
      );

      // Update family member count
      queryClient.setQueryData<Family>(queryKeys.family(familyId), (old) => {
        if (old) {
          return { ...old, memberCount: Math.max(0, old.memberCount - 1) };
        }
        return old;
      });

      // Remove individual member data
      queryClient.removeQueries({
        queryKey: queryKeys.member(familyId, userId),
      });
    },
  });
};

// ============================================================================
// MESSAGE HOOKS
// ============================================================================

export const useMessages = (
  familyId: string,
  limit: number = 50
): UseQueryResult<Message[], Error> => {
  return useQuery({
    queryKey: queryKeys.messages(familyId),
    queryFn: () => apiService.getMessages(familyId, limit),
    enabled: !!familyId,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useSendMessage = (): UseMutationResult<
  Message,
  Error,
  CreateMessageDto
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiService.sendMessage,
    onSuccess: (newMessage) => {
      // Add message to the list
      queryClient.setQueryData<Message[]>(
        queryKeys.messages(newMessage.familyId),
        (old = []) => {
          // Avoid duplicates
          if (old.some((msg) => msg.id === newMessage.id)) {
            return old;
          }
          return [...old, newMessage].sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        }
      );
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
    },
  });
};

export const useDeleteMessage = (): UseMutationResult<
  void,
  Error,
  { familyId: string; messageId: string }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ familyId, messageId }) =>
      apiService.deleteMessage(familyId, messageId),
    onSuccess: (_, { familyId, messageId }) => {
      // Remove message from the list
      queryClient.setQueryData<Message[]>(
        queryKeys.messages(familyId),
        (old = []) => old.filter((msg) => msg.id !== messageId)
      );
    },
  });
};

export const useUpdateMessage = (): UseMutationResult<
  Message,
  Error,
  { familyId: string; messageId: string; content: string }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ familyId, messageId, content }) =>
      apiService.updateMessage(familyId, messageId, content),
    onSuccess: (updatedMessage) => {
      // Update message in the list
      queryClient.setQueryData<Message[]>(
        queryKeys.messages(updatedMessage.familyId),
        (old = []) =>
          old.map((msg) =>
            msg.id === updatedMessage.id ? updatedMessage : msg
          )
      );
    },
  });
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  return {
    invalidateFamilies: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.families }),

    invalidateFamily: (familyId: string) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.family(familyId) }),

    invalidateFamilyMembers: (familyId: string) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.familyMembers(familyId),
      }),

    invalidateMessages: (familyId: string) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(familyId) }),

    invalidateAll: () => queryClient.invalidateQueries(),
  };
};

export const usePrefetchFamily = () => {
  const queryClient = useQueryClient();

  return {
    prefetchFamily: (familyId: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.family(familyId),
        queryFn: () => apiService.getFamily(familyId),
        staleTime: 1000 * 60 * 2,
      });
    },

    prefetchFamilyMembers: (familyId: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.familyMembers(familyId),
        queryFn: () => apiService.getFamilyMembers(familyId),
        staleTime: 1000 * 60 * 2,
      });
    },

    prefetchMessages: (familyId: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.messages(familyId),
        queryFn: () => apiService.getMessages(familyId),
        staleTime: 1000 * 60,
      });
    },
  };
};
