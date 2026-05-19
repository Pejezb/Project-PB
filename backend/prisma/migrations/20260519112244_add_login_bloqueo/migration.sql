/*
  Warnings:

  - The values [EN_ESPERA] on the enum `EstadoMesa` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[numero,sucursalId]` on the table `Mesa` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EstadoMesa_new" AS ENUM ('LIBRE', 'OCUPADA', 'RESERVADA');
ALTER TABLE "Mesa" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "Mesa" ALTER COLUMN "estado" TYPE "EstadoMesa_new" USING ("estado"::text::"EstadoMesa_new");
ALTER TYPE "EstadoMesa" RENAME TO "EstadoMesa_old";
ALTER TYPE "EstadoMesa_new" RENAME TO "EstadoMesa";
DROP TYPE "EstadoMesa_old";
ALTER TABLE "Mesa" ALTER COLUMN "estado" SET DEFAULT 'LIBRE';
COMMIT;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "bloqueadoHasta" TIMESTAMP(3),
ADD COLUMN     "intentosFallidos" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Mesa_numero_sucursalId_key" ON "Mesa"("numero", "sucursalId");
