


export interface CreateFamilyRequest {
  name: string;
  username: string;
}

export interface JoinFamilyRequest {
  code: string;
  username: string;
}

export interface SendMessageRequest {
  content: string;
  familyCode: string;
}

// client/types/index.ts

export interface Family {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: Date;
  memberCount: number;
}

export interface Member {
  id: string;
  _id?: string; // MongoDB ID compatibility
  familyId: string;
  userId: string;
  username: string;
  joinedAt: Date;
  isOnline?: boolean;
}

export interface Message {
  id: string;
  familyId: string;
  senderId: string;
  senderName?: string;
  content: string;
  timestamp: Date | string | number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFamilyDto {
  name: string;
  description?: string;
}

export interface JoinFamilyDto {
  familyId: string;
  userId: string;
  username?: string;
}

export interface CreateMessageDto {
  familyId: string;
  senderId: string;
  senderName?: string;
  content: string;
}

// WebSocket specific types
export interface User {
  socketId: string;
  username?: string;
}

export interface TypingUser {
  userId: string;
  username?: string;
}

export interface WebSocketMessage {
  id: string;
  familyId: string;
  senderId: string;
  senderName?: string;
  content: string;
  timestamp: Date;
}

// API Response types
export interface CreateFamilyResponse {
  family: Family;
  member: Member;
}

export interface FamilyDetailsResponse {
  family: Family;
  members: Member[];
}

// Error types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}