/*
  Warnings:

  - A unique constraint covering the columns `[logtoOrgId]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Tenant` ADD COLUMN `logtoOrgId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Tenant_logtoOrgId_key` ON `Tenant`(`logtoOrgId`);
