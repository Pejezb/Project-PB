import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const getMesas = async (req: Request, res: Response): Promise<void> => {
  try {
    const sucursalId = req.user?.sucursalId;

    if (!sucursalId) {
      res.status(400).json({ message: "Sucursal no encontrada en token" });
      return;
    }

    const mesas = await prisma.mesa.findMany({
      where: { sucursalId },
      orderBy: { numero: "asc" },
    });

    res.json(mesas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener mesas" });
  }
};

export const crearMesa = async (req: Request, res: Response): Promise<void> => {
  try {
    const { numero, capacidad } = req.body;
    const sucursalId = req.user?.sucursalId;

    if (!sucursalId) {
      res.status(400).json({ message: "Sucursal no encontrada en token" });
      return;
    }

    const existe = await prisma.mesa.findFirst({
      where: {
        numero,
        sucursalId,
      },
    });

    if (existe) {
      res.status(400).json({ message: "La mesa ya existe en esta sucursal" });
      return;
    }

    const mesa = await prisma.mesa.create({
      data: {
        numero,
        capacidad,
        sucursalId,
      },
    });

    res.status(201).json(mesa);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creando mesa" });
  }
};

export const actualizarMesa = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const sucursalId = req.user?.sucursalId;

    if (!sucursalId) {
      res.status(400).json({ message: "Sucursal no encontrada en token" });
      return;
    }

    const { numero, capacidad, estado } = req.body;

    const mesa = await prisma.mesa.update({
      where: {
        id,
      },
      data: {
        numero: Number(numero),
        capacidad: Number(capacidad),
        estado: estado as EstadoMesa, 
      },
    });

    res.json(mesa);
  } catch (error: any) {
    console.error("ERROR UPDATE MESA:", error);
    res.status(500).json({
      message: "Error actualizando mesa",
      error: error?.message,
    });
  }
};