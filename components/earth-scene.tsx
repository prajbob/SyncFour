"use client"

import { useRef, useMemo, useEffect } from "react"
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber"
import { Stars } from "@react-three/drei"
import * as THREE from "three"

// Suppress THREE.Clock deprecation warning from @react-three/fiber internals
if (typeof window !== 'undefined') {
  const originalWarn = console.warn
  console.warn = (...args) => {
    if (args[0]?.includes?.('THREE.Clock') || (typeof args[0] === 'string' && args[0].includes('Clock'))) {
      return
    }
    originalWarn.apply(console, args)
  }
}

function Earth() {
  const earthRef = useRef<THREE.Mesh>(null)
  const atmosphereRef = useRef<THREE.Mesh>(null)
  
  // Load Earth texture from a reliable CDN
  const earthTexture = useLoader(
    THREE.TextureLoader, 
    "https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg"
  )
  
  const nightTexture = useLoader(
    THREE.TextureLoader,
    "https://unpkg.com/three-globe@2.31.1/example/img/earth-night.jpg"
  )
  
  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.015
    }
  })

  // Custom shader for day/night blending
  const earthMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: earthTexture },
        nightTexture: { value: nightTexture },
        sunDirection: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform vec3 sunDirection;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vec3 dayColor = texture2D(dayTexture, vUv).rgb;
          vec3 nightColor = texture2D(nightTexture, vUv).rgb;
          
          // Calculate sun intensity based on angle
          float intensity = dot(vNormal, sunDirection);
          
          // Smooth transition between day and night
          float dayNightMix = smoothstep(-0.2, 0.4, intensity);
          
          // Blend textures
          vec3 color = mix(nightColor * 1.2, dayColor, dayNightMix);
          
          // Add subtle ambient
          color += vec3(0.02, 0.03, 0.05);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    })
  }, [earthTexture, nightTexture])

  return (
    <group position={[2, -2, 0]}>
      {/* Main Earth */}
      <mesh ref={earthRef} rotation={[0.1, -0.5, 0.15]}>
        <sphereGeometry args={[3.5, 64, 64]} />
        <primitive object={earthMaterial} attach="material" />
      </mesh>
      
      {/* Atmosphere glow */}
      <mesh ref={atmosphereRef} rotation={[0.1, -0.5, 0.15]}>
        <sphereGeometry args={[3.7, 64, 64]} />
        <shaderMaterial
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          uniforms={{
            glowColor: { value: new THREE.Color("#4da8ff") },
          }}
          vertexShader={`
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 glowColor;
            varying vec3 vNormal;
            void main() {
              float intensity = pow(0.75 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
              gl_FragColor = vec4(glowColor, intensity * 0.6);
            }
          `}
        />
      </mesh>
      
      {/* Inner atmosphere for fresnel effect */}
      <mesh rotation={[0.1, -0.5, 0.15]}>
        <sphereGeometry args={[3.52, 64, 64]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          uniforms={{
            glowColor: { value: new THREE.Color("#87ceeb") },
          }}
          vertexShader={`
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              vViewPosition = -mvPosition.xyz;
              gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={`
            uniform vec3 glowColor;
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            void main() {
              vec3 viewDir = normalize(vViewPosition);
              float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);
              gl_FragColor = vec4(glowColor, fresnel * 0.3);
            }
          `}
        />
      </mesh>
    </group>
  )
}

function SunLight() {
  return (
    <>
      <directionalLight
        position={[10, 5, 8]}
        intensity={2.5}
        color="#fff8f0"
      />
      <directionalLight
        position={[-5, -2, -5]}
        intensity={0.2}
        color="#4da6ff"
      />
      <ambientLight intensity={0.08} />
    </>
  )
}

function Scene() {
  const { mouse } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        mouse.y * 0.03,
        0.02
      )
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        mouse.x * 0.03,
        0.02
      )
    }
  })

  return (
    <group ref={groupRef}>
      <Earth />
      <Stars
        radius={100}
        depth={50}
        count={4000}
        factor={4}
        saturation={0}
        fade
        speed={0.3}
      />
      <SunLight />
    </group>
  )
}

export default function EarthScene() {
  return (
    <div className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "radial-gradient(ellipse at 70% 40%, #0a1628 0%, #000000 100%)" }}
      >
        <Scene />
      </Canvas>
      
      {/* Cinematic overlays */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        {/* Subtle vignette */}
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 70% 50%, transparent 30%, rgba(0,0,0,0.5) 100%)"
          }}
        />
      </div>
    </div>
  )
}
