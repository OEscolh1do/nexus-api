-- DropForeignKey
ALTER TABLE `AuditLog` DROP FOREIGN KEY `AuditLog_tenantId_fkey`;

-- DropForeignKey
ALTER TABLE `AuditLog` DROP FOREIGN KEY `AuditLog_userId_fkey`;

-- AlterTable
ALTER TABLE `AuditLog` MODIFY `tenantId` VARCHAR(191) NULL,
    MODIFY `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Tenant` MODIFY `type` VARCHAR(191) NOT NULL DEFAULT 'CORPORATE';

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
