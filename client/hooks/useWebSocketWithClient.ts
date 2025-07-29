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

// API functions (replace with your actual API calls)
const messagesApi = {
  getMessages: async (familyId: string): Promise<Message[]> => {
    const response = await fetch(`/api/families/${familyId}/messages`);
    if (!response.ok) throw new Error("Failed to fetch messages");
    return response.json();
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
    const response = await fetch(`/api/families/${familyId}/members`);
    if (!response.ok) throw new Error("Failed to fetch family members");
    return response.json();
  },
};

export const useWebSocketWithQuery = (userId: string, username?: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentFamilyId, setCurrentFamilyId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

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
    wsService.current = new WebSocketService(userId, username);
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
    try {
      await wsService.current.connect();
      setIsConnected(true);
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting]);

  // Wait for connection helper
  const waitForConnection = useCallback(
    async (timeout = 10000): Promise<boolean> => {
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
      if (!wsService.current) return;

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
          throw error;
        }
      };

      // If not connected, wait for connection or queue the action
      if (!isConnected) {
        // First try to establish connection if not connecting
        if (!isConnecting) {
          await connect();
        }

        // Wait for connection
        const connected = await waitForConnection();
        if (connected) {
          await executeJoinFamily();
        } else {
          // Queue the action for when connection is established
          pendingActions.current.push(() => executeJoinFamily());
          console.log(
            "Queued joinFamily action - waiting for WebSocket connection"
          );
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
        wsService.current.sendMessage(content);
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
      wsService.current.sendTypingIndicator(isTyping);
    },
    [isConnected]
  );

  // Get family members
  const getFamilyMembers = useCallback(() => {
    if (wsService.current && isConnected) {
      wsService.current.getFamilyMembers();
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

  // Auto-connect on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveFamily();
      wsService.current?.disconnect();
    };
  }, [leaveFamily]);

  // Retry connection if it drops
  useEffect(() => {
    if (!isConnected && !isConnecting && wsService.current) {
      const retryInterval = setInterval(() => {
        console.log("Attempting to reconnect WebSocket...");
        connect();
      }, 5000);

      return () => clearInterval(retryInterval);
    }
  }, [isConnected, isConnecting, connect]);

  return {
    // Connection state
    isConnected,
    isConnecting,
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
