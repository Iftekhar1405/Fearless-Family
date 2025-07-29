// client/services/websocket.service.ts
import { io, Socket } from 'socket.io-client';

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

  // Event listeners
  private messageListeners: ((message: Message) => void)[] = [];
  private typingListeners: ((data: { userId: string; username?: string; isTyping: boolean }) => void)[] = [];
  private userJoinedListeners: ((data: { userId: string; username?: string }) => void)[] = [];
  private userLeftListeners: ((data: { userId: string; username?: string }) => void)[] = [];
  private onlineUsersListeners: ((users: User[]) => void)[] = [];

  constructor(userId: string, username?: string) {
    this.userId = userId;
    this.username = username;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io('ws://localhost:3001/chat', {
        transports: ['websocket'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
        this.setupEventListeners();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
        this.currentFamilyId = null;
      });
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Listen for new messages
    this.socket.on('newMessage', (message: Message) => {
      this.messageListeners.forEach(listener => listener(message));
    });

    // Listen for recent messages when joining a family
    this.socket.on('recentMessages', (data: { familyId: string; messages: Message[] }) => {
      data.messages.forEach(message => {
        this.messageListeners.forEach(listener => listener(message));
      });
    });

    // Listen for typing indicators
    this.socket.on('userTyping', (data: { userId: string; username?: string; isTyping: boolean }) => {
      this.typingListeners.forEach(listener => listener(data));
    });

    // Listen for user joined
    this.socket.on('userJoined', (data: { userId: string; username?: string }) => {
      this.userJoinedListeners.forEach(listener => listener(data));
    });

    // Listen for user left
    this.socket.on('userLeft', (data: { userId: string; username?: string }) => {
      this.userLeftListeners.forEach(listener => listener(data));
    });

    // Listen for family members list
    this.socket.on('familyMembers', (data: { familyId: string; onlineUsers: User[]; count: number }) => {
      this.onlineUsersListeners.forEach(listener => listener(data.onlineUsers));
    });

    // Listen for errors
    this.socket.on('error', (error: { message: string }) => {
      console.error('WebSocket error:', error.message);
    });
  }

  joinFamily(familyId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to WebSocket server'));
        return;
      }

      this.socket.emit('joinFamily', {
        familyId,
        userId: this.userId,
        username: this.username,
      });

      this.socket.once('joinedFamily', (data: { familyId: string; success: boolean }) => {
        if (data.success) {
          this.currentFamilyId = familyId;
          // Request current online members
          this.socket?.emit('getFamilyMembers', { familyId });
          resolve();
        } else {
          reject(new Error('Failed to join family'));
        }
      });

      // Handle potential errors
      this.socket.once('error', (error) => {
        reject(new Error(error.message));
      });
    });
  }

  leaveFamily(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.socket?.connected || !this.currentFamilyId) {
        resolve();
        return;
      }

      this.socket.emit('leaveFamily');
      this.socket.once('leftFamily', () => {
        this.currentFamilyId = null;
        resolve();
      });
    });
  }

  sendMessage(content: string): void {
    if (!this.socket?.connected || !this.currentFamilyId) {
      console.error('Cannot send message: not connected or not in a family');
      return;
    }

    this.socket.emit('sendMessage', {
      familyId: this.currentFamilyId,
      userId: this.userId,
      username: this.username,
      content,
    });
  }

  sendTypingIndicator(isTyping: boolean): void {
    if (!this.socket?.connected || !this.currentFamilyId) return;

    this.socket.emit('typing', {
      familyId: this.currentFamilyId,
      userId: this.userId,
      username: this.username,
      isTyping,
    });
  }

  getFamilyMembers(): void {
    if (!this.socket?.connected || !this.currentFamilyId) return;

    this.socket.emit('getFamilyMembers', { familyId: this.currentFamilyId });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentFamilyId = null;
    }
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

  onTyping(callback: (data: { userId: string; username?: string; isTyping: boolean }) => void): () => void {
    this.typingListeners.push(callback);
    return () => {
      const index = this.typingListeners.indexOf(callback);
      if (index > -1) {
        this.typingListeners.splice(index, 1);
      }
    };
  }

  onUserJoined(callback: (data: { userId: string; username?: string }) => void): () => void {
    this.userJoinedListeners.push(callback);
    return () => {
      const index = this.userJoinedListeners.indexOf(callback);
      if (index > -1) {
        this.userJoinedListeners.splice(index, 1);
      }
    };
  }

  onUserLeft(callback: (data: { userId: string; username?: string }) => void): () => void {
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
}