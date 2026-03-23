/**
 * =============================================================================
 * MODULE MESHES — Renderização 3D dos Módulos Posicionados (P5-2)
 * =============================================================================
 *
 * Componente filho do <Canvas> R3F que renderiza os módulos posicionados
 * no mapa como retângulos 3D usando InstancedMesh.
 *
 * Performance:
 * - Lê placedModules via getState() no useFrame (zero subscrições React)
 * - InstancedMesh: 1 draw call para N módulos
 * - Atualiza matrizes apenas quando o array muda (comparação por length)
 * - Highlight do módulo selecionado via emissive color
 *
 * =============================================================================
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSolarStore } from '@/core/state/solarStore';
import { useUIStore } from '@/core/state/uiStore';
import { latLngToLocal } from '@/core/utils/geoProjection';

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_INSTANCES = 2000;

const STRING_COLORS = [
  0xf43f5e, // Rose (MPPT 1)
  0x8b5cf6, // Violet (MPPT 2)
  0x10b981, // Emerald (MPPT 3)
  0xf59e0b, // Amber (MPPT 4)
  0x0ea5e9, // Sky Blue (MPPT 5)
];

// =============================================================================
// COMPONENT
// =============================================================================

export const ModuleMeshes: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const prevCountRef = useRef(-1);
  const prevSelectedRef = useRef('');

  // Use a hash of stringData to smartly bust the frame loop cache when assignments happen
  const prevStringHashRef = useRef('');

  // Geometry and Material configuration
  const geometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(1, 1, 0.05); // Z-depth of 5cm
    geo.translate(0, 0, 0.025); // Set origin to bottom face
    return geo;
  }, []);

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.8,
  }), []);

  // Matriz temporária reutilizável
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  // Sync with Zustand at 60fps
  useFrame(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;

    const state = useSolarStore.getState();
    const coords = state.project.coordinates;
    const placed = state.project.placedModules;
    const selectedMultiIds = useUIStore.getState().selectedEntity.multiIds;

    const currentStringHash = placed.map(pm => pm.stringData ? `${pm.id}-${pm.stringData.mpptId}` : '').join('|');

    if (!coords || placed.length === 0) {
      // Esconder todas as instâncias
      mesh.count = 0;
      prevCountRef.current = 0;
      return;
    }

    const selectedJoined = selectedMultiIds.join(',');
    const count = placed.length;
    
    // Only update matrices and colors if count, selection, or string assignment changes
    if (count === prevCountRef.current && prevSelectedRef.current === selectedJoined && prevStringHashRef.current === currentStringHash) {
      return;
    }

    mesh.count = count;

    for (let i = 0; i < count; i++) {
      const pm = placed[i];
      
      // Conversão LatLng -> WebGL Local (metros)
      const localXY = latLngToLocal(coords, {
        lat: pm.center[0],
        lng: pm.center[1],
      });

      // Usa dimensões físicas reais do módulo (salvas em projectSlice)
      const w = pm.widthM;
      const h = pm.heightM;

      tempMatrix.identity();
      tempMatrix.makeRotationZ((pm.axisAngle * Math.PI) / 180);
      tempMatrix.setPosition(localXY.x, localXY.y, 0);
      tempMatrix.scale(new THREE.Vector3(w, h, 1));
      
      mesh.setMatrixAt(i, tempMatrix);

      // Hierarquia visual:
      // 1. Selecionado (Azul Claro Bright)
      // 2. Atribuído a um MPPT (Cor específica da String)
      // 3. Padrão não-atribuído (Azul Solar Escuro)
      if (selectedMultiIds.includes(pm.id)) {
        tempColor.set(0x4fc3f7);
      } else if (pm.stringData?.mpptId) {
        const mpptIndex = (pm.stringData.mpptId - 1) % STRING_COLORS.length;
        tempColor.set(STRING_COLORS[mpptIndex]);
      } else {
        tempColor.set(0x1e3a5f);
      }
      mesh.setColorAt(i, tempColor);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    prevCountRef.current = count;
    prevSelectedRef.current = selectedJoined;
    prevStringHashRef.current = currentStringHash;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, MAX_INSTANCES]}
      frustumCulled={false}
    />
  );
};
