'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function BackgroundAnimation() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        containerRef.current.appendChild(renderer.domElement);

        // Create particles
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 5000;
        const posArray = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 5;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        // Create material
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.005,
            color: '#3b82f6', // Tailwind blue-500
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        // Create mesh
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);
        camera.position.z = 2;

        // Mouse movement effect
        let mouseX = 0;
        let mouseY = 0;

        const handleMouseMove = (event: MouseEvent) => {
            mouseX = event.clientX / window.innerWidth - 0.5;
            mouseY = event.clientY / window.innerHeight - 0.5;
        };

        window.addEventListener('mousemove', handleMouseMove);

        // Animation
        const animate = () => {
            requestAnimationFrame(animate);

            particlesMesh.rotation.y += 0.001;
            particlesMesh.rotation.x += 0.001;

            // Mouse effect
            particlesMesh.rotation.x += mouseY * 0.01;
            particlesMesh.rotation.y += mouseX * 0.01;

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
            window.removeEventListener('mousemove', handleMouseMove);
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