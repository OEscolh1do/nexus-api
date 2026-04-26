-- CreateTable
CREATE TABLE `TechnicalDesign` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant-001',
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

    INDEX `TechnicalDesign_tenantId_idx`(`tenantId`),
    INDEX `TechnicalDesign_iacaLeadId_idx`(`iacaLeadId`),
    INDEX `TechnicalDesign_createdBy_idx`(`createdBy`),
    INDEX `TechnicalDesign_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoofSection` (
    `id` VARCHAR(191) NOT NULL,
    `technicalDesignId` VARCHAR(191) NOT NULL,
    `polygonGeoJson` JSON NOT NULL,
    `azimuth` DOUBLE NOT NULL,
    `tilt` DOUBLE NOT NULL,
    `area` DOUBLE NOT NULL,
    `shadingFactor` DOUBLE NOT NULL DEFAULT 1,
    `label` VARCHAR(191) NULL,

    INDEX `RoofSection_technicalDesignId_idx`(`technicalDesignId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PVArray` (
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

    INDEX `PVArray_technicalDesignId_idx`(`technicalDesignId`),
    INDEX `PVArray_roofSectionId_idx`(`roofSectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Simulation` (
    `id` VARCHAR(191) NOT NULL,
    `technicalDesignId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `inputParams` JSON NOT NULL,
    `resultData` JSON NOT NULL,
    `executedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Simulation_technicalDesignId_idx`(`technicalDesignId`),
    INDEX `Simulation_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ModuleCatalog` (
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
    `electricalData` JSON NULL,
    `bifacial` BOOLEAN NOT NULL DEFAULT false,
    `bifacialityFactor` DOUBLE NULL,
    `noct` DOUBLE NOT NULL DEFAULT 45,
    `nmot` DOUBLE NULL,
    `cellSizeClass` VARCHAR(191) NULL,
    `tempCoeffVoc` DOUBLE NOT NULL DEFAULT -0.29,
    `tempCoeffPmax` DOUBLE NOT NULL DEFAULT -0.35,

    UNIQUE INDEX `ModuleCatalog_model_key`(`model`),
    INDEX `ModuleCatalog_manufacturer_idx`(`manufacturer`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InverterCatalog` (
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
    `electricalData` JSON NULL,
    `Voc_max_hardware` DOUBLE NOT NULL DEFAULT 1000,
    `Isc_max_hardware` DOUBLE NOT NULL DEFAULT 20,
    `afci` BOOLEAN NOT NULL DEFAULT false,
    `rsd` BOOLEAN NOT NULL DEFAULT false,
    `ipRating` VARCHAR(191) NULL,
    `coolingType` VARCHAR(191) NULL,
    `maxAmbientTemp` DOUBLE NULL,
    `deratingStartTemp` DOUBLE NULL,
    `portaria515Compliant` BOOLEAN NOT NULL DEFAULT false,
    `nbr17193Compliant` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `InverterCatalog_model_key`(`model`),
    INDEX `InverterCatalog_manufacturer_idx`(`manufacturer`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RoofSection` ADD CONSTRAINT `RoofSection_technicalDesignId_fkey` FOREIGN KEY (`technicalDesignId`) REFERENCES `TechnicalDesign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PVArray` ADD CONSTRAINT `PVArray_roofSectionId_fkey` FOREIGN KEY (`roofSectionId`) REFERENCES `RoofSection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PVArray` ADD CONSTRAINT `PVArray_technicalDesignId_fkey` FOREIGN KEY (`technicalDesignId`) REFERENCES `TechnicalDesign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Simulation` ADD CONSTRAINT `Simulation_technicalDesignId_fkey` FOREIGN KEY (`technicalDesignId`) REFERENCES `TechnicalDesign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
