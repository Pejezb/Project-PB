import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { addToBlacklist } from '../utils/tokenBlacklist';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_EXPIRES = '8h';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña requeridos' });
    return;
  }

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

  const ok = await bcrypt.compare(password, usuario.passwordHash);

  if (!ok || !usuario.activo) {
    const nuevosIntentos = usuario.intentosFallidos + 1;
    logger.warn(`Login fallido para: ${email} — intento ${nuevosIntentos}/3`);
    const bloqueadoHasta = nuevosIntentos >= 3
      ? new Date(Date.now() + 60 * 1000)
      : null;

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

  res.json({
    token,
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
}

export const me = async (req: Request, res: Response) => {
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
};

export const logout = (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) addToBlacklist(token);
  logger.info(`Logout: userId ${req.user?.userId}`);
  res.json({ message: 'Sesión cerrada' });
};