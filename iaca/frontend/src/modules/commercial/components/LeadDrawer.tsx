import React from 'react';
import { useCommercial } from '../contexts/CommercialContext';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, GraduationCap, X, Zap } from 'lucide-react';

const LeadDrawer: React.FC = () => {
  const { selectedLead, isLeadDrawerOpen, setIsLeadDrawerOpen } = useCommercial();

  if (!selectedLead) return null;

  const score = selectedLead.academyScore || 0;
  let scoreColor = 'bg-slate-200 text-slate-700';
  let scoreLabel = 'Cold';

  if (score > 150) {
    scoreColor = 'bg-red-100 text-red-700';
    scoreLabel = 'HOT';
  } else if (score > 50) {
    scoreColor = 'bg-orange-100 text-orange-700';
    scoreLabel = 'Warm';
  }

  return (
    // Simple Drawer/Sidebar logic - assuming generic Sheet or Sidebar component available or manually styled
    // Using a manual fixed div for simplicity if Shadcn Sheet isn't perfectly matched in path, but creating similar structure.
    // Actually, user context implies shadcn. I'll act as if components/ui exist. If not, I'll use standard tailwind.
    <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 z-50 ${isLeadDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{selectedLead.name}</h2>
            <p className="text-sm text-gray-500">{selectedLead.city}, {selectedLead.state}</p>
          </div>
          <button onClick={() => setIsLeadDrawerOpen(false)} className="p-1 hover:bg-gray-200 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Academy Score Section */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-blue-700 font-medium">
                <GraduationCap className="w-5 h-5" />
                <span>Academy Score</span>
              </div>
              <Badge className={scoreColor}>
                {score > 100 && <Flame className="w-3 h-3 mr-1" />}
                {scoreLabel}
              </Badge>
            </div>
            <div className="text-3xl font-bold text-blue-900">{score} pts</div>
            <div className="text-xs text-blue-600 mt-1">Interactions captured from Academy</div>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">Contato</h3>
            <div className="space-y-2">
              <p className="flex justify-between border-b pb-1">
                <span className="text-gray-500">Email:</span>
                <span className="font-medium">{selectedLead.email || 'N/A'}</span>
              </p>
              <p className="flex justify-between border-b pb-1">
                <span className="text-gray-500">Telefone:</span>
                <span className="font-medium">{selectedLead.phone}</span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 space-y-2">
            <Button
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white gap-2 flex items-center justify-center"
              onClick={() => {
                const kurupiraUrl = import.meta.env.VITE_KURUPIRA_URL || 'http://localhost:5174';
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const params = new URLSearchParams({ leadId: selectedLead.id, name: selectedLead.name });
                if (token) params.set('token', token);
                window.open(`${kurupiraUrl}?${params.toString()}`, '_blank');
              }}
            >
              <Zap size={16} />
              Dimensionar no Kurupira
            </Button>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Iniciar Oportunidade
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LeadDrawer;
