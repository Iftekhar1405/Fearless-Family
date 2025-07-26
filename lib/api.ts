import { CreateFamilyRequest, JoinFamilyRequest, SendMessageRequest, Family, Member, Message } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fearless-family-apis-production.up.railway.app/api';
// const API_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async createFamily(data: CreateFamilyRequest): Promise<{ family: Family; member: { _id: string } }> {
    return this.request('/families', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinFamily(data: JoinFamilyRequest): Promise<{ family: Family; member: { _id: string } }> {
    return this.request('/families/join', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFamilyDetails(code: string, memberId: string): Promise<{ family: Family; members: Member[] }> {
    return this.request(`/families/${code}?memberId=${memberId}`);
  }

  async getMessages(familyCode: string, memberId: string): Promise<Message[]> {
    return this.request(`/messages?familyCode=${familyCode}&memberId=${memberId}`);
  }

  async sendMessage(data: SendMessageRequest & { memberId: string }): Promise<Message> {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();