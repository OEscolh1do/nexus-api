-- Migration: Add MigrationAudit table for hardened migration tracking
-- Generated: 2026-01-21
-- Purpose: Track project-to-quote migration with full audit trail

-- Create MigrationAudit table
CREATE TABLE IF NOT EXISTS `MigrationAudit` (
  `id` VARCHAR(191) NOT NULL,
  `batchNumber` INTEGER NOT NULL,
  `projectId` VARCHAR(191) NOT NULL,
  `leadId` VARCHAR(191) NULL,
  `quoteId` VARCHAR(191) NULL,
  `action` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `errorMessage` TEXT NULL,
  `duration_ms` INTEGER NOT NULL DEFAULT 0,
  `dryRun` BOOLEAN NOT NULL DEFAULT false,
  `metadata` JSON NULL,
  `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  INDEX `MigrationAudit_projectId_idx` (`projectId`),
  INDEX `MigrationAudit_batchNumber_idx` (`batchNumber`),
  INDEX `MigrationAudit_status_idx` (`status`),
  INDEX `MigrationAudit_timestamp_idx` (`timestamp`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
