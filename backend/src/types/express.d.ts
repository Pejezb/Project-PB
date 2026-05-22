import { Rol } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        rol: Rol;
        sucursalId?: string;
      };
    }
  }
}

export {};