import { 
    Activity, 
    Cable, 
    Mountain, 
    Sun, 
    Thermometer, 
    TrendingDown, 
    Wind, 
    Zap,
    Cloud
} from 'lucide-react';
import { LossProfile } from '../store/useTechStore';

export interface LossConfigItem {
    key: keyof LossProfile;
    label: string;
    icon: any;
    type: 'loss' | 'efficiency'; // 'loss' = subtracts from 100%, 'efficiency' = is the % itself (e.g. 98%)
    defaultValue: number;
    description: string;
}

export const LOSS_CONFIG: LossConfigItem[] = [
    // Environmental
    { 
        key: 'orientation', 
        label: 'Orientação', 
        icon: Sun, 
        type: 'loss', 
        defaultValue: 3.0,
        description: 'Perdas por desvio do azimute ideal.'
    },
    { 
        key: 'inclination', 
        label: 'Inclinação', 
        icon: TrendingDown, 
        type: 'loss', 
        defaultValue: 4.0,
        description: 'Perdas por desvio da inclinação ideal (Latitude).'
    },
    { 
        key: 'shading', 
        label: 'Sombreamento', 
        icon: Cloud, 
        type: 'loss', 
        defaultValue: 3.0,
        description: 'Perdas por sombras próximas (árvores, chaminés).'
    },
    { 
        key: 'horizon', 
        label: 'Horizonte', 
        icon: Mountain, 
        type: 'loss', 
        defaultValue: 2.0,
        description: 'Perdas por sombreamento do horizonte distante.'
    },
    { 
        key: 'temperature', 
        label: 'Temperatura', // Renamed from 'thermal' to match store key
        icon: Thermometer, 
        type: 'loss', 
        defaultValue: 4.4,
        description: 'Perdas térmicas devido ao aquecimento das células.'
    },
    { 
        key: 'soiling', 
        label: 'Sujeira', 
        icon: Wind, 
        type: 'loss', 
        defaultValue: 5.0,
        description: 'Perdas por acúmulo de poeira e detritos.'
    },
    
    // Electrical
    { 
        key: 'mismatch', 
        label: 'Mismatch', 
        icon: Activity, 
        type: 'loss', 
        defaultValue: 1.5,
        description: 'Perdas por diferença de potência entre módulos.'
    },
    { 
        key: 'dcCable', 
        label: 'Cabos CC', 
        icon: Cable, 
        type: 'loss', 
        defaultValue: 0.5,
        description: 'Queda de tensão no cabeamento de corrente contínua.'
    },
    { 
        key: 'acCable', 
        label: 'Cabos CA', 
        icon: Cable, 
        type: 'loss', 
        defaultValue: 1.0,
        description: 'Queda de tensão no cabeamento de corrente alternada.'
    },
    
    // Inverter
    { 
        key: 'inverterEfficiency', 
        label: 'Eficiência Inv.', 
        icon: Zap, 
        type: 'efficiency', 
        defaultValue: 98.0, 
        description: 'Eficiência de conversão DC/AC do inversor.'
    }
];
