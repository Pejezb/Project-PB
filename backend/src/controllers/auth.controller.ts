import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) throw new Error('JWT_SECRET no configurado');

const JWT_EXPIRES = '8h';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  path: '/',
  maxAge: 8 * 60 * 60 * 1000,
};

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

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña requeridos' });
    return;
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { sucursal: true },
    });

    if (!usuario) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      const segundosRestantes = Math.ceil(
        (usuario.bloqueadoHasta.getTime() - Date.now()) / 1000
      );
      res.status(429).json({
        error: 'Cuenta bloqueada temporalmente',
        bloqueadoHasta: usuario.bloqueadoHasta,
        segundosRestantes,
      });
      return;
    }

    if (!usuario.activo) {
      res.status(403).json({ error: 'Cuenta desactivada' });
      return;
    }

    const passwordOk = await bcrypt.compare(password, usuario.passwordHash);

    if (!passwordOk) {
      const nuevosIntentos = usuario.intentosFallidos + 1;
      logger.warn(`Login fallido para: ${email} — intento ${nuevosIntentos}/3`);

      const bloqueadoHasta =
        nuevosIntentos >= 3 ? new Date(Date.now() + 60 * 1000) : null;

      await prisma.usuario.update({
        where: { email },
        data: {
          intentosFallidos: nuevosIntentos,
          ...(bloqueadoHasta && { bloqueadoHasta }),
        },
      });

      if (nuevosIntentos >= 3) {
        logger.warn(`Cuenta bloqueada: ${email}`);
        res.status(429).json({
          error: 'Cuenta bloqueada temporalmente',
          bloqueadoHasta,
          segundosRestantes: 60,
        });
        return;
      }

      res.status(401).json({
        error: 'Credenciales incorrectas',
        intentosRestantes: 3 - nuevosIntentos,
      });
      return;
    }

    if (usuario.rol !== 'DUENO' && !usuario.sucursal?.abierto) {
      res.status(403).json({ error: 'La sucursal está cerrada' });
      return;
    }

    const { start, end } = getFechaRange();
    const asistenciaHoy = await prisma.asistencia.findFirst({
      where: {
        usuarioId: usuario.id,
        fecha: {
          gte: start,
          lt: end,
        },
      },
    });

    if (asistenciaHoy && !asistenciaHoy.presente) {
      res.status(403).json({
        error: 'Acceso bloqueado: ha sido marcado como ausente hoy',
      });
      return;
    }

    await prisma.usuario.update({
      where: { email },
      data: { intentosFallidos: 0, bloqueadoHasta: null },
    });

    logger.info(`Login exitoso: ${email} (${usuario.rol})`);

    const token = jwt.sign(
      { userId: usuario.id, rol: usuario.rol, sucursalId: usuario.sucursalId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    res.json({
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        sucursalId: usuario.sucursalId,
        sucursal: usuario.sucursal
          ? { id: usuario.sucursal.id, nombre: usuario.sucursal.nombre }
          : null,
      },
    });
  } catch (error) {
    logger.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user!.userId },
      include: { sucursal: true },
    });

    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      sucursalId: usuario.sucursalId,
      sucursal: usuario.sucursal
        ? { id: usuario.sucursal.id, nombre: usuario.sucursal.nombre }
        : null,
    });
  } catch (error) {
    logger.error('Error en me:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const logout = (req: Request, res: Response): void => {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.json({ message: 'Sesión cerrada' });
};