/**
 * presets.ts
 *
 * Presets são combinações de elementos primitivos que, ao serem
 * arrastados da paleta, adicionam múltiplos elementos ao canvas
 * de uma só vez — compostos, não monolíticos.
 *
 * dx/dy = posição relativa ao ponto de drop (canto superior esquerdo do preset).
 */

import type { CanvasElementType } from './types';

export interface PresetElementDef {
  type: CanvasElementType;
  dx: number;
  dy: number;
  width: number;
  height: number;
  zIndex: number;
  props: Record<string, unknown>;
}

export interface CanvasPreset {
  id: string;
  label: string;
  description: string;
  defaultWidth: number;
  defaultHeight: number;
  elements: PresetElementDef[];
}

// ─── Preset: Badge de Capacidade ─────────────────────────────────────────────
// Recria o bloco "Nome do cliente + Potência + Geração" da página técnica.
// Composto por: placeholder, boxes coloridas, textos fixos e placeholders de KPI.

export const PRESET_KPI_BADGE: CanvasPreset = {
  id: 'kpi-badge',
  label: 'Badge de Capacidade',
  description: 'Nome do cliente + potência instalada + geração mensal',
  defaultWidth: 325,
  defaultHeight: 100,
  elements: [
    // Nome do cliente
    { type: 'placeholder', dx: 0, dy: 0, width: 325, height: 20, zIndex: 1,
      props: { field: 'client.name', prefix: '', suffix: '', fontSize: 13, fontWeight: 900, color: '#2D6A4F', textAlign: 'left', italic: false } },

    // Fundo: label vertical (verde claro)
    { type: 'box', dx: 0, dy: 22, width: 22, height: 78, zIndex: 2,
      props: { bgColor: '#4CAF50', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: 0, opacity: 1, shadow: false } },
    // Texto "PROJETO" vertical
    { type: 'text', dx: 0, dy: 22, width: 22, height: 78, zIndex: 3,
      props: { content: 'PROJETO', fontSize: 8, fontWeight: 900, color: '#064E3B', textAlign: 'center', fontFamily: 'system', rotation: -90 } },

    // Fundo: coluna Potência (verde escuro)
    { type: 'box', dx: 22, dy: 22, width: 150, height: 78, zIndex: 2,
      props: { bgColor: '#2D6A4F', border: '', borderTop: '', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '', borderLeft: '', borderRadius: 0, opacity: 1, shadow: false } },
    // Label "Potência Nominal"
    { type: 'text', dx: 32, dy: 30, width: 130, height: 14, zIndex: 3,
      props: { content: 'Potência Nominal', fontSize: 9, fontWeight: 800, color: '#ffffff', textAlign: 'center', fontFamily: 'system', rotation: 0 } },
    // Valor: potência instalada (kWp)
    { type: 'placeholder', dx: 32, dy: 48, width: 130, height: 40, zIndex: 3,
      props: { field: 'project.power', prefix: '', suffix: '', fontSize: 22, fontWeight: 900, color: '#ffffff', textAlign: 'center', italic: false } },

    // Fundo: coluna Geração (verde claro)
    { type: 'box', dx: 172, dy: 22, width: 153, height: 78, zIndex: 2,
      props: { bgColor: '#4CAF50', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: 0, opacity: 1, shadow: false } },
    // Label "Geração Mensal"
    { type: 'text', dx: 182, dy: 30, width: 130, height: 14, zIndex: 3,
      props: { content: 'Geração Mensal', fontSize: 9, fontWeight: 800, color: '#064E3B', textAlign: 'center', fontFamily: 'system', rotation: 0 } },
    // Valor: geração mensal média (kWh/mês)
    { type: 'placeholder', dx: 182, dy: 48, width: 130, height: 40, zIndex: 3,
      props: { field: 'project.monthlyGen', prefix: '', suffix: '', fontSize: 16, fontWeight: 900, color: '#064E3B', textAlign: 'center', italic: false } },
  ],
};

// ─── Preset: Painel de Equipamentos ──────────────────────────────────────────
// Recria o painel com label vertical, linha de módulos e linha de inversores.

export const PRESET_EQUIPMENT_PANEL: CanvasPreset = {
  id: 'equipment-panel',
  label: 'Painel de Equipamentos',
  description: 'Módulos e inversores com label lateral vertical',
  defaultWidth: 343,
  defaultHeight: 155,
  elements: [
    // Fundo geral com borda
    { type: 'box', dx: 0, dy: 0, width: 343, height: 155, zIndex: 1,
      props: { bgColor: '#ffffff', border: '1px solid #E2E8F0', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: 8, opacity: 1, shadow: true } },

    // Label lateral (verde escuro)
    { type: 'box', dx: 0, dy: 0, width: 24, height: 155, zIndex: 2,
      props: { bgColor: '#2D6A4F', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: 0, opacity: 1, shadow: false } },
    // Texto "EQUIPAMENTOS" vertical
    { type: 'text', dx: 0, dy: 0, width: 24, height: 155, zIndex: 3,
      props: { content: 'EQUIPAMENTOS', fontSize: 9, fontWeight: 900, color: '#ffffff', textAlign: 'center', fontFamily: 'system', rotation: -90 } },

    // ── Seção Módulos ──
    { type: 'text', dx: 32, dy: 10, width: 100, height: 12, zIndex: 3,
      props: { content: 'Módulos', fontSize: 8, fontWeight: 900, color: '#94A3B8', textAlign: 'left', fontFamily: 'system', rotation: 0 } },
    { type: 'placeholder', dx: 88, dy: 10, width: 120, height: 12, zIndex: 3,
      props: { field: 'project.modules', prefix: '· ', suffix: '', fontSize: 8, fontWeight: 700, color: '#94A3B8', textAlign: 'left', italic: false } },
    { type: 'placeholder', dx: 32, dy: 26, width: 220, height: 16, zIndex: 3,
      props: { field: 'project.moduleModel', prefix: '', suffix: '', fontSize: 11, fontWeight: 900, color: '#1E293B', textAlign: 'left', italic: false } },

    // Divisória módulo/inversor
    { type: 'divider', dx: 24, dy: 80, width: 319, height: 1, zIndex: 3,
      props: { color: '#E2E8F0', thickness: 1, margin: 0 } },

    // ── Seção Inversores ──
    { type: 'text', dx: 32, dy: 90, width: 150, height: 12, zIndex: 3,
      props: { content: 'Inversores', fontSize: 8, fontWeight: 900, color: '#94A3B8', textAlign: 'left', fontFamily: 'system', rotation: 0 } },
    { type: 'placeholder', dx: 32, dy: 106, width: 220, height: 16, zIndex: 3,
      props: { field: 'project.inverterModel', prefix: '', suffix: '', fontSize: 11, fontWeight: 900, color: '#1E293B', textAlign: 'left', italic: false } },
    { type: 'placeholder', dx: 32, dy: 126, width: 220, height: 14, zIndex: 3,
      props: { field: 'project.power', prefix: 'Potência: ', suffix: '', fontSize: 9, fontWeight: 600, color: '#64748B', textAlign: 'left', italic: false } },
  ],
};

// ─── Preset: Cabeçalho de Seção ──────────────────────────────────────────────

export const PRESET_SECTION_HEADER: CanvasPreset = {
  id: 'section-header',
  label: 'Cabeçalho de Seção',
  description: 'Título em destaque + subtexto descritivo',
  defaultWidth: 500,
  defaultHeight: 120,
  elements: [
    // Borda superior colorida
    { type: 'box', dx: 0, dy: 0, width: 500, height: 6, zIndex: 1,
      props: { bgColor: '#1a3d2b', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: 0, opacity: 1, shadow: false } },
    // Título
    { type: 'text', dx: 0, dy: 14, width: 500, height: 60, zIndex: 2,
      props: { content: 'TÍTULO DA SEÇÃO', fontSize: 28, fontWeight: 900, color: '#0F172A', textAlign: 'left', fontFamily: 'system', rotation: 0 } },
    // Subtexto
    { type: 'text', dx: 0, dy: 80, width: 460, height: 36, zIndex: 2,
      props: { content: 'Subtexto descritivo da seção. Edite este texto para personalizar a mensagem.', fontSize: 10, fontWeight: 400, color: '#64748B', textAlign: 'left', fontFamily: 'system', rotation: 0 } },
  ],
};

// ─── Preset: Card KPI (genérico) ─────────────────────────────────────────────

export const PRESET_KPI_CARD: CanvasPreset = {
  id: 'kpi-card',
  label: 'Card KPI',
  description: 'Card de indicador com fundo colorido, rótulo e valor',
  defaultWidth: 170,
  defaultHeight: 90,
  elements: [
    // Fundo com destaque lateral
    { type: 'box', dx: 0, dy: 0, width: 170, height: 90, zIndex: 1,
      props: { bgColor: '#F0FDF4', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '4px solid #4CAF50', borderRadius: 6, opacity: 1, shadow: true } },
    // Rótulo
    { type: 'text', dx: 12, dy: 10, width: 146, height: 14, zIndex: 2,
      props: { content: 'INDICADOR', fontSize: 8, fontWeight: 900, color: '#166534', textAlign: 'left', fontFamily: 'system', rotation: 0 } },
    // Valor principal (placeholder)
    { type: 'placeholder', dx: 12, dy: 26, width: 146, height: 38, zIndex: 2,
      props: { field: 'project.power', prefix: '', suffix: '', fontSize: 28, fontWeight: 900, color: '#4CAF50', textAlign: 'left', italic: false } },
    // Unidade/legenda
    { type: 'text', dx: 12, dy: 68, width: 146, height: 14, zIndex: 2,
      props: { content: 'unidade ou legenda', fontSize: 8, fontWeight: 700, color: '#94A3B8', textAlign: 'left', fontFamily: 'system', rotation: 0 } },
  ],
};

// ─── Preset: Bullet de Garantia ──────────────────────────────────────────────

export const PRESET_GUARANTEE_BULLET: CanvasPreset = {
  id: 'guarantee-bullet',
  label: 'Bullet de Garantia',
  description: 'Ícone + título + descrição — item de lista',
  defaultWidth: 300,
  defaultHeight: 44,
  elements: [
    // Fundo do ícone
    { type: 'box', dx: 0, dy: 4, width: 28, height: 28, zIndex: 1,
      props: { bgColor: '#f0fdf4', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: 6, opacity: 1, shadow: false } },
    // Ícone
    { type: 'icon', dx: 4, dy: 8, width: 20, height: 20, zIndex: 2,
      props: { name: 'Shield', size: 14, color: '#16a34a', bgColor: '', bgRadius: 0 } },
    // Título
    { type: 'text', dx: 36, dy: 4, width: 264, height: 16, zIndex: 2,
      props: { content: 'Título da Garantia', fontSize: 10, fontWeight: 800, color: '#1E293B', textAlign: 'left', fontFamily: 'system', rotation: 0 } },
    // Descrição
    { type: 'text', dx: 36, dy: 22, width: 264, height: 18, zIndex: 2,
      props: { content: 'Descrição detalhada da garantia ou serviço incluso.', fontSize: 9, fontWeight: 400, color: '#475569', textAlign: 'left', fontFamily: 'system', rotation: 0 } },
  ],
};

export const ALL_PRESETS: CanvasPreset[] = [
  PRESET_KPI_BADGE,
  PRESET_EQUIPMENT_PANEL,
  PRESET_SECTION_HEADER,
  PRESET_KPI_CARD,
  PRESET_GUARANTEE_BULLET,
];
