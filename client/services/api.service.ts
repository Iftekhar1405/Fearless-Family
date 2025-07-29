// client/services/api.service.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Family {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  memberCount: number;
}

export interface Member {
  id: string;
  familyId: string;
  userId: string;
  username?: string;
  joinedAt: Date;
  isOnline?: boolean;
}

export interface Message {
  id: string;
  familyId: string;
  senderId: string;
  senderName?: string;
  content: string;
  timestamp: Date;
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

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Family endpoints
  async getFamilies(): Promise<Family[]> {
    return this.request<Family[]>('/families');
  }

  async getFamily(id: string): Promise<Family> {
    return this.request<Family>(`/families/${id}`);
  }

  async createFamily(data: CreateFamilyDto): Promise<Family> {
    return this.request<Family>('/families', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteFamily(id: string): Promise<void> {
    return this.request<void>(`/families/${id}`, {
      method: 'DELETE',
    });
  }

  async joinFamily(data: JoinFamilyDto): Promise<Member> {
    return this.request<Member>(`/families/${data.familyId}/join`, {
      method: 'POST',
      body: JSON.stringify({
        userId: data.userId,
        username: data.username,
      }),
    });
  }

  async leaveFamily(familyId: string, userId: string): Promise<void> {
    return this.request<void>(`/families/${familyId}/leave`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Member endpoints
  async getFamilyMembers(familyId: string): Promise<Member[]> {
    return this.request<Member[]>(`/families/${familyId}/members`);
  }

  async getMember(familyId: string, userId: string): Promise<Member> {
    return this.request<Member>(`/families/${familyId}/members/${userId}`);
  }

  // Message endpoints
  async getMessages(familyId: string, limit: number = 50): Promise<Message[]> {
    return this.request<Message[]>(`/families/${familyId}/messages?limit=${limit}`);
  }

  async getMessage(familyId: string, messageId: string): Promise<Message> {
    return this.request<Message>(`/families/${familyId}/messages/${messageId}`);
  }

  async sendMessage(data: CreateMessageDto): Promise<Message> {
    return this.request<Message>(`/families/${data.familyId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        senderId: data.senderId,
        senderName: data.senderName,
        content: data.content,
      }),
    });
  }

  async deleteMessage(familyId: string, messageId: string): Promise<void> {
    return this.request<void>(`/families/${familyId}/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  async updateMessage(
    familyId: string, 
    messageId: string, 
    content: string
  ): Promise<Message> {
    return this.request<Message>(`/families/${familyId}/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

export const apiService = new ApiService();