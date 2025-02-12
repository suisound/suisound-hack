import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Canvas } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';

function ParticleField() {
    const prefersReducedMotion = useReducedMotion();
    const meshRef = useRef<THREE.Points>(null);
    const time = useRef(0);
    const geometryRef = useRef<THREE.BufferGeometry | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!meshRef.current) return;

        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(2000 * 3); // 2000 particles * 3 coordinates
        const colors = new Float32Array(2000 * 3); // 2000 particles * 3 color components
        const color = new THREE.Color();

        // Create a denser particle field with more variation
        const spread = 50;

        for (let i = 0; i < vertices.length; i += 3) {
            // Create a more organic distribution
            vertices[i] = (Math.random() - 0.5) * spread;
            vertices[i + 1] = (Math.random() - 0.5) * spread;
            vertices[i + 2] = (Math.random() - 0.5) * spread * 0.5;

            // Create a more sophisticated color gradient
            const hue = 0.75 + (Math.random() * 0.1); // Purple range
            const saturation = 0.6 + (Math.random() * 0.4); // More vibrant
            const lightness = 0.3 + (Math.random() * 0.3); // Varied brightness
            color.setHSL(hue, saturation, lightness);
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        geometryRef.current = geometry;
        meshRef.current.geometry = geometry;
        meshRef.current.material = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: isLoading ? 0 : 0.8,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
        });

        // Fade in the particles
        const fadeIn = () => {
            if (!meshRef.current?.material) return;
            (meshRef.current.material as THREE.PointsMaterial).opacity += 0.1;
            if ((meshRef.current.material as THREE.PointsMaterial).opacity < 0.8) {
                requestAnimationFrame(fadeIn);
            } else {
                setIsLoading(false);
            }
        };
        
        requestAnimationFrame(fadeIn);

        return () => {
            geometry.dispose();
            if (meshRef.current?.material) {
                (meshRef.current.material as THREE.PointsMaterial).dispose();
            }
        };
    }, []);

    useFrame(({ clock }) => {
        if (!meshRef.current || !geometryRef.current || prefersReducedMotion) return;

        time.current = clock.getElapsedTime() * 0.2;
        const positions = (geometryRef.current.getAttribute('position') as THREE.Float32BufferAttribute).array;

        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];

            // Combine multiple sine waves for more organic movement
            positions[i + 2] = z + Math.sin(x * 0.1 + time.current) * 0.1 +
                              Math.cos(y * 0.1 + time.current * 0.8) * 0.1;
            
            // Add subtle horizontal movement
            positions[i] = x + Math.sin(y * 0.05 + time.current * 0.3) * 0.05;
            
            // Add very subtle vertical drift
            positions[i + 1] = y + Math.cos(x * 0.05 + time.current * 0.2) * 0.05;
        }

        geometryRef.current.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={meshRef}>
            <pointsMaterial 
                size={0.15} 
                vertexColors 
                transparent 
                opacity={0.8} 
                sizeAttenuation 
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}

export default function ThreeBackground() {
    return (
        <div className="fixed inset-0 z-[--z-background]" aria-hidden="true">
            <Canvas
                camera={{ position: [0, 0, 30], fov: 60, near: 0.1, far: 1000 }}
                style={{ background: 'var(--bg-dark)' }}
            >
                <ambientLight intensity={0.5} />
                <ParticleField />
            </Canvas>
        </div>
    );
} 