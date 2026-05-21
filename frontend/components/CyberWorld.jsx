import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

const NODE_COLORS = {
  firewall: 0x00ff88, router: 0x00f0ff, server: 0x0088ff,
  database: 0xaa44ff, endpoint: 0xffcc00, cloud: 0x44aaff,
  iot: 0xff8800, attacker: 0xff2244, dmz: 0xff6600
};

const ATTACK_COLORS = {
  ddos: 0xff2200, bruteforce: 0xff8800, mitm: 0xaa00ff,
  malware: 0xff0055, ransomware: 0xff0000, portscan: 0x00ffff,
  phishing: 0xffff00, packetflood: 0xff6600
};

export default function CyberWorld({ nodes = [], connections = [], activeAttacks = [], onNodeClick, socket }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const composerRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const nodeMeshesRef = useRef(new Map());
  const connectionLinesRef = useRef(new Map());
  const particleSystemsRef = useRef([]);
  const attackEffectsRef = useRef([]);
  const rainRef = useRef(null);
  const cityGroupRef = useRef(null);
  const animFrameRef = useRef(null);

  const generateBuilding = useCallback((x, z, rng) => {
    const group = new THREE.Group();
    const height = rng() * 22 + 3;
    const w = rng() * 2.5 + 1.2;
    const d = rng() * 2.5 + 1.2;

    const geo = new THREE.BoxGeometry(w, height, d);
    const colorVal = rng();
    const baseColor = colorVal < 0.5 ? 0x040818 : colorVal < 0.8 ? 0x060a1a : 0x020610;
    const emissiveColor = colorVal < 0.3 ? 0x001020 : 0x000818;

    const mat = new THREE.MeshPhongMaterial({ color: baseColor, emissive: emissiveColor, shininess: 60 });
    const building = new THREE.Mesh(geo, mat);
    building.position.y = height / 2;
    building.castShadow = true;
    building.receiveShadow = true;
    group.add(building);

    const edgesGeo = new THREE.EdgesGeometry(geo);
    const neonChoice = rng();
    let edgeColor = neonChoice < 0.3 ? 0x00f0ff : neonChoice < 0.6 ? 0x0044ff : neonChoice < 0.8 ? 0x00ff44 : 0x4400ff;
    const edgeMat = new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: rng() * 0.4 + 0.15 });
    const edges = new THREE.LineSegments(edgesGeo, edgeMat);
    edges.position.y = height / 2;
    group.add(edges);

    const windowRows = Math.floor(height / 2.5);
    const windowCols = Math.floor(w / 0.7);
    for (let r = 0; r < windowRows; r++) {
      for (let c = 0; c < windowCols; c++) {
        if (rng() < 0.5) continue;
        const wGeo = new THREE.PlaneGeometry(0.25, 0.2);
        const wColor = rng() < 0.6 ? 0x88ccff : rng() < 0.8 ? 0xffee88 : 0x88ffaa;
        const wMat = new THREE.MeshBasicMaterial({ color: wColor, transparent: true, opacity: 0.7 + rng() * 0.3 });
        const wMesh = new THREE.Mesh(wGeo, wMat);
        wMesh.position.set(-w / 2 - 0.01, 1 + r * 2.2, -d / 2 + d * (c / windowCols) + 0.3);
        wMesh.rotation.y = -Math.PI / 2;
        group.add(wMesh);
      }
    }

    if (rng() < 0.2 && height > 12) {
      const antGeo = new THREE.CylinderGeometry(0.05, 0.05, 4, 4);
      const antMat = new THREE.MeshPhongMaterial({ color: 0x333344, emissive: 0x001122 });
      const antenna = new THREE.Mesh(antGeo, antMat);
      antenna.position.y = height + 2;
      group.add(antenna);
      const lightGeo = new THREE.SphereGeometry(0.12, 6, 6);
      const lightMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
      const blinkLight = new THREE.Mesh(lightGeo, lightMat);
      blinkLight.position.y = height + 4.1;
      blinkLight.userData.blink = true;
      group.add(blinkLight);
    }

    group.position.set(x, 0, z);
    return group;
  }, []);

  const createCity = useCallback((scene) => {
    const cityGroup = new THREE.Group();
    const gridSize = 18;
    const spacing = 9;
    let seed = 42;
    const rng = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };

    for (let gx = 0; gx < gridSize; gx++) {
      for (let gz = 0; gz < gridSize; gz++) {
        const distFromCenter = Math.sqrt(Math.pow(gx - gridSize / 2, 2) + Math.pow(gz - gridSize / 2, 2));
        if (rng() < 0.12 || distFromCenter < 2) continue;
        const x = (gx - gridSize / 2) * spacing;
        const z = (gz - gridSize / 2) * spacing;
        const building = generateBuilding(x, z, rng);
        cityGroup.add(building);
      }
    }

    const groundGeo = new THREE.PlaneGeometry(300, 300, 80, 80);
    const groundMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, color1: { value: new THREE.Color(0x001122) }, color2: { value: new THREE.Color(0x000510) } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float time; uniform vec3 color1; uniform vec3 color2; varying vec2 vUv;
        void main() {
          vec2 grid = fract(vUv * 30.0);
          float gx = smoothstep(0.0, 0.04, grid.x) * smoothstep(1.0, 0.96, grid.x);
          float gy = smoothstep(0.0, 0.04, grid.y) * smoothstep(1.0, 0.96, grid.y);
          float line = 1.0 - min(gx, gy);
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float pulse = sin(dist * 15.0 - time * 2.5) * 0.5 + 0.5;
          float fade = 1.0 - smoothstep(0.3, 0.5, dist);
          vec3 lineColor = mix(vec3(0.0, 0.3, 0.5), vec3(0.0, 0.8, 1.0), pulse) * fade;
          vec3 base = mix(color2, color1, fade * 0.3);
          gl_FragColor = vec4(mix(base, lineColor, line * 0.7), 1.0);
        }`,
      side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.userData.isGround = true;
    cityGroup.add(ground);

    const rimGeo = new THREE.RingGeometry(140, 145, 64);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0x003355, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.1;
    cityGroup.add(rim);

    scene.add(cityGroup);
    cityGroupRef.current = cityGroup;
    return groundMat;
  }, [generateBuilding]);

  const createNetworkNodes = useCallback((scene, nodes) => {
    nodeMeshesRef.current.forEach(m => scene.remove(m));
    nodeMeshesRef.current.clear();

    nodes.forEach(node => {
      const group = new THREE.Group();
      const color = NODE_COLORS[node.type] || 0x00f0ff;
      const pos = node.pos3d || { x: 0, y: 0, z: 0 };
      const scale = node.type === 'firewall' || node.type === 'router' ? 1.4 : 1.0;

      const sphereGeo = new THREE.SphereGeometry(1.2 * scale, 16, 12);
      const sphereMat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.6, transparent: true, opacity: 0.85, shininess: 120 });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      group.add(sphere);

      const haloGeo = new THREE.SphereGeometry(1.8 * scale, 12, 8);
      const haloMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.08, wireframe: true });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      group.add(halo);

      const ring1Geo = new THREE.RingGeometry(1.6 * scale, 1.8 * scale, 32);
      const ring1Mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
      const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
      ring1.rotation.x = Math.PI / 2;
      group.add(ring1);

      const ring2Geo = new THREE.RingGeometry(2.2 * scale, 2.35 * scale, 32);
      const ring2Mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
      const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
      ring2.rotation.x = Math.PI / 3;
      group.add(ring2);

      const pointLight = new THREE.PointLight(color, 1.5, 20);
      group.add(pointLight);

      group.position.set(pos.x * 1.2, 8 + scale * 2, pos.z * 1.2);
      group.userData = { nodeId: node.id, type: node.type, color, sphere, halo, ring1, ring2, pointLight, originalY: 8 + scale * 2, status: node.status };

      const pillarGeo = new THREE.CylinderGeometry(0.05, 0.3, 8, 6);
      const pillarMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25 });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.y = -5;
      group.add(pillar);

      scene.add(group);
      nodeMeshesRef.current.set(node.id, group);
    });
  }, []);

  const createConnections = useCallback((scene, nodes, connections) => {
    connectionLinesRef.current.forEach(obj => { scene.remove(obj.line); scene.remove(obj.particles); });
    connectionLinesRef.current.clear();

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    connections.forEach(conn => {
      const fromNode = nodeMap.get(conn.from);
      const toNode = nodeMap.get(conn.to);
      if (!fromNode || !toNode) return;

      const fromPos = new THREE.Vector3(fromNode.pos3d.x * 1.2, 9, fromNode.pos3d.z * 1.2);
      const toPos = new THREE.Vector3(toNode.pos3d.x * 1.2, 9, toNode.pos3d.z * 1.2);

      const isAttack = conn.protocol === 'ATTACK' || conn.protocol === 'C2-Channel';
      const lineColor = isAttack ? 0xff2244 : conn.protocol === 'IPSec-VPN' ? 0xaa44ff : 0x003344;

      const points = [];
      const midPoint = fromPos.clone().lerp(toPos, 0.5);
      midPoint.y += 5;
      for (let t = 0; t <= 20; t++) {
        const s = t / 20;
        const p = new THREE.Vector3().lerpVectors(fromPos, midPoint, s).lerp(toPos.clone().lerp(midPoint, 1 - s), s);
        points.push(p);
      }

      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: isAttack ? 0.6 : 0.25 });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);

      const particleCount = 8;
      const particlePositions = new Float32Array(particleCount * 3);
      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: isAttack ? 0xff4444 : 0x00aaff,
        size: isAttack ? 0.6 : 0.4,
        transparent: true, opacity: 0.9
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);

      connectionLinesRef.current.set(conn.id, { line, particles, points, particleOffsets: Array.from({ length: particleCount }, (_, i) => i / particleCount), speed: isAttack ? 0.8 : 0.3 + Math.random() * 0.4, particleCount });
    });
  }, []);

  const createRain = useCallback((scene) => {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 280;
      positions[i * 3 + 1] = Math.random() * 120;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 280;
      velocities[i] = 0.8 + Math.random() * 1.2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0x004466, size: 0.18, transparent: true, opacity: 0.5 });
    const rain = new THREE.Points(geo, mat);
    scene.add(rain);
    rainRef.current = { mesh: rain, velocities };
  }, []);

  const createAmbientParticles = useCallback((scene) => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = Math.random() * 60 + 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0x001133, size: 0.3, transparent: true, opacity: 0.6 });
    scene.add(new THREE.Points(geo, mat));
  }, []);

  const createAttackEffect = useCallback((attack) => {
    const scene = sceneRef.current;
    if (!scene) return;
    const targetMesh = nodeMeshesRef.current.get(attack.targetId);
    const sourceMesh = nodeMeshesRef.current.get(attack.sourceId);
    if (!targetMesh) return;

    const color = ATTACK_COLORS[attack.type] || 0xff2244;
    const effects = [];

    if (attack.type === 'ddos' || attack.type === 'packetflood') {
      const count = 400;
      const positions = new Float32Array(count * 3);
      const velocities = [];
      const origin = sourceMesh ? sourceMesh.position.clone() : new THREE.Vector3(0, 15, -100);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = origin.x + (Math.random() - 0.5) * 60;
        positions[i * 3 + 1] = origin.y + Math.random() * 20;
        positions[i * 3 + 2] = origin.z + (Math.random() - 0.5) * 60;
        const dir = targetMesh.position.clone().sub(origin).normalize();
        velocities.push(dir.clone().multiplyScalar(0.6 + Math.random() * 0.8).add(new THREE.Vector3((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2)));
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({ color, size: 0.5, transparent: true, opacity: 0.9 });
      const particles = new THREE.Points(geo, mat);
      scene.add(particles);
      effects.push({ type: 'ddos_particles', mesh: particles, velocities, positions, targetPos: targetMesh.position.clone(), startTime: Date.now() });
    }

    if (attack.type === 'bruteforce') {
      for (let b = 0; b < 8; b++) {
        const beamGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 6);
        const beamMat = new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.8 });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.copy(sourceMesh ? sourceMesh.position : new THREE.Vector3(0, 10, -80));
        scene.add(beam);
        effects.push({ type: 'beam', mesh: beam, target: targetMesh.position.clone(), delay: b * 200, startTime: Date.now() });
      }
    }

    if (attack.type === 'malware' || attack.type === 'ransomware') {
      const corruptCount = 120;
      const positions = new Float32Array(corruptCount * 3);
      const basePos = targetMesh.position;
      for (let i = 0; i < corruptCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 15;
        positions[i * 3] = basePos.x + Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.random() * 30;
        positions[i * 3 + 2] = basePos.z + Math.sin(angle) * radius;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({ color: 0xff0044, size: 0.7, transparent: true, opacity: 0 });
      const corrupt = new THREE.Points(geo, mat);
      scene.add(corrupt);
      effects.push({ type: 'malware_spread', mesh: corrupt, positions, startTime: Date.now(), basePos: basePos.clone(), radius: 0 });
    }

    if (attack.type === 'mitm') {
      const srcPos = sourceMesh ? sourceMesh.position.clone() : new THREE.Vector3(0, 10, -60);
      const interceptGeo = new THREE.OctahedronGeometry(3, 0);
      const interceptMat = new THREE.MeshBasicMaterial({ color: 0xaa00ff, wireframe: true, transparent: true, opacity: 0.7 });
      const interceptor = new THREE.Mesh(interceptGeo, interceptMat);
      const midPoint = srcPos.clone().lerp(targetMesh.position, 0.5);
      midPoint.y += 5;
      interceptor.position.copy(midPoint);
      scene.add(interceptor);
      effects.push({ type: 'mitm_node', mesh: interceptor, startTime: Date.now() });
    }

    if (attack.type === 'portscan') {
      const scanRingGeo = new THREE.RingGeometry(0.5, 1, 32);
      const scanMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
      const scanRing = new THREE.Mesh(scanRingGeo, scanMat);
      scanRing.position.copy(targetMesh.position);
      scanRing.rotation.x = Math.PI / 2;
      scene.add(scanRing);
      effects.push({ type: 'scan_ring', mesh: scanRing, startTime: Date.now() });
    }

    if (attack.type === 'phishing') {
      const portalGeo = new THREE.TorusGeometry(3, 0.3, 8, 32);
      const portalMat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.9 });
      const portal = new THREE.Mesh(portalGeo, portalMat);
      portal.position.copy(targetMesh.position).add(new THREE.Vector3(10, 5, 10));
      scene.add(portal);
      effects.push({ type: 'phishing_portal', mesh: portal, startTime: Date.now() });
    }

    attackEffectsRef.current.push({ attackId: attack.id, effects, startTime: Date.now() });

    if (targetMesh.userData.sphere) {
      targetMesh.userData.sphere.material.color.setHex(color);
      targetMesh.userData.sphere.material.emissive.setHex(color);
      targetMesh.userData.sphere.material.emissiveIntensity = 1.5;
    }
  }, []);

  const removeAttackEffect = useCallback((attackId) => {
    const scene = sceneRef.current;
    if (!scene) return;
    const idx = attackEffectsRef.current.findIndex(e => e.attackId === attackId);
    if (idx === -1) return;
    const { effects } = attackEffectsRef.current[idx];
    effects.forEach(e => { if (e.mesh) scene.remove(e.mesh); });
    attackEffectsRef.current.splice(idx, 1);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000510);
    scene.fog = new THREE.FogExp2(0x000820, 0.009);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(65, mount.clientWidth / mount.clientHeight, 0.1, 1500);
    camera.position.set(80, 70, 100);
    camera.lookAt(0, 10, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(mount.clientWidth, mount.clientHeight),
      0.9, 0.5, 0.65
    );
    composer.addPass(bloomPass);

    const vignettePass = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, offset: { value: 0.6 }, darkness: { value: 0.8 } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform sampler2D tDiffuse; uniform float offset; uniform float darkness; varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
          gl_FragColor = vec4(mix(color.rgb, vec3(0.0), dot(uv, uv) * darkness), color.a);
        }`
    });
    composer.addPass(vignettePass);
    composerRef.current = composer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 20;
    controls.maxDistance = 300;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.target.set(0, 5, 0);
    controlsRef.current = controls;

    const ambLight = new THREE.AmbientLight(0x000820, 0.8);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0x002244, 1.5);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.far = 300;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const neonPositions = [
      [-60, 5, -60, 0x00f0ff], [60, 5, -60, 0x0044ff], [-60, 5, 60, 0x00ff88], [60, 5, 60, 0x4400ff],
      [0, 8, -80, 0xff2244], [0, 5, 80, 0x00aaff]
    ];
    neonPositions.forEach(([x, y, z, color]) => {
      const light = new THREE.PointLight(color, 2, 80);
      light.position.set(x, y, z);
      scene.add(light);
    });

    const groundShaderMat = createCity(scene);
    createRain(scene);
    createAmbientParticles(scene);

    if (nodes.length > 0) createNetworkNodes(scene, nodes);
    if (connections.length > 0 && nodes.length > 0) createConnections(scene, nodes, connections);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const handleClick = (e) => {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const meshes = [];
      nodeMeshesRef.current.forEach(group => { meshes.push(group.children[0]); });
      const intersects = raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const group = hit.parent;
        if (group?.userData?.nodeId && onNodeClick) onNodeClick(group.userData.nodeId);
      }
    };
    mount.addEventListener('click', handleClick);

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const t = clockRef.current.getElapsedTime();
      const delta = clockRef.current.getDelta();

      controls.update();

      if (groundShaderMat) groundShaderMat.uniforms.time.value = t;

      nodeMeshesRef.current.forEach((group) => {
        const { sphere, halo, ring1, ring2, originalY, status } = group.userData;
        group.position.y = originalY + Math.sin(t * 1.2 + group.position.x) * 0.5;
        if (ring1) ring1.rotation.z = t * 0.8;
        if (ring2) ring2.rotation.y = t * -0.5;
        if (halo) halo.material.opacity = 0.04 + Math.sin(t * 2) * 0.03;
        if (sphere && status === 'under_attack') sphere.material.emissiveIntensity = 1 + Math.sin(t * 8) * 0.5;
      });

      connectionLinesRef.current.forEach((conn) => {
        const { particles, points, particleOffsets, speed, particleCount } = conn;
        const posAttr = particles.geometry.attributes.position;
        for (let i = 0; i < particleCount; i++) {
          particleOffsets[i] = (particleOffsets[i] + speed * delta * 0.15) % 1;
          const idx = Math.floor(particleOffsets[i] * (points.length - 1));
          const nextIdx = Math.min(idx + 1, points.length - 1);
          const frac = particleOffsets[i] * (points.length - 1) - idx;
          const p = points[idx].clone().lerp(points[nextIdx], frac);
          posAttr.setXYZ(i, p.x, p.y, p.z);
        }
        posAttr.needsUpdate = true;
      });

      if (rainRef.current) {
        const { mesh, velocities } = rainRef.current;
        const pos = mesh.geometry.attributes.position;
        for (let i = 0; i < velocities.length; i++) {
          let y = pos.getY(i) - velocities[i] * 0.4;
          if (y < 0) y = 100;
          pos.setY(i, y);
        }
        pos.needsUpdate = true;
      }

      attackEffectsRef.current.forEach((effectGroup) => {
        const elapsed = (Date.now() - effectGroup.startTime) / 1000;
        effectGroup.effects.forEach((e) => {
          if (!e.mesh) return;
          if (e.type === 'ddos_particles') {
            const pos = e.mesh.geometry.attributes.position;
            for (let i = 0; i < e.velocities.length; i++) {
              const curPos = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
              const toTarget = e.targetPos.clone().sub(curPos).normalize().multiplyScalar(0.3);
              curPos.add(e.velocities[i].clone().multiplyScalar(0.5)).add(toTarget);
              pos.setXYZ(i, curPos.x, curPos.y, curPos.z);
            }
            pos.needsUpdate = true;
            e.mesh.material.opacity = Math.max(0.2, 0.9 - elapsed * 0.03);
          }
          if (e.type === 'malware_spread') {
            e.mesh.material.opacity = Math.min(0.9, elapsed * 0.3);
            const pos = e.mesh.geometry.attributes.position;
            const spread = Math.min(30, elapsed * 5);
            for (let i = 0; i < 120; i++) {
              const angle = Math.random() * Math.PI * 2;
              pos.setX(i, e.basePos.x + Math.cos(angle) * spread * Math.random());
              pos.setZ(i, e.basePos.z + Math.sin(angle) * spread * Math.random());
            }
            pos.needsUpdate = true;
          }
          if (e.type === 'mitm_node') {
            e.mesh.rotation.y = elapsed * 1.5;
            e.mesh.rotation.x = elapsed * 0.7;
            e.mesh.material.opacity = 0.5 + Math.sin(elapsed * 3) * 0.3;
          }
          if (e.type === 'scan_ring') {
            const scale = 1 + elapsed * 3;
            e.mesh.scale.set(scale, scale, scale);
            e.mesh.material.opacity = Math.max(0, 0.8 - elapsed * 0.1);
          }
          if (e.type === 'phishing_portal') {
            e.mesh.rotation.z = elapsed * 1.2;
            e.mesh.material.opacity = 0.6 + Math.sin(elapsed * 4) * 0.3;
            e.mesh.position.y = 13 + Math.sin(elapsed * 1.5) * 2;
          }
          if (e.type === 'beam') {
            if ((Date.now() - effectGroup.startTime) > e.delay) {
              const t2 = ((Date.now() - effectGroup.startTime - e.delay) % 800) / 800;
              const start = e.mesh.position.clone();
              const end = e.target;
              const pos = start.lerp(end, t2);
              e.mesh.position.copy(pos);
              e.mesh.material.opacity = t2 < 0.5 ? t2 * 2 : (1 - t2) * 2;
            }
          }
        });
      });

      composer.render();
    };

    animate();

    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      composer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mount.removeEventListener('click', handleClick);
      cancelAnimationFrame(animFrameRef.current);
      controls.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current || nodes.length === 0) return;
    createNetworkNodes(sceneRef.current, nodes);
    if (connections.length > 0) createConnections(sceneRef.current, nodes, connections);
  }, [nodes, connections, createNetworkNodes, createConnections]);

  useEffect(() => {
    if (!socket) return;
    const handleAttackStart = (attack) => createAttackEffect(attack);
    const handleAttackEnd = ({ id }) => removeAttackEffect(id);
    const handleMalwareSpread = ({ newTarget, fromNode }) => {
      const targetMesh = nodeMeshesRef.current.get(newTarget);
      if (targetMesh?.userData?.sphere) {
        targetMesh.userData.sphere.material.color.setHex(0xff0044);
        targetMesh.userData.sphere.material.emissive.setHex(0xff0044);
        targetMesh.userData.sphere.material.emissiveIntensity = 1.2;
      }
    };
    const handleNodeHealth = ({ id, health, status }) => {
      const mesh = nodeMeshesRef.current.get(id);
      if (mesh?.userData?.sphere) {
        const h = health / 100;
        const c = new THREE.Color().setHSL(h * 0.3, 1, 0.5);
        if (status === 'active' || status === 'recovering') mesh.userData.sphere.material.color.setHex(NODE_COLORS[mesh.userData.type] || 0x00f0ff);
      }
    };
    socket.on('attack_started', handleAttackStart);
    socket.on('attack_ended', handleAttackEnd);
    socket.on('attack_stopped', ({ id }) => removeAttackEffect(id));
    socket.on('malware_spread', handleMalwareSpread);
    socket.on('node_health_update', handleNodeHealth);
    return () => {
      socket.off('attack_started', handleAttackStart);
      socket.off('attack_ended', handleAttackEnd);
      socket.off('malware_spread', handleMalwareSpread);
      socket.off('node_health_update', handleNodeHealth);
    };
  }, [socket, createAttackEffect, removeAttackEffect]);

  return <div ref={mountRef} className="w-full h-full" style={{ cursor: 'crosshair' }} />;
}
