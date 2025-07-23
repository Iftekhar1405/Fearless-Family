export interface Family {
  _id: string;
  name: string;
  code: string;
  createdAt: Date;
  memberCount: number;
  familyCode:string
}

export interface Member {
  _id: string;
  username: string;
  joinedAt: Date;
}

export interface Message {
  id: string;
  content: string;
  timestamp: Date;
  familyId: string;
}

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