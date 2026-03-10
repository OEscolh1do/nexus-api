import { useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ProjectCockpit } from "@/modules/ops/ui/ProjectCockpit"
import { ProjectBoard } from "@/modules/ops/ui/ProjectBoard"
import { FinancialDashboard } from "@/modules/fin/ui/FinancialDashboard"
// Removed AnalyticsDashboard import
import { LoginForm } from "@/modules/iam/ui/LoginForm"
import { AppSwitcher } from "@/views/AppSwitcher"
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
import NavigationSettings from "@/views/admin/NavigationSettings"
import TenantSettings from "@/views/admin/TenantSettings"
import { AuditTrailView } from "@/views/executive/AuditTrailView"
import { ApprovalCenterView } from "@/views/executive/ApprovalCenterView"

// --- PHASE 2: EXTRANET PORTALS ---
import { ClientPortalLayout } from "@/views/extranet/b2b/ClientPortalLayout"
import ClientProjectDashboard from "@/views/extranet/b2b/ClientProjectDashboard"
import { VendorPortalLayout } from "@/views/extranet/b2p/VendorPortalLayout"
import VendorTerminalView from "@/views/extranet/b2p/VendorTerminalView"
import { RDOCreator } from "@/views/extranet/b2p/RDOCreator"

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem("token");
    // AUTH FIX: Accept valid JWT tokens (which do not start with dev-token-)
    // Previous check: return !!(token && token.startsWith("dev-token-"));
    return !!token;
  });

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  }

  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* PORTAL DE ENTRADA */}
        <Route path="/" element={<AppSwitcher onLogout={logout} />} />

        {/* ADMIN */}
        <Route path="/admin" element={<Navigate to="/admin/tenant" />} />
        <Route path="/admin/navigation" element={<NavigationSettings />} />
        <Route path="/admin/tenant" element={<TenantSettings />} />

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

        {/* VIEW 5: ACADEMY */}
        <Route path="/academy" element={
          <div className="flex h-screen items-center justify-center bg-teal-50">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-teal-900">Portal Academy</h1>
              <p className="text-teal-700">Módulo em construção (Greenfield)</p>
              <a href="/" className="underline mt-4 block">Voltar</a>
            </div>
          </div>
        } />

        {/* PHASE 2: EXTRANETS (B2B CLIENTS & B2P CONTRACTORS) */}

        {/* B2B Client Portal */}
        <Route path="/extranet/client" element={<ClientPortalLayout />}>
          <Route path="dashboard" element={<ClientProjectDashboard />} />
          <Route index element={<Navigate to="dashboard" />} />
        </Route>

        {/* B2P Vendor Terminal */}
        <Route path="/extranet/vendor" element={<VendorPortalLayout />}>
          <Route path="tasks" element={<VendorTerminalView />} />
          <Route path="rdo" element={<RDOCreator />} />
          <Route index element={<Navigate to="tasks" />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
