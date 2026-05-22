import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


type UserToken = {
    id: string;
    rol: 'ADMIN' | 'MESERO' | 'COCINERO';
    sucursalId: string | null;
};

const HORA_ENTRADA = "15:00";

const getUser = (req: Request): UserToken | undefined => {
    return req.user as UserToken | undefined;
};

const getFechaSolo = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

const getHoraLima = (date: Date) => {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Lima',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date);
};


const esTardanza = (hora: Date) => {
    const [h, m] = HORA_ENTRADA.split(':').map(Number);

    const horaLima = getHoraLima(hora);
    const [hActual, mActual] = horaLima.split(':').map(Number);

    const minutosActual = hActual * 60 + mActual;
    const minutosLimite = h * 60 + m;

    return minutosActual > minutosLimite;
};

export const getAsistencias = async (req: Request, res: Response) => {
    try {
        const user = getUser(req);

        if (!user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        const fecha = getFechaSolo();

        const whereSucursal =
            user.rol === 'ADMIN'
                ? {}
                : { sucursalId: user.sucursalId! };

        const usuarios = await prisma.usuario.findMany({
            where: {
                ...whereSucursal,
                rol: {
                    in: ['MESERO', 'COCINERO'],
                },
            },
            include: {
                asistencias: {
                    where: {
                        fecha,
                    },
                    take: 1,
                },
            },
        });

        const result = usuarios.map((u) => {
            const a = u.asistencias?.[0];

            return {
                id: u.id,
                nombre: u.nombre,
                rol: u.rol,
                asistencia: a?.presente ?? false,
                horaEntrada: a?.horaEntrada ?? null,
                tardanza: a?.tardanza ?? false,
            };
        });

        return res.json(result);

    } catch (error) {
        console.error('ERROR getAsistencias:', error);
        return res.status(500).json({
            error: 'Error al obtener asistencias',
        });
    }
};

export const toggleAsistencia = async (req: Request, res: Response) => {
    try {
        const user = getUser(req);

        if (!user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        const { id } = req.params;
        const { presente } = req.body;

        const fecha = getFechaSolo();
        const ahora = new Date();

        const whereEmpleado =
            user.rol === 'ADMIN'
                ? { id }
                : { id, sucursalId: user.sucursalId! };

        const empleado = await prisma.usuario.findFirst({
            where: whereEmpleado,
        });

        if (!empleado) {
            return res.status(404).json({
                error: 'Usuario no existe o no pertenece a la sucursal',
            });
        }

        const existente = await prisma.asistencia.findFirst({
            where: {
                usuarioId: id,
                fecha,
            },
        });

        const horaEntrada =
            presente && !existente?.horaEntrada
                ? ahora
                : existente?.horaEntrada ?? null;

        const tardanza =
            presente
                ? esTardanza(ahora)
                : existente?.tardanza ?? false;

        let asistencia;

        if (existente) {
            asistencia = await prisma.asistencia.update({
                where: { id: existente.id },
                data: {
                    presente,
                    horaEntrada,
                    tardanza,
                },
            });
        } else {
            asistencia = await prisma.asistencia.create({
                data: {
                    usuarioId: id,
                    sucursalId: user.sucursalId!,
                    fecha,
                    presente,
                    horaEntrada: presente ? ahora : null,
                    tardanza: presente ? esTardanza(ahora) : false,
                },
            });
        }

        // ✅ RESPUESTA CORREGIDA (lo que tu frontend espera)
        return res.json({
            id: asistencia.id,
            presente: asistencia.presente,
            tardanza: asistencia.tardanza,
            horaEntrada: asistencia.horaEntrada,
        });

    } catch (error) {
        console.error('ERROR toggleAsistencia:', error);
        return res.status(500).json({
            message: 'Error al actualizar asistencia',
        });
    }
};
