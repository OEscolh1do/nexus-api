import { useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
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
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // URL JWT Trapping (SSO Pass-Through)
    const params = new URLSearchParams(window.location.search);
    const sessionToken = params.get("session");

    if (sessionToken) {
      localStorage.setItem("token", sessionToken);
      // Clean the URL so the token doesn't stay visible
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }

    const token = localStorage.getItem("token");
    return !!token;
  });

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  }

  if (!isAuthenticated) {
    // Redireciona usuários deslogados do ERP direto para o Hub Central
    window.location.href = import.meta.env.VITE_HUB_URL || "http://localhost:5175";
    return null;
  }

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
