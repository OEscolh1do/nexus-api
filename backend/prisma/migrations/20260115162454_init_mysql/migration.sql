-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `avatar` VARCHAR(191) NULL,
    `role` ENUM('SALES', 'ENGINEER', 'ADMIN') NOT NULL DEFAULT 'SALES',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Client` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `cpf_cnpj` VARCHAR(191) NULL,
    `zip` VARCHAR(191) NULL,
    `street` VARCHAR(191) NULL,
    `number` VARCHAR(191) NULL,
    `neighborhood` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `contractAccounts` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` ENUM('LEAD', 'VISIT', 'PROPOSAL', 'NEGOTIATION', 'CONTACT', 'BUDGET', 'WAITING', 'APPROVED', 'REJECTED', 'READY', 'EXECUTION', 'REVIEW', 'DONE', 'CLOSED') NOT NULL DEFAULT 'LEAD',
    `pipeline` VARCHAR(191) NOT NULL DEFAULT 'SALES',
    `rank` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `monthlyUsage` DOUBLE NULL,
    `consumptionHistory` JSON NULL,
    `location` VARCHAR(191) NULL,
    `roofType` VARCHAR(191) NULL,
    `orientation` VARCHAR(191) NULL,
    `roofArea` DOUBLE NULL,
    `price` DOUBLE NULL,
    `energyTariff` DOUBLE NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActivityLog` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `details` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attachment` (
    `id` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `clientId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Location` (
    `id` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Location_city_key`(`city`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IrradiationData` (
    `id` VARCHAR(191) NOT NULL,
    `month` INTEGER NOT NULL,
    `irradiation` DOUBLE NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `IrradiationData_locationId_month_key`(`locationId`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConsumerUnit` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `isGenerator` BOOLEAN NOT NULL DEFAULT false,
    `averageAvg` DOUBLE NULL,
    `titular` VARCHAR(191) NULL,
    `group` VARCHAR(191) NULL,
    `meterNumber` VARCHAR(191) NULL,
    `availabilityFee` DOUBLE NULL,
    `voltage` VARCHAR(191) NULL,
    `concessionaire` VARCHAR(191) NULL,
    `projectId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attachment` ADD CONSTRAINT `Attachment_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attachment` ADD CONSTRAINT `Attachment_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IrradiationData` ADD CONSTRAINT `IrradiationData_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsumerUnit` ADD CONSTRAINT `ConsumerUnit_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
