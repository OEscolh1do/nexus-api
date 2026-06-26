-- CreateTable
CREATE TABLE `IdentityAuditHistory` (
    `id` VARCHAR(191) NOT NULL,
    `checkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `summary` JSON NOT NULL,
    `report` JSON NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'SUCCESS',
    `errorMessage` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
