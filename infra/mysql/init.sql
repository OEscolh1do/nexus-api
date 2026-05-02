-- =============================================================
-- Neonorte Docker Init Script — MySQL 8.0
-- Operação Guardiões: Criação de schemas e users isolados
-- =============================================================

-- Iaçã (Gestão)
CREATE DATABASE IF NOT EXISTS db_iaca
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Kurupira (Engenharia)
CREATE DATABASE IF NOT EXISTS db_kurupira
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- User com acesso EXCLUSIVO a db_iaca
CREATE USER IF NOT EXISTS 'user_iaca'@'%' IDENTIFIED BY 'iaca_S3cur3_2026!';
GRANT ALL PRIVILEGES ON db_iaca.* TO 'user_iaca'@'%';

-- User com acesso EXCLUSIVO a db_kurupira
CREATE USER IF NOT EXISTS 'user_kurupira'@'%' IDENTIFIED BY 'kuru_S3cur3_2026!';
GRANT ALL PRIVILEGES ON db_kurupira.* TO 'user_kurupira'@'%';

-- Revogar acesso cruzado (defesa em profundidade)
-- (Removido: No MySQL 8, dá erro revogar privilégios que não foram explicitamente concedidos)
-- REVOKE ALL PRIVILEGES ON db_kurupira.* FROM 'user_iaca'@'%';
-- REVOKE ALL PRIVILEGES ON db_iaca.* FROM 'user_kurupira'@'%';

-- User READ-ONLY para o Admin BFF (neonorte-admin)
CREATE USER IF NOT EXISTS 'user_admin'@'%' IDENTIFIED BY 'admin_S3cur3_2026!';
GRANT SELECT ON db_iaca.* TO 'user_admin'@'%';
GRANT SELECT ON db_kurupira.* TO 'user_admin'@'%';

-- Sumaúma (Ywara Core Admin) - O NOVO MESTRE
CREATE DATABASE IF NOT EXISTS db_sumauma
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'user_sumauma'@'%' IDENTIFIED BY 'sumauma_S3cur3_2026!';
GRANT ALL PRIVILEGES ON db_sumauma.* TO 'user_sumauma'@'%';
GRANT SELECT ON db_iaca.* TO 'user_sumauma'@'%';
GRANT SELECT ON db_kurupira.* TO 'user_sumauma'@'%';

FLUSH PRIVILEGES;
