/*
  Warnings:

  - You are about to drop the `InverterCatalog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ModuleCatalog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PVArray` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RoofSection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Simulation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TechnicalDesign` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `PVArray` DROP FOREIGN KEY `PVArray_roofSectionId_fkey`;

-- DropForeignKey
ALTER TABLE `PVArray` DROP FOREIGN KEY `PVArray_technicalDesignId_fkey`;

-- DropForeignKey
ALTER TABLE `RoofSection` DROP FOREIGN KEY `RoofSection_technicalDesignId_fkey`;

-- DropForeignKey
ALTER TABLE `Simulation` DROP FOREIGN KEY `Simulation_technicalDesignId_fkey`;

-- DropTable
DROP TABLE `InverterCatalog`;

-- DropTable
DROP TABLE `ModuleCatalog`;

-- DropTable
DROP TABLE `PVArray`;

-- DropTable
DROP TABLE `RoofSection`;

-- DropTable
DROP TABLE `Simulation`;

-- DropTable
DROP TABLE `TechnicalDesign`;

-- CreateTable
CREATE TABLE `technical_designs` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `iacaLeadId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `designData` JSON NULL,
    `notes` TEXT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,

    INDEX `technical_designs_tenantId_idx`(`tenantId`),
    INDEX `technical_designs_iacaLeadId_idx`(`iacaLeadId`),
    INDEX `technical_designs_createdBy_idx`(`createdBy`),
    INDEX `technical_designs_status_idx`(`status`),
    INDEX `technical_designs_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roof_sections` (
    `id` VARCHAR(191) NOT NULL,
    `technicalDesignId` VARCHAR(191) NOT NULL,
    `polygonGeoJson` JSON NOT NULL,
    `azimuth` DOUBLE NOT NULL,
    `tilt` DOUBLE NOT NULL,
    `area` DOUBLE NOT NULL,
    `shadingFactor` DOUBLE NOT NULL DEFAULT 1,
    `label` VARCHAR(191) NULL,

    INDEX `roof_sections_technicalDesignId_idx`(`technicalDesignId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pv_arrays` (
    `id` VARCHAR(191) NOT NULL,
    `technicalDesignId` VARCHAR(191) NOT NULL,
    `roofSectionId` VARCHAR(191) NULL,
    `moduleModel` VARCHAR(191) NOT NULL,
    `modulePower` DOUBLE NOT NULL,
    `moduleCount` INTEGER NOT NULL,
    `stringConfig` JSON NULL,
    `inverterModel` VARCHAR(191) NULL,
    `inverterPower` DOUBLE NULL,
    `cableSectionMm2` DOUBLE NULL,
    `estimatedGenKwh` DOUBLE NULL,

    INDEX `pv_arrays_technicalDesignId_idx`(`technicalDesignId`),
    INDEX `pv_arrays_roofSectionId_idx`(`roofSectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `simulations` (
    `id` VARCHAR(191) NOT NULL,
    `technicalDesignId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `inputParams` JSON NOT NULL,
    `resultData` JSON NOT NULL,
    `executedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `simulations_technicalDesignId_idx`(`technicalDesignId`),
    INDEX `simulations_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `module_catalog` (
    `id` VARCHAR(191) NOT NULL,
    `manufacturer` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `powerWp` DOUBLE NOT NULL,
    `efficiency` DOUBLE NULL,
    `dimensions` VARCHAR(191) NULL,
    `weight` DOUBLE NULL,
    `datasheet` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `unifilarSymbolRef` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `bifacial` BOOLEAN NOT NULL DEFAULT false,
    `bifacialityFactor` DOUBLE NULL,
    `noct` DOUBLE NULL,
    `tempCoeffVoc` DOUBLE NULL,
    `tempCoeffPmax` DOUBLE NULL,
    `cellSizeClass` VARCHAR(191) NULL,
    `degradacaoAnual` DECIMAL(5, 4) NOT NULL DEFAULT 0.005,
    `electricalData` JSON NULL,

    UNIQUE INDEX `module_catalog_model_key`(`model`),
    INDEX `module_catalog_manufacturer_idx`(`manufacturer`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_settings` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `data` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `user_settings_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `user_settings_userId_tenantId_key`(`userId`, `tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inverter_catalog` (
    `id` VARCHAR(191) NOT NULL,
    `manufacturer` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `nominalPowerW` DOUBLE NOT NULL,
    `maxInputV` DOUBLE NULL,
    `mpptCount` INTEGER NULL,
    `efficiency` DOUBLE NULL,
    `datasheet` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `unifilarSymbolRef` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `width` DOUBLE NULL,
    `height` DOUBLE NULL,
    `depth` DOUBLE NULL,
    `weight` DOUBLE NULL,
    `Voc_max_hardware` DOUBLE NULL,
    `Isc_max_hardware` DOUBLE NULL,
    `coolingType` VARCHAR(191) NULL DEFAULT 'passive',
    `afci` BOOLEAN NOT NULL DEFAULT true,
    `rsd` BOOLEAN NOT NULL DEFAULT false,
    `portaria515Compliant` BOOLEAN NOT NULL DEFAULT false,
    `electricalData` JSON NULL,

    UNIQUE INDEX `inverter_catalog_model_key`(`model`),
    INDEX `inverter_catalog_manufacturer_idx`(`manufacturer`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `roof_sections` ADD CONSTRAINT `roof_sections_technicalDesignId_fkey` FOREIGN KEY (`technicalDesignId`) REFERENCES `technical_designs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pv_arrays` ADD CONSTRAINT `pv_arrays_roofSectionId_fkey` FOREIGN KEY (`roofSectionId`) REFERENCES `roof_sections`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pv_arrays` ADD CONSTRAINT `pv_arrays_technicalDesignId_fkey` FOREIGN KEY (`technicalDesignId`) REFERENCES `technical_designs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `simulations` ADD CONSTRAINT `simulations_technicalDesignId_fkey` FOREIGN KEY (`technicalDesignId`) REFERENCES `technical_designs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
