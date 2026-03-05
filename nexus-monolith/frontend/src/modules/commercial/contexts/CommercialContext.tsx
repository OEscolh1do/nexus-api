import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Mission, Lead } from '../types';

interface CommercialContextType {
  activeMission: Mission | null;
  setActiveMission: (mission: Mission | null) => void;
  selectedLead: Lead | null;
  setSelectedLead: (lead: Lead | null) => void;
  isLeadDrawerOpen: boolean;
  setIsLeadDrawerOpen: (open: boolean) => void;
}

const CommercialContext = createContext<CommercialContextType | undefined>(undefined);

export const CommercialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadDrawerOpen, setIsLeadDrawerOpen] = useState(false);

  const handleSetSelectedLead = (lead: Lead | null) => {
      setSelectedLead(lead);
      if (lead) setIsLeadDrawerOpen(true);
      else setIsLeadDrawerOpen(false);
  };

  return (
    <CommercialContext.Provider value={{
      activeMission,
      setActiveMission,
      selectedLead,
      setSelectedLead: handleSetSelectedLead,
      isLeadDrawerOpen,
      setIsLeadDrawerOpen
    }}>
      {children}
    </CommercialContext.Provider>
  );
};

export const useCommercial = () => {
  const context = useContext(CommercialContext);
  if (!context) {
    throw new Error('useCommercial must be used within a CommercialProvider');
  }
  return context;
};
