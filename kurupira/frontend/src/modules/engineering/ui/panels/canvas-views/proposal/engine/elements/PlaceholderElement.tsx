/**
 * PlaceholderElement.tsx
 *
 * Campo dinâmico ("merge field") que se substitui por um dado real do projeto.
 * O usuário escolhe o campo no painel de propriedades e formata como qualquer texto.
 */

import React from 'react';
import { useProposalPageData } from '../useProposalPageData';
import { formatBRL, formatDate } from '@/modules/engineering/utils/formatters';
import type { CanvasElement } from '../types';

// ─── Catálogo de campos disponíveis ───────────────────────────────────────────

// Typed union keeps field strings as a single source of truth.
export type PlaceholderField =
  | 'client.name' | 'client.city' | 'client.state' | 'client.neighborhood'
  | 'client.street' | 'client.address' | 'client.zipCode' | 'client.concessionaire'
  | 'client.connectionType' | 'client.tariff' | 'client.consumption'
  | 'project.power' | 'project.modules' | 'project.moduleModel' | 'project.inverterModel'
  | 'project.monthlyGen' | 'project.annualGen' | 'project.coverage'
  | 'project.economiaAno' | 'project.investment'
  | 'proposal.date' | 'proposal.dueDate' | 'proposal.validity'
  | 'proposal.engineer' | 'proposal.engineerCrea' | 'proposal.phone';

export interface PlaceholderFieldDef {
  field: PlaceholderField;
  label: string;
  group: string;
  example: string;
}

export const PLACEHOLDER_FIELDS: PlaceholderFieldDef[] = [
  { field: 'client.name',           group: 'Cliente',  label: 'Nome do cliente',      example: 'João Silva'                                    },
  { field: 'client.city',           group: 'Cliente',  label: 'Cidade',               example: 'Parauapebas'                                   },
  { field: 'client.state',          group: 'Cliente',  label: 'Estado (UF)',           example: 'PA'                                            },
  { field: 'client.neighborhood',   group: 'Cliente',  label: 'Bairro',               example: 'Centro'                                        },
  { field: 'client.street',         group: 'Cliente',  label: 'Rua',                  example: 'Av. Principal, 100'                            },
  { field: 'client.address',        group: 'Cliente',  label: 'Endereço completo',    example: 'Av. Principal, 100 — Centro, Parauapebas/PA'   },
  { field: 'client.zipCode',        group: 'Cliente',  label: 'CEP',                  example: '68515-000'                                     },
  { field: 'client.concessionaire', group: 'Cliente',  label: 'Concessionária',       example: 'Equatorial PA'                                 },
  { field: 'client.connectionType', group: 'Cliente',  label: 'Tipo de ligação',      example: 'Monofásico'                                    },
  { field: 'client.tariff',         group: 'Cliente',  label: 'Tarifa (R$/kWh)',       example: '0,92'                                          },
  { field: 'client.consumption',    group: 'Cliente',  label: 'Consumo médio (kWh)',   example: '450'                                           },
  { field: 'project.power',         group: 'Projeto',  label: 'Potência instalada',   example: '6,60 kWp'                                      },
  { field: 'project.modules',       group: 'Projeto',  label: 'Nº de módulos',        example: '15 módulos'                                    },
  { field: 'project.moduleModel',   group: 'Projeto',  label: 'Modelo do módulo',     example: 'Canadian 440W'                                 },
  { field: 'project.inverterModel', group: 'Projeto',  label: 'Modelo do inversor',   example: 'Growatt 5000TL'                                },
  { field: 'project.monthlyGen',    group: 'Projeto',  label: 'Geração média mensal', example: '756 kWh/mês'                                   },
  { field: 'project.annualGen',     group: 'Projeto',  label: 'Geração anual total',  example: '9.072 kWh/ano'                                 },
  { field: 'project.coverage',      group: 'Projeto',  label: 'Cobertura solar',      example: '87,3%'                                         },
  { field: 'project.economiaAno',   group: 'Projeto',  label: 'Economia anual',       example: 'R$ 8.346,24'                                   },
  { field: 'project.investment',    group: 'Projeto',  label: 'Investimento total',   example: 'R$ 22.500,00'                                  },
  { field: 'proposal.date',         group: 'Proposta', label: 'Data da proposta',     example: '06/05/2026'                                    },
  { field: 'proposal.dueDate',      group: 'Proposta', label: 'Válida até',           example: '21/05/2026'                                    },
  { field: 'proposal.validity',     group: 'Proposta', label: 'Validade (dias)',       example: '15 dias'                                       },
  { field: 'proposal.engineer',     group: 'Proposta', label: 'Responsável técnico',  example: 'Eng. Maria Santos'                             },
  { field: 'proposal.engineerCrea', group: 'Proposta', label: 'CREA do engenheiro',   example: 'CREA-PA 123456'                                },
  { field: 'proposal.phone',        group: 'Proposta', label: 'Telefone de contato',  example: '(94) 99999-9999'                               },
];

export const DEFAULT_PLACEHOLDER_FIELD: PlaceholderField = PLACEHOLDER_FIELDS[0].field;

// ─── Resolver ─────────────────────────────────────────────────────────────────

function formatConnectionType(ct: string | undefined): string {
  if (ct === 'monofasico') return 'Monofásico';
  if (ct === 'bifasico')   return 'Bifásico';
  if (ct === 'trifasico')  return 'Trifásico';
  return ct ?? '—';
}

// Lazily resolves only the requested field — avoids building all 25 values on every render.
export function resolvePlaceholder(
  field: PlaceholderField | string,
  data: ReturnType<typeof useProposalPageData>,
): string {
  const { clientData, proposalData, totalPowerKwp, totalModules, firstModule, firstInverter, stats, monthlyGenAvg } = data;

  switch (field) {
    // ── Cliente ──────────────────────────────────────────────────────────────
    case 'client.name':
      return clientData.clientName || '—';
    case 'client.city':
      return clientData.city || '—';
    case 'client.state':
      return clientData.state || '—';
    case 'client.neighborhood':
      return clientData.neighborhood || '—';
    case 'client.street':
      return `${clientData.street || ''}${clientData.number ? `, ${clientData.number}` : ''}`.trim() || '—';
    case 'client.address': {
      const parts = [
        clientData.street,
        clientData.number ? `, ${clientData.number}` : '',
        clientData.neighborhood ? ` — ${clientData.neighborhood}` : '',
        clientData.city ? `, ${clientData.city}` : '',
        clientData.state ? `/${clientData.state}` : '',
      ];
      return parts.join('').trim() || '—';
    }
    case 'client.zipCode':
      return clientData.zipCode || '—';
    case 'client.concessionaire':
      return clientData.concessionaire || '—';
    case 'client.connectionType':
      return formatConnectionType(clientData.connectionType);
    case 'client.tariff':
      return `R$ ${(clientData.tariffRate || 0).toFixed(4).replace('.', ',')}`;
    case 'client.consumption':
      return `${Math.round(clientData.averageConsumption || 0).toLocaleString('pt-BR')} kWh`;

    // ── Projeto ───────────────────────────────────────────────────────────────
    case 'project.power':
      return `${totalPowerKwp.toFixed(2).replace('.', ',')} kWp`;
    case 'project.modules':
      return `${totalModules} módulo${totalModules !== 1 ? 's' : ''}`;
    case 'project.moduleModel':
      return firstModule
        ? `${firstModule.manufacturer} ${firstModule.model} ${firstModule.power}W`.trim()
        : '—';
    case 'project.inverterModel':
      return firstInverter ? firstInverter.snapshot.model.trim() || '—' : '—';
    case 'project.monthlyGen':
      return `${monthlyGenAvg.toLocaleString('pt-BR')} kWh/mês`;
    case 'project.annualGen':
      return `${stats.totalGen.toLocaleString('pt-BR')} kWh/ano`;
    case 'project.coverage':
      return `${stats.coverage.toFixed(1).replace('.', ',')}%`;
    case 'project.economiaAno':
      return formatBRL(stats.economiaAno);
    case 'project.investment': {
      const total = (proposalData.lineItems ?? []).reduce((s, i) => s + (i.value ?? 0), 0);
      return total > 0 ? formatBRL(total) : '—';
    }

    // ── Proposta ──────────────────────────────────────────────────────────────
    case 'proposal.date':
      return formatDate(new Date());
    case 'proposal.dueDate': {
      const due = new Date();
      due.setDate(due.getDate() + (proposalData.validityDays ?? 15));
      return formatDate(due);
    }
    case 'proposal.validity':
      return `${proposalData.validityDays ?? 15} dias`;
    case 'proposal.engineer':
      return proposalData.engineerName || '—';
    case 'proposal.engineerCrea':
      return proposalData.engineerCrea || '—';
    case 'proposal.phone':
      return proposalData.contactPhone || '—';

    default:
      return `{{${field}}}`;
  }
}

// ─── Componente ────────────────────────────────────────────────────────────────

interface Props {
  element: CanvasElement;
}

export function PlaceholderElement({ element }: Props) {
  const data = useProposalPageData();
  const p    = element.props as Record<string, unknown>;

  const field      = String(p.field      ?? DEFAULT_PLACEHOLDER_FIELD) as PlaceholderField;
  const prefix     = String(p.prefix     ?? '');
  const suffix     = String(p.suffix     ?? '');
  const fontSize   = Number(p.fontSize   ?? 14);
  const fontWeight = Number(p.fontWeight ?? 400);
  const color      = String(p.color      ?? '#1a1a1a');
  const textAlign  = String(p.textAlign  ?? 'left') as React.CSSProperties['textAlign'];
  const italic     = Boolean(p.italic    ?? false);

  const value    = resolvePlaceholder(field, data);
  const fieldDef = PLACEHOLDER_FIELDS.find((f) => f.field === field);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        padding: '2px 4px',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      <span
        style={{
          fontSize,
          fontWeight,
          color,
          textAlign,
          fontStyle: italic ? 'italic' : 'normal',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          width: '100%',
          lineHeight: 1.35,
        }}
      >
        {prefix}{value}{suffix}
      </span>

      {/* Badge visível apenas no editor — oculto durante exportação PDF */}
      {!data.isExportingPdf && (
        <span
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            fontSize: 7,
            background: '#6366f1',
            color: '#fff',
            padding: '1px 4px',
            borderRadius: '0 0 3px 0',
            pointerEvents: 'none',
            opacity: 0.75,
            lineHeight: 1.5,
            userSelect: 'none',
          }}
        >
          {fieldDef?.label ?? field}
        </span>
      )}
    </div>
  );
}
