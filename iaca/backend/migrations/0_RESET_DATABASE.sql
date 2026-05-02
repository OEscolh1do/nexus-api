-- ============================================
-- RESET COMPLETO DO BANCO DE DADOS (HOSTINGER)
-- ============================================
-- 
-- ATENÇÃO: Este script APAGA TODOS OS DADOS!
-- Use apenas em ambiente de desenvolvimento/testes.
--
-- Data: 2026-01-20
-- Responsável: Antigravity AI
-- Objetivo: Reset completo + Schema atualizado com AuditLog
-- ============================================

-- Desabilitar verificação de foreign keys temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- Apagar todas as tabelas existentes (se existirem)
DROP TABLE IF EXISTS `ChecklistItem`;
DROP TABLE IF EXISTS `Checklist`;
DROP TABLE IF EXISTS `TaskDependency`;
DROP TABLE IF EXISTS `Task`;
DROP TABLE IF EXISTS `Project`;
DROP TABLE IF EXISTS `KeyResult`;
DROP TABLE IF EXISTS `Strategy`;
DROP TABLE IF EXISTS `HRLeave`;
DROP TABLE IF EXISTS `AuditLog`;
DROP TABLE IF EXISTS `User`;
DROP TABLE IF EXISTS `_prisma_migrations`;

-- Reabilitar verificação de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

-- Mensagem de confirmação
SELECT 'Banco de dados limpo. Pronto para aplicar migrações Prisma.' AS status;
