import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/async.middleware';
import {
  loginSchema, createPedidoSchema, updateEstadoSchema, registrarPagoSchema,
  createMesaSchema, updateMesaSchema, updateEstadoMesaSchema,
  createUsuarioSchema, updateUsuarioSchema, updatePerfilSchema, changePasswordSchema,
  addItemsSchema,
} from '../schemas';
import { login, refresh, logout } from '../controllers/auth.controller';
import { getMesas, createMesa, updateMesa, updateEstadoMesa, deleteMesa } from '../controllers/mesas.controller';
import { getPedidos, getPedidosActivos, getPedidoById, createPedido, updateEstadoPedido, registrarPago, addItemsToPedido } from '../controllers/pedidos.controller';
import { getProductos, createProducto, updateProducto, deleteProducto, getCategorias, createCategoria, uploadImagen, upload } from '../controllers/menu.controller';
import { getInventario, getAlertas, createInsumo, updateInsumo, deleteInsumo } from '../controllers/inventario.controller';
import { getVentas, getTopProductos, getProductividad } from '../controllers/reportes.controller';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario, getRestaurante, updateRestaurante, getDashboardStats, getPerfil, updatePerfil, changePassword } from '../controllers/usuarios.controller';

export const router = Router();

// ─── Auth ──────────────────────────────────────────
router.post('/auth/login',   validateBody(loginSchema), asyncHandler(login));
router.post('/auth/refresh', asyncHandler(refresh));
router.post('/auth/logout',  asyncHandler(logout));

router.use(authMiddleware);

// ─── Dashboard ─────────────────────────────────────
router.get('/dashboard', asyncHandler(getDashboardStats));

// ─── Mesas ────────────────────────────────────────
router.get('/mesas',              asyncHandler(getMesas));
router.post('/mesas',             roleMiddleware('ADMIN'), validateBody(createMesaSchema), asyncHandler(createMesa));
router.patch('/mesas/:id',        roleMiddleware('ADMIN'), validateBody(updateMesaSchema), asyncHandler(updateMesa));
router.patch('/mesas/:id/estado', validateBody(updateEstadoMesaSchema), asyncHandler(updateEstadoMesa));
router.delete('/mesas/:id',       roleMiddleware('ADMIN'), asyncHandler(deleteMesa));

// ─── Pedidos ──────────────────────────────────────
router.get('/pedidos',                asyncHandler(getPedidos));
router.get('/pedidos/activos',        asyncHandler(getPedidosActivos));
router.get('/pedidos/:id',            asyncHandler(getPedidoById));
router.post('/pedidos',               roleMiddleware('ADMIN', 'MESERO'), validateBody(createPedidoSchema), asyncHandler(createPedido));
router.patch('/pedidos/:id/estado',   validateBody(updateEstadoSchema), asyncHandler(updateEstadoPedido));
router.patch('/pedidos/:id/pago',     roleMiddleware('ADMIN', 'CAJERO', 'MESERO'), validateBody(registrarPagoSchema), asyncHandler(registrarPago));
router.post('/pedidos/:id/items',     roleMiddleware('ADMIN', 'MESERO'), validateBody(addItemsSchema), asyncHandler(addItemsToPedido));

// ─── Menú ─────────────────────────────────────────
router.get('/menu/productos',             asyncHandler(getProductos));
router.post('/menu/productos',            roleMiddleware('ADMIN'), asyncHandler(createProducto));
router.put('/menu/productos/:id',         roleMiddleware('ADMIN'), asyncHandler(updateProducto));
router.delete('/menu/productos/:id',      roleMiddleware('ADMIN'), asyncHandler(deleteProducto));
router.get('/menu/categorias',            asyncHandler(getCategorias));
router.post('/menu/categorias',           roleMiddleware('ADMIN'), asyncHandler(createCategoria));
router.post('/menu/upload-imagen',        roleMiddleware('ADMIN'), upload.single('imagen'), asyncHandler(uploadImagen));

// ─── Inventario ───────────────────────────────────
router.get('/inventario',         asyncHandler(getInventario));
router.get('/inventario/alertas', asyncHandler(getAlertas));
router.post('/inventario',        roleMiddleware('ADMIN'), asyncHandler(createInsumo));
router.put('/inventario/:id',     roleMiddleware('ADMIN'), asyncHandler(updateInsumo));
router.delete('/inventario/:id',  roleMiddleware('ADMIN'), asyncHandler(deleteInsumo));

// ─── Reportes ─────────────────────────────────────
router.get('/reportes/ventas',    roleMiddleware('ADMIN', 'CAJERO'), asyncHandler(getVentas));
router.get('/reportes/productos', roleMiddleware('ADMIN', 'CAJERO'), asyncHandler(getTopProductos));
router.get('/reportes/cocineros', roleMiddleware('ADMIN'),           asyncHandler(getProductividad));

// ─── Perfil ────────────────────────────────────────
router.get('/perfil',          asyncHandler(getPerfil));
router.put('/perfil',          validateBody(updatePerfilSchema),   asyncHandler(updatePerfil));
router.put('/perfil/password', validateBody(changePasswordSchema), asyncHandler(changePassword));

// ─── Usuarios ─────────────────────────────────────
router.get('/usuarios',        roleMiddleware('ADMIN'), asyncHandler(getUsuarios));
router.post('/usuarios',       roleMiddleware('ADMIN'), validateBody(createUsuarioSchema), asyncHandler(createUsuario));
router.put('/usuarios/:id',    roleMiddleware('ADMIN'), validateBody(updateUsuarioSchema), asyncHandler(updateUsuario));
router.delete('/usuarios/:id', roleMiddleware('ADMIN'), asyncHandler(deleteUsuario));

// ─── Restaurante ──────────────────────────────────
router.get('/restaurante', asyncHandler(getRestaurante));
router.put('/restaurante', roleMiddleware('ADMIN'), asyncHandler(updateRestaurante));
