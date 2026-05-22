import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { isBlacklisted } from '../utils/tokenBlacklist';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Token requerido' });
        return;
    }

    if (isBlacklisted(token)) {
        res.status(401).json({ error: 'Token inválido o expirado' });
        return;
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;

        

        const user = await prisma.usuario.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                rol: true,
                sucursalId: true,
                activo: true,
            },
        });

        if (!user) {
            res.status(401).json({ error: 'Usuario no existe' });
            return;
        }

        if (!user.activo) {
            res.status(403).json({ error: 'Usuario desactivado' });
            return;
        }

        req.user = {
            userId: user.id,
            rol: user.rol,
            sucursalId: user.sucursalId ?? undefined,
        };

        const rolesConAsistencia = ['MESERO', 'COCINERO'];

        if (rolesConAsistencia.includes(user.rol)) {
            const start = new Date();
            start.setHours(0, 0, 0, 0);

            const end = new Date();
            end.setHours(23, 59, 59, 999);

            const asistencia = await prisma.asistencia.findFirst({
                where: {
                    usuarioId: user.id,
                    fecha: {
                        gte: start,
                        lte: end,
                    },
                },
                orderBy: {
                    creadoEn: 'desc',
                },
            });

            if (!asistencia || asistencia.presente !== true) {
                res.status(403).json({
                    error: 'Debes registrar asistencia para acceder al sistema',
                });
                return;
            }
        }

        next();
    } catch (err) {
        res.status(401).json({ error: 'Token inválido o expirado' });
        return;
    }
}

export function roleMiddleware(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.rol)) {
            res.status(403).json({ error: 'Sin permisos para esta acción' });
            return;
        }
        next();
    };
}

