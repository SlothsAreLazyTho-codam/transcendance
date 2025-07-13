import { User } from "@/lib/types/user";

export type CreateChannelForm = {
  name: string;
  type: string;
  password?: string;
};

export type Member = {
  id: number;
  userId: number;
  channelId: number;
  isAdmin: boolean;
  joinedAt: string;
  updatedAt: string;
  user: User;
  mutedStatus: any; // adjust this if you have a clearer structure
  bannedStatus: any; // adjust this if you have a clearer structure
};

export type TextMessage = {
  id: number;
  content: string;
  senderId: number;
  channelId: number;
  sender?: {
    id: number;
    username: string;
  };
};

export type Channel = {
  id: number;
  name: string;
  type: "PUBLIC" | "PRIVATE" | "PROTECTED" | string;
  password: string | null;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  members: Member[];
  bannedMembers: any[]; // adjust types if needed
  mutedMembers: any[]; // adjust types if needed
  messages: TextMessage[]; // define a Message type if you have it
};

export type DMTextMessage = {
  id: number;
  content: string;
  senderId: number;
  dmUser1Id: number;
  dmUser2Id: number;
  sender?: {
    id: number;
    username: string;
  };
};

export type DMChannel = {
  vid: number;
  user1Id: number;
  user2Id: number;
  createdAt: string;
  updatedAt: string;

  // Related entities (optional as they may be loaded separately)
  user1?: {
    id: number;
    blockedUsers: Array<any>;
    blockedBy: Array<any>;
    username?: string; // Optional, if you want to include username
  };
  
  user2?: {
    id: number;
    blockedUsers: Array<any>;
    blockedBy: Array<any>;
    username?: string; // Optional, if you want to include username
  };
  
  messages: DMTextMessage[];
}
