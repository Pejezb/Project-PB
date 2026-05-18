import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { login, me } from '../controllers/auth.controller';
import { getSucursales, getSucursalById, createSucursal, updateSucursal, toggleSucursal, deleteSucursal } from '../controllers/sucursales.controller';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario, updateMe, changeMyPassword } from '../controllers/usuarios.controller';
import { getDashboardDueno, getDashboardSucursal } from '../controllers/dashboard.controller';
import { getAsistencias, toggleAsistencia } from '../controllers/asistencias.controller';
import { crearMesa, getMesas, actualizarMesa } from '../controllers/mesa.controller';

const router = Router();
// ── Auth (público) ────────────────────────────────────────────────────────────
router.post('/auth/login', login);
router.get('/auth/me', authMiddleware, me);

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', authMiddleware, roleMiddleware('DUENO'), getDashboardDueno);
router.get('/dashboard/sucursal/:id', authMiddleware, roleMiddleware('DUENO', 'ADMIN'), getDashboardSucursal);

// ── Sucursales (solo DUEÑO y ADMIN) ──────────────────────────────────────────
router.get('/sucursales', authMiddleware, roleMiddleware('DUENO'), getSucursales);
router.get('/sucursales/:id', authMiddleware, roleMiddleware('DUENO', 'ADMIN'), getSucursalById);
router.post('/sucursales', authMiddleware, roleMiddleware('DUENO'), createSucursal);
router.patch('/sucursales/:id', authMiddleware, roleMiddleware('DUENO', 'ADMIN'), updateSucursal);
router.patch('/sucursales/:id/toggle', authMiddleware, roleMiddleware('DUENO', 'ADMIN'), toggleSucursal);
router.delete('/sucursales/:id', authMiddleware, roleMiddleware('DUENO'), deleteSucursal);

// ── Usuarios ──────────────────────────────────────────────────────────────────
// Perfil propio (todos los roles) — debe ir ANTES de /:id
router.patch('/usuarios/me', authMiddleware, updateMe);
router.patch('/usuarios/me/password', authMiddleware, changeMyPassword);

router.get('/usuarios', authMiddleware, roleMiddleware('DUENO', 'ADMIN'), getUsuarios);
router.post('/usuarios', authMiddleware, roleMiddleware('DUENO', 'ADMIN'), createUsuario);
router.patch('/usuarios/:id', authMiddleware, roleMiddleware('DUENO', 'ADMIN'), updateUsuario);
router.delete('/usuarios/:id', authMiddleware, roleMiddleware('DUENO', 'ADMIN'), deleteUsuario);

// Asistencias ────────────────────────────────────────────────────────────────
router.get('/asistencias', authMiddleware, roleMiddleware('DUENO', 'ADMIN'), getAsistencias);
router.post('/asistencias/:id', authMiddleware, roleMiddleware('DUENO', 'ADMIN'), toggleAsistencia);

// Mesas ────────────────────────────────────────────────────────────────
router.get('/mesas', authMiddleware, roleMiddleware('ADMIN'), getMesas);
router.post('/mesas', authMiddleware, roleMiddleware('ADMIN'), crearMesa);
router.patch('/mesas/:id', authMiddleware, roleMiddleware('ADMIN'), actualizarMesa);

// ── Placeholder: rutas que el equipo implementará ────────────────────────────
// router.use('/mesas',    authMiddleware, mesasRouter);
// router.use('/pedidos',  authMiddleware, pedidosRouter);
// router.use('/menu',     authMiddleware, menuRouter);
// router.use('/reportes', authMiddleware, reportesRouter);

export default router;
