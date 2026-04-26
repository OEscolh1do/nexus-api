/*
  Warnings:

  - You are about to drop the column `deratingStartTemp` on the `InverterCatalog` table. All the data in the column will be lost.
  - You are about to drop the column `ipRating` on the `InverterCatalog` table. All the data in the column will be lost.
  - You are about to drop the column `maxAmbientTemp` on the `InverterCatalog` table. All the data in the column will be lost.
  - You are about to drop the column `nbr17193Compliant` on the `InverterCatalog` table. All the data in the column will be lost.
  - You are about to drop the column `nmot` on the `ModuleCatalog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `InverterCatalog` DROP COLUMN `deratingStartTemp`,
    DROP COLUMN `ipRating`,
    DROP COLUMN `maxAmbientTemp`,
    DROP COLUMN `nbr17193Compliant`,
    MODIFY `Voc_max_hardware` DOUBLE NULL,
    MODIFY `Isc_max_hardware` DOUBLE NULL,
    MODIFY `afci` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `coolingType` VARCHAR(191) NULL DEFAULT 'passive';

-- AlterTable
ALTER TABLE `ModuleCatalog` DROP COLUMN `nmot`,
    ADD COLUMN `degradacaoAnual` DECIMAL(5, 4) NOT NULL DEFAULT 0.005,
    MODIFY `noct` DOUBLE NULL,
    MODIFY `tempCoeffVoc` DOUBLE NULL,
    MODIFY `tempCoeffPmax` DOUBLE NULL;
