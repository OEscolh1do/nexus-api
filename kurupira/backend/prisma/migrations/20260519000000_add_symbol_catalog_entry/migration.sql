-- CreateTable: symbol_catalog_entries
-- Biblioteca de símbolos IEC editados pelo usuário no SymbolEditorCanvas (Kurupira)

CREATE TABLE `symbol_catalog_entries` (
    `id`        VARCHAR(191) NOT NULL,
    `tenantId`  VARCHAR(191) NOT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `name`      VARCHAR(191) NOT NULL,
    `symId`     VARCHAR(191) NOT NULL,
    `vbW`       INTEGER      NOT NULL,
    `vbH`       INTEGER      NOT NULL,
    `elements`  JSON         NOT NULL,
    `cssVars`   JSON         NULL,
    `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3)  NOT NULL,
    `deletedAt` DATETIME(3)  NULL,
    `deletedBy` VARCHAR(191) NULL,

    INDEX `symbol_catalog_entries_tenantId_idx`(`tenantId`),
    INDEX `symbol_catalog_entries_symId_idx`(`symId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
