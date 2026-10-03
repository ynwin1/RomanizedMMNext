export type AuthRole = "admin";

export interface AuthPrincipal {
  userId: string;
  role: AuthRole | null;
}
