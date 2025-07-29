// client/hooks/useIntegratedQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/client/lib/api';
import { Family, Member, Message, CreateFamilyResponse } from '@/client/types';

// Query Keys
export const queryKeys = {
  families: ['families'] as const,
  family: (code: string) => ['families', code] as const,
  familyMembers: (code: string) => ['families', code, 'members'] as const,
  messages: (code: string) => ['families', code, 'messages'] as const,
  member: (code: string, memberId: string) => ['families', code, 'members', memberId] as const,
};

// Family Hooks
export const useFamilies = () => {
  return useQuery({
    queryKey: queryKeys.families,
    queryFn: api.getFamilies,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useFamily = (code: string) => {
  return useQuery({
    queryKey: queryKeys.family(code),
    queryFn: () => api.getFamily(code),
    enabled: !!code,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useFamilyDetails = (code: string, memberId: string) => {
  return useQuery({
    queryKey: [...queryKeys.family(code), 'details'],
    queryFn: () => api.getFamilyDetails(code, memberId),
    enabled: !!code && !!memberId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useCreateFamily = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createFamily,
    onSuccess: (response: CreateFamilyResponse) => {
      // Update families list
      queryClient.setQueryData(queryKeys.families, (old: Family[] = []) => {
        return [...old, response.family];
      });

      // Set individual family data
      queryClient.setQueryData(queryKeys.family(response.family.code), response.family);
    },
    onError: (error) => {
      console.error('Failed to create family:', error);
    },
  });
};

// Member Hooks
export const useFamilyMembers = (code: string) => {
  return useQuery({
    queryKey: queryKeys.familyMembers(code),
    queryFn: () => api.getFamilyMembers(code),
    enabled: !!code,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 30, // Refetch every 30 seconds for online status
  });
};

export const useJoinFamily = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.joinFamily,
    onSuccess: (response, variables) => {
      // Update family members list
      queryClient.setQueryData(
        queryKeys.familyMembers(variables.code),
        (old: Member[] = []) => {
          const filtered = old.filter(member => member.id !== response.member.id);
          return [...filtered, response.member];
        }
      );

      // Update family member count
      queryClient.setQueryData(
        queryKeys.family(variables.code),
        (old: Family | undefined) => {
          if (old) {
            return { ...old, memberCount: old.memberCount + 1 };
          }
          return old;
        }
      );
    },
  });
};

// Message Hooks
export const useMessages = (code: string, memberId: string, limit: number = 50) => {
  return useQuery({
    queryKey: queryKeys.messages(code),
    queryFn: () => api.getMessages(code, memberId, limit),
    enabled: !!code && !!memberId,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.sendMessage,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.messages(variables.familyCode) 
      });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(
        queryKeys.messages(variables.familyCode)
      );

      // Optimistically update to the new value
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        familyId: variables.familyCode,
        senderId: variables.memberId,
        content: variables.content,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData(
        queryKeys.messages(variables.familyCode),
        (old: Message[] = []) => [...old, optimisticMessage]
      );

      return { previousMessages };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages(variables.familyCode),
          context.previousMessages
        );
      }
    },
    onSuccess: (newMessage, variables) => {
      // Replace optimistic update with real message
      queryClient.setQueryData(
        queryKeys.messages(variables.familyCode),
        (old: Message[] = []) => {
          const filtered = old.filter(msg => !msg.id.startsWith('temp-'));
          return [...filtered, newMessage].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        }
      );
    },
  });
};

// Utility Hooks
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  return {
    invalidateFamilies: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.families }),

    invalidateFamily: (code: string) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.family(code) }),

    invalidateFamilyMembers: (code: string) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.familyMembers(code) }),

    invalidateMessages: (code: string) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(code) }),

    invalidateAll: () => queryClient.invalidateQueries(),
  };
};