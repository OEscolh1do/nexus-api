import { create } from 'zustand';

export type InverterCanvasTab = 'voltage' | 'oversizing' | 'topology' | 'audit';

interface InverterUIState {
  activeInverterId: string | null;
  setActiveInverterId: (id: string | null) => void;

  activeCanvasTab: InverterCanvasTab;
  setActiveCanvasTab: (tab: InverterCanvasTab) => void;

  terminalOpen: boolean;
  setTerminalOpen: (isOpen: boolean) => void;

  highlightMpptId: number | null;
  setHighlightMpptId: (id: number | null) => void;
}

export const useInverterUIStore = create<InverterUIState>((set) => ({
  activeInverterId: null,
  setActiveInverterId: (id) => set({ activeInverterId: id }),

  activeCanvasTab: 'voltage',
  setActiveCanvasTab: (tab) => set({ activeCanvasTab: tab }),

  terminalOpen: false,
  setTerminalOpen: (isOpen) => set({ terminalOpen: isOpen }),

  highlightMpptId: null,
  setHighlightMpptId: (id) => set({ highlightMpptId: id }),
}));
