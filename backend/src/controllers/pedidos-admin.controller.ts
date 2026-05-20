import { Request, Response } from 'express';
import {
    PrismaClient,
    EstadoPedido,
    Rol,
} from '@prisma/client';

const prisma = new PrismaClient();

export async function getPedidosAdmin(
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
            busqueda,
            estado,
        } = req.query as {
            busqueda?: string;
            estado?: string;
        };

        const where: any = {};

        // ADMIN → solo su sucursal
        if (user.rol === 'ADMIN') {
            where.sucursalId = user.sucursalId;
        }

        // DUENO → todas sus sucursales
        if (user.rol === 'DUENO') {
            where.sucursal = {
                duenoId: user.userId,
            };
        }

        if (
            estado &&
            estado !== 'TODOS'
        ) {
            where.estado =
                estado as EstadoPedido;
        }

        if (busqueda) {
            const numeroBusqueda =
                Number(busqueda);

            where.OR = [
                {
                    numero: isNaN(numeroBusqueda)
                        ? undefined
                        : numeroBusqueda,
                },
                {
                    mesa: {
                        numero: isNaN(numeroBusqueda)
                            ? undefined
                            : numeroBusqueda,
                    },
                },
            ];
        }

        const pedidos =
            await prisma.pedido.findMany({
                where,
                include: {
                    mesa: true,
                    mesero: true,
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

        const pedidosFormateados =
            pedidos.map((pedido) => ({
                id: pedido.numero,

                pedidoId: pedido.id,

                mesa:
                    pedido.mesa?.numero || 0,

                estado:
                    pedido.pagado
                        ? 'PAGADO'
                        : 'PENDIENTE',

                usuario:
                    pedido.mesero?.nombre ||
                    'Sin usuario',

                creadoEn: pedido.creadoEn,

                productos: pedido.items.map(
                    (item) => ({
                        nombre:
                            item.producto.nombre,

                        cantidad:
                            item.cantidad,

                        precio: Number(
                            item.precio
                        ),
                    })
                ),

                total: Number(
                    pedido.total || 0
                ),
            }));

        res.json(pedidosFormateados);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error:
                'Error obteniendo pedidos',
        });
    }
}