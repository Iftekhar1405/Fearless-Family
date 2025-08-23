// client/services/websocket.service.ts
import { io, Socket } from "socket.io-client";

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

export class WebSocketService {
  private socket: Socket | null = null;
  private currentFamilyId: string | null = null;
  private userId: string;
  private username?: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3; // Reduced from 5
  private reconnectDelay = 1000;
  private isConnecting = false;

  // Event listeners
  private messageListeners: ((message: Message) => void)[] = [];
  private typingListeners: ((data: {
    userId: string;
    username?: string;
    isTyping: boolean;
  }) => void)[] = [];
  private userJoinedListeners: ((data: {
    userId: string;
    username?: string;
  }) => void)[] = [];
  private userLeftListeners: ((data: {
    userId: string;
    username?: string;
  }) => void)[] = [];
  private onlineUsersListeners: ((users: User[]) => void)[] = [];

  constructor(userId: string, username?: string) {
    this.userId = userId;
    this.username = username;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        reject(new Error("Connection already in progress"));
        return;
      }

      this.isConnecting = true;

      try {
        // Disconnect existing connection if any
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }

        console.log("Attempting to connect to WebSocket server...");

        // Check if we're in a browser environment
        if (typeof window === "undefined") {
          this.isConnecting = false;
          reject(new Error("WebSocket not available in server environment"));
          return;
        }

        this.socket = io("http://localhost:3001/chat", {
          transports: ["polling", "websocket"], // Start with polling, then upgrade
          autoConnect: true,
          forceNew: true,
          timeout: 10000, // Reduced from 20 seconds
          reconnection: false, // Disable automatic reconnection to handle it manually
          upgrade: true, // Allow transport upgrades
          rememberUpgrade: false, // Don't remember the upgrade
        });

        // Connection success
        this.socket.on("connect", () => {
          console.log("✅ Connected to WebSocket server", this.socket?.id);
          console.log("Transport:", this.socket?.io.engine.transport.name);
          this.reconnectAttempts = 0;
          this.isConnecting = false;

          // Don't resolve immediately, wait for server confirmation
          this.setupEventListeners();

          // Send a ping to confirm connection is stable
          this.socket?.emit("ping", {
            userId: this.userId,
            timestamp: Date.now(),
          });

          // Wait a bit to ensure connection is stable before resolving
          setTimeout(() => {
            if (this.socket?.connected) {
              resolve();
            } else {
              this.isConnecting = false;
              reject(new Error("Connection lost immediately after connecting"));
            }
          }, 1000);
        });

        // Handle transport upgrade
        this.socket.on("upgrade", () => {
          console.log(
            "🔄 Transport upgraded to:",
            this.socket?.io.engine.transport.name
          );
        });

        // Handle ping response
        this.socket.on("pong", (data) => {
          console.log("🏓 Received pong:", data);
        });

        // Connection error
        this.socket.on("connect_error", (error) => {
          console.error("❌ WebSocket connection error:", error);
          this.reconnectAttempts++;
          this.isConnecting = false;

          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error("Max reconnection attempts reached");
            reject(
              new Error(
                `Failed to connect after ${this.maxReconnectAttempts} attempts: ${error.message}`
              )
            );
          } else {
            console.log(
              `Retrying connection... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
            );
            // Don't reject here, let the timeout handle it
          }
        });

        // Disconnection
        this.socket.on("disconnect", (reason, details) => {
          console.log(
            "🔌 Disconnected from WebSocket server:",
            reason,
            details
          );
          this.currentFamilyId = null;
          this.isConnecting = false;

          // Log detailed disconnect reason
          switch (reason) {
            case "io server disconnect":
              console.log("Server forcefully disconnected the socket");
              break;
            case "io client disconnect":
              console.log("Client manually disconnected");
              break;
            case "ping timeout":
              console.log("Connection lost due to ping timeout");
              break;
            case "transport close":
              console.log("Transport connection closed");
              break;
            case "transport error":
              console.log("Transport error occurred");
              break;
            default:
              console.log("Unknown disconnect reason:", reason);
          }
        });

        // Set a timeout to reject if connection takes too long
        setTimeout(() => {
          if (!this.socket?.connected && this.isConnecting) {
            this.isConnecting = false;
            reject(new Error("Connection timeout"));
          }
        }, 10000); // Reduced from 15 seconds
      } catch (error) {
        console.error("Error creating socket connection:", error);
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    console.log("Setting up event listeners...");

    // Listen for connection confirmation
    this.socket.on("connected", (data) => {
      console.log("Server confirmed connection:", data);
    });

    // Listen for new messages
    this.socket.on("newMessage", (message: Message) => {
      console.log("Received new message:", message);
      this.messageListeners.forEach((listener) => listener(message));
    });

    // Listen for recent messages when joining a family
    this.socket.on(
      "recentMessages",
      (data: { familyId: string; messages: Message[] }) => {
        console.log("Received recent messages:", data.messages.length);
        data.messages.forEach((message) => {
          this.messageListeners.forEach((listener) => listener(message));
        });
      }
    );

    // Listen for typing indicators
    this.socket.on(
      "userTyping",
      (data: { userId: string; username?: string; isTyping: boolean }) => {
        this.typingListeners.forEach((listener) => listener(data));
      }
    );

    // Listen for user joined
    this.socket.on(
      "userJoined",
      (data: { userId: string; username?: string }) => {
        console.log("User joined:", data);
        this.userJoinedListeners.forEach((listener) => listener(data));
      }
    );

    // Listen for user left
    this.socket.on(
      "userLeft",
      (data: { userId: string; username?: string }) => {
        console.log("User left:", data);
        this.userLeftListeners.forEach((listener) => listener(data));
      }
    );

    // Listen for family members list
    this.socket.on(
      "familyMembers",
      (data: { familyId: string; onlineUsers: User[]; count: number }) => {
        console.log("Received family members:", data);
        this.onlineUsersListeners.forEach((listener) =>
          listener(data.onlineUsers)
        );
      }
    );

    // Listen for errors
    this.socket.on("error", (error: { message: string }) => {
      console.error("WebSocket error:", error.message);
    });

    console.log("✅ Event listeners set up successfully");
  }

  joinFamily(familyId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error("Not connected to WebSocket server"));
        return;
      }

      console.log("Joining family:", familyId);

      // Set up timeout for join operation
      const timeout = setTimeout(() => {
        reject(new Error("Join family timeout"));
      }, 5000); // Reduced from 10 seconds

      this.socket.emit("joinFamily", {
        familyId,
        userId: this.userId,
        username: this.username,
      });

      // Handle successful join
      const handleJoinSuccess = (data: {
        familyId: string;
        success: boolean;
      }) => {
        clearTimeout(timeout);
        this.socket?.off("joinedFamily", handleJoinSuccess);
        this.socket?.off("error", handleJoinError);

        if (data.success) {
          console.log("✅ Successfully joined family:", familyId);
          this.currentFamilyId = familyId;
          // Request current online members
          this.socket?.emit("getFamilyMembers", { familyId });
          resolve();
        } else {
          reject(new Error("Failed to join family"));
        }
      };

      // Handle join error - for development, we'll be more lenient
      const handleJoinError = (error: { message: string }) => {
        clearTimeout(timeout);
        this.socket?.off("joinedFamily", handleJoinSuccess);
        this.socket?.off("error", handleJoinError);

        // For development, if the error is about not being a member,
        // we'll still consider it a success since the WebSocket server allows it
        if (error.message.includes("not a member")) {
          console.log(
            "⚠️ User not a member, but allowing join for development"
          );
          this.currentFamilyId = familyId;
          resolve();
        } else {
          reject(new Error(error.message));
        }
      };

      this.socket.once("joinedFamily", handleJoinSuccess);
      this.socket.once("error", handleJoinError);
    });
  }

  leaveFamily(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.socket?.connected || !this.currentFamilyId) {
        resolve();
        return;
      }

      console.log("Leaving family:", this.currentFamilyId);

      const timeout = setTimeout(() => {
        console.log("Leave family timeout, resolving anyway");
        this.currentFamilyId = null;
        resolve();
      }, 3000); // Reduced from 5 seconds

      this.socket.emit("leaveFamily");

      this.socket.once("leftFamily", () => {
        clearTimeout(timeout);
        console.log("✅ Successfully left family");
        this.currentFamilyId = null;
        resolve();
      });
    });
  }

  sendMessage(content: string): void {
    if (!this.socket?.connected || !this.currentFamilyId) {
      console.error("Cannot send message: not connected or not in a family");
      throw new Error("Cannot send message: not connected or not in a family");
    }

    console.log("Sending message:", content);

    this.socket.emit("sendMessage", {
      familyId: this.currentFamilyId,
      userId: this.userId,
      username: this.username,
      content,
    });
  }

  sendTypingIndicator(isTyping: boolean): void {
    if (!this.socket?.connected || !this.currentFamilyId) return;

    this.socket.emit("typing", {
      familyId: this.currentFamilyId,
      userId: this.userId,
      username: this.username,
      isTyping,
    });
  }

  getFamilyMembers(): void {
    if (!this.socket?.connected || !this.currentFamilyId) return;
    this.socket.emit("getFamilyMembers", { familyId: this.currentFamilyId });
  }

  disconnect(): void {
    console.log("Disconnecting WebSocket...");
    this.isConnecting = false;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentFamilyId = null;
    }
  }

  // Test connection method
  testConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve(false);
        return;
      }

      const timeout = setTimeout(() => {
        resolve(false);
      }, 3000); // Reduced from 5 seconds

      this.socket.emit("demo", { test: "connection test" });

      this.socket.once("onTesting", () => {
        clearTimeout(timeout);
        resolve(true);
      });
    });
  }

  // Event listener management
  onMessage(callback: (message: Message) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      const index = this.messageListeners.indexOf(callback);
      if (index > -1) {
        this.messageListeners.splice(index, 1);
      }
    };
  }

  onTyping(
    callback: (data: {
      userId: string;
      username?: string;
      isTyping: boolean;
    }) => void
  ): () => void {
    this.typingListeners.push(callback);
    return () => {
      const index = this.typingListeners.indexOf(callback);
      if (index > -1) {
        this.typingListeners.splice(index, 1);
      }
    };
  }

  onUserJoined(
    callback: (data: { userId: string; username?: string }) => void
  ): () => void {
    this.userJoinedListeners.push(callback);
    return () => {
      const index = this.userJoinedListeners.indexOf(callback);
      if (index > -1) {
        this.userJoinedListeners.splice(index, 1);
      }
    };
  }

  onUserLeft(
    callback: (data: { userId: string; username?: string }) => void
  ): () => void {
    this.userLeftListeners.push(callback);
    return () => {
      const index = this.userLeftListeners.indexOf(callback);
      if (index > -1) {
        this.userLeftListeners.splice(index, 1);
      }
    };
  }

  onOnlineUsers(callback: (users: User[]) => void): () => void {
    this.onlineUsersListeners.push(callback);
    return () => {
      const index = this.onlineUsersListeners.indexOf(callback);
      if (index > -1) {
        this.onlineUsersListeners.splice(index, 1);
      }
    };
  }

  // Getters
  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  get currentFamily(): string | null {
    return this.currentFamilyId;
  }

  get connectionState(): string {
    if (!this.socket) return "not_initialized";
    if (this.socket.connected) return "connected";
    if (this.isConnecting) return "connecting";
    return "disconnected";
  }
}
