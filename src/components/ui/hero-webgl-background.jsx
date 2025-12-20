import { useMemo, useRef, useState, Component } from "react";
import * as THREE from "three";
import { Canvas, createPortal, useFrame } from "@react-three/fiber";
import { Effects, useFBO } from "@react-three/drei";
import * as easing from "maath/easing";

import { cn } from "@/lib/utils";

// Error boundary to catch WebGL rendering errors
class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("WebGL Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

// Periodic noise shared across shaders
const periodicNoiseGLSL = /* glsl */ `
  float periodicNoise(vec3 p, float time) {
    float noise = 0.0;
    noise += sin(p.x * 2.0 + time) * cos(p.z * 1.5 + time);
    noise += sin(p.x * 3.2 + time * 2.0) * cos(p.z * 2.1 + time) * 0.6;
    noise += sin(p.x * 1.7 + time) * cos(p.z * 2.8 + time * 3.0) * 0.4;
    noise += sin(p.x * p.z * 0.5 + time * 2.0) * 0.3;
    return noise * 0.3;
  }
`;

// Depth-of-field points material
class DofPointsMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader: /* glsl */ `
        uniform sampler2D positions;
        uniform sampler2D initialPositions;
        uniform float uFocus;
        uniform float uFov;
        uniform float uBlur;
        uniform float uPointSize;
        varying float vDistance;
        varying float vPosY;
        varying vec3 vWorldPosition;
        varying vec3 vInitialPosition;
        void main() {
          vec3 pos = texture2D(positions, position.xy).xyz;
          vec3 initialPos = texture2D(initialPositions, position.xy).xyz;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          vDistance = abs(uFocus - -mvPosition.z);
          vPosY = pos.y;
          vWorldPosition = pos;
          vInitialPosition = initialPos;
          gl_PointSize = max(vDistance * uBlur * uPointSize, 3.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        uniform float uRevealFactor;
        uniform float uRevealProgress;
        uniform float uTime;
        varying float vDistance;
        varying float vPosY;
        varying vec3 vWorldPosition;
        varying vec3 vInitialPosition;
        uniform float uTransition;

        ${periodicNoiseGLSL}

        float sparkleNoise(vec3 seed, float time) {
          float hash = sin(seed.x * 127.1 + seed.y * 311.7 + seed.z * 74.7) * 43758.5453;
          hash = fract(hash);
          float slowTime = time * 1.0;
          float sparkle = 0.0;
          sparkle += sin(slowTime + hash * 6.28318) * 0.5;
          sparkle += sin(slowTime * 1.7 + hash * 12.56636) * 0.3;
          sparkle += sin(slowTime * 0.8 + hash * 18.84954) * 0.2;
          float hash2 = sin(seed.x * 113.5 + seed.y * 271.9 + seed.z * 97.3) * 37849.3241;
          hash2 = fract(hash2);
          float sparkleMask = sin(hash2 * 6.28318) * 0.7;
          sparkleMask += sin(hash2 * 12.56636) * 0.3;
          if (sparkleMask < 0.3) {
            sparkle *= 0.05;
          }
          float normalizedSparkle = (sparkle + 1.0) * 0.5;
          float smoothCurve = pow(normalizedSparkle, 4.0);
          float blendFactor = normalizedSparkle * normalizedSparkle;
          float finalBrightness = mix(normalizedSparkle, smoothCurve, blendFactor);
          finalBrightness = max(finalBrightness, 0.35);
          return finalBrightness;
        }

        void main() {
          float floorFactor = clamp(smoothstep(-1.0, 0.5, vPosY), 0.0, 1.0);
          float distanceFromCenter = length(vWorldPosition.xz);
          float noiseValue = periodicNoise(vInitialPosition * 4.0, 0.0);
          float revealThreshold = uRevealFactor + noiseValue * 0.3;
          float revealMask = 1.0 - smoothstep(revealThreshold - 0.2, revealThreshold + 0.1, distanceFromCenter);
          float sparkleBrightness = sparkleNoise(vInitialPosition, uTime);

          float d = length(gl_PointCoord - 0.5);
          float circleMask = 1.0 - smoothstep(0.45, 0.5, d);
          if (circleMask <= 0.0) discard;

          float alpha = (1.04 - clamp(vDistance, 0.0, 1.0)) *
                        clamp(smoothstep(-0.5, 0.25, vPosY), 0.0, 1.0) *
                        uOpacity *
                        revealMask *
                        uRevealProgress *
                        sparkleBrightness *
                        floorFactor *
                        circleMask;

          float stableAlpha = max(alpha, 0.15);
          gl_FragColor = vec4(vec3(3), mix(alpha, stableAlpha, clamp(uTransition, 0.0, 1.0)));
        }
      `,
      uniforms: {
        positions: { value: null },
        initialPositions: { value: null },
        uTime: { value: 0 },
        uFocus: { value: 5.1 },
        uFov: { value: 50 },
        uBlur: { value: 30 },
        uTransition: { value: 0.0 },
        uPointSize: { value: 2.0 },
        uOpacity: { value: 1.0 },
        uRevealFactor: { value: 0.0 },
        uRevealProgress: { value: 0.0 },
      },
      transparent: true,
      depthWrite: false,
    });
  }
}

// Generate initial positions on a plane
function getPlane(count, components, size = 512, scale = 1.0) {
  const length = count * components;
  const data = new Float32Array(length);
  for (let i = 0; i < count; i++) {
    const i4 = i * components;
    const x = (i % size) / (size - 1);
    const z = Math.floor(i / size) / (size - 1);
    data[i4 + 0] = (x - 0.5) * 2 * scale;
    data[i4 + 1] = 0;
    data[i4 + 2] = (z - 0.5) * 2 * scale;
    data[i4 + 3] = 1.0;
  }
  return data;
}

// Simulation material
class SimulationMaterial extends THREE.ShaderMaterial {
  constructor(scale = 10.0) {
    const positionsTexture = new THREE.DataTexture(
      getPlane(512 * 512, 4, 512, scale),
      512,
      512,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    positionsTexture.needsUpdate = true;

    super({
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform sampler2D positions;
        uniform float uTime;
        uniform float uNoiseScale;
        uniform float uNoiseIntensity;
        uniform float uTimeScale;
        uniform float uLoopPeriod;

        ${periodicNoiseGLSL}

        void main() {
          vec3 originalPos = texture2D(positions, vUv).xyz;
          float continuousTime = uTime * uTimeScale * (6.28318530718 / uLoopPeriod);
          vec3 noiseInput = originalPos * uNoiseScale;
          float displacementX = periodicNoise(noiseInput + vec3(0.0, 0.0, 0.0), continuousTime);
          float displacementY = periodicNoise(noiseInput + vec3(50.0, 0.0, 0.0), continuousTime + 2.094);
          float displacementZ = periodicNoise(noiseInput + vec3(0.0, 50.0, 0.0), continuousTime + 4.188);
          vec3 distortion = vec3(displacementX, displacementY, displacementZ) * uNoiseIntensity;
          vec3 finalPos = originalPos + distortion;
          gl_FragColor = vec4(finalPos, 1.0);
        }
      `,
      uniforms: {
        positions: { value: positionsTexture },
        uTime: { value: 0 },
        uNoiseScale: { value: 1.0 },
        uNoiseIntensity: { value: 0.5 },
        uTimeScale: { value: 1 },
        uLoopPeriod: { value: 24.0 },
      },
    });
  }
}

// Vignette shader
export const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    darkness: { value: 1.0 },
    offset: { value: 1.0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float darkness;
    uniform float offset;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - 0.5) * 2.0;
      float dist = dot(uv, uv);
      float vignette = 1.0 - smoothstep(offset, offset + darkness, dist);
      gl_FragColor = vec4(texel.rgb * vignette, texel.a);
    }
  `,
};

// Particles component
function Particles({
  speed,
  aperture,
  focus,
  size = 512,
  noiseScale = 1.0,
  noiseIntensity = 0.5,
  timeScale = 0.5,
  pointSize = 2.0,
  opacity = 1.0,
  planeScale = 1.0,
  useManualTime = false,
  manualTime = 0,
  introspect = false,
  ...props
}) {
  const revealStartTime = useRef(null);
  const [isRevealing, setIsRevealing] = useState(true);
  const revealDuration = 3.5;

  const simulationMaterial = useMemo(() => new SimulationMaterial(planeScale), [planeScale]);

  const target = useFBO(size, size, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
  });

  const dofPointsMaterial = useMemo(() => {
    const m = new DofPointsMaterial();
    m.uniforms.positions.value = target.texture;
    m.uniforms.initialPositions.value = simulationMaterial.uniforms.positions.value;
    return m;
  }, [simulationMaterial, target.texture]);

  const [scene] = useState(() => new THREE.Scene());
  const [camera] = useState(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1));
  const [positions] = useState(() => new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]));
  const [uvs] = useState(() => new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]));

  const particles = useMemo(() => {
    const length = size * size;
    const arr = new Float32Array(length * 3);
    for (let i = 0; i < length; i++) {
      const i3 = i * 3;
      arr[i3 + 0] = (i % size) / size;
      arr[i3 + 1] = i / size / size;
      arr[i3 + 2] = 0;
    }
    return arr;
  }, [size]);

  useFrame((state, delta) => {
    if (!dofPointsMaterial || !simulationMaterial) return;

    state.gl.setRenderTarget(target);
    state.gl.clear();
    state.gl.render(scene, camera);
    state.gl.setRenderTarget(null);

    const currentTime = useManualTime ? manualTime : state.clock.elapsedTime;

    if (revealStartTime.current === null) {
      revealStartTime.current = currentTime;
    }

    const revealElapsed = currentTime - revealStartTime.current;
    const revealProgress = Math.min(revealElapsed / revealDuration, 1.0);
    const easedProgress = 1 - Math.pow(1 - revealProgress, 3);
    const revealFactor = easedProgress * 4.0;

    if (revealProgress >= 1.0 && isRevealing) {
      setIsRevealing(false);
    }

    dofPointsMaterial.uniforms.uTime.value = currentTime;
    dofPointsMaterial.uniforms.uFocus.value = focus;
    dofPointsMaterial.uniforms.uBlur.value = aperture;

    easing.damp(dofPointsMaterial.uniforms.uTransition, "value", introspect ? 1.0 : 0.0, introspect ? 0.35 : 0.2, delta);

    simulationMaterial.uniforms.uTime.value = currentTime;
    simulationMaterial.uniforms.uNoiseScale.value = noiseScale;
    simulationMaterial.uniforms.uNoiseIntensity.value = noiseIntensity;
    simulationMaterial.uniforms.uTimeScale.value = timeScale * speed;

    dofPointsMaterial.uniforms.uPointSize.value = pointSize;
    dofPointsMaterial.uniforms.uOpacity.value = opacity;
    dofPointsMaterial.uniforms.uRevealFactor.value = revealFactor;
    dofPointsMaterial.uniforms.uRevealProgress.value = easedProgress;
  });

  return (
    <>
      {createPortal(
        <mesh material={simulationMaterial}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            <bufferAttribute attach="attributes-uv" args={[uvs, 2]} />
          </bufferGeometry>
        </mesh>,
        scene
      )}
      <points material={dofPointsMaterial} {...props}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
      </points>
    </>
  );
}

// Fallback background when WebGL fails
const FallbackBackground = ({ accentColors, gridOpacity }) => (
  <>
    <div
      className="absolute inset-0 opacity-70"
      style={{
        backgroundImage: `radial-gradient(circle at 30% 40%, ${accentColors.a}, transparent 35%), radial-gradient(circle at 75% 20%, ${accentColors.b}, transparent 30%), radial-gradient(circle at 60% 75%, ${accentColors.c}, transparent 35%)`,
      }}
    />
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "140px 140px",
        opacity: gridOpacity,
      }}
    />
  </>
);

// Main component
const HeroWebGLBackground = ({
  hovering = false,
  className,
  bgColor = "#000000",
  accentColors = {
    a: "rgba(16,185,129,0.18)",
    b: "rgba(59,130,246,0.12)",
    c: "rgba(16,185,129,0.1)",
  },
  gridOpacity = 0.35,
}) => {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 z-0 overflow-hidden", className)}
    >
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 40%, ${accentColors.a}, transparent 35%), radial-gradient(circle at 75% 20%, ${accentColors.b}, transparent 30%), radial-gradient(circle at 60% 75%, ${accentColors.c}, transparent 35%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "140px 140px",
          opacity: gridOpacity,
        }}
      />

      <WebGLErrorBoundary fallback={<FallbackBackground accentColors={accentColors} gridOpacity={gridOpacity} />}>
        <Canvas
          camera={{ position: [1.26, 2.66, -1.82], fov: 50, near: 0.01, far: 300 }}
          style={{ width: "100%", height: "100%" }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              console.warn('WebGL context lost');
            });
          }}
        >
          <color attach="background" args={[bgColor]} />
          <Particles
            speed={1.0}
            aperture={1.79} 
            focus={3.8}
            size={512}
            noiseScale={0.6}
            noiseIntensity={0.52}
            timeScale={1.0}
            pointSize={10.0}
            opacity={0.8}
            planeScale={10.0}
            useManualTime={false}
            manualTime={0}
            introspect={hovering}
          />
          <Effects multisampling={0} disableGamma>
            <shaderPass args={[VignetteShader]} uniforms-darkness-value={1.5} uniforms-offset-value={0.4} />
          </Effects>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
};

export default HeroWebGLBackground;
