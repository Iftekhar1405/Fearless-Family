// client/lib/api.ts

import {
  Family,
  Member,
  Message,
  CreateFamilyResponse,
  FamilyDetailsResponse,
} from "@/client/types";

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_BASE_URL = "http://localhost:3001";

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/api${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Family endpoints
  async getFamilies(): Promise<Family[]> {
    return this.request<Family[]>("/families");
  }

  async getFamily(code: string): Promise<Family> {
    return this.request<Family>(`/families/${code}`);
  }

  async getFamilyDetails(
    code: string,
    memberId: string
  ): Promise<FamilyDetailsResponse> {
    return this.request<FamilyDetailsResponse>(
      `/families/${code}/details?memberId=${memberId}`
    );
  }

  async createFamily(data: {
    name: string;
    username: string;
  }): Promise<CreateFamilyResponse> {
    return this.request<CreateFamilyResponse>("/families", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async joinFamily(data: {
    code: string;
    username: string;
  }): Promise<{ family: Family; member: Member }> {
    return this.request<{ family: Family; member: Member }>(`/families/join`, {
      method: "POST",
      body: JSON.stringify({ username: data.username, code: data.code }),
    });
  }

  async leaveFamily(code: string, memberId: string): Promise<void> {
    return this.request<void>(`/families/${code}/leave`, {
      method: "POST",
      body: JSON.stringify({ memberId }),
    });
  }

  // Member endpoints
  async getFamilyMembers(code: string): Promise<Member[]> {
    return this.request<Member[]>(`/families/${code}/members`);
  }

  async getMember(code: string, memberId: string): Promise<Member> {
    return this.request<Member>(`/families/${code}/members/${memberId}`);
  }

  // Message endpoints
  async getMessages(
    code: string,
    memberId: string,
    limit: number = 50
  ): Promise<Message[]> {
    return this.request<Message[]>(
      `/families/${code}/messages?memberId=${memberId}&limit=${limit}`
    );
  }

  async sendMessage(data: {
    content: string;
    familyCode: string;
    memberId: string;
  }): Promise<Message> {
    return this.request<Message>(`/families/${data.familyCode}/messages`, {
      method: "POST",
      body: JSON.stringify({
        content: data.content,
        memberId: data.memberId,
      }),
    });
  }

  async deleteMessage(code: string, messageId: string): Promise<void> {
    return this.request<void>(`/families/${code}/messages/${messageId}`, {
      method: "DELETE",
    });
  }

  async updateMessage(
    code: string,
    messageId: string,
    content: string
  ): Promise<Message> {
    return this.request<Message>(`/families/${code}/messages/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>("/health");
  }
}

export const api = new ApiService();
