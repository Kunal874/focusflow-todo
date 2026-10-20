export type User = { id: string; email: string; createdAt: string };
export type AuthSession = {
  user: User;
  accessToken: string;
  expiresAt: string;
};
