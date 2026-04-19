/**
 * =============================================================================
 * PROJECT SLICE — Estado Geométrico do Projeto (P10: InstallationArea Freeform)
 * =============================================================================
 *
 * Slice Zustand para dados geo-espaciais do projeto:
 * - Áreas de Instalação (InstallationArea) com vértices livres manipuláveis
 * - Módulos vinculados a Áreas por Offsets Locais (X/Y)
 * - Coordenadas absolutas em cache para performance do WebGL (ModuleMeshes)
 *
 * Entra no zundo parcializado — reversível via Ctrl+Z.
 * =============================================================================
 */

import { StateCreator } from 'zustand';
import { calcModulePolygon, type LatLngTuple } from '@/core/utils/geoUtils';

// =============================================================================
// TYPES
// =============================================================================

export type SurfaceType = 'ceramic' | 'metallic' | 'fibrocement' | 'slab' | 'ground' | 'carport';

export interface LocalVertex { x: number; y: number; }

export interface InstallationArea {
  id: string;
  center: LatLngTuple;     // Ponto pivô global no mapa
  azimuth: number;         // Rotação mecânica (0 a 360)
  pitch: number;           // Inclinação Z (default: 15)
  surfaceType: SurfaceType;

  // NÚCLEO FREEFORM — Offsets métricos relativos ao center [0,0]
  localVertices: LocalVertex[];

  placedModuleIds: string[]; // Relação Pai-Filho
}

export interface PlacedModule {
  id: string;
  moduleSpecId: string;
  areaId: string;        // Back-reference à InstallationArea pai
  offsetX_M: number;     // Posição local Relativa (X) do centro do painel 
  offsetY_M: number;     // Posição local Relativa (Y) do centro do painel

  // CACHE ABSOLUTO GEOGRÁFICO (Derivado quando a área move/gira)
  center: LatLngTuple;
  polygon: LatLngTuple[];
  axisAngle: number;
  widthM: number;
  heightM: number;

  stringData?: {
    inverterId: string;
    mpptId: number;
  };
}

export interface ProjectData {
  coordinates: { lat: number; lng: number } | null;
  zoom: number;
  installationAreas: InstallationArea[];
  placedModules: PlacedModule[];
  projectStatus: 'draft' | 'approved';
}

// =============================================================================
// INTERFACE
// =============================================================================

export interface ProjectSlice {
  project: ProjectData;

  setCoordinates: (lat: number, lng: number) => void;
  setZoom: (z: number) => void;

  // Áreas de Instalação (Freeform)
  spawnArea: (center: LatLngTuple, widthM?: number, heightM?: number, azimuth?: number) => void;
  spawnFreeformArea: (points: LatLngTuple[]) => void;
  updateArea: (id: string, data: Partial<Omit<InstallationArea, 'id' | 'placedModuleIds' | 'localVertices'>>) => void;
  deleteArea: (id: string) => void;
  clearAreas: () => void;
  duplicateArea: (id: string) => void;
  autoLayoutArea: (id: string) => void;
  resizeArea: (id: string, newWidthM: number, newHeightM: number) => void;

  // Vértices Freeform
  updateAreaVertex: (areaId: string, vertexIndex: number, x: number, y: number) => void;
  addAreaVertex: (areaId: string, afterIndex: number, x: number, y: number) => void;
  removeAreaVertex: (areaId: string, vertexIndex: number) => void;

  // Módulos
  placeModule: (areaId: string, offsetX: number, offsetY: number, moduleSpecId: string, widthM: number, heightM: number) => void;
  removePlacedModule: (id: string) => void;
  clearPlacedModules: () => void;

  // Elétrica & Status
  assignModulesToString: (moduleIds: string[], inverterId: string, mpptId: number) => void;
  approveProject: () => void;
  setProjectStatus: (status: 'draft' | 'approved') => void;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialProjectData: ProjectData = {
  coordinates: null,
  zoom: 19,
  installationAreas: [],
  placedModules: [],
  projectStatus: 'draft',
};

// =============================================================================
// HELPERS
// =============================================================================

let idCounter = 0;
const generateId = (prefix: string) => `${prefix}_${Date.now()}_${++idCounter}`;

/**
 * Gera 4 vértices retangulares a partir de widthM x heightM centralizados em [0,0].
 */
function verticesFromRect(widthM: number, heightM: number): LocalVertex[] {
  const hw = widthM / 2;
  const hh = heightM / 2;
  return [
    { x: -hw, y: -hh }, // bottom-left
    { x:  hw, y: -hh }, // bottom-right
    { x:  hw, y:  hh }, // top-right
    { x: -hw, y:  hh }, // top-left
  ];
}

/**
 * Calcula a bounding box dos vértices locais.
 */
function computeBounds(vertices: LocalVertex[]): { minX: number; maxX: number; minY: number; maxY: number; widthM: number; heightM: number } {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const v of vertices) {
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
  }
  return { minX, maxX, minY, maxY, widthM: maxX - minX, heightM: maxY - minY };
}

/**
 * Ray-Casting: Verifica se um ponto está dentro de um polígono.
 */
function isPointInPolygon(pt: LocalVertex, polygon: LocalVertex[]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    if (((yi > pt.y) !== (yj > pt.y)) && (pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Verifica se os 4 cantos de um retângulo estão dentro do polígono.
 */
function isRectInsidePolygon(cx: number, cy: number, hw: number, hh: number, polygon: LocalVertex[]): boolean {
  const corners: LocalVertex[] = [
    { x: cx - hw, y: cy - hh },
    { x: cx + hw, y: cy - hh },
    { x: cx + hw, y: cy + hh },
    { x: cx - hw, y: cy + hh },
  ];
  return corners.every(c => isPointInPolygon(c, polygon));
}

/**
 * Remove módulos que ficaram fora do polígono após edição de vértices.
 */
function cleanOrphanModules(
  placedModules: PlacedModule[],
  areaId: string,
  localVertices: LocalVertex[]
): { kept: PlacedModule[]; removedIds: string[] } {
  const kept: PlacedModule[] = [];
  const removedIds: string[] = [];

  for (const mod of placedModules) {
    if (mod.areaId !== areaId) {
      kept.push(mod);
      continue;
    }
    const hw = mod.widthM / 2;
    const hh = mod.heightM / 2;
    if (isRectInsidePolygon(mod.offsetX_M, mod.offsetY_M, hw, hh, localVertices)) {
      kept.push(mod);
    } else {
      removedIds.push(mod.id);
    }
  }

  return { kept, removedIds };
}

/** 
 * Recalcula as posições absolutas (GEO Cache) de um módulo baseado nas propriedades de sua área pai 
 */
function deriveAbsoluteModuleData(mod: PlacedModule, area: InstallationArea): PlacedModule {
  const earthRadius = 6378137;
  const latRads = area.center[0] * (Math.PI / 180);

  // Gira o offset (X,Y) pelo Azimute da área
  const angleRad = area.azimuth * (Math.PI / 180);
  const rotatedOffsetX = mod.offsetX_M * Math.cos(angleRad) - mod.offsetY_M * Math.sin(angleRad);
  const rotatedOffsetY = mod.offsetX_M * Math.sin(angleRad) + mod.offsetY_M * Math.cos(angleRad);

  // Converte offsets rotacionados em graus GPS
  const deltaLat = (rotatedOffsetY / earthRadius) * (180 / Math.PI);
  const deltaLng = (rotatedOffsetX / (earthRadius * Math.cos(latRads))) * (180 / Math.PI);

  const newCenter: LatLngTuple = [
    area.center[0] + deltaLat,
    area.center[1] + deltaLng
  ];

  const newPolygon = calcModulePolygon(newCenter, mod.widthM, mod.heightM, area.azimuth);

  return {
    ...mod,
    center: newCenter,
    polygon: newPolygon,
    axisAngle: area.azimuth
  };
}

// =============================================================================
// FACTORY
// =============================================================================

export const createProjectSlice: StateCreator<
  ProjectSlice,
  [],
  [],
  ProjectSlice
> = (set) => ({
  project: initialProjectData,

  setCoordinates: (lat, lng) => set((s) => ({
    project: { ...s.project, coordinates: { lat, lng } },
  })),

  setZoom: (z) => set((s) => ({
    project: { ...s.project, zoom: z },
  })),

  // ─── ÁREAS DE INSTALAÇÃO (FREEFORM CSG) ──────────────────────────────────────

  spawnArea: (center, widthM = 10, heightM = 5, azimuth = 0) => set((s) => {
    if (s.project.projectStatus === 'approved') return s;
    const newArea: InstallationArea = {
      id: generateId('area'),
      center,
      azimuth,
      pitch: 15,
      surfaceType: 'ceramic',
      localVertices: verticesFromRect(widthM, heightM),
      placedModuleIds: []
    };
    return { project: { ...s.project, installationAreas: [...s.project.installationAreas, newArea] } };
  }),
  
  spawnFreeformArea: (points) => set((s) => {
    if (s.project.projectStatus === 'approved' || points.length < 3) return s;
    
    // 1. Calcular Centro Pivo (Media)
    const latSum = points.reduce((acc, p) => acc + p[0], 0);
    const lngSum = points.reduce((acc, p) => acc + p[1], 0);
    const center: LatLngTuple = [latSum / points.length, lngSum / points.length];
    
    // 2. Converter LatLng -> Local XY (Meters)
    const earthRadius = 6378137;
    const latRads = center[0] * (Math.PI / 180);
    
    const localVertices: LocalVertex[] = points.map(p => {
      const dLat = p[0] - center[0];
      const dLng = p[1] - center[1];
      const y = dLat * (Math.PI / 180) * earthRadius;
      const x = dLng * (Math.PI / 180) * earthRadius * Math.cos(latRads);
      return { x, y };
    });
    
    const newArea: InstallationArea = {
      id: generateId('area_drawn'),
      center,
      azimuth: 0, // Desenho livre assume azimuth 0 inicial (vértices já contém a rotação)
      pitch: 15,
      surfaceType: 'ceramic',
      localVertices,
      placedModuleIds: []
    };
    
    return { project: { ...s.project, installationAreas: [...s.project.installationAreas, newArea] } };
  }),

  updateArea: (id, data) => set((s) => {
    if (s.project.projectStatus === 'approved') return s;

    const areaIndex = s.project.installationAreas.findIndex(a => a.id === id);
    if (areaIndex === -1) return s;

    const oldArea = s.project.installationAreas[areaIndex];
    const newArea = { ...oldArea, ...data };

    const newAreas = [...s.project.installationAreas];
    newAreas[areaIndex] = newArea;

    // Cascata O(1): Se centro ou azimute mudarem, recalcula módulos filhos
    const needsModuleRecalc = data.center || data.azimuth !== undefined;
    
    let newPlacedModules = s.project.placedModules;
    if (needsModuleRecalc && newArea.placedModuleIds.length > 0) {
      newPlacedModules = s.project.placedModules.map(mod => {
        if (mod.areaId === id) {
          return deriveAbsoluteModuleData(mod, newArea);
        }
        return mod;
      });
    }

    return { 
      project: { 
        ...s.project, 
        installationAreas: newAreas,
        placedModules: newPlacedModules
      } 
    };
  }),

  deleteArea: (id) => set((s) => {
    if (s.project.projectStatus === 'approved') return s;
    const area = s.project.installationAreas.find(a => a.id === id);
    if (!area) return s;

    return { 
      project: { 
        ...s.project, 
        installationAreas: s.project.installationAreas.filter(a => a.id !== id),
        placedModules: s.project.placedModules.filter(m => m.areaId !== id)
      } 
    };
  }),

  clearAreas: () => set((s) => {
    if (s.project.projectStatus === 'approved') return s;
    return { project: { ...s.project, installationAreas: [], placedModules: [] } };
  }),

  duplicateArea: (id) => set((s) => {
    if (s.project.projectStatus === 'approved') return s;
    const area = s.project.installationAreas.find(a => a.id === id);
    if (!area) return s;

    const newAreaId = generateId('area');
    
    // Offset de +2m no eixo X local para não sobrepor
    const earthRadius = 6378137;
    const latRads = area.center[0] * (Math.PI / 180);
    const offsetLng = (2 / (earthRadius * Math.cos(latRads))) * (180 / Math.PI);
    
    const clonedArea: InstallationArea = {
      ...area,
      id: newAreaId,
      center: [area.center[0], area.center[1] + offsetLng],
      localVertices: area.localVertices.map(v => ({ ...v })),
      placedModuleIds: [],
    };

    // Clonar módulos filhos com novos IDs
    const clonedModules: PlacedModule[] = [];
    const clonedModuleIds: string[] = [];

    for (const modId of area.placedModuleIds) {
      const origMod = s.project.placedModules.find(m => m.id === modId);
      if (!origMod) continue;
      const newModId = generateId('pm_dup');
      let cloned: PlacedModule = {
        ...origMod,
        id: newModId,
        areaId: newAreaId,
      };
      cloned = deriveAbsoluteModuleData(cloned, clonedArea);
      clonedModules.push(cloned);
      clonedModuleIds.push(newModId);
    }

    clonedArea.placedModuleIds = clonedModuleIds;

    return {
      project: {
        ...s.project,
        installationAreas: [...s.project.installationAreas, clonedArea],
        placedModules: [...s.project.placedModules, ...clonedModules],
      }
    };
  }),

  // ─── VÉRTICES FREEFORM ─────────────────────────────────────────────────────

  updateAreaVertex: (areaId, vertexIndex, x, y) => set((s) => {
    if (s.project.projectStatus === 'approved') return s;
    const areaIndex = s.project.installationAreas.findIndex(a => a.id === areaId);
    if (areaIndex === -1) return s;

    const area = s.project.installationAreas[areaIndex];
    if (vertexIndex < 0 || vertexIndex >= area.localVertices.length) return s;

    const newVertices = [...area.localVertices];
    newVertices[vertexIndex] = { x, y };

    const { kept, removedIds } = cleanOrphanModules(s.project.placedModules, areaId, newVertices);
    const newPlacedModuleIds = area.placedModuleIds.filter(id => !removedIds.includes(id));

    const newAreas = [...s.project.installationAreas];
    newAreas[areaIndex] = { ...area, localVertices: newVertices, placedModuleIds: newPlacedModuleIds };

    return { project: { ...s.project, installationAreas: newAreas, placedModules: kept } };
  }),

  addAreaVertex: (areaId, afterIndex, x, y) => set((s) => {
    if (s.project.projectStatus === 'approved') return s;
    const areaIndex = s.project.installationAreas.findIndex(a => a.id === areaId);
    if (areaIndex === -1) return s;

    const area = s.project.installationAreas[areaIndex];
    const newVertices = [...area.localVertices];
    newVertices.splice(afterIndex + 1, 0, { x, y });

    const newAreas = [...s.project.installationAreas];
    newAreas[areaIndex] = { ...area, localVertices: newVertices };

    return { project: { ...s.project, installationAreas: newAreas } };
  }),

  removeAreaVertex: (areaId, vertexIndex) => set((s) => {
    if (s.project.projectStatus === 'approved') return s;
    const areaIndex = s.project.installationAreas.findIndex(a => a.id === areaId);
    if (areaIndex === -1) return s;

    const area = s.project.installationAreas[areaIndex];
    // Guard: mínimo 3 vértices (triângulo)
    if (area.localVertices.length <= 3) return s;

    const newVertices = area.localVertices.filter((_, i) => i !== vertexIndex);

    const { kept, removedIds } = cleanOrphanModules(s.project.placedModules, areaId, newVertices);
    const newPlacedModuleIds = area.placedModuleIds.filter(id => !removedIds.includes(id));

    const newAreas = [...s.project.installationAreas];
    newAreas[areaIndex] = { ...area, localVertices: newVertices, placedModuleIds: newPlacedModuleIds };

    return { project: { ...s.project, installationAreas: newAreas, placedModules: kept } };
  }),

  resizeArea: (id, newWidthM, newHeightM) => set((s) => {
    if (s.project.projectStatus === 'approved') return s;
    const areaIndex = s.project.installationAreas.findIndex(a => a.id === id);
    if (areaIndex === -1) return s;

    const area = s.project.installationAreas[areaIndex];
    if (area.localVertices.length === 0) return s;

    const bounds = computeBounds(area.localVertices);
    if (bounds.widthM <= 0 || bounds.heightM <= 0) return s;

    const scaleX = newWidthM / bounds.widthM;
    const scaleY = newHeightM / bounds.heightM;

    const newVertices = area.localVertices.map(v => ({
      x: v.x * scaleX,
      y: v.y * scaleY
    }));

    const { kept, removedIds } = cleanOrphanModules(s.project.placedModules, id, newVertices);
    const newPlacedModuleIds = area.placedModuleIds.filter(modId => !removedIds.includes(modId));

    const newAreas = [...s.project.installationAreas];
    newAreas[areaIndex] = { ...area, localVertices: newVertices, placedModuleIds: newPlacedModuleIds };

    return { project: { ...s.project, installationAreas: newAreas, placedModules: kept } };
  }),

  // ─── AUTO-LAYOUT (GRID + RAYCASTING) ─────────────────────────────────────

  autoLayoutArea: (id) => set((s) => {
    if (s.project.projectStatus === 'approved') return s;
    const areaIndex = s.project.installationAreas.findIndex(a => a.id === id);
    if (areaIndex === -1) return s;
    const area = s.project.installationAreas[areaIndex];

    // Find the active module specification
    const stateAny = s as any;
    const entities = stateAny.modules?.entities || {};
    const modulesArr = Object.values(entities).filter(Boolean) as any[];
    if (modulesArr.length === 0) return s;
    
    // Calcula o Cap Lógico
    let totalLogicalQty = 0;
    for (const mod of modulesArr) {
      totalLogicalQty += (mod.quantity || 0);
    }

    if (totalLogicalQty === 0) {
      // Deixa o TopRibbon dar o alerta, mas no console também avisamos
      console.warn('AutoLayout abortado: totalLogicalQty é 0 na aba Componentes.');
      return s;
    }

    const activeSpec = modulesArr[0];
    
    const parseDims = (areaVal: number, dim: string) => {
      const match = dim.match(/(\d+)\s*x\s*(\d+)/i);
      if (match) {
        const w = parseInt(match[1], 10) / 1000;
        const h = parseInt(match[2], 10) / 1000;
        return { w: Math.max(w, h), h: Math.min(w, h) };
      }
      const hCalc = Math.sqrt(areaVal / 2);
      return { w: hCalc * 2, h: hCalc };
    };

    const { w: modW, h: modH } = parseDims(activeSpec.area, activeSpec.dimensions);
    
    // Módulos já existentes nesta área (para o Smart Fill)
    const existingModules = s.project.placedModules.filter(m => m.areaId === id);
    const existingOthers = s.project.placedModules.filter(m => m.areaId !== id);
    const maxNewModules = totalLogicalQty - existingOthers.length - existingModules.length;

    if (maxNewModules <= 0) return s;

    const margin = 0.05; // 5cm between panels

    // Calcular bounds do polígono freeform
    const bounds = computeBounds(area.localVertices);

    // Otimizador Portrait vs Landscape (Smart Fill)
    const tryLayout = (w: number, h: number): { count: number; modules: PlacedModule[]; ids: string[] } => {
      const eW = w + margin;
      const eH = h + margin;
      const cols = Math.floor(bounds.widthM / eW);
      const rows = Math.floor(bounds.heightM / eH);
      const startX = bounds.minX + eW / 2;
      const startY = bounds.minY + eH / 2;

      const mods: PlacedModule[] = [];
      const ids: string[] = [];
      let placedCount = 0;
      const halfW = w / 2;
      const halfH = h / 2;

      // Retorna true se retângulos se intersectam geometricamente
      const intersect = (cx1: number, cy1: number, w1: number, h1: number, cx2: number, cy2: number, w2: number, h2: number) => {
        return !(
          cx1 + w1/2 <= cx2 - w2/2 ||
          cx1 - w1/2 >= cx2 + w2/2 ||
          cy1 + h1/2 <= cy2 - h2/2 ||
          cy1 - h1/2 >= cy2 + h2/2
        );
      };

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (placedCount >= maxNewModules) break;

          const cx = startX + c * eW;
          const cy = startY + r * eH;
          
          // Smart Fill: Pular se colidir com algum painel *já existente* nesta área manualmente colocado
          let collides = false;
          for (const em of existingModules) {
            if (intersect(cx, cy, w, h, em.offsetX_M, em.offsetY_M, em.widthM, em.heightM)) {
              collides = true;
              break;
            }
          }
          if (collides) continue;

          // Ray-Casting: verificar se os 4 cantos do painel estão dentro do polígono
          if (isRectInsidePolygon(cx, cy, halfW, halfH, area.localVertices)) {
            const mId = generateId('pm_auto');
            let placed: PlacedModule = {
              id: mId,
              moduleSpecId: activeSpec.id,
              areaId: id,
              offsetX_M: cx,
              offsetY_M: cy,
              widthM: w,
              heightM: h,
              center: [0,0], polygon: [], axisAngle: 0
            };
            placed = deriveAbsoluteModuleData(placed, area);
            mods.push(placed);
            ids.push(mId);
            placedCount++;
          }
        }
        if (placedCount >= maxNewModules) break;
      }
      return { count: mods.length, modules: mods, ids };
    };

    // Testa Portrait e Landscape
    const portrait  = tryLayout(modW, modH);
    const landscape = tryLayout(modH, modW);
    const winner = landscape.count > portrait.count ? landscape : portrait;

    // Preserva os IDs e objetos existentes, adiciona os novos
    const newPlacedModuleIds = [...area.placedModuleIds, ...winner.ids];
    
    const newAreas = [...s.project.installationAreas];
    newAreas[areaIndex] = { ...area, placedModuleIds: newPlacedModuleIds };

    return {
      project: {
        ...s.project,
        installationAreas: newAreas,
        placedModules: [...s.project.placedModules, ...winner.modules]
      }
    };
  }),

  // ─── MODULES (RELATIVE OFFSETS) ────────────────────────────────────────────

  placeModule: (areaId, offsetX, offsetY, moduleSpecId, widthM, heightM) => set((s) => {
    if (s.project.projectStatus === 'approved') return s;
    
    // Check Manual Placement Cap
    const stateAny = s as any;
    const entities = stateAny.modules?.entities || {};
    const modulesArr = Object.values(entities).filter(Boolean) as any[];
    
    let totalLogicalQty = 0;
    for (const mod of modulesArr) {
      totalLogicalQty += (mod.quantity || 0);
    }
    const globalPlacedCount = s.project.placedModules.length;

    if (globalPlacedCount >= totalLogicalQty && totalLogicalQty > 0) {
      console.warn('placeModule abortado: cap lógico atingido.');
      return s;
    }

    const areaIndex = s.project.installationAreas.findIndex(a => a.id === areaId);
    if (areaIndex === -1) return s;
    const area = s.project.installationAreas[areaIndex];

    // Boundary check: verificar se o módulo cabe dentro do polígono
    const halfW = widthM / 2;
    const halfH = heightM / 2;
    if (!isRectInsidePolygon(offsetX, offsetY, halfW, halfH, area.localVertices)) {
      return s; // Módulo fora da área — ignorado
    }

    const moduleId = generateId('pm');

    let placed: PlacedModule = {
      id: moduleId,
      moduleSpecId,
      areaId,
      offsetX_M: offsetX,
      offsetY_M: offsetY,
      widthM,
      heightM,
      center: [0,0], polygon: [], axisAngle: 0
    };

    placed = deriveAbsoluteModuleData(placed, area);

    const newAreas = [...s.project.installationAreas];
    newAreas[areaIndex] = { ...area, placedModuleIds: [...area.placedModuleIds, moduleId] };

    return {
      project: {
        ...s.project,
        installationAreas: newAreas,
        placedModules: [...s.project.placedModules, placed],
      },
    };
  }),

  removePlacedModule: (id) => set((s) => {
    if (s.project.projectStatus === 'approved') return s;
    
    const mod = s.project.placedModules.find(x => x.id === id);
    if (!mod) return s;

    const newAreas = s.project.installationAreas.map(a => {
      if (a.id === mod.areaId) return { ...a, placedModuleIds: a.placedModuleIds.filter(x => x !== id) };
      return a;
    });

    return {
      project: {
        ...s.project,
        installationAreas: newAreas,
        placedModules: s.project.placedModules.filter((m) => m.id !== id),
      },
    };
  }),

  clearPlacedModules: () => set((s) => {
    if (s.project.projectStatus === 'approved') return s;
    
    const newAreas = s.project.installationAreas.map(a => ({ ...a, placedModuleIds: [] }));
    
    return {
      project: { ...s.project, installationAreas: newAreas, placedModules: [] },
    };
  }),

  // ─── STRINGING & STATUS ────────────────────────────────────────────────────

  assignModulesToString: (moduleIds, inverterId, mpptId) => set((s) => {
    if (s.project.projectStatus === 'approved') return s;
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

  setProjectStatus: (status) => set((s) => ({
    project: { ...s.project, projectStatus: status }
  })),
});
