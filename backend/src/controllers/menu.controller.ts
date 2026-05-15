import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import path from 'path';

const prisma = new PrismaClient();

// Supabase client con service key para uploads
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

// Multer en memoria (no guardamos en disco)
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

export async function uploadImagen(req: Request, res: Response): Promise<void> {
  if (!req.file) { res.status(400).json({ error: 'Archivo requerido' }); return; }

  const ext      = path.extname(req.file.originalname).toLowerCase();
  const filename = `${req.restauranteId}-${Date.now()}${ext}`;

  const { error } = await supabase.storage
    .from('productos')
    .upload(filename, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    });

  if (error) { res.status(500).json({ error: 'Error al subir imagen', detail: error.message }); return; }

  const { data } = supabase.storage.from('productos').getPublicUrl(filename);
  res.json({ url: data.publicUrl });
}

export async function getProductos(req: Request, res: Response): Promise<void> {
  const productos = await prisma.producto.findMany({
    where: { restauranteId: req.restauranteId! },
    include: { categoria: true },
    orderBy: { nombre: 'asc' },
  });
  res.json(productos);
}

export async function createProducto(req: Request, res: Response): Promise<void> {
  const { nombre, descripcion, precio, imagen, disponible, categoriaId, requiereCocina } = req.body;
  const producto = await prisma.producto.create({
    data: {
      nombre, descripcion, precio, imagen,
      disponible: disponible ?? true,
      requiereCocina: requiereCocina ?? true,
      categoriaId,
      restauranteId: req.restauranteId!,
    },
    include: { categoria: true },
  });
  res.status(201).json(producto);
}

export async function updateProducto(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { nombre, descripcion, precio, imagen, disponible, categoriaId, requiereCocina } = req.body;
  const producto = await prisma.producto.update({
    where: { id, restauranteId: req.restauranteId! },
    data: { nombre, descripcion, precio, imagen, disponible, categoriaId, requiereCocina },
    include: { categoria: true },
  });
  res.json(producto);
}

export async function deleteProducto(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  await prisma.producto.delete({ where: { id, restauranteId: req.restauranteId! } });
  res.status(204).send();
}

export async function getCategorias(req: Request, res: Response): Promise<void> {
  const categorias = await prisma.categoria.findMany({
    where: { restauranteId: req.restauranteId! },
    orderBy: { nombre: 'asc' },
  });
  res.json(categorias);
}

export async function createCategoria(req: Request, res: Response): Promise<void> {
  const { nombre } = req.body;
  const categoria = await prisma.categoria.create({
    data: { nombre, restauranteId: req.restauranteId! },
  });
  res.status(201).json(categoria);
}
