export type ActionState = {
  ok?: boolean;
  error?: string; // PortalErrorCode
  temp?: { username: string; password: string };
  nonce?: number;
} | null;
