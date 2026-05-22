import { Request, Response } from 'express';
import { PrismaClient, EstadoPedido, EstadoMesa } from '@prisma/client';

const prisma = new PrismaClient();

export async function getPedidosActivos(req: Request, res: Response): Promise<void> {
  const sucursalId = req.user!.sucursalId!;

  const pedidos = await prisma.pedido.findMany({
    where: {
      sucursalId,
      estado: { notIn: [EstadoPedido.PAGADO, EstadoPedido.CANCELADO] },
    },
    include: {
      mesa: true,
      items: { include: { producto: true } },
    },
    orderBy: { creadoEn: 'asc' },
  });

  res.json(pedidos);
}

export async function crearPedido(req: Request, res: Response): Promise<void> {
  const { mesaId, tipo, items } = req.body;
  const meseroId = req.user!.userId;
  const sucursalId = req.user!.sucursalId!;

  if (!tipo || !items?.length) {
    res.status(400).json({ error: 'tipo e items son requeridos' }); return;
  }

  const productIds = items.map((i: any) => i.productoId);
  const productos = await prisma.producto.findMany({
    where: { id: { in: productIds }, sucursalId, disponible: true },
  });

  if (productos.length !== productIds.length) {
    res.status(400).json({ error: 'Uno o más productos no están disponibles' }); return;
  }

  let total = 0;
  let necesitaCocina = false;

  const itemsData = items.map((item: any) => {
    const producto = productos.find((p) => p.id === item.productoId)!;
    const subtotal = Number(producto.precio) * item.cantidad;
    total += subtotal;
    if (producto.requiereCocina) necesitaCocina = true;
    return {
      productoId: item.productoId,
      cantidad: item.cantidad,
      precio: producto.precio,
      subtotal,
      enviadoACocina: producto.requiereCocina,
    };
  });

  const pedido = await prisma.pedido.create({
    data: {
      tipo,
      estado: necesitaCocina ? EstadoPedido.LISTO : EstadoPedido.PENDIENTE,
      mesaId: mesaId || null,
      meseroId,
      sucursalId,
      total,
      items: { create: itemsData },
    },
    include: { mesa: true, items: { include: { producto: true } } },
  });

  if (mesaId) {
    await prisma.mesa.update({
      where: { id: mesaId },
      data: { estado: EstadoMesa.OCUPADA },
    });
  }

  res.status(201).json(pedido);
}

export async function agregarItems(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { items } = req.body;
  const sucursalId = req.user!.sucursalId!;

  if (!items?.length) {
    res.status(400).json({ error: 'items requeridos' }); return;
  }

  const pedido = await prisma.pedido.findFirst({
    where: { id, sucursalId, estado: { notIn: [EstadoPedido.PAGADO, EstadoPedido.CANCELADO] } },
  });
  if (!pedido) { res.status(404).json({ error: 'Pedido no encontrado' }); return; }

  const productIds = items.map((i: any) => i.productoId);
  const productos = await prisma.producto.findMany({
    where: { id: { in: productIds }, sucursalId, disponible: true },
  });

  let addedTotal = 0;
  let necesitaCocina = false;

  const itemsData = items.map((item: any) => {
    const producto = productos.find((p) => p.id === item.productoId)!;
    const subtotal = Number(producto.precio) * item.cantidad;
    addedTotal += subtotal;
    if (producto.requiereCocina) necesitaCocina = true;
    return {
      pedidoId: id,
      productoId: item.productoId,
      cantidad: item.cantidad,
      precio: producto.precio,
      subtotal,
      enviadoACocina: producto.requiereCocina,
    };
  });

  await prisma.itemPedido.createMany({ data: itemsData });

  const nuevoTotal = Number(pedido.total || 0) + addedTotal;
  const nuevoEstado =
  necesitaCocina && pedido.estado === EstadoPedido.PENDIENTE
    ? EstadoPedido.PENDIENTE
    : EstadoPedido.LISTO;

  const actualizado = await prisma.pedido.update({
    where: { id },
    data: { total: nuevoTotal, estado: nuevoEstado },
    include: { mesa: true, items: { include: { producto: true } } },
  });

  res.json(actualizado);
}

export async function marcarEntregado(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const sucursalId = req.user!.sucursalId!;

  const pedido = await prisma.pedido.findFirst({
    where: { id, sucursalId, estado: EstadoPedido.LISTO },
  });
  if (!pedido) { res.status(404).json({ error: 'Pedido no está en estado LISTO' }); return; }

  const actualizado = await prisma.pedido.update({
    where: { id },
    data: { estado: EstadoPedido.LISTO },
    include: { mesa: true, items: { include: { producto: true } } },
  });

  res.json(actualizado);
}

export async function cobrarPedido(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { metodoPago } = req.body;
  const sucursalId = req.user!.sucursalId!;

  if (!metodoPago) { res.status(400).json({ error: 'Método de pago requerido' }); return; }

  const pedido = await prisma.pedido.findFirst({
    where: { id, sucursalId, estado: { notIn: [EstadoPedido.PAGADO, EstadoPedido.CANCELADO] } },
  });
  if (!pedido) { res.status(404).json({ error: 'Pedido no encontrado' }); return; }

  await prisma.pedido.update({
    where: { id },
    data: { pagado: true, metodoPago, estado: EstadoPedido.PAGADO },
  });

  if (pedido.mesaId) {
    const otrosActivos = await prisma.pedido.count({
      where: {
        mesaId: pedido.mesaId,
        estado: { notIn: [EstadoPedido.PAGADO, EstadoPedido.CANCELADO] },
        id: { not: id },
      },
    });
    if (otrosActivos === 0) {
      await prisma.mesa.update({
        where: { id: pedido.mesaId },
        data: { estado: EstadoMesa.LIBRE },
      });
    }
  }

  res.json({ mensaje: 'Pedido cobrado correctamente' });
}

export async function cancelarPedido(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const sucursalId = req.user!.sucursalId!;

  const pedido = await prisma.pedido.findFirst({
    where: { id, sucursalId, estado: { notIn: [EstadoPedido.PAGADO, EstadoPedido.CANCELADO] } },
  });
  if (!pedido) { res.status(404).json({ error: 'Pedido no encontrado' }); return; }

  await prisma.pedido.update({
    where: { id },
    data: { estado: EstadoPedido.CANCELADO },
  });

  if (pedido.mesaId) {
    const otrosActivos = await prisma.pedido.count({
      where: {
        mesaId: pedido.mesaId,
        estado: { notIn: [EstadoPedido.PAGADO, EstadoPedido.CANCELADO] },
        id: { not: id },
      },
    });
    if (otrosActivos === 0) {
      await prisma.mesa.update({
        where: { id: pedido.mesaId },
        data: { estado: EstadoMesa.LIBRE },
      });
    }
  }

  res.json({ mensaje: 'Pedido cancelado' });
}
