import type { ProposalTemplate } from '../types';
import { A4_WIDTH, A4_HEIGHT } from '../types';

export const CLASSIC_TEMPLATE: ProposalTemplate = {
  id: 'classic',
  name: 'Clássico Neonorte',
  description: 'Layout padrão com capa, investimento, dimensionamento, cronograma e contato.',
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
      label: 'Capa',
      background: { color: '#2D0A4E' },
      elements: [
        {
          id: 'classic-p0-main',
          type: 'page-cover',
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
    {
      id: 'classic-p1',
      label: 'Investimento',
      background: { color: '#ffffff' },
      elements: [
        {
          id: 'classic-p1-main',
          type: 'page-investment',
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
    {
      id: 'classic-p2',
      label: 'Dimensionamento',
      background: { color: '#ffffff' },
      elements: [
        {
          id: 'classic-p2-main',
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
    {
      id: 'classic-p3',
      label: 'Cronograma',
      background: { color: '#ffffff' },
      elements: [
        {
          id: 'classic-p3-main',
          type: 'page-schedule',
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
    {
      id: 'classic-p4',
      label: 'Contato',
      background: {},
      elements: [
        {
          id: 'classic-p4-main',
          type: 'page-contact',
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
