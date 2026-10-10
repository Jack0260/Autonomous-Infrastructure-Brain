import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { EdgeNode, LiveTelemetry } from '@/types';

interface DigitalTwinSceneProps {
  nodes: EdgeNode[];
  telemetry: LiveTelemetry[];
  onNodeClick?: (nodeId: string) => void;
  selectedNodeId?: string | null;
}

const SECTOR_POSITIONS: Record<string, { x: number; z: number }> = {
  datacenter: { x: -6, z: -4 },
  factory: { x: 6, z: -4 },
  powergrid: { x: 0, z: 6 },
};

const SECTOR_COLORS: Record<string, number> = {
  datacenter: 0x22d3ee,
  factory: 0xf59e0b,
  powergrid: 0x10b981,
};

export function DigitalTwinScene({ nodes, telemetry, onNodeClick, selectedNodeId }: DigitalTwinSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const nodeMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const animationIdRef = useRef<number>(0);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      50, mount.clientWidth / mount.clientHeight, 0.1, 100
    );
    camera.position.set(12, 10, 12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0x475569, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 15, 10);
    scene.add(dirLight);

    const gridHelper = new THREE.GridHelper(24, 24, 0x334155, 0x1e293b);
    scene.add(gridHelper);

    const sectors = [
      { name: 'datacenter', label: 'Datacenter', ...SECTOR_POSITIONS.datacenter },
      { name: 'factory', label: 'Factory', ...SECTOR_POSITIONS.factory },
      { name: 'powergrid', label: 'Power Grid', ...SECTOR_POSITIONS.powergrid },
    ];

    sectors.forEach((sector) => {
      const ringGeom = new THREE.RingGeometry(3.5, 3.7, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: SECTOR_COLORS[sector.name],
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(sector.x, 0.01, sector.z);
      scene.add(ring);
    });

    nodes.forEach((node) => {
      const sectorPos = SECTOR_POSITIONS[node.sector] || { x: 0, z: 0 };
      const angle = Math.random() * Math.PI * 2;
      const radius = 1 + Math.random() * 2;
      const x = sectorPos.x + Math.cos(angle) * radius;
      const z = sectorPos.z + Math.sin(angle) * radius;

      const size = node.type === 'transformer' ? 0.6 : node.type === 'sensor' ? 0.25 : 0.4;
      const geom = new THREE.OctahedronGeometry(size, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.85,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(x, size + 0.5, z);
      mesh.userData = { nodeId: node.id, nodeName: node.name, sector: node.sector };
      scene.add(mesh);
      nodeMeshesRef.current.set(node.id, mesh);

      const haloGeom = new THREE.SphereGeometry(size * 1.8, 16, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.08,
      });
      const halo = new THREE.Mesh(haloGeom, haloMat);
      halo.position.copy(mesh.position);
      scene.add(halo);
      mesh.userData.halo = halo;
    });

    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let camAngleY = Math.atan2(camera.position.x, camera.position.z);
    let camAngleX = Math.atan2(
      Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2),
      camera.position.y
    );
    let camDist = camera.position.length();

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) {
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const meshes = Array.from(nodeMeshesRef.current.values());
        const intersects = raycaster.intersectObjects(meshes);
        if (intersects.length > 0) {
          const id = intersects[0].object.userData.nodeId as string;
          setHoveredNode(id);
          renderer.domElement.style.cursor = 'pointer';
        } else {
          setHoveredNode(null);
          renderer.domElement.style.cursor = isDragging ? 'grabbing' : 'grab';
        }
        return;
      }
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      camAngleY -= dx * 0.005;
      camAngleX = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, camAngleX - dy * 0.005));
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onPointerUp = () => { isDragging = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camDist = Math.max(5, Math.min(30, camDist + e.deltaY * 0.01));
    };
    const onClick = () => {
      if (hoveredNode && onNodeClick) onNodeClick(hoveredNode);
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('click', onClick);

    const animate = () => {
      camDist = Math.max(5, camDist);
      camera.position.x = camDist * Math.sin(camAngleY) * Math.sin(camAngleX);
      camera.position.y = camDist * Math.cos(camAngleX);
      camera.position.z = camDist * Math.cos(camAngleY) * Math.sin(camAngleX);
      camera.lookAt(0, 0, 0);

      nodeMeshesRef.current.forEach((mesh) => {
        mesh.rotation.y += 0.005;
        mesh.rotation.x += 0.002;
        if (mesh.userData.halo) {
          mesh.userData.halo.rotation.y -= 0.003;
        }
      });

      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      nodeMeshesRef.current.clear();
    };
  }, [nodes]);

  useEffect(() => {
    const telMap = new Map(telemetry.map((t) => [t.nodeId, t]));
    nodeMeshesRef.current.forEach((mesh, nodeId) => {
      const reading = telMap.get(nodeId);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const halo = mesh.userData.halo as THREE.Mesh | undefined;
      const haloMat = halo?.material as THREE.MeshBasicMaterial | undefined;

      if (!reading) {
        mat.color.setHex(0x10b981);
        mat.emissive.setHex(0x10b981);
        mat.emissiveIntensity = 0.3;
        if (haloMat) {
          haloMat.color.setHex(0x10b981);
          haloMat.opacity = 0.08;
        }
        return;
      }

      if (reading.isAnomalous && reading.anomalyScore > 0.8) {
        mat.color.setHex(0xef4444);
        mat.emissive.setHex(0xef4444);
        mat.emissiveIntensity = 0.6 + Math.sin(Date.now() * 0.005) * 0.2;
        if (haloMat) { haloMat.color.setHex(0xef4444); haloMat.opacity = 0.15; }
      } else if (reading.isAnomalous) {
        mat.color.setHex(0xf59e0b);
        mat.emissive.setHex(0xf59e0b);
        mat.emissiveIntensity = 0.4;
        if (haloMat) { haloMat.color.setHex(0xf59e0b); haloMat.opacity = 0.12; }
      } else {
        mat.color.setHex(0x10b981);
        mat.emissive.setHex(0x10b981);
        mat.emissiveIntensity = 0.25;
        if (haloMat) { haloMat.color.setHex(0x10b981); haloMat.opacity = 0.08; }
      }

      if (selectedNodeId === nodeId) {
        mat.emissiveIntensity = 0.8;
        const scale = 1.3;
        mesh.scale.set(scale, scale, scale);
      } else {
        mesh.scale.set(1, 1, 1);
      }
    });
  }, [telemetry, selectedNodeId]);

  const hoveredInfo = hoveredNode
    ? telemetry.find((t) => t.nodeId === hoveredNode)
    : null;
  const hoveredNodeData = hoveredNode
    ? nodes.find((n) => n.id === hoveredNode)
    : null;

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" style={{ minHeight: '400px' }} />

      {hoveredInfo && hoveredNodeData && (
        <div className="absolute top-4 left-4 atlas-card p-3 pointer-events-none animate-fade-in z-10 min-w-[200px]">
          <p className="text-sm font-semibold text-atlas-text">{hoveredNodeData.name}</p>
          <p className="text-xs text-atlas-text-secondary capitalize">{hoveredNodeData.type} - {hoveredNodeData.sector}</p>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <span className="text-atlas-text-secondary">Temp</span>
            <span className="text-atlas-text font-mono">{hoveredInfo.temperature}C</span>
            <span className="text-atlas-text-secondary">Vibration</span>
            <span className="text-atlas-text font-mono">{hoveredInfo.vibration}mm/s</span>
            <span className="text-atlas-text-secondary">Power</span>
            <span className="text-atlas-text font-mono">{hoveredInfo.power}W</span>
            <span className="text-atlas-text-secondary">Anomaly</span>
            <span className={`font-mono ${hoveredInfo.isAnomalous ? 'text-red-400' : 'text-emerald-400'}`}>
              {(hoveredInfo.anomalyScore * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 atlas-card p-3 z-10">
        <p className="text-xs text-atlas-text-secondary mb-2 font-medium">Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-xs text-atlas-text-secondary">Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span className="text-xs text-atlas-text-secondary">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500 animate-pulse" />
            <span className="text-xs text-atlas-text-secondary">Critical</span>
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 atlas-card px-3 py-2 z-10">
        <p className="text-xs text-atlas-text-secondary">Drag to rotate - Scroll to zoom - Click node for details</p>
      </div>
    </div>
  );
}
