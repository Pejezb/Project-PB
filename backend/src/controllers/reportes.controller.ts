import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getFechaInicio(fecha?: string) {
  if (!fecha) {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() - 6);
    hoy.setHours(0, 0, 0, 0);
    return hoy;
  }

  const date = new Date(`${fecha}T00:00:00`);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getFechaFin(fecha?: string) {
  const date = fecha ? new Date(`${fecha}T00:00:00`) : new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function formatDateKey(date: Date) {
  return date.toISOString().split('T')[0];
}

function generarDiasRango(desde: Date, hasta: Date) {
  const dias: string[] = [];
  const actual = new Date(desde);
  actual.setHours(0, 0, 0, 0);

  const fin = new Date(hasta);
  fin.setHours(0, 0, 0, 0);

  while (actual <= fin) {
    dias.push(formatDateKey(actual));
    actual.setDate(actual.getDate() + 1);
  }

  return dias;
}

export async function getReporteDueno(req: Request, res: Response): Promise<void> {
  try {
    const duenoId = req.user!.userId;
    const { desde, hasta, sucursalId } = req.query;

    const fechaInicio = getFechaInicio(typeof desde === 'string' ? desde : undefined);
    const fechaFin = getFechaFin(typeof hasta === 'string' ? hasta : undefined);

    const sucursalesDueno = await prisma.sucursal.findMany({
      where: { duenoId },
      select: {
        id: true,
        nombre: true,
      },
      orderBy: { nombre: 'asc' },
    });

    const sucursalIdsPermitidas = sucursalesDueno.map((sucursal) => sucursal.id);

    if (sucursalIdsPermitidas.length === 0) {
      res.json({
        filtros: {
          desde: formatDateKey(fechaInicio),
          hasta: formatDateKey(fechaFin),
          sucursales: [],
        },
        resumen: {
          ventasTotales: 0,
          pedidosPagados: 0,
          ticketPromedio: 0,
          productoMasVendido: null,
          sucursalLider: null,
        },
        ventasPorDia: [],
        ventasPorSucursal: [],
        ventasPorMetodoPago: [],
        topProductos: [],
        detallePedidos: [],
      });
      return;
    }

    const sucursalFiltro =
      typeof sucursalId === 'string' && sucursalId.trim() !== ''
        ? sucursalId
        : undefined;

    if (sucursalFiltro && !sucursalIdsPermitidas.includes(sucursalFiltro)) {
      res.status(403).json({ error: 'No tienes acceso a esta sucursal' });
      return;
    }

    const sucursalIdsConsulta = sucursalFiltro
      ? [sucursalFiltro]
      : sucursalIdsPermitidas;

    const pedidoWhere = {
      sucursalId: { in: sucursalIdsConsulta },
      estado: 'PAGADO' as const,
      pagado: true,
      creadoEn: {
        gte: fechaInicio,
        lte: fechaFin,
      },
    };

    const [
      ventasAggregate,
      pedidosPagados,
      pedidosBase,
      ventasPorSucursalRaw,
      ventasPorMetodoPagoRaw,
      topProductosRaw,
      detallePedidosRaw,
    ] = await Promise.all([
      prisma.pedido.aggregate({
        where: pedidoWhere,
        _sum: { total: true },
      }),

      prisma.pedido.count({
        where: pedidoWhere,
      }),

      prisma.pedido.findMany({
        where: pedidoWhere,
        select: {
          id: true,
          creadoEn: true,
          total: true,
        },
      }),

      prisma.pedido.groupBy({
        by: ['sucursalId'],
        where: pedidoWhere,
        _sum: { total: true },
        _count: { _all: true },
        orderBy: { _sum: { total: 'desc' } },
      }),

      prisma.pedido.groupBy({
        by: ['metodoPago'],
        where: pedidoWhere,
        _sum: { total: true },
        _count: { _all: true },
        orderBy: { _sum: { total: 'desc' } },
      }),

      prisma.itemPedido.groupBy({
        by: ['productoId'],
        where: {
          pedido: pedidoWhere,
        },
        _sum: {
          cantidad: true,
          subtotal: true,
        },
        orderBy: {
          _sum: {
            subtotal: 'desc',
          },
        },
        take: 10,
      }),

      prisma.pedido.findMany({
        where: pedidoWhere,
        orderBy: { creadoEn: 'desc' },
        take: 50,
        select: {
          id: true,
          numero: true,
          creadoEn: true,
          metodoPago: true,
          total: true,
          sucursal: {
            select: {
              id: true,
              nombre: true,
            },
          },
          mesero: {
            select: {
              id: true,
              nombre: true,
              rol: true,
            },
          },
        },
      }),
    ]);

    const sucursalNombrePorId = new Map(
      sucursalesDueno.map((sucursal) => [sucursal.id, sucursal.nombre])
    );

    const ventasPorDiaMap = new Map<string, { fecha: string; total: number; pedidos: number }>();

    generarDiasRango(fechaInicio, fechaFin).forEach((fecha) => {
      ventasPorDiaMap.set(fecha, {
        fecha,
        total: 0,
        pedidos: 0,
      });
    });

    pedidosBase.forEach((pedido) => {
      const fecha = formatDateKey(pedido.creadoEn);
      const actual = ventasPorDiaMap.get(fecha) ?? {
        fecha,
        total: 0,
        pedidos: 0,
      };

      actual.total += Number(pedido.total ?? 0);
      actual.pedidos += 1;

      ventasPorDiaMap.set(fecha, actual);
    });

    const ventasPorDia = Array.from(ventasPorDiaMap.values());

    const ventasPorSucursal = ventasPorSucursalRaw.map((item) => ({
      sucursalId: item.sucursalId,
      sucursal: sucursalNombrePorId.get(item.sucursalId) ?? 'Sucursal no encontrada',
      total: Number(item._sum.total ?? 0),
      pedidos: item._count._all,
    }));

    const ventasTotales = Number(ventasAggregate._sum.total ?? 0);

    const ticketPromedio =
      pedidosPagados > 0 ? ventasTotales / pedidosPagados : 0;

    const ventasPorMetodoPago = ventasPorMetodoPagoRaw.map((item) => ({
      metodoPago: item.metodoPago?.trim() || 'No registrado',
      total: Number(item._sum.total ?? 0),
      pedidos: item._count._all,
    }));

    const productosIds = topProductosRaw.map((item) => item.productoId);

    const productos = await prisma.producto.findMany({
      where: {
        id: { in: productosIds },
      },
      select: {
        id: true,
        nombre: true,
      },
    });

    const productoNombrePorId = new Map(
      productos.map((producto) => [producto.id, producto.nombre])
    );

    const topProductos = topProductosRaw.map((item) => ({
      productoId: item.productoId,
      producto: productoNombrePorId.get(item.productoId) ?? 'Producto no encontrado',
      cantidad: item._sum.cantidad ?? 0,
      total: Number(item._sum.subtotal ?? 0),
    }));

    const productoMasVendido = topProductos.length > 0 ? topProductos[0] : null;

    const sucursalLider =
      ventasPorSucursal.length > 0
        ? {
            id: ventasPorSucursal[0].sucursalId,
            nombre: ventasPorSucursal[0].sucursal,
            total: ventasPorSucursal[0].total,
          }
        : null;

    const detallePedidos = detallePedidosRaw.map((pedido) => ({
      id: pedido.id,
      numero: pedido.numero,
      fecha: pedido.creadoEn.toISOString(),
      sucursal: pedido.sucursal.nombre,
      mesero: pedido.mesero?.nombre ?? 'Sin mesero',
      metodoPago: pedido.metodoPago,
      total: Number(pedido.total ?? 0),
    }));

    res.json({
      filtros: {
        desde: formatDateKey(fechaInicio),
        hasta: formatDateKey(fechaFin),
        sucursales: sucursalesDueno,
      },
      resumen: {
        ventasTotales,
        pedidosPagados,
        ticketPromedio,
        productoMasVendido,
        sucursalLider,
      },
      ventasPorDia,
      ventasPorSucursal,
      ventasPorMetodoPago,
      topProductos,
      detallePedidos,
    });
  } catch (error) {
    console.error('Error generando reporte de dueño:', error);
    res.status(500).json({ error: 'Error generando reporte de dueño' });
  }
}