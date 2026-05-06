import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function BankingScene3D() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x061f39, 0.035);

        const camera = new THREE.PerspectiveCamera(50, el.clientWidth / el.clientHeight, 0.1, 200);
        camera.position.set(0, 0, 12);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(el.clientWidth, el.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.4;
        renderer.setClearColor(0x061f39, 1);
        el.appendChild(renderer.domElement);

        // ── Lighting ──
        scene.add(new THREE.AmbientLight(0xffffff, 0.3));

        const dl = new THREE.DirectionalLight(0xd4a23c, 1.0);
        dl.position.set(6, 8, 6);
        scene.add(dl);

        const pl1 = new THREE.PointLight(0x0a6474, 2.5, 30);
        pl1.position.set(-6, 3, 4);
        scene.add(pl1);

        const pl2 = new THREE.PointLight(0xd4a23c, 2.0, 25);
        pl2.position.set(5, -2, 5);
        scene.add(pl2);

        const pl3 = new THREE.PointLight(0x0a6474, 1.5, 20);
        pl3.position.set(0, -5, 3);
        scene.add(pl3);

        const pl4 = new THREE.PointLight(0xd4a23c, 1.2, 18);
        pl4.position.set(-4, -3, 6);
        scene.add(pl4);

        // ── Materials ──
        const goldM = new THREE.MeshStandardMaterial({ color: 0xd4a23c, metalness: 0.95, roughness: 0.12 });
        const tealM = new THREE.MeshStandardMaterial({ color: 0x0a6474, metalness: 0.8, roughness: 0.2 });
        const navyM = new THREE.MeshPhysicalMaterial({ color: 0x082f54, metalness: 0.9, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 });
        const glassM = new THREE.MeshPhysicalMaterial({ color: 0xaaddee, metalness: 0.0, roughness: 0.05, transparent: true, opacity: 0.15, envMapIntensity: 2 });
        const coinEdgeM = new THREE.MeshStandardMaterial({ color: 0xc89530, metalness: 0.95, roughness: 0.15 });

        // ── Helper: rounded-rect card shape ──
        function makeCardShape(w: number, h: number, r: number) {
            const s = new THREE.Shape();
            s.moveTo(-w / 2 + r, -h / 2);
            s.lineTo(w / 2 - r, -h / 2);
            s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
            s.lineTo(w / 2, h / 2 - r);
            s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
            s.lineTo(-w / 2 + r, h / 2);
            s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
            s.lineTo(-w / 2, -h / 2 + r);
            s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
            return s;
        }

        // ── Credit Card 1 (large, right side) ──
        const card1 = new THREE.Group();
        const cGeo = new THREE.ExtrudeGeometry(makeCardShape(3.2, 2.0, 0.15), { depth: 0.04, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 3 });
        card1.add(new THREE.Mesh(cGeo, navyM));
        // chip
        const chip1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.02), goldM.clone());
        chip1.position.set(-0.85, 0.35, 0.05);
        card1.add(chip1);
        // chip lines
        for (let i = 0; i < 3; i++) {
            const cl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.008, 0.005), new THREE.MeshStandardMaterial({ color: 0xb8892e, metalness: 0.9, roughness: 0.2 }));
            cl.position.set(-0.85, 0.25 + i * 0.12, 0.06);
            card1.add(cl);
        }
        // contactless arcs
        for (let i = 0; i < 3; i++) {
            const arc = new THREE.Mesh(new THREE.TorusGeometry(0.06 + i * 0.04, 0.006, 8, 16, Math.PI * 0.7), goldM.clone());
            arc.position.set(-0.2, 0.35, 0.05);
            arc.rotation.z = -Math.PI / 4;
            card1.add(arc);
        }
        // card number dots
        for (let g = 0; g < 4; g++) {
            for (let d = 0; d < 4; d++) {
                const dot = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), goldM.clone());
                dot.position.set(-1.0 + g * 0.65 + d * 0.1, -0.15, 0.05);
                card1.add(dot);
            }
        }
        // CIM text line
        const cimLine = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.005), goldM.clone());
        cimLine.position.set(-0.85, -0.55, 0.05);
        card1.add(cimLine);
        // gold stripe at top
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.06, 0.01), goldM.clone());
        stripe.position.set(0, 0.85, 0.05);
        card1.add(stripe);

        card1.position.set(4.5, 0.5, -2);
        card1.rotation.set(0.15, -0.55, 0.08);
        scene.add(card1);

        // ── Credit Card 2 (smaller, left side) ──
        const card2 = new THREE.Group();
        const c2Geo = new THREE.ExtrudeGeometry(makeCardShape(2.4, 1.5, 0.12), { depth: 0.03, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 });
        card2.add(new THREE.Mesh(c2Geo, tealM.clone()));
        const chip2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.015), goldM.clone());
        chip2.position.set(-0.6, 0.25, 0.04);
        card2.add(chip2);
        const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 0.008), goldM.clone());
        stripe2.position.set(0, 0.6, 0.04);
        card2.add(stripe2);
        card2.position.set(-5.5, -1.5, -3);
        card2.rotation.set(-0.2, 0.6, -0.15);
        scene.add(card2);

        // ── Gold Coins ──
        const coins: THREE.Mesh[] = [];
        const coinPositions: [number, number, number, number, number][] = [
            [-3.5, 3, -4, 0.4, 0.06],
            [5, -3.5, -3, 0.35, 0.05],
            [-6, -0.5, -5, 0.5, 0.07],
            [3, 4, -5, 0.3, 0.05],
            [-2, -4.5, -4, 0.38, 0.06],
            [6.5, 2.5, -6, 0.45, 0.06],
            [-5, 4.5, -7, 0.32, 0.05],
        ];
        coinPositions.forEach(([x, y, z, r, h]) => {
            const coin = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 32), coinEdgeM.clone());
            coin.position.set(x, y, z);
            coin.rotation.x = Math.random() * Math.PI;
            coin.rotation.z = Math.random() * Math.PI;
            scene.add(coin);
            coins.push(coin);
        });

        // ── Shield (security) ──
        const shieldShape = new THREE.Shape();
        shieldShape.moveTo(0, 1.8);
        shieldShape.bezierCurveTo(0.6, 1.7, 1.2, 1.4, 1.2, 0.8);
        shieldShape.lineTo(1.2, 0);
        shieldShape.bezierCurveTo(1.2, -0.8, 0.6, -1.4, 0, -1.8);
        shieldShape.bezierCurveTo(-0.6, -1.4, -1.2, -0.8, -1.2, 0);
        shieldShape.lineTo(-1.2, 0.8);
        shieldShape.bezierCurveTo(-1.2, 1.4, -0.6, 1.7, 0, 1.8);

        const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 4 });
        const shieldMat = new THREE.MeshPhysicalMaterial({ color: 0x0a6474, metalness: 0.7, roughness: 0.2, transparent: true, opacity: 0.35, clearcoat: 0.8 });
        const shield = new THREE.Mesh(shieldGeo, shieldMat);
        shield.position.set(-4, 2, -8);
        shield.rotation.set(0.1, 0.3, 0);
        shield.scale.set(1.2, 1.2, 1.2);
        scene.add(shield);

        // Shield check-mark
        const checkShape = new THREE.Shape();
        checkShape.moveTo(-0.4, 0);
        checkShape.lineTo(-0.15, -0.35);
        checkShape.lineTo(0.45, 0.4);
        checkShape.lineTo(0.35, 0.5);
        checkShape.lineTo(-0.15, -0.1);
        checkShape.lineTo(-0.3, 0.1);
        const checkGeo = new THREE.ExtrudeGeometry(checkShape, { depth: 0.04, bevelEnabled: false });
        const checkMesh = new THREE.Mesh(checkGeo, goldM.clone());
        checkMesh.position.set(-4, 2, -7.85);
        checkMesh.rotation.set(0.1, 0.3, 0);
        checkMesh.scale.set(1.2, 1.2, 1.2);
        scene.add(checkMesh);

        // ── Orbiting Rings ──
        const rings: THREE.Mesh[] = [];
        const ringDefs: [number, number, number[], number[]][] = [
            [4.0, 0.03, [0, 0, -3], [Math.PI / 3, 0, 0]],
            [3.2, 0.025, [1, -0.5, -2], [Math.PI / 5, Math.PI / 6, 0]],
            [5.5, 0.02, [-0.5, 0.3, -5], [-Math.PI / 4, Math.PI / 4, Math.PI / 8]],
            [2.5, 0.035, [2, 1, -1], [Math.PI / 2.5, -Math.PI / 7, 0]],
            [6.5, 0.015, [0, 0, -8], [Math.PI / 6, Math.PI / 3, Math.PI / 5]],
        ];
        ringDefs.forEach(([r, t, pos, rot], i) => {
            const mat = i % 2 === 0 ? goldM.clone() : tealM.clone();
            const mesh = new THREE.Mesh(new THREE.TorusGeometry(r, t, 24, 128), mat);
            mesh.position.set(pos[0], pos[1], pos[2]);
            mesh.rotation.set(rot[0], rot[1], rot[2]);
            scene.add(mesh);
            rings.push(mesh);
        });

        // ── Glass Spheres ──
        const spheres: THREE.Mesh[] = [];
        const sDefs: [number, number, number, number][] = [
            [-3, 2, -2, 0.2], [4, -2, -1.5, 0.15], [-2, -3, -3, 0.25],
            [3, 3.5, -4, 0.18], [-5, -2.5, -5, 0.3], [2, -4, -3, 0.12],
            [5.5, 1, -4, 0.22], [-4.5, 4, -6, 0.16], [0, 5, -5, 0.2],
            [-1, -5, -4, 0.14], [6, -4, -6, 0.18], [-6, 0, -3, 0.13],
        ];
        sDefs.forEach(([x, y, z, s]) => {
            const m = new THREE.Mesh(new THREE.SphereGeometry(s, 20, 20), glassM.clone());
            m.position.set(x, y, z);
            scene.add(m);
            spheres.push(m);
        });

        // ── Octahedrons (fintech accent) ──
        const octas: THREE.Mesh[] = [];
        const octaDefs: [number, number, number, number][] = [
            [5, 3, -6, 0.25], [-3.5, -4, -5, 0.2], [7, -1, -7, 0.3],
            [-6.5, 3, -8, 0.22], [1, -6, -6, 0.18],
        ];
        octaDefs.forEach(([x, y, z, s]) => {
            const mat = new THREE.MeshPhysicalMaterial({ color: 0x0a6474, metalness: 0.6, roughness: 0.3, transparent: true, opacity: 0.2, clearcoat: 0.5 });
            const m = new THREE.Mesh(new THREE.OctahedronGeometry(s, 0), mat);
            m.position.set(x, y, z);
            scene.add(m);
            octas.push(m);
        });

        // ── Particles ──
        const pCount = 500;
        const pPos = new Float32Array(pCount * 3);
        const pSizes = new Float32Array(pCount);
        for (let i = 0; i < pCount; i++) {
            pPos[i * 3] = (Math.random() - 0.5) * 30;
            pPos[i * 3 + 1] = (Math.random() - 0.5) * 24;
            pPos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 3;
            pSizes[i] = Math.random() * 0.03 + 0.008;
        }
        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xd4a23c, size: 0.025, transparent: true, opacity: 0.6, sizeAttenuation: true }));
        scene.add(particles);

        // Second particle layer (teal, subtle)
        const p2Count = 300;
        const p2Pos = new Float32Array(p2Count * 3);
        for (let i = 0; i < p2Count; i++) {
            p2Pos[i * 3] = (Math.random() - 0.5) * 35;
            p2Pos[i * 3 + 1] = (Math.random() - 0.5) * 28;
            p2Pos[i * 3 + 2] = (Math.random() - 0.5) * 25 - 5;
        }
        const p2Geo = new THREE.BufferGeometry();
        p2Geo.setAttribute('position', new THREE.BufferAttribute(p2Pos, 3));
        const particles2 = new THREE.Points(p2Geo, new THREE.PointsMaterial({ color: 0x0a6474, size: 0.018, transparent: true, opacity: 0.4, sizeAttenuation: true }));
        scene.add(particles2);

        // ── Light trail rings (thin, glowing) ──
        const trails: THREE.Mesh[] = [];
        for (let i = 0; i < 6; i++) {
            const trailMat = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? 0xd4a23c : 0x0a6474,
                transparent: true,
                opacity: 0.08 + Math.random() * 0.06,
            });
            const trail = new THREE.Mesh(new THREE.TorusGeometry(7 + i * 1.5, 0.008, 8, 128), trailMat);
            trail.position.set((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, -10 - i * 2);
            trail.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            scene.add(trail);
            trails.push(trail);
        }

        // ── Mouse ──
        let mx = 0, my = 0;
        const onMouse = (e: MouseEvent) => {
            mx = (e.clientX / window.innerWidth) * 2 - 1;
            my = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', onMouse);

        // ── Animate ──
        const clock = new THREE.Clock();
        let raf: number;

        const animate = () => {
            raf = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();

            // Cards float
            card1.position.y = 0.5 + Math.sin(t * 0.4) * 0.3;
            card1.rotation.y = -0.55 + Math.sin(t * 0.25) * 0.12;
            card1.rotation.x = 0.15 + Math.cos(t * 0.3) * 0.06;

            card2.position.y = -1.5 + Math.sin(t * 0.35 + 1) * 0.25;
            card2.rotation.y = 0.6 + Math.sin(t * 0.2 + 2) * 0.1;

            // Coins spin
            coins.forEach((c, i) => {
                c.rotation.y += 0.008 + i * 0.002;
                c.position.y += Math.sin(t * 0.3 + i * 1.5) * 0.003;
            });

            // Shield float
            shield.position.y = 2 + Math.sin(t * 0.3) * 0.2;
            shield.rotation.y = 0.3 + Math.sin(t * 0.15) * 0.08;
            checkMesh.position.y = 2 + Math.sin(t * 0.3) * 0.2;
            checkMesh.rotation.y = 0.3 + Math.sin(t * 0.15) * 0.08;

            // Rings orbit
            rings.forEach((r, i) => {
                r.rotation.x += 0.0006 * (i + 1);
                r.rotation.z += 0.0003 * (i + 1);
                r.rotation.y += 0.0002 * (i + 1);
            });

            // Spheres drift
            spheres.forEach((s, i) => {
                s.position.y += Math.sin(t * 0.35 + i * 0.8) * 0.002;
                s.position.x += Math.cos(t * 0.2 + i * 0.6) * 0.001;
            });

            // Octahedrons rotate
            octas.forEach((o, i) => {
                o.rotation.x += 0.003 + i * 0.001;
                o.rotation.y += 0.002 + i * 0.0008;
                o.position.y += Math.sin(t * 0.25 + i) * 0.002;
            });

            // Light trails rotate slowly
            trails.forEach((tr, i) => {
                tr.rotation.x += 0.0003 * (i + 1);
                tr.rotation.y += 0.0002 * (i + 1);
            });

            // Particles rotate
            particles.rotation.y = t * 0.012;
            particles.rotation.x = t * 0.005;
            particles2.rotation.y = -t * 0.008;
            particles2.rotation.z = t * 0.003;

            // Pulsing lights
            pl1.intensity = 2.5 + Math.sin(t * 0.5) * 0.5;
            pl2.intensity = 2.0 + Math.cos(t * 0.4) * 0.4;

            // Mouse parallax
            camera.position.x += (mx * 0.8 - camera.position.x) * 0.015;
            camera.position.y += (my * 0.5 - camera.position.y) * 0.015;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        };
        animate();

        // ── Resize ──
        const onResize = () => {
            camera.aspect = el.clientWidth / el.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(el.clientWidth, el.clientHeight);
        };
        window.addEventListener('resize', onResize);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('mousemove', onMouse);
            window.removeEventListener('resize', onResize);
            if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
            renderer.dispose();
            scene.traverse((o) => {
                if (o instanceof THREE.Mesh) {
                    o.geometry.dispose();
                    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
                }
            });
            pGeo.dispose();
            p2Geo.dispose();
        };
    }, []);

    return <div ref={ref} className="absolute inset-0 w-full h-full" aria-hidden="true" />;
}
