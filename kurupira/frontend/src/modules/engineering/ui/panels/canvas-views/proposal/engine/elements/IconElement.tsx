/**
 * IconElement — ícone Lucide avulso, posicionável no canvas.
 * O nome do ícone é configurável via props. Suporta fundo colorido opcional.
 */
import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { CanvasElement } from '../types';

// Catálogo de ícones disponíveis — subconjunto curado para uso editorial.
// Chave = nome exibido no seletor; valor = componente Lucide.
export const ICON_CATALOG: Record<string, React.FC<{ size?: number; color?: string; strokeWidth?: number }>> = {
  Zap:           LucideIcons.Zap,
  Shield:        LucideIcons.Shield,
  ShieldCheck:   LucideIcons.ShieldCheck,
  Sparkles:      LucideIcons.Sparkles,
  Wrench:        LucideIcons.Wrench,
  ClipboardCheck:LucideIcons.ClipboardCheck,
  CheckCircle:   LucideIcons.CheckCircle,
  Check:         LucideIcons.Check,
  Star:          LucideIcons.Star,
  Heart:         LucideIcons.Heart,
  Leaf:          LucideIcons.Leaf,
  Globe:         LucideIcons.Globe,
  Sun:           LucideIcons.Sun,
  MapPin:        LucideIcons.MapPin,
  TrendingUp:    LucideIcons.TrendingUp,
  BarChart2:     LucideIcons.BarChart2,
  Award:         LucideIcons.Award,
  ThumbsUp:      LucideIcons.ThumbsUp,
  Users:         LucideIcons.Users,
  Building:      LucideIcons.Building,
  Phone:         LucideIcons.Phone,
  Mail:          LucideIcons.Mail,
  Calendar:      LucideIcons.Calendar,
  Clock:         LucideIcons.Clock,
  FileText:      LucideIcons.FileText,
  Info:          LucideIcons.Info,
  AlertCircle:   LucideIcons.AlertCircle,
  Lock:          LucideIcons.Lock,
  Unlock:        LucideIcons.Unlock,
  Settings:      LucideIcons.Settings,
  Cpu:           LucideIcons.Cpu,
  Layers:        LucideIcons.Layers,
  Tool:          LucideIcons.Wrench,  // alias
};

interface Props {
  element: CanvasElement;
}

export function IconElement({ element }: Props) {
  const p       = element.props as Record<string, unknown>;
  const name    = String(p.name    ?? 'Zap');
  const size    = Number(p.size    ?? 24);
  const color   = String(p.color   ?? '#10b981');
  const bgColor = String(p.bgColor ?? '');
  const bgRadius = Number(p.bgRadius ?? 4);

  const IconComponent = ICON_CATALOG[name] ?? LucideIcons.Zap;

  return (
    <div
      style={{
        width:          '100%',
        height:         '100%',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        backgroundColor: bgColor || undefined,
        borderRadius:   bgColor ? `${bgRadius}px` : undefined,
      }}
    >
      <IconComponent size={size} color={color} />
    </div>
  );
}
