export type UserType = 'participant' | 'mentor';

export interface JwtPayload {
  userId: string;
  userType: UserType;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
