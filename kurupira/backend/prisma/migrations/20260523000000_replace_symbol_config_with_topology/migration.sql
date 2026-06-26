-- Migration: add typologyConfig column to inverter_catalog
-- typologyConfig (TopologyConfig) is the new unified topology engine.
-- symbolConfig (ParametricSymbolConfig) is kept for backward compat with Kurupira Layer 3.
-- It will be dropped in a future migration once UnifilarSchematicCanvas is migrated.

ALTER TABLE `inverter_catalog` ADD COLUMN `typologyConfig` JSON NULL;
