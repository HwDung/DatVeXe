export type AuthContext = {
  userId: string;
  sessionId: string;
  email: string;
  roles: string[];
  permissions: string[];
};