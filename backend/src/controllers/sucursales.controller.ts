import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getSucursales(req: Request, res: Response): Promise<void> {
  const { userId, rol, sucursalId } = req.user!;

  const where =
    rol === 'DUENO'
      ? { duenoId: userId }
      : { id: sucursalId ?? '' };

  const sucursales = await prisma.sucursal.findMany({
    where,
    include: {
      _count: { select: { usuarios: true, pedidos: true } },
    },
    orderBy: { creadoEn: 'asc' },
  });

  res.json(sucursales);
}

export async function getSucursalById(req: Request, res: Response): Promise<void> {
  const sucursal = await prisma.sucursal.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { usuarios: true, mesas: true, productos: true } } },
  });
  if (!sucursal) { res.status(404).json({ error: 'Sucursal no encontrada' }); return; }
  res.json(sucursal);
}

export async function createSucursal(req: Request, res: Response): Promise<void> {
  const { nombre, direccion, telefono, horarioApertura, horarioCierre, diasOperacion } = req.body;
  if (!nombre) { res.status(400).json({ error: 'El nombre es requerido' }); return; }

  const sucursal = await prisma.sucursal.create({
    data: {
      nombre,
      direccion,
      telefono,
      horarioApertura,
      horarioCierre,
      diasOperacion,
      abierto: false,
      duenoId: req.user!.userId,
    },
  });
  res.status(201).json(sucursal);
}

export async function updateSucursal(req: Request, res: Response): Promise<void> {
  const { nombre, direccion, telefono, horarioApertura, horarioCierre, diasOperacion } = req.body;
  const sucursal = await prisma.sucursal.update({
    where: { id: req.params.id },
    data: { nombre, direccion, telefono, horarioApertura, horarioCierre, diasOperacion },
  });
  res.json(sucursal);
}

export async function toggleSucursal(req: Request, res: Response): Promise<void> {
  const sucursal = await prisma.sucursal.findUnique({ where: { id: req.params.id } });
  if (!sucursal) { res.status(404).json({ error: 'Sucursal no encontrada' }); return; }

  const updated = await prisma.sucursal.update({
    where: { id: req.params.id },
    data: { abierto: !sucursal.abierto },
  });
  res.json({ abierto: updated.abierto, mensaje: updated.abierto ? 'Sucursal abierta' : 'Sucursal cerrada' });
}

export async function deleteSucursal(req: Request, res: Response): Promise<void> {
  const sucursal = await prisma.sucursal.findUnique({ where: { id: req.params.id } });
  if (!sucursal) { res.status(404).json({ error: 'Sucursal no encontrada' }); return; }

  const activos = await prisma.pedido.count({
    where: { sucursalId: req.params.id, estado: { notIn: ['PAGADO', 'CANCELADO'] } },
  });
  if (activos > 0) {
    res.status(400).json({ error: `No se puede eliminar: hay ${activos} pedido(s) activo(s)` });
    return;
  }

  await prisma.sucursal.delete({ where: { id: req.params.id } });
  res.json({ mensaje: 'Sucursal eliminada correctamente' });
}
