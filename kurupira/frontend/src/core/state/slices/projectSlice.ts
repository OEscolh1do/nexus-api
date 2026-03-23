/**
 * =============================================================================
 * PROJECT SLICE — Estado Geométrico do Projeto (PGFX-02 + GFX-05)
 * =============================================================================
 *
 * Slice Zustand para dados geo-espaciais do projeto:
 * - Coordenadas do sítio (lat/lng)
 * - Nível de zoom do mapa
 * - Polígono do telhado (vértices)
 * - Azimute derivado do telhado (aresta mais longa)
 * - Módulos posicionados no mapa (GFX-05)
 *
 * Este slice entra no zundo parcializado — mudanças de geometria
 * são reversíveis via Ctrl+Z.
 * =============================================================================
 */

import { StateCreator } from 'zustand';
import { calcRoofAzimuth, calcModulePolygon, type LatLngTuple } from '@/core/utils/geoUtils';

// =============================================================================
// TYPES
// =============================================================================

/** Instância de módulo posicionada no mapa */
export interface PlacedModule {
  id: string;
  /** ID do ModuleSpecs (referência ao modelo selecionado) */
  moduleSpecId: string;
  /** Ponto central [lat, lng] */
  center: LatLngTuple;
  /** 4 vértices do polígono rotacionado [lat, lng][] */
  polygon: LatLngTuple[];
  /** Ângulo de alinhamento em graus usado no posicionamento */
  axisAngle: number;
  /** Largura física do módulo em metros */
  widthM: number;
  /** Altura física do módulo em metros */
  heightM: number;
  /** Vínculo Elétrico (Fase P6) */
  stringData?: {
    inverterId: string;
    mpptId: number;
  };
}

export interface ProjectData {
  /** Coordenadas centrais do sítio (null = não definido ainda) */
  coordinates: { lat: number; lng: number } | null;
  /** Nível de zoom do mapa Leaflet (default: 19) */
  zoom: number;
  /** Vértices do polígono do telhado [lat, lng][] */
  roofPolygon: LatLngTuple[];
  /** Azimute físico do telhado em graus (derivado do polígono) */
  roofAzimuth: number | null;
  /** Módulos posicionados no mapa (GFX-05) */
  placedModules: PlacedModule[];
  /** Status do projeto (CRM P7-2). Se 'approved', congela a edição. */
  projectStatus: 'draft' | 'approved';
}

// =============================================================================
// INTERFACE
// =============================================================================

export interface ProjectSlice {
  /** Dados geométricos do projeto */
  project: ProjectData;

  /** Define as coordenadas centrais do sítio */
  setCoordinates: (lat: number, lng: number) => void;

  /** Define o nível de zoom do mapa */
  setZoom: (z: number) => void;

  /** Adiciona um vértice ao polígono do telhado */
  addRoofVertex: (point: LatLngTuple) => void;

  /** Define o polígono do telhado (substitui o existente) */
  setRoofPolygon: (poly: LatLngTuple[]) => void;

  /** Fecha o polígono e calcula o roofAzimuth */
  closeRoofPolygon: () => void;

  /** Limpa o polígono do telhado */
  clearRoofPolygon: () => void;

  /** Posiciona um módulo no mapa (GFX-05) */
  placeModule: (center: LatLngTuple, moduleSpecId: string, widthM: number, heightM: number) => void;

  /** Remove um módulo posicionado por ID */
  removePlacedModule: (id: string) => void;

  /** Limpa todos os módulos posicionados */
  clearPlacedModules: () => void;

  /** Atribui uma rede elétrica (String/MPPT) a um array de módulos físicos no telhado (Fase P6) */
  assignModulesToString: (moduleIds: string[], inverterId: string, mpptId: number) => void;

  /** Tranca o projeto e sincroniza status com o CRM (Fase P7-2) */
  approveProject: () => void;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialProjectData: ProjectData = {
  coordinates: null,
  zoom: 19,
  roofPolygon: [],
  roofAzimuth: null,
  placedModules: [],
  projectStatus: 'draft',
};

// =============================================================================
// HELPERS
// =============================================================================

let moduleCounter = 0;
const generateModuleId = () => `pm_${Date.now()}_${++moduleCounter}`;

// =============================================================================
// FACTORY
// =============================================================================

export const createProjectSlice: StateCreator<
  ProjectSlice,
  [],
  [],
  ProjectSlice
> = (set, get) => ({
  project: initialProjectData,

  setCoordinates: (lat, lng) => set((s) => ({
    project: { ...s.project, coordinates: { lat, lng } },
  })),

  setZoom: (z) => set((s) => ({
    project: { ...s.project, zoom: z },
  })),

  addRoofVertex: (point) => set((s) => {
    if (s.project.projectStatus !== 'draft') return s;
    return { project: { ...s.project, roofPolygon: [...s.project.roofPolygon, point] } };
  }),

  setRoofPolygon: (poly) => set((s) => {
    if (s.project.projectStatus !== 'draft') return s;
    return { project: { ...s.project, roofPolygon: poly } };
  }),

  closeRoofPolygon: () => set((s) => {
    if (s.project.projectStatus !== 'draft') return s;
    return {
      project: {
        ...s.project,
        roofAzimuth: calcRoofAzimuth(s.project.roofPolygon),
      }
    };
  }),

  clearRoofPolygon: () => set((s) => {
    if (s.project.projectStatus !== 'draft') return s;
    return { project: { ...s.project, roofPolygon: [], roofAzimuth: null } };
  }),

  placeModule: (center, moduleSpecId, widthM, heightM) => {
    const state = get();
    if (state.project.projectStatus !== 'draft') return;
    const axisAngle = state.project.roofAzimuth ?? 0;
    const polygon = calcModulePolygon(center, widthM, heightM, axisAngle);

    const placed: PlacedModule = {
      id: generateModuleId(),
      moduleSpecId,
      center,
      polygon,
      axisAngle,
      widthM,
      heightM,
    };

    set((s) => ({
      project: {
        ...s.project,
        placedModules: [...s.project.placedModules, placed],
      },
    }));
  },

  removePlacedModule: (id) => set((s) => {
    if (s.project.projectStatus !== 'draft') return s;
    return {
      project: {
        ...s.project,
        placedModules: s.project.placedModules.filter((m) => m.id !== id),
      },
    };
  }),

  clearPlacedModules: () => set((s) => {
    if (s.project.projectStatus !== 'draft') return s;
    return {
      project: { ...s.project, placedModules: [] },
    };
  }),

  assignModulesToString: (moduleIds, inverterId, mpptId) => set((s) => {
    if (s.project.projectStatus !== 'draft') return s;
    return {
      project: {
        ...s.project,
        placedModules: s.project.placedModules.map(m =>
          moduleIds.includes(m.id)
            ? { ...m, stringData: { inverterId, mpptId } }
            : m
        ),
      }
    };
  }),

  approveProject: () => set((s) => ({
    project: { ...s.project, projectStatus: 'approved' }
  })),
});
