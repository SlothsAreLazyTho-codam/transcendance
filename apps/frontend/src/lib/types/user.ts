export type User = {
  id: number;
  username: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  otp: string | null;
  followedUsers: Follower[];
  blockedUsers: Blocked[];
};

export type Follower = {
  userId: number;
  followingId: number;
  reason: string;
  createdAt: Date;
};

export type Blocked = {
  userId: number;
  blockedId: number;
  reason: string;
  createdAt: Date;
};
