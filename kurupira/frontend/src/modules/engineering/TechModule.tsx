/**
 * =============================================================================
 * TECH MODULE — Shell de Engenharia (Refatorado para UX-001 Fase 3)
 * =============================================================================
 *
 * Responsabilidade:
 * - Renderizar o WorkspaceLayout (esqueleto CSS Grid com 4 painéis)
 * - Verificar se o módulo ativo é 'engineering' antes de montar
 *
 * O layout antigo (Tabs horizontal: Arranjo / Inversores / Geração) foi
 * substituído pelo paradigma de 4 painéis simultâneos:
 *   TopRibbon | LeftOutliner | CenterCanvas | RightInspector
 *
 * As abas internas de configuração (PVArrayTab, InverterSystemTab,
 * GenerationAnalysisTab) continuam acessíveis pelo LeftOutliner e TopRibbon.
 * =============================================================================
 */

import React from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import { WorkspaceLayout } from './ui/layout/WorkspaceLayout';

export const TechModule: React.FC = () => {
    const activeModule = useSolarStore(state => state.activeModule);

    if (activeModule !== 'engineering') return null;

    return <WorkspaceLayout />;
};
