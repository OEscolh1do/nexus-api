import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { api } from "@/lib/api"
import { ProjectCockpit } from "@/modules/ops/ui/ProjectCockpit"
import { ProjectBoard } from "@/modules/ops/ui/ProjectBoard"
import { FinancialDashboard } from "@/modules/fin/ui/FinancialDashboard"
// Removed AnalyticsDashboard import
// Removed LoginForm import (we redirect to Hub now)
// Removed AppSwitcher import
import { ErpTabBar } from "@/components/layout/ErpTabBar"
import { ExecutiveLayout } from "@/views/executive/ExecutiveLayout"
import { OpsLayout } from "@/views/ops/OpsLayout"
import { CommercialLayout } from "@/views/commercial/CommercialLayout"
import CommercialPipeline from "@/modules/commercial/ui/CommercialPipeline"
import { MissionControl } from "@/modules/commercial/ui/MissionControl"
import CommercialPerformance from "@/views/commercial/CommercialPerformance"
import ClientsView from "@/views/commercial/ClientsView"
import { ContractsView } from "@/views/commercial/ContractsView"
import { GanttMatrixView } from "@/modules/ops/ui/GanttMatrixView"
import { KanbanView } from "@/modules/ops/ui/KanbanView"
import { PeopleView } from "@/modules/ops/ui/PeopleView"
import WorkloadView from "@/modules/ops/ui/WorkloadView"
import { StrategyManagerView } from "@/modules/strategy/ui/StrategyManagerView"
import { ExecutiveDashboard } from "@/views/executive/ExecutiveDashboard"
import { PortfolioView } from "@/views/executive/PortfolioView"
import { BIView } from "@/views/executive/BIView"

import { StrategyReviewView } from "@/modules/strategy/ui/StrategyReviewView"
import { AuditTrailView } from "@/views/executive/AuditTrailView"
import { ApprovalCenterView } from "@/views/executive/ApprovalCenterView"

// Funções e Wrappers Legados de APPs e Extranets foram removidas para Micro-frontends.

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const initSilentAuth = async () => {
      // 1. Tenta Auth via Storage herdado (Compatibilidade Temporal)
      const token = localStorage.getItem("token");
      if (token) {
        setIsAuthenticated(true);
        return;
      }

      // 2. 🛡️ SSO Auth Bridge (Fase 13): "Recuperação Cega"
      // Se não há token, pede ao server para verificar se há Cookie válido
      try {
        await api.get("/iam/me");
        setIsAuthenticated(true);
      } catch (error) {
        // Redireciona o usuário rejeitado direto para o Hub Central
        window.location.href = import.meta.env.VITE_HUB_URL || "http://localhost:5175";
      }
    };

    initSilentAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    window.location.href = import.meta.env.VITE_HUB_URL || "http://localhost:5175";
  };

  // Tela preta rápida de transição do SSO para evitar Flashes
  if (isAuthenticated === null) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#050510]">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 text-xs tracking-widest uppercase font-semibold">Validando Sessão Segura...</p>
        </div>
      );
  }

  if (!isAuthenticated) return null;

  return (
    <BrowserRouter>
      {/* BARRA DE ABAS GLOBAL FIXA NO RODAPÉ */}
      <ErpTabBar onLogout={logout} />

      <div className="pb-12 h-screen overflow-hidden">
        <Routes>
          {/* PORTAL DE ENTRADA (Agora redireciona para a primeira Aba do ERP: Gestão) */}
          <Route path="/" element={<Navigate to="/executive/overview" replace />} />

        {/* VIEW 1: EXECUTIVE (BI & FIN) */}
        <Route path="/executive" element={<ExecutiveLayout />}>
          <Route path="overview" element={<ExecutiveDashboard />} />
          <Route path="strategy" element={<StrategyManagerView />} />
          <Route path="portfolio" element={<PortfolioView />} />
          <Route path="people" element={<PeopleView />} />
          <Route path="financial" element={<FinancialDashboard />} />
          <Route path="audit" element={<AuditTrailView />} />
          <Route path="analytics" element={<BIView />} />
          <Route index element={<Navigate to="overview" />} />
        </Route>

        {/* VIEW 2: COMMERCIAL */}
        <Route path="/commercial" element={<CommercialLayout />}>
          <Route path="pipeline" element={<CommercialPipeline />} />
          <Route path="missions" element={<MissionControl />} />
          <Route path="performance" element={<CommercialPerformance />} />
          <Route path="clients" element={<ClientsView />} />
          <Route path="contracts" element={<ContractsView />} />
          <Route index element={<Navigate to="pipeline" />} />
        </Route>

        {/* VIEW 3: OPS (FACTORY) */}
        <Route path="/ops" element={<OpsLayout />}>
          <Route path="cockpit" element={<ProjectCockpit />} />
          <Route path="portfolio" element={<ProjectBoard />} />
          <Route path="kanban" element={<KanbanView />} />
          <Route path="gantt" element={<GanttMatrixView />} />
          <Route path="workload" element={<WorkloadView />} />
          <Route path="strategy" element={<StrategyReviewView />} />
          <Route path="approvals" element={<ApprovalCenterView />} />
          <Route path="issues" element={<div className="p-8 text-center text-slate-500">Gestão de Gargalos (Em breve)</div>} />
          <Route path="map" element={<div className="p-8 text-center text-slate-500">Mapa Operacional (Em breve)</div>} />
          <Route index element={<Navigate to="cockpit" />} />
        </Route>

        {/* Academy e Portais Extranet removidos na migração de Arquitetura. */}

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/executive/overview" replace />} />
      </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
