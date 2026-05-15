import { z } from 'zod';

/* ──────── Auth ──────── */
export const loginSchema = z.object({
  email:    z.string().email('Email inválido').max(120),
  password: z.string().min(6, 'Mínimo 6 caracteres').max(120),
});

/* ──────── Pedidos ──────── */
export const itemPedidoSchema = z.object({
  productoId: z.string().min(1),
  cantidad:   z.number().int().positive().max(99),
});

export const createPedidoSchema = z.object({
  tipo:   z.enum(['EN_MESA', 'PARA_LLEVAR']),
  mesaId: z.string().optional().nullable(),
  items:  z.array(itemPedidoSchema).min(1, 'Mínimo 1 item'),
});

export const updateEstadoSchema = z.object({
  estado: z.enum(['PENDIENTE', 'EN_COCINA', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'PAGADO', 'CANCELADO']),
});

export const registrarPagoSchema = z.object({
  metodoPago: z.string().min(1).max(40),
});

/* ──────── Mesas ──────── */
export const createMesaSchema = z.object({
  numero:    z.number().int().positive().max(999),
  capacidad: z.number().int().positive().max(50).default(4),
});

export const updateMesaSchema = z.object({
  numero:    z.number().int().positive().max(999).optional(),
  capacidad: z.number().int().positive().max(50).optional(),
});

export const updateEstadoMesaSchema = z.object({
  estado: z.enum(['LIBRE', 'OCUPADA', 'EN_ESPERA']),
});

/* ──────── Usuarios ──────── */
export const createUsuarioSchema = z.object({
  nombre:   z.string().min(2).max(80),
  email:    z.string().email().max(120),
  password: z.string().min(6).max(120),
  rol:      z.enum(['ADMIN', 'MESERO', 'COCINERO', 'CAJERO']),
});

export const updateUsuarioSchema = z.object({
  nombre:   z.string().min(2).max(80).optional(),
  email:    z.string().email().max(120).optional(),
  password: z.string().min(6).max(120).optional(),
  rol:      z.enum(['ADMIN', 'MESERO', 'COCINERO', 'CAJERO']).optional(),
  activo:   z.boolean().optional(),
});

export const updatePerfilSchema = z.object({
  nombre: z.string().min(2).max(80).optional(),
  email:  z.string().email().max(120).optional(),
});

export const changePasswordSchema = z.object({
  passwordActual: z.string().min(1),
  passwordNuevo:  z.string().min(6).max(120),
});

export const addItemsSchema = z.object({
  items: z.array(itemPedidoSchema).min(1, 'Mínimo 1 item'),
});
