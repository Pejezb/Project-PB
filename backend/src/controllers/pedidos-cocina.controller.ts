import { Request, Response } from 'express';
import { PrismaClient, EstadoPedido } from '@prisma/client';

const prisma = new PrismaClient();

export const obtenerPedidosCocina = async (
    req: Request,
    res: Response
) => {
    try {
        const sucursalId = req.user?.sucursalId;

        if (!sucursalId) {
            return res.status(400).json({
                message: 'Sucursal no definida en el usuario',
            });
        }

        const pedidos = await prisma.pedido.findMany({
            where: {
                sucursalId,

                estado: EstadoPedido.PENDIENTE,

                items: {
                    some: {
                        producto: {
                            requiereCocina: true,
                        },
                    },
                },
            },

            include: {
                mesa: true,

                items: {
                    include: {
                        producto: true,
                    },
                },
            },

            orderBy: {
                creadoEn: 'asc',
            },
        });

        const pedidosFormateados = pedidos.map((pedido) => ({
            id: pedido.id,

            mesa: pedido.mesa
                ? `Mesa ${pedido.mesa.numero}`
                : 'Para llevar',

            cliente: 'Cliente',

            creadoEn: pedido.creadoEn,

            estado: pedido.estado,

            platos: pedido.items
                .filter(
                    (item) => item.producto.requiereCocina
                )
                .map(
                    (item) =>
                        `${item.producto.nombre} x${item.cantidad}`
                ),
        }));

        return res.json(pedidosFormateados);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Error al obtener pedidos de cocina',
        });
    }
};

export const marcarPedidoListo = async (
    req: Request,
    res: Response
) => {
    try {
        const { id } = req.params;

        console.log('Marcando pedido listo:', id);

        const pedido = await prisma.pedido.update({
            where: {
                id,
            },

            data: {
                estado: EstadoPedido.LISTO,
            },
        });

        console.log(pedido.estado);

        return res.json({
            message: 'Pedido marcado como listo',
            pedido,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Error al marcar pedido como listo',
        });
    }
};