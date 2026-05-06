import type { ProposalTemplate } from '../types';
import { A4_WIDTH, A4_HEIGHT } from '../types';

export const CLASSIC_TEMPLATE: ProposalTemplate = {
  id: 'classic',
  name: 'Clássico Neonorte',
  description: 'Página de dimensionamento técnico do sistema fotovoltaico.',
  isBuiltIn: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  theme: {
    primaryColor: '#2D0A4E',
    accentColor: '#10B981',
    fontFamily: 'system',
  },
  pages: [
    {
      id: 'classic-p0',
      label: 'Dimensionamento',
      background: { color: '#ffffff' },
      elements: [
        {
          id: 'classic-p0-main',
          type: 'page-technical',
          x: 0,
          y: 0,
          width: A4_WIDTH,
          height: A4_HEIGHT,
          zIndex: 0,
          locked: true,
          visible: true,
          props: {},
        },
      ],
    },
  ],
};

export const BUILT_IN_TEMPLATES: ProposalTemplate[] = [CLASSIC_TEMPLATE];
