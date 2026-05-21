import { Request, Response } from 'express';
import { PrismaClient, Rol } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET /usuarios — listar usuarios (DUENO ve todos, ADMIN solo los de su sucursal)
export async function getUsuarios(req: Request, res: Response): Promise<void> {
  const isDueno = req.user!.rol === 'DUENO';

  // ADMIN: siempre filtrado por su propia sucursal, sin excepciones
  // DUENO: puede filtrar por sucursalId query param, o ver todos si no pasa ninguno
  const sucursalId = isDueno
    ? (req.query.sucursalId as string | undefined)
    : req.user!.sucursalId;

  if (!isDueno && !sucursalId) {
    res.status(400).json({ error: 'sucursalId no encontrado en el token' }); return;
  }

  const where = sucursalId ? { sucursalId } : {};

  const usuarios = await prisma.usuario.findMany({
    where,
    select: {
      id: true, nombre: true, email: true, rol: true, activo: true, creadoEn: true,
      sucursal: { select: { id: true, nombre: true } },
    },
    orderBy: { creadoEn: 'asc' },
  });
  res.json(usuarios);
}

// POST /usuarios — crear usuario en una sucursal
export async function createUsuario(req: Request, res: Response): Promise<void> {
  const { nombre, email, password, rol, sucursalId } = req.body;
  if (!nombre || !email || !password || !rol) {
    res.status(400).json({ error: 'Todos los campos son requeridos' }); return;
  }
  if (!Object.values(Rol).includes(rol)) {
    res.status(400).json({ error: `Rol inválido. Válidos: ${Object.values(Rol).join(', ')}` }); return;
  }

  const targetSucursalId = req.user!.rol === 'DUENO' ? sucursalId : req.user!.sucursalId!;
  if (!targetSucursalId) { res.status(400).json({ error: 'sucursalId requerido' }); return; }

  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) { res.status(409).json({ error: 'Email ya registrado' }); return; }

  const hash = await bcrypt.hash(password, 10);
  const usuario = await prisma.usuario.create({
    data: { nombre, email, passwordHash: hash, rol, sucursalId: targetSucursalId },
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
  });
  res.status(201).json(usuario);
}

// PATCH /usuarios/:id — actualizar usuario
export async function updateUsuario(req: Request, res: Response): Promise<void> {
  const { nombre, email, rol, activo, sucursalId, password } = req.body;

  const emailNormalizado =
    typeof email === 'string' ? email.trim().toLowerCase() : undefined;

  if (email !== undefined) {
    if (!emailNormalizado) {
      res.status(400).json({ error: 'El email no puede estar vacío' });
      return;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado);
    if (!emailValido) {
      res.status(400).json({ error: 'Formato de email inválido' });
      return;
    }

    const existente = await prisma.usuario.findUnique({
      where: { email: emailNormalizado },
      select: { id: true },
    });

    if (existente && existente.id !== req.params.id) {
      res.status(409).json({ error: 'Email ya registrado' });
      return;
    }
  }

  const passwordData = password
    ? { passwordHash: await bcrypt.hash(password, 10) }
    : {};

  const usuario = await prisma.usuario.update({
    where: { id: req.params.id },
    data: {
      ...(nombre !== undefined ? { nombre } : {}),
      ...(emailNormalizado !== undefined ? { email: emailNormalizado } : {}),
      ...(rol !== undefined ? { rol } : {}),
      ...(activo !== undefined ? { activo } : {}),
      ...(sucursalId ? { sucursalId } : {}),
      ...passwordData,
    },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      activo: true,
      sucursalId: true,
      creadoEn: true,
      sucursal: { select: { id: true, nombre: true } },
    },
  });

  res.json(usuario);
}

// DELETE /usuarios/:id — eliminar usuario
export async function deleteUsuario(req: Request, res: Response): Promise<void> {
  await prisma.usuario.delete({ where: { id: req.params.id } });
  res.json({ mensaje: 'Usuario eliminado' });
}

// PATCH /usuarios/me — actualizar perfil propio
export async function updateMe(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;          // ← userId (no id)
  const { nombre } = req.body;
  if (!nombre?.trim()) { res.status(400).json({ error: 'El nombre no puede estar vacío' }); return; }

  // DUENO actualiza en tabla Dueno, los demás en Usuario
  if (req.user!.rol === 'DUENO') {
    const dueno = await prisma.dueno.update({
      where: { id: userId },
      data: { nombre },
      select: { id: true, nombre: true, email: true },
    });
    res.json(dueno);
    return;
  }

  const usuario = await prisma.usuario.update({
    where: { id: userId },
    data: { nombre },
    select: { id: true, nombre: true, email: true, rol: true },
  });
  res.json(usuario);
}

// PATCH /usuarios/me/password — cambiar contraseña propia
export async function changeMyPassword(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;          // ← userId (no id)
  const { passwordActual, passwordNueva } = req.body;
  if (!passwordActual || !passwordNueva) {
    res.status(400).json({ error: 'Se requieren ambas contraseñas' }); return;
  }
  if (passwordNueva.length < 6) {
    res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }); return;
  }

  if (req.user!.rol === 'DUENO') {
    const dueno = await prisma.dueno.findUnique({ where: { id: userId } });
    if (!dueno) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
    const ok = await bcrypt.compare(passwordActual, dueno.passwordHash);
    if (!ok) { res.status(401).json({ error: 'Contraseña actual incorrecta' }); return; }
    await prisma.dueno.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(passwordNueva, 10) } });
  } else {
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!usuario) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
    const ok = await bcrypt.compare(passwordActual, usuario.passwordHash);
    if (!ok) { res.status(401).json({ error: 'Contraseña actual incorrecta' }); return; }
    await prisma.usuario.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(passwordNueva, 10) } });
  }

  res.json({ mensaje: 'Contraseña actualizada correctamente' });
}
