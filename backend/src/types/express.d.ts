import type { UserType } from './auth.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        userType: UserType;
      };
    }
  }
}
