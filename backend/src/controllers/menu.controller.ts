import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const mapTipo = (p: any) => ({
  ...p,
  tipo: p.requiereCocina ? 'COCINA' : 'COMPLEMENTO',
});

export const crearCategoria = async (req: Request, res: Response) => {
  try {
    const { nombre, sucursalId } = req.body;

    if (!nombre || !sucursalId) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    const categoria = await prisma.categoria.create({
      data: { nombre, sucursalId },
    });

    return res.status(201).json(categoria);
  } catch (error) {
    return res.status(500).json({ message: 'Error creando categoría', error });
  }
};

export const listarCategorias = async (req: Request, res: Response) => {
  try {
    const { sucursalId } = req.query;

    const categorias = await prisma.categoria.findMany({
      where: sucursalId ? { sucursalId: String(sucursalId) } : undefined,
      include: {
        _count: { select: { productos: true } },
      },
      orderBy: { nombre: 'asc' },
    });

    return res.json(categorias);
  } catch (error) {
    return res.status(500).json({ message: 'Error listando categorías' });
  }
};

export const crearProducto = async (req: Request, res: Response) => {
  try {
    const {
      nombre,
      descripcion,
      precio,
      imagen,
      categoriaId,
      sucursalId,
      tipo, 
    } = req.body;

    if (!nombre || !precio || !categoriaId || !sucursalId) {
      return res.status(400).json({ ok: false, message: 'Datos incompletos' });
    }

    const producto = await prisma.producto.create({
      data: {
        nombre,
        descripcion,
        precio: new Prisma.Decimal(precio),
        imagen,
        categoriaId,
        sucursalId,
        requiereCocina: tipo !== 'COMPLEMENTO', 
      },
    });

    return res.status(201).json(mapTipo(producto));
  } catch (error) {
    console.error('ERROR CREANDO PRODUCTO:', error);
    return res.status(500).json({ ok: false, message: 'Error creando producto', error: String(error) });
  }
};

export const listarProductos = async (req: Request, res: Response) => {
  try {
    const { sucursalId, categoriaId, search } = req.query;

    const productos = await prisma.producto.findMany({
      where: {
        sucursalId: sucursalId ? String(sucursalId) : undefined,
        categoriaId: categoriaId ? String(categoriaId) : undefined,
        nombre: search
          ? { contains: String(search), mode: 'insensitive' }
          : undefined,
      },
      include: { categoria: true },
      orderBy: { id: 'desc' },
    });

    return res.status(200).json(productos.map(mapTipo));
  } catch (error) {
    console.error('ERROR LISTANDO PRODUCTOS:', error);
    return res.status(500).json({ ok: false, message: 'Error listando productos', error: String(error) });
  }
};

export const obtenerProducto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const producto = await prisma.producto.findUnique({
      where: { id },
      include: { categoria: true },
    });

    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    return res.json(mapTipo(producto));
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo producto' });
  }
};

export const actualizarProducto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, imagen, categoriaId, tipo } = req.body;

    const producto = await prisma.producto.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        imagen,
        categoriaId,
        requiereCocina: tipo !== undefined ? tipo !== 'COMPLEMENTO' : undefined,
        precio: precio !== undefined ? new Prisma.Decimal(precio) : undefined,
      },
    });

    return res.json(mapTipo(producto));
  } catch (error) {
    return res.status(500).json({ message: 'Error actualizando producto' });
  }
};

export const eliminarProducto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.producto.delete({ where: { id } });

    return res.json({ message: 'Producto eliminado' });
  } catch (error) {
    return res.status(500).json({ message: 'Error eliminando producto' });
  }
};

export const toggleDisponibilidad = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const producto = await prisma.producto.findUnique({ where: { id } });

    if (!producto) {
      return res.status(404).json({ message: 'Producto no existe' });
    }

    const actualizado = await prisma.producto.update({
      where: { id },
      data: { disponible: !producto.disponible },
    });

    return res.json(mapTipo(actualizado));
  } catch (error) {
    return res.status(500).json({ message: 'Error cambiando estado' });
  }
};