# RestaurantOS v2 — Sistema multi-sucursal

Sistema de gestión para restaurantes con soporte de múltiples sucursales. Construido con **React + TypeScript** (frontend) y **Node.js + Prisma + PostgreSQL** (backend).

---

## Arquitectura de roles

| Rol | Alcance | Accesos |
|-----|---------|---------|
| **DUENO** | Todas las sucursales | Dashboard global, CRUD sucursales, CRUD usuarios |
| **ADMIN** | Su sucursal | Dashboard local, CRUD usuarios, gestión de operaciones |
| **MESERO** | Su sucursal | Mesas, pedidos, cobros |
| **COCINERO** | Su sucursal | Vista cocina (pedidos en preparación) |

> El acceso de MESERO y COCINERO queda **bloqueado** si la sucursal está cerrada (`abierto = false`).

---

## Stack tecnológico

**Frontend**
- React 18 + TypeScript + Vite
- Tailwind CSS v3
- Zustand (estado global)
- TanStack React Query v5
- React Router v6
- react-hot-toast + lucide-react

**Backend**
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL (Supabase)
- JWT para autenticación
- bcryptjs para contraseñas

---

## Estructura de carpetas

```
restaurantos-v2/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Modelo de datos
│   │   └── seed.ts             # Datos de prueba
│   └── src/
│       ├── controllers/        # Lógica de negocio
│       ├── middleware/         # Auth, roles, sucursal abierta
│       ├── routes/             # Rutas de la API
│       └── index.ts            # Entry point
└── frontend/
    └── src/
        ├── components/
        │   ├── layout/         # AuthLayout, Sidebar
        │   └── ui/             # Button, Badge
        ├── pages/
        │   ├── auth/           # Login
        │   ├── dashboard/      # Dashboard (Dueño y Admin)
        │   ├── sucursales/     # CRUD sucursales (solo Dueño)
        │   ├── usuarios/       # CRUD usuarios
        │   └── configuracion/  # Perfil y contraseña
        ├── services/           # Llamadas a la API
        ├── store/              # Zustand (authStore)
        └── types/              # Interfaces TypeScript
```

---

## URL del Sistema
https://restaurantos.qoritum.com/

## Setup inicial

### 1. Clonar y entrar al proyecto
```bash
git clone https://github.com/Pejezb/Proyecto-Integrador-II.git
cd Proyecto-Integrador-II
```

### 2. Backend
```bash
cd backend
npm install

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL de Supabase y un JWT_SECRET

# Aplicar schema a la base de datos
npx prisma db push

# Cargar datos de prueba
npx ts-node prisma/seed.ts
```

### 3. Frontend
```bash
cd ../frontend
npm install

# Copiar variables de entorno
cp .env.example .env
# Editar si el backend no corre en localhost:3001

npm run dev
```

---

## Variables de entorno

**backend/.env**
```env
DATABASE_URL="postgresql://..."   # URL de Supabase
JWT_SECRET="una_clave_secreta"
PORT=3001
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:3001/api
```

---

## Credenciales de prueba (seed)

Después de ejecutar el seed:

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `dueno@polleria.com` | `Dueno123!` | DUENO |
| `admin@polleria.com` | `Admin123!` | ADMIN |
| `mesero@polleria.com` | `Mesero123!` | MESERO |
| `cocina@polleria.com` | `Cocina123!` | COCINERO |

---

## API — Endpoints implementados

```
POST   /api/auth/login

GET    /api/sucursales              # Solo DUENO
POST   /api/sucursales              # Solo DUENO
PUT    /api/sucursales/:id          # Solo DUENO
PATCH  /api/sucursales/:id/toggle   # DUENO + ADMIN
DELETE /api/sucursales/:id          # Solo DUENO

GET    /api/usuarios
POST   /api/usuarios
PATCH  /api/usuarios/:id
DELETE /api/usuarios/:id
PATCH  /api/usuarios/me             # Perfil propio
PATCH  /api/usuarios/me/password    # Cambiar contraseña

GET    /api/dashboard               # Solo DUENO
GET    /api/dashboard/sucursal/:id  # DUENO + ADMIN
```

### Para implementar (el equipo añade aquí)
```
# Mesas
GET    /api/mesas
POST   /api/mesas
PATCH  /api/mesas/:id/estado

# Pedidos
GET    /api/pedidos
POST   /api/pedidos
PATCH  /api/pedidos/:id/estado
POST   /api/pedidos/:id/items

# Menú
GET    /api/categorias
POST   /api/categorias
GET    /api/productos
POST   /api/productos

# Reportes
GET    /api/reportes/ventas
```

---

## Rutas frontend disponibles

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/login` | Público | Inicio de sesión |
| `/dashboard` | Todos | Resumen (diferente por rol) |
| `/sucursales` | Solo DUENO | Gestión de sucursales |
| `/usuarios` | DUENO + ADMIN | Gestión de usuarios |
| `/configuracion` | Todos | Perfil personal |

### Para implementar (el equipo añade aquí)
```
/mesas        → Vista de mesas (ADMIN, MESERO)
/pedidos      → Gestión de pedidos (ADMIN, MESERO)
/cocina       → Vista cocinero (COCINERO)
/menu         → Gestión del menú (ADMIN)
/reportes     → Reportes de ventas (DUENO, ADMIN)
```

---

## Flujo de apertura de sucursal

1. El **DUENO** crea la sucursal → queda `abierto: false`
2. El DUENO o el **ADMIN** del local presiona "Abrir local" en `/sucursales`
3. El sistema cambia `abierto: true`
4. Los usuarios MESERO y COCINERO ya pueden iniciar sesión y operar
5. Al finalizar el día, se presiona "Cerrar local" → `abierto: false`
6. Cualquier intento de login de no-DUENO devuelve 403

---

## Notas para el equipo

- Los comentarios `// El equipo puede agregar...` marcan los puntos de extensión
- El sidebar (`Sidebar.tsx`) tiene las rutas comentadas con sus íconos listos
- Los tipos TypeScript están en `frontend/src/types/index.ts`
- El `authStore` guarda `user`, `token` y expone `setAuth` / `logout`
- Usar siempre `api` (instancia de axios) de `services/api.ts` — ya incluye el token automáticamente
