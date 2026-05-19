import { Request, Response } from 'express';
import { PrismaClient, Rol } from '@prisma/client';
import ExcelJS from 'exceljs';
const prisma = new PrismaClient();


export async function getReportes(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as {
      userId: string;
      rol: Rol;
      sucursalId?: string;
    };

    const {
      desde,
      hasta,
      meseroId,
    } = req.query as {
      desde?: string;
      hasta?: string;
      meseroId?: string;
    };

    const fechaInicio = desde
      ? new Date(`${desde}T00:00:00`)
      : new Date(new Date().setDate(new Date().getDate() - 6));

    const fechaFin = hasta
      ? new Date(`${hasta}T23:59:59`)
      : new Date();

    const whereBase: any = {
      pagado: true,
      creadoEn: {
        gte: fechaInicio,
        lte: fechaFin,
      },
    };

    if (user.rol === 'ADMIN') {
      whereBase.sucursalId = user.sucursalId;
    }

    if (user.rol === 'DUENO') {
      whereBase.sucursal = {
        duenoId: user.userId,
      };
    }

    if (meseroId) {
      whereBase.meseroId = meseroId;
    }

    const pedidos = await prisma.pedido.findMany({
      where: whereBase,
      include: {
        mesero: true,
      },
      orderBy: {
        creadoEn: 'asc',
      },
    });


    const totalVentas = pedidos.reduce(
      (acc, pedido) => acc + Number(pedido.total || 0),
      0
    );


    const cantidadPedidos = pedidos.length;


    const ventasMap = new Map<string, number>();

    pedidos.forEach((pedido) => {
      const fecha = pedido.creadoEn.toLocaleDateString('es-PE', {
        weekday: 'short',
      });

      const actual = ventasMap.get(fecha) || 0;

      ventasMap.set(
        fecha,
        actual + Number(pedido.total || 0)
      );
    });

    const ventasPorDia = Array.from(ventasMap.entries()).map(
      ([dia, monto]) => ({
        dia:
          dia.charAt(0).toUpperCase() +
          dia.slice(1, 3),
        monto,
      })
    );

    const pedidosMap = new Map<string, number>();

    pedidos.forEach((pedido) => {
      const fecha = pedido.creadoEn.toLocaleDateString('es-PE', {
        weekday: 'short',
      });

      const actual = pedidosMap.get(fecha) || 0;

      pedidosMap.set(fecha, actual + 1);
    });

    const pedidosPorDia = Array.from(pedidosMap.entries()).map(
      ([dia, cantidad]) => ({
        dia:
          dia.charAt(0).toUpperCase() +
          dia.slice(1, 3),
        pedidos: cantidad,
      })
    );

    const meserosMap = new Map<
      string,
      {
        nombre: string;
        pedidos: number;
      }
    >();

    pedidos.forEach((pedido) => {
      if (!pedido.mesero) return;

      const actual = meserosMap.get(pedido.mesero.id);

      if (actual) {
        actual.pedidos += 1;
      } else {
        meserosMap.set(pedido.mesero.id, {
          nombre: pedido.mesero.nombre,
          pedidos: 1,
        });
      }
    });

    const rendimientoMeseros = Array.from(
      meserosMap.values()
    ).sort((a, b) => b.pedidos - a.pedidos);

    const whereMeseros: any = {
      rol: 'MESERO',
      activo: true,
    };

    if (user.rol === 'ADMIN') {
      whereMeseros.sucursalId = user.sucursalId;
    }

    if (user.rol === 'DUENO') {
      whereMeseros.sucursal = {
        duenoId: user.userId,
      };
    }

    const meseros = await prisma.usuario.findMany({
      where: whereMeseros,
      select: {
        id: true,
        nombre: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    res.status(200).json({
      totalVentas,
      cantidadPedidos,
      ventasPorDia,
      pedidosPorDia,
      rendimientoMeseros,
      meseros,
    });

  } catch (error) {
    console.error('Error reportes:', error);

    res.status(500).json({
      message: 'Error al obtener reportes',
    });
  }
}

export async function exportarReporteExcel(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = req.user as {
      userId: string;
      rol: Rol;
      sucursalId?: string;
    };

    const {
      desde,
      hasta,
      meseroId,
    } = req.query as {
      desde?: string;
      hasta?: string;
      meseroId?: string;
    };

    const fechaInicio = desde
      ? new Date(`${desde}T00:00:00`)
      : new Date(new Date().setDate(new Date().getDate() - 6));

    const fechaFin = hasta
      ? new Date(`${hasta}T23:59:59`)
      : new Date();

    const whereBase: any = {
      pagado: true,
      creadoEn: {
        gte: fechaInicio,
        lte: fechaFin,
      },
    };

    if (user.rol === 'ADMIN') {
      whereBase.sucursalId = user.sucursalId;
    }

    if (user.rol === 'DUENO') {
      whereBase.sucursal = {
        duenoId: user.userId,
      };
    }

    if (meseroId) {
      whereBase.meseroId = meseroId;
    }

    const pedidos = await prisma.pedido.findMany({
      where: whereBase,
      include: {
        mesero: true,
        mesa: true,
        items: {
          include: {
            producto: true,
          },
        },
      },
      orderBy: {
        creadoEn: 'desc',
      },
    });

    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet('Reporte');

    worksheet.columns = [
      {
        header: 'Pedido',
        key: 'pedido',
        width: 15,
      },
      {
        header: 'Fecha',
        key: 'fecha',
        width: 25,
      },
      {
        header: 'Mesero',
        key: 'mesero',
        width: 25,
      },
      {
        header: 'Mesa',
        key: 'mesa',
        width: 15,
      },
      {
        header: 'Tipo',
        key: 'tipo',
        width: 20,
      },
      {
        header: 'Método Pago',
        key: 'metodoPago',
        width: 20,
      },
      {
        header: 'Total',
        key: 'total',
        width: 15,
      },
    ];

    pedidos.forEach((pedido) => {
      worksheet.addRow({
        pedido: pedido.numero,
        fecha: pedido.creadoEn.toLocaleString('es-PE'),
        mesero: pedido.mesero?.nombre || '-',
        mesa: pedido.mesa?.numero || '-',
        tipo: pedido.tipo,
        metodoPago: pedido.metodoPago || '-',
        total: Number(pedido.total || 0),
      });
    });

    worksheet.getRow(1).font = {
      bold: true,
    };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=reporte.xlsx`
    );

    await workbook.xlsx.write(res);

    res.end();

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Error exportando excel',
    });
  }
}