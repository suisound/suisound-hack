'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise';

export default function BlobAnimation() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ 
            alpha: true,
            antialias: true 
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        containerRef.current.appendChild(renderer.domElement);

        // Create blob
        const geometry = new THREE.IcosahedronGeometry(1.5, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0x3b82f6,
            shininess: 50,
            transparent: true,
            opacity: 0.3,
            emissive: 0x3b82f6,
            emissiveIntensity: 0.2,
            wireframe: false,
            flatShading: true
        });

        const blob = new THREE.Mesh(geometry, material);
        scene.add(blob);

        // Create glow effect
        const glowGeometry = new THREE.IcosahedronGeometry(1.8, 32);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                coefficient: { value: 0.8 },
                color: { value: new THREE.Color(0x3b82f6) },
                power: { value: 1.5 },
            },
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float coefficient;
                uniform vec3 color;
                uniform float power;
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(coefficient - dot(vNormal, vec3(0.0, 0.0, 1.0)), power);
                    gl_FragColor = vec4(color, intensity * 0.5);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
        });

        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        scene.add(glowMesh);

        // Add lights
        const light1 = new THREE.DirectionalLight(0x3b82f6, 2);
        light1.position.set(0, 1, 0);
        scene.add(light1);

        const light2 = new THREE.DirectionalLight(0x8b5cf6, 2);
        light2.position.set(1, -1, 0);
        scene.add(light2);

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 2);
        scene.add(ambientLight);

        camera.position.z = 3;

        // Noise for animation
        const noise = new SimplexNoise();
        let time = 0;

        // Update colors to be more subtle
        const colors = [
            new THREE.Color(0x3b82f6).multiplyScalar(0.4),
            new THREE.Color(0x8b5cf6).multiplyScalar(0.4),
            new THREE.Color(0x6366f1).multiplyScalar(0.4)
        ];

        // In the animation loop, add color morphing
        let colorIndex = 0;

        // Animation
        const animate = () => {
            requestAnimationFrame(animate);
            time += 0.0003;

            // Simpler color transitions
            const nextColor = colors[(colorIndex + 1) % colors.length];
            material.color.lerp(nextColor, 0.003);
            material.emissive.lerp(nextColor, 0.003);

            if (material.color.equals(nextColor)) {
                colorIndex = (colorIndex + 1) % colors.length;
            }

            // Gentler vertex manipulation
            const positions = geometry.attributes.position;
            const vector = new THREE.Vector3();

            for (let i = 0; i < positions.count; i++) {
                vector.fromBufferAttribute(positions, i);
                const distance = vector.length();
                
                // Much subtler wave effect
                const noise1 = noise.noise3d(
                    vector.x + time,
                    vector.y + time,
                    vector.z
                ) * 0.03;
                
                vector.normalize();
                vector.multiplyScalar(distance + noise1);
                
                positions.setXYZ(i, vector.x, vector.y, vector.z);
            }

            positions.needsUpdate = true;

            // Very subtle rotation
            blob.rotation.x += 0.0001;
            blob.rotation.y += 0.0002;

            // Update glow
            glowMesh.rotation.x = blob.rotation.x;
            glowMesh.rotation.y = blob.rotation.y;

            renderer.render(scene, camera);
        };

        animate();

        // Handle resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            containerRef.current?.removeChild(renderer.domElement);
        };
    }, []);

    return (
        <div 
            ref={containerRef} 
            className="fixed top-0 left-0 w-full h-full -z-10"
        />
    );
} 