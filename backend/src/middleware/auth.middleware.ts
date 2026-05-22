import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, Rol } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) throw new Error('JWT_SECRET no configurado');

interface JwtPayload {
  userId: string;
  rol: string;
  sucursalId?: string;
}

const getFechaSolo = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getFechaRange = () => {
  const start = getFechaSolo();
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

    req.user = {
      userId: payload.userId,
      rol: payload.rol as Rol,
      sucursalId: payload.sucursalId,
    };

    const { start, end } = getFechaRange();
    const asistenciaHoy = await prisma.asistencia.findFirst({
      where: {
        usuarioId: payload.userId,
        fecha: {
          gte: start,
          lt: end,
        },
      },
    });

    if (asistenciaHoy && !asistenciaHoy.presente) {
      res.status(403).json({ error: 'Acceso restringido: usuario marcado como ausente hoy' });
      return;
    }

    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function roleMiddleware(...roles: Rol[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    if (!roles.includes(req.user.rol)) {
      res.status(403).json({ error: 'Sin permisos para esta acción' });
      return;
    }

    next();
  };
}