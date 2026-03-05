-- ============================================
-- MIGRAÇÃO MANUAL: Adicionar Tabela AuditLog
-- ============================================
-- 
-- IMPORTANTE: Esta migração é SEGURA e NÃO-DESTRUTIVA.
-- Ela apenas ADICIONA a nova tabela sem afetar dados existentes.
--
-- Data: 2026-01-20
-- Responsável: Antigravity AI
-- Schema Version: Adicionando AuditLog v1.0
--
-- INSTRUÇÕES DE EXECUÇÃO:
-- 1. Fazer backup do banco antes de executar (OBRIGATÓRIO)
-- 2. Executar via phpMyAdmin ou MySQL CLI no Hostinger
-- 3. Verificar que a tabela foi criada: SHOW TABLES LIKE 'AuditLog';
-- ============================================

-- Criar tabela AuditLog (apenas se não existir)
CREATE TABLE IF NOT EXISTS `AuditLog` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `action` VARCHAR(191) NOT NULL COMMENT 'Ex: UPDATE_PROJECT_DETAILS, DELETE_PROJECT',
  `resourceId` VARCHAR(191) NOT NULL COMMENT 'ID do recurso afetado (ex: ID do projeto)',
  `before` LONGTEXT NULL COMMENT 'Estado anterior (JSON)',
  `after` LONGTEXT NULL COMMENT 'Estado novo (JSON)',
  `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ipAddress` VARCHAR(191) NULL COMMENT 'IP de origem da requisição',
  `userAgent` TEXT NULL COMMENT 'User-Agent do navegador',
  
  PRIMARY KEY (`id`),
  
  -- Índices para performance
  INDEX `AuditLog_userId_fkey` (`userId`),
  INDEX `AuditLog_resourceId_idx` (`resourceId`),
  INDEX `AuditLog_action_idx` (`action`),
  INDEX `AuditLog_timestamp_idx` (`timestamp`),
  
  -- Foreign key para User
  CONSTRAINT `AuditLog_userId_fkey` 
    FOREIGN KEY (`userId`) 
    REFERENCES `User` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabela de auditoria para rastreamento de mudanças críticas';

-- Verificar se a tabela foi criada
SELECT 'AuditLog table created successfully!' AS status;

-- Verificar estrutura da tabela
DESCRIBE `AuditLog`;
