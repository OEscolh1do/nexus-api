-- AlterTable
ALTER TABLE `inverter_catalog` MODIFY `unifilarSymbolRef` VARCHAR(191) NULL DEFAULT 'inverter-default';

-- AlterTable
ALTER TABLE `module_catalog` MODIFY `unifilarSymbolRef` VARCHAR(191) NULL DEFAULT 'module-default';

-- AlterTable
ALTER TABLE `technical_designs` ADD COLUMN `averageConsumption` DOUBLE NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `clientName` VARCHAR(191) NULL,
    ADD COLUMN `state` VARCHAR(191) NULL,
    ADD COLUMN `targetPowerKwp` DOUBLE NULL;
