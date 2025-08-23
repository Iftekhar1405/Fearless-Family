// client/hooks/useWebSocketWithQuery.ts
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { WebSocketService } from "../services/webSocket.service";

interface Message {
  id: string;
  familyId: string;
  senderId: string;
  senderName?: string;
  content: string;
  timestamp: Date;
}

interface User {
  socketId: string;
  username?: string;
}

interface TypingUser {
  userId: string;
  username?: string;
}

interface SendMessageData {
  familyId: string;
  content: string;
}

// API functions - Updated to use Next.js API routes
const messagesApi = {
  getMessages: async (familyId: string): Promise<Message[]> => {
    try {
      const response = await fetch(`/api/families/${familyId}/messages`);
      if (!response.ok) {
        if (response.status === 404) {
          // Return empty array if no messages exist yet
          return [];
        }
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error("Error fetching messages:", error);
      // Return empty array as fallback
      return [];
    }
  },

  sendMessage: async (
    data: SendMessageData & { userId: string; username?: string }
  ): Promise<Message> => {
    const response = await fetch(`/api/families/${data.familyId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: data.content,
        senderId: data.userId,
        senderName: data.username,
      }),
    });
    if (!response.ok) throw new Error("Failed to send message");
    return response.json();
  },

  getFamilyMembers: async (familyId: string) => {
    try {
      const response = await fetch(`/api/families/${familyId}/members`);
      if (!response.ok) {
        if (response.status === 404) {
          // Return empty array if no members exist yet
          return [];
        }
        throw new Error(`Failed to fetch family members: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error("Error fetching family members:", error);
      // Return empty array as fallback
      return [];
    }
  },
};

export const useWebSocketWithQuery = (userId: string, username?: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentFamilyId, setCurrentFamilyId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const wsService = useRef<WebSocketService | null>(null);
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const queryClient = useQueryClient();

  // Queue for actions that need to wait for connection
  const pendingActions = useRef<Array<() => void>>([]);

  // TanStack Query for messages
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["messages", currentFamilyId],
    queryFn: () =>
      currentFamilyId
        ? messagesApi.getMessages(currentFamilyId)
        : Promise.resolve([]),
    enabled: !!currentFamilyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error instanceof Error && error.message.includes("404")) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // TanStack Query for family members
  const { data: familyMembers = [], refetch: refetchFamilyMembers } = useQuery({
    queryKey: ["familyMembers", currentFamilyId],
    queryFn: () =>
      currentFamilyId
        ? messagesApi.getFamilyMembers(currentFamilyId)
        : Promise.resolve([]),
    enabled: !!currentFamilyId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error instanceof Error && error.message.includes("404")) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Mutation for sending messages (fallback if WebSocket fails)
  const sendMessageMutation = useMutation({
    mutationFn: messagesApi.sendMessage,
    onSuccess: (newMessage) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        ["messages", currentFamilyId],
        (old: Message[] = []) => {
          if (old.some((msg) => msg.id === newMessage.id)) {
            return old; // Avoid duplicates
          }
          return [...old, newMessage].sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        }
      );
    },
    onError: (error) => {
      console.error("Failed to send message via API:", error);
    },
  });

  // Initialize WebSocket service
  useEffect(() => {
    // Only initialize WebSocket if we have a userId
    if (userId) {
      wsService.current = new WebSocketService(userId, username);
    }
    return () => {
      wsService.current?.disconnect();
    };
  }, [userId, username]);

  // Execute pending actions when connected
  useEffect(() => {
    if (isConnected && pendingActions.current.length > 0) {
      const actions = [...pendingActions.current];
      pendingActions.current = [];
      actions.forEach((action) => action());
    }
  }, [isConnected]);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (!wsService.current || isConnected || isConnecting) return;

    setIsConnecting(true);
    setConnectionError(null);

    try {
      await wsService.current.connect();
      setIsConnected(true);
      setConnectionError(null);
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      setConnectionError(
        error instanceof Error ? error.message : "Connection failed"
      );
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting]);

  // Wait for connection helper
  const waitForConnection = useCallback(
    async (timeout = 5000): Promise<boolean> => {
      if (isConnected) return true;

      return new Promise((resolve) => {
        const startTime = Date.now();
        const checkConnection = () => {
          if (isConnected) {
            resolve(true);
          } else if (Date.now() - startTime > timeout) {
            resolve(false);
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    },
    [isConnected]
  );

  // Join a family
  const joinFamily = useCallback(
    async (familyId: string) => {
      if (!wsService.current) {
        // If no WebSocket service, just set the family ID and rely on REST API
        setCurrentFamilyId(familyId);
        return;
      }

      const executeJoinFamily = async () => {
        try {
          await wsService.current!.joinFamily(familyId);
          setCurrentFamilyId(familyId);

          // Invalidate and refetch messages for the new family
          await queryClient.invalidateQueries({
            queryKey: ["messages", familyId],
          });
          await queryClient.invalidateQueries({
            queryKey: ["familyMembers", familyId],
          });
        } catch (error) {
          console.error("Failed to join family:", error);
          // Even if WebSocket fails, set the family ID to enable REST API fallback
          setCurrentFamilyId(familyId);

          // Don't throw the error for "not a member" issues in development
          if (
            error instanceof Error &&
            error.message.includes("not a member")
          ) {
            console.log(
              "⚠️ WebSocket join failed, but continuing with REST API fallback"
            );
            return;
          }
          throw error;
        }
      };

      // If not connected, try to connect first
      if (!isConnected) {
        if (!isConnecting) {
          await connect();
        }

        // Wait for connection with shorter timeout
        const connected = await waitForConnection(3000);
        if (connected) {
          await executeJoinFamily();
        } else {
          // If WebSocket connection fails, still set family ID for REST API fallback
          console.log("WebSocket connection failed, using REST API fallback");
          setCurrentFamilyId(familyId);
          // Queue the action for when connection is established
          pendingActions.current.push(() => executeJoinFamily());
        }
      } else {
        await executeJoinFamily();
      }
    },
    [queryClient, isConnected, isConnecting, connect, waitForConnection]
  );

  // Leave current family
  const leaveFamily = useCallback(async () => {
    if (!wsService.current) return;

    try {
      if (isConnected) {
        await wsService.current.leaveFamily();
      }
      const previousFamilyId = currentFamilyId;
      setCurrentFamilyId(null);
      setOnlineUsers([]);
      setTypingUsers([]);

      // Clear cache for the previous family
      if (previousFamilyId) {
        queryClient.removeQueries({ queryKey: ["messages", previousFamilyId] });
      }
    } catch (error) {
      console.error("Failed to leave family:", error);
    }
  }, [currentFamilyId, queryClient, isConnected]);

  // Send a message (with fallback to API)
  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentFamilyId) return;

      if (wsService.current && isConnected) {
        // Try WebSocket first
        try {
          wsService.current.sendMessage(content);
        } catch (error) {
          console.error("WebSocket send failed, falling back to API:", error);
          // Fallback to API
          await sendMessageMutation.mutateAsync({
            familyId: currentFamilyId,
            content,
            userId,
            username,
          });
        }
      } else {
        // Fallback to API
        await sendMessageMutation.mutateAsync({
          familyId: currentFamilyId,
          content,
          userId,
          username,
        });
      }
    },
    [currentFamilyId, isConnected, userId, username, sendMessageMutation]
  );

  // Send typing indicator
  const sendTypingIndicator = useCallback(
    (isTyping: boolean) => {
      if (!wsService.current || !isConnected) return;
      try {
        wsService.current.sendTypingIndicator(isTyping);
      } catch (error) {
        console.error("Failed to send typing indicator:", error);
      }
    },
    [isConnected]
  );

  // Get family members
  const getFamilyMembers = useCallback(() => {
    if (wsService.current && isConnected) {
      try {
        wsService.current.getFamilyMembers();
      } catch (error) {
        console.error("Failed to get family members via WebSocket:", error);
        // Fallback to refetch via TanStack Query
        refetchFamilyMembers();
      }
    } else {
      // Fallback to refetch via TanStack Query
      refetchFamilyMembers();
    }
  }, [isConnected, refetchFamilyMembers]);

  // Setup WebSocket event listeners
  useEffect(() => {
    if (!wsService.current) return;

    const unsubscribeMessage = wsService.current.onMessage((message) => {
      // Update TanStack Query cache with real-time message
      queryClient.setQueryData(
        ["messages", message.familyId],
        (old: Message[] = []) => {
          if (old.some((msg) => msg.id === message.id)) {
            return old; // Avoid duplicates
          }
          return [...old, message].sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        }
      );
    });

    const unsubscribeTyping = wsService.current.onTyping((data) => {
      const { userId: typingUserId, username: typingUsername, isTyping } = data;

      setTypingUsers((prev) => {
        if (isTyping) {
          const filtered = prev.filter((u) => u.userId !== typingUserId);
          const newUser = { userId: typingUserId, username: typingUsername };

          // Clear existing timeout
          const existingTimeout = typingTimeouts.current.get(typingUserId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          // Set new timeout
          const timeout = setTimeout(() => {
            setTypingUsers((current) =>
              current.filter((u) => u.userId !== typingUserId)
            );
            typingTimeouts.current.delete(typingUserId);
          }, 3000);

          typingTimeouts.current.set(typingUserId, timeout);
          return [...filtered, newUser];
        } else {
          const existingTimeout = typingTimeouts.current.get(typingUserId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            typingTimeouts.current.delete(typingUserId);
          }
          return prev.filter((u) => u.userId !== typingUserId);
        }
      });
    });

    const unsubscribeUserJoined = wsService.current.onUserJoined((data) => {
      console.log(`${data.username || "Anonymous"} joined the family`);
      getFamilyMembers();

      // Invalidate family members query to get fresh data
      queryClient.invalidateQueries({
        queryKey: ["familyMembers", currentFamilyId],
      });
    });

    const unsubscribeUserLeft = wsService.current.onUserLeft((data) => {
      console.log(`${data.username || "Anonymous"} left the family`);
      getFamilyMembers();

      // Invalidate family members query to get fresh data
      queryClient.invalidateQueries({
        queryKey: ["familyMembers", currentFamilyId],
      });
    });

    const unsubscribeOnlineUsers = wsService.current.onOnlineUsers((users) => {
      setOnlineUsers(users);
    });

    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
      unsubscribeUserJoined();
      unsubscribeUserLeft();
      unsubscribeOnlineUsers();

      // Clear all typing timeouts
      typingTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeouts.current.clear();
    };
  }, [getFamilyMembers, queryClient, currentFamilyId]);

  // Auto-connect on mount (only if we have a userId)
  useEffect(() => {
    if (userId) {
      connect();
    }
  }, [connect, userId]);

  // Retry connection if it drops (with exponential backoff)
  useEffect(() => {
    if (!isConnected && !isConnecting && wsService.current && userId) {
      let retryCount = 0;
      const maxRetries = 3;

      const retryInterval = setInterval(() => {
        if (retryCount >= maxRetries) {
          console.log("Max retry attempts reached, stopping reconnection");
          clearInterval(retryInterval);
          return;
        }

        console.log(
          `Attempting to reconnect WebSocket... (${
            retryCount + 1
          }/${maxRetries})`
        );
        retryCount++;
        connect();
      }, Math.min(5000 * Math.pow(2, retryCount), 30000)); // Exponential backoff, max 30s

      return () => clearInterval(retryInterval);
    }
  }, [isConnected, isConnecting, connect, userId]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    connectionError,
    currentFamilyId,

    // Data from TanStack Query
    messages,
    isLoadingMessages,
    messagesError,
    familyMembers,

    // Real-time WebSocket data
    onlineUsers,
    typingUsers,

    // Actions
    connect,
    joinFamily,
    leaveFamily,
    sendMessage,
    sendTypingIndicator,
    getFamilyMembers,
    refetchMessages,
    refetchFamilyMembers,

    // Mutation states
    isSendingMessage: sendMessageMutation.isPending,
    sendMessageError: sendMessageMutation.error,
  };
};
