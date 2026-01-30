/**
 * 3D Components for Puck Editor (PHASE-ED-04A)
 * 
 * React Three Fiber and Drei based 3D components for the DRAMAC CMS page builder.
 * These components provide immersive 3D experiences in the visual editor.
 */

"use client";

import React, { Suspense, useRef, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Text3D,
  Center,
  Float,
  Stars,
  useGLTF,
  Html,
  PerspectiveCamera,
} from "@react-three/drei";
import * as THREE from "three";
import type {
  Scene3DProps,
  ParticleBackgroundProps,
  FloatingCardsProps,
  GlobeVisualizationProps,
  Animated3DTextProps,
} from "@/types/puck";
import { cn } from "@/lib/utils";

// ============================================
// WebGL Support Check
// ============================================

function WebGLFallback({ message = "3D content requires WebGL" }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-full bg-muted/30 rounded-lg border border-dashed">
      <div className="text-center p-8">
        <div className="text-4xl mb-4">🎮</div>
        <p className="text-muted-foreground">{message}</p>
        <p className="text-xs text-muted-foreground mt-2">
          Please use a WebGL-enabled browser
        </p>
      </div>
    </div>
  );
}

function CanvasLoader() {
  return (
    <div className="flex items-center justify-center h-full bg-muted/10">
      <div className="animate-pulse flex flex-col items-center gap-2">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-sm text-muted-foreground">Loading 3D...</span>
      </div>
    </div>
  );
}

// ============================================
// Scene3D Component - 3D Model Viewer
// ============================================

interface ModelProps {
  url: string;
  autoRotate: boolean;
}

function Model({ url, autoRotate }: ModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Basic rotation animation
  useFrame((state, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
  });

  // For demo purposes, create a simple geometric shape
  // In production, this would load the GLTF model
  return (
    <group ref={groupRef}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#6366f1" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

function DemoModel({ autoRotate }: { autoRotate: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]}>
        <torusKnotGeometry args={[0.7, 0.25, 100, 16]} />
        <meshStandardMaterial 
          color="#6366f1" 
          metalness={0.7} 
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

function Scene3DContent({
  modelUrl,
  autoRotate = true,
  enableZoom = true,
  lighting = "studio",
  cameraPosition = "angle",
}: Scene3DProps) {
  const getCameraPosition = (): [number, number, number] => {
    switch (cameraPosition) {
      case "front": return [0, 0, 5];
      case "top": return [0, 5, 0];
      case "angle":
      default: return [3, 2, 3];
    }
  };

  const getLightingPreset = () => {
    switch (lighting) {
      case "ambient":
        return <ambientLight intensity={1} />;
      case "directional":
        return (
          <>
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <ambientLight intensity={0.2} />
          </>
        );
      case "dramatic":
        return (
          <>
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
            <pointLight position={[-10, -10, -10]} color="#6366f1" intensity={0.5} />
          </>
        );
      case "studio":
      default:
        return <Environment preset="studio" />;
    }
  };

  return (
    <>
      <PerspectiveCamera makeDefault position={getCameraPosition()} fov={50} />
      {getLightingPreset()}
      <Suspense fallback={null}>
        {modelUrl ? (
          <Model url={modelUrl} autoRotate={autoRotate} />
        ) : (
          <DemoModel autoRotate={autoRotate} />
        )}
      </Suspense>
      <OrbitControls enableZoom={enableZoom} enablePan={false} />
    </>
  );
}

export function Scene3DRender(props: Scene3DProps) {
  const {
    backgroundColor = "#1a1a2e",
    height = 400,
  } = props;

  const [hasWebGL, setHasWebGL] = useState(true);

  // Check WebGL support
  React.useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setHasWebGL(!!gl);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) {
    return (
      <div style={{ height }}>
        <WebGLFallback message="3D Model Viewer requires WebGL" />
      </div>
    );
  }

  return (
    <div 
      style={{ height, background: backgroundColor }} 
      className="rounded-lg overflow-hidden"
    >
      <Suspense fallback={<CanvasLoader />}>
        <Canvas>
          <Scene3DContent {...props} />
        </Canvas>
      </Suspense>
    </div>
  );
}

// ============================================
// ParticleBackground Component
// ============================================

function Particles({
  count,
  color,
  size,
  style,
  speed,
}: {
  count: number;
  color: string;
  size: number;
  style: string;
  speed: number;
}) {
  const mesh = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 10;
      pos[i + 1] = (Math.random() - 0.5) * 10;
      pos[i + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, [count]);

  useFrame((state, delta) => {
    if (!mesh.current) return;

    const positions = mesh.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count * 3; i += 3) {
      switch (style) {
        case "float":
          positions[i + 1] += Math.sin(state.clock.elapsedTime + i) * 0.001 * speed;
          break;
        case "swarm":
          positions[i] += Math.sin(state.clock.elapsedTime * speed + i) * 0.002;
          positions[i + 1] += Math.cos(state.clock.elapsedTime * speed + i) * 0.002;
          break;
        case "galaxy":
          const angle = state.clock.elapsedTime * 0.1 * speed;
          const radius = Math.sqrt(positions[i] ** 2 + positions[i + 2] ** 2);
          positions[i] = Math.cos(angle + i * 0.01) * radius;
          positions[i + 2] = Math.sin(angle + i * 0.01) * radius;
          break;
        case "snow":
          positions[i + 1] -= 0.01 * speed;
          if (positions[i + 1] < -5) positions[i + 1] = 5;
          break;
        case "rain":
          positions[i + 1] -= 0.05 * speed;
          if (positions[i + 1] < -5) positions[i + 1] = 5;
          break;
      }
    }
    
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

function ParticleBackgroundContent(props: ParticleBackgroundProps) {
  const {
    particleCount = 500,
    particleColor = "#ffffff",
    particleSize = 0.05,
    animationStyle = "float",
    speed = 1,
  } = props;

  return (
    <>
      <ambientLight intensity={0.5} />
      <Particles
        count={particleCount}
        color={particleColor}
        size={particleSize}
        style={animationStyle}
        speed={speed}
      />
      {animationStyle === "galaxy" && <Stars radius={100} depth={50} count={1000} factor={4} />}
    </>
  );
}

export function ParticleBackgroundRender(props: ParticleBackgroundProps) {
  const {
    backgroundColor = "#0a0a0f",
    height = 400,
  } = props;

  const [hasWebGL, setHasWebGL] = useState(true);

  React.useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setHasWebGL(!!gl);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) {
    return (
      <div style={{ height }}>
        <WebGLFallback message="Particle effects require WebGL" />
      </div>
    );
  }

  return (
    <div 
      style={{ height, background: backgroundColor }} 
      className="rounded-lg overflow-hidden"
    >
      <Suspense fallback={<CanvasLoader />}>
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <ParticleBackgroundContent {...props} />
        </Canvas>
      </Suspense>
    </div>
  );
}

// ============================================
// FloatingCards Component
// ============================================

interface FloatingCardProps {
  position: [number, number, number];
  title: string;
  description: string;
  image?: string;
  rotationIntensity: number;
  floatIntensity: number;
}

function FloatingCard({
  position,
  title,
  description,
  rotationIntensity,
  floatIntensity,
}: FloatingCardProps) {
  return (
    <Float
      speed={2}
      rotationIntensity={rotationIntensity}
      floatIntensity={floatIntensity}
    >
      <group position={position}>
        <mesh>
          <boxGeometry args={[2, 2.5, 0.1]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <Html
          transform
          occlude
          position={[0, 0, 0.06]}
          style={{
            width: "180px",
            padding: "16px",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div className="bg-white/90 backdrop-blur rounded-lg p-4 shadow-lg">
            <h3 className="font-semibold text-sm text-gray-900 mb-1">{title}</h3>
            <p className="text-xs text-gray-600">{description}</p>
          </div>
        </Html>
      </group>
    </Float>
  );
}

function FloatingCardsContent(props: FloatingCardsProps) {
  const {
    cards = [
      { title: "Card 1", description: "Description 1" },
      { title: "Card 2", description: "Description 2" },
      { title: "Card 3", description: "Description 3" },
    ],
    depth = 2,
    rotationIntensity = 0.5,
    floatIntensity = 0.5,
  } = props;

  const positions: [number, number, number][] = useMemo(() => {
    const count = cards.length;
    return cards.map((_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const radius = 3;
      return [
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius * (depth / 2),
      ] as [number, number, number];
    });
  }, [cards, depth]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      {cards.map((card, i) => (
        <FloatingCard
          key={i}
          position={positions[i]}
          title={card.title}
          description={card.description}
          image={card.image}
          rotationIntensity={rotationIntensity}
          floatIntensity={floatIntensity}
        />
      ))}
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
    </>
  );
}

export function FloatingCardsRender(props: FloatingCardsProps) {
  const {
    backgroundColor = "#f8fafc",
    height = 500,
  } = props;

  const [hasWebGL, setHasWebGL] = useState(true);

  React.useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setHasWebGL(!!gl);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) {
    return (
      <div style={{ height }}>
        <WebGLFallback message="3D cards require WebGL" />
      </div>
    );
  }

  return (
    <div 
      style={{ height, background: backgroundColor }} 
      className="rounded-lg overflow-hidden"
    >
      <Suspense fallback={<CanvasLoader />}>
        <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
          <FloatingCardsContent {...props} />
        </Canvas>
      </Suspense>
    </div>
  );
}

// ============================================
// GlobeVisualization Component
// ============================================

function Globe({
  texture,
  autoRotate,
  rotationSpeed,
}: {
  texture: string;
  autoRotate: boolean;
  rotationSpeed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * rotationSpeed * 0.5;
    }
  });

  const getGlobeMaterial = () => {
    switch (texture) {
      case "wireframe":
        return <meshBasicMaterial color="#6366f1" wireframe />;
      case "dots":
        return <pointsMaterial size={0.02} color="#6366f1" />;
      case "earth":
      default:
        return (
          <meshStandardMaterial
            color="#2563eb"
            metalness={0.3}
            roughness={0.7}
          />
        );
    }
  };

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 64]} />
      {getGlobeMaterial()}
    </mesh>
  );
}

function GlobeMarker({
  lat,
  lng,
  color = "#ef4444",
  label,
}: {
  lat: number;
  lng: number;
  color?: string;
  label?: string;
}) {
  // Convert lat/lng to 3D position on sphere
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const radius = 2.05;

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return (
    <group position={[x, y, z]}>
      <mesh>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {label && (
        <Html distanceFactor={10}>
          <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

function GlobeVisualizationContent(props: GlobeVisualizationProps) {
  const {
    texture = "earth",
    autoRotate = true,
    rotationSpeed = 1,
    markers = [],
  } = props;

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={0.8} />
      <Globe
        texture={texture}
        autoRotate={autoRotate}
        rotationSpeed={rotationSpeed}
      />
      {markers.map((marker, i) => (
        <GlobeMarker
          key={i}
          lat={marker.lat}
          lng={marker.lng}
          color={marker.color}
          label={marker.label}
        />
      ))}
      <OrbitControls enableZoom={true} enablePan={false} />
    </>
  );
}

export function GlobeVisualizationRender(props: GlobeVisualizationProps) {
  const {
    backgroundColor = "#0f172a",
    height = 500,
  } = props;

  const [hasWebGL, setHasWebGL] = useState(true);

  React.useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setHasWebGL(!!gl);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) {
    return (
      <div style={{ height }}>
        <WebGLFallback message="Globe visualization requires WebGL" />
      </div>
    );
  }

  return (
    <div 
      style={{ height, background: backgroundColor }} 
      className="rounded-lg overflow-hidden"
    >
      <Suspense fallback={<CanvasLoader />}>
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <GlobeVisualizationContent {...props} />
        </Canvas>
      </Suspense>
    </div>
  );
}

// ============================================
// Animated3DText Component
// ============================================

function AnimatedText({
  text,
  fontSize,
  color,
  metalness,
  roughness,
  depth,
  animationType,
}: {
  text: string;
  fontSize: number;
  color: string;
  metalness: number;
  roughness: number;
  depth: number;
  animationType: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    switch (animationType) {
      case "rotate":
        meshRef.current.rotation.y += delta * 0.5;
        break;
      case "float":
        meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2;
        break;
      case "pulse":
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
        meshRef.current.scale.setScalar(scale);
        break;
    }
  });

  // Simple 3D box as text placeholder (actual Text3D requires font loading)
  return (
    <Center>
      <group ref={meshRef}>
        <mesh>
          <boxGeometry args={[text.length * fontSize * 0.5, fontSize, depth]} />
          <meshStandardMaterial
            color={color}
            metalness={metalness}
            roughness={roughness}
          />
        </mesh>
        <Html
          transform
          position={[0, 0, depth / 2 + 0.01]}
          style={{
            fontSize: `${fontSize * 20}px`,
            fontWeight: "bold",
            color: "white",
            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {text}
        </Html>
      </group>
    </Center>
  );
}

function Animated3DTextContent(props: Animated3DTextProps) {
  const {
    text = "Hello 3D",
    fontSize = 1,
    color = "#6366f1",
    metalness = 0.5,
    roughness = 0.3,
    depth = 0.5,
    animationType = "rotate",
  } = props;

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, -5, -5]} intensity={0.3} color="#a855f7" />
      <AnimatedText
        text={text}
        fontSize={fontSize}
        color={color}
        metalness={metalness}
        roughness={roughness}
        depth={depth}
        animationType={animationType}
      />
      <OrbitControls enableZoom={false} />
    </>
  );
}

export function Animated3DTextRender(props: Animated3DTextProps) {
  const {
    backgroundColor = "#1e1b4b",
    height = 300,
  } = props;

  const [hasWebGL, setHasWebGL] = useState(true);

  React.useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setHasWebGL(!!gl);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) {
    return (
      <div style={{ height }}>
        <WebGLFallback message="3D text requires WebGL" />
      </div>
    );
  }

  return (
    <div 
      style={{ height, background: backgroundColor }} 
      className="rounded-lg overflow-hidden"
    >
      <Suspense fallback={<CanvasLoader />}>
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Animated3DTextContent {...props} />
        </Canvas>
      </Suspense>
    </div>
  );
}
