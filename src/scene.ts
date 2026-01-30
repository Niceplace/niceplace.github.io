import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

"use strict";

// === GLOBAL VARIABLES ===
let HEIGHT = window.innerHeight;
let WIDTH = window.innerWidth;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 1, 2000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('myCanvas') as HTMLCanvasElement,
    antialias: true,
    alpha: true
});
renderer.shadowMap.enabled = true;
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(WIDTH, HEIGHT);

// Lights
let ambientLight: THREE.AmbientLight;
let hemisphereLight: THREE.HemisphereLight;
let shadowLight: THREE.DirectionalLight;
let shadowLight2: THREE.DirectionalLight;

// Planet objects
let saturnPlanet: THREE.Object3D;
let marsPlanet: THREE.Object3D;
let saturnMaterial: THREE.MeshPhongMaterial; // For color animation

// Character arrays for orbiting
const characters: { mesh: THREE.Object3D; pivot: THREE.Object3D; speed: number }[] = [];

// Star objects
let closeStars: { mesh: THREE.Object3D; mat: THREE.MeshPhongMaterial };
let distantStars: THREE.Points;

// === UTILITY FUNCTIONS ===
function flipCoin(): number {
    const flip = Math.floor(Math.random() * 2);
    if (flip === 1) {
        return Math.ceil(Math.random() * -700) - 400;
    } else {
        return Math.ceil(Math.random() * 500) + 200;
    }
}

function handleWindowResize(): void {
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    // Update canvas size
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();

    // Recalculate planet positions for new window size
    updatePlanetPositions();
}

// Update planet positions based on current window size
function updatePlanetPositions(): void {
    const visibleHeight = 2 * 500 * Math.tan((60 * Math.PI) / 180 / 2);
    const visibleWidth = visibleHeight * (WIDTH / HEIGHT);

    // Saturn: bottom-left (10% from left, 10% from bottom)
    const saturnX = -visibleWidth * 0.4;
    const saturnY = -visibleHeight * 0.4;

    // Mars: upper-right (10% from right, 10% from top)
    const marsX = visibleWidth * 0.4;
    const marsY = visibleHeight * 0.4;

    if (saturnPlanet) {
        saturnPlanet.position.set(saturnX, saturnY, -100);
    }

    if (marsPlanet) {
        marsPlanet.position.set(marsX, marsY, -100);
    }
}

// === LIGHTING ===
function createLights(): void {
    ambientLight = new THREE.AmbientLight(0xE5D5D5);
    ambientLight.intensity = 0.5;
    hemisphereLight = new THREE.HemisphereLight(0x2F586D, 0x0E4A6D, 0.7);
    shadowLight = new THREE.DirectionalLight(0xE5CC20, 0.8);
    shadowLight2 = new THREE.DirectionalLight(0x136D69, 1);

    shadowLight.position.set(200, -350, 0);
    shadowLight2.position.set(-200, 500, 10);

    shadowLight.castShadow = true;
    shadowLight2.castShadow = true;

    shadowLight.shadow.camera.left = -1400;
    shadowLight.shadow.camera.right = 1400;
    shadowLight.shadow.camera.top = 1400;
    shadowLight.shadow.camera.bottom = -1400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    scene.add(ambientLight, hemisphereLight, shadowLight, shadowLight2);
}

// === BACKGROUND STARS ===
function createDistantStars(): THREE.Points {
    const particleCount = 10000;
    const geom = new THREE.BufferGeometry();
    const mat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1
    });

    const positions = new Float32Array(particleCount * 3);
    for (let p = 0; p < particleCount; p++) {
        positions[p * 3] = Math.random() * 3000 - 1500;
        positions[p * 3 + 1] = Math.random() * 3000 - 1500;
        positions[p * 3 + 2] = flipCoin();
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return new THREE.Points(geom, mat);
}

function createCloseStars(): { mesh: THREE.Object3D; mat: THREE.MeshPhongMaterial } {
    const mesh = new THREE.Object3D();
    const geom = new THREE.SphereGeometry(2, 6, 6);
    const mat = new THREE.MeshPhongMaterial({
        shininess: 100,
        specular: 0xffffff,
        transparent: true
    });

    const starCount = 155;
    for (let i = 0; i < starCount; i++) {
        const star = new THREE.Mesh(geom, mat.clone());
        star.position.x = Math.random() * (WIDTH + 1) - WIDTH / 2;
        star.position.y = Math.random() * (HEIGHT + 1) - HEIGHT / 2;
        star.position.z = Math.floor(Math.random() * (1200 - 1)) - 1500;
        star.scale.set(0.5, 0.5, 0.5);
        mesh.add(star);
    }

    return { mesh, mat };
}

function createCosmos(): void {
    distantStars = createDistantStars();
    closeStars = createCloseStars();
    closeStars.mesh.position.set(0, 0, 0);
    distantStars.position.set(0, 0, 0);  // distantStars IS the mesh, not an object with .mesh
    scene.add(distantStars, closeStars.mesh);
}

// === MARS PLANET (Upper Right) ===
function createMarsPlanet(): THREE.Object3D {
    const mesh = new THREE.Object3D();

    // Main sphere - reddish orange
    const marsGeom = new THREE.DodecahedronGeometry(40, 2);
    const marsMat = new THREE.MeshPhongMaterial({
        shininess: 15,
        color: 0xC1440E, // Mars red
        flatShading: true
    });
    const marsSphere = new THREE.Mesh(marsGeom, marsMat);
    marsSphere.receiveShadow = true;
    marsSphere.castShadow = true;
    mesh.add(marsSphere);

    // Add craters (slightly depressed darker spheres)
    const craterCount = 8;
    for (let i = 0; i < craterCount; i++) {
        const size = 5 + Math.random() * 10;
        const craterGeom = new THREE.SphereGeometry(size, 6, 6);
        const craterMat = new THREE.MeshPhongMaterial({
            shininess: 10,
            color: 0x8B3103, // Darker red-brown
            flatShading: true
        });
        const crater = new THREE.Mesh(craterGeom, craterMat);

        // Random position on sphere surface using spherical coordinates
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        const radius = 38; // Slightly inside the surface

        crater.position.x = radius * Math.sin(theta) * Math.cos(phi);
        crater.position.y = radius * Math.sin(theta) * Math.sin(phi);
        crater.position.z = radius * Math.cos(theta);

        mesh.add(crater);
    }

    // Small highlights
    for (let i = 0; i < 3; i++) {
        const highlightGeom = new THREE.SphereGeometry(8, 5, 5);
        const highlightMat = new THREE.MeshPhongMaterial({
            shininess: 20,
            color: 0xE77D11, // Orange highlight
            flatShading: true
        });
        const highlight = new THREE.Mesh(highlightGeom, highlightMat);

        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        const radius = 39;

        highlight.position.x = radius * Math.sin(theta) * Math.cos(phi);
        highlight.position.y = radius * Math.sin(theta) * Math.sin(phi);
        highlight.position.z = radius * Math.cos(theta);

        mesh.add(highlight);
    }

    return mesh;
}

// === SATURN PLANET (Bottom Left) ===
function createSaturnPlanet(): THREE.Object3D {
    const mesh = new THREE.Object3D();

    // Main sphere - will have animated color
    const saturnGeom = new THREE.DodecahedronGeometry(70, 2);
    saturnMaterial = new THREE.MeshPhongMaterial({
        shininess: 25,
        color: 0xFF6B9D, // Start with pink
        flatShading: true
    });
    const saturnSphere = new THREE.Mesh(saturnGeom, saturnMaterial);
    saturnSphere.receiveShadow = true;
    saturnSphere.castShadow = true;
    mesh.add(saturnSphere);

    // Ring system
    const ringGeom = new THREE.RingGeometry(85, 110, 32);
    const pos = ringGeom.attributes.position;
    const uv = ringGeom.attributes.uv;

    // Fix UV mapping for ring
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const radius = Math.sqrt(x * x + y * y);
        uv.setXY(i, (radius - 85) / 25, 0);
    }

    const ringMat = new THREE.MeshPhongMaterial({
        shininess: 30,
        color: 0x4ECDC4, // Turquoise
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        flatShading: true
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2.5; // Tilt the ring
    mesh.add(ring);

    // Add a second inner ring for detail
    const innerRingGeom = new THREE.RingGeometry(75, 82, 24);
    const innerRingMat = new THREE.MeshPhongMaterial({
        shininess: 30,
        color: 0xFFB347, // Amber accent
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
        flatShading: true
    });
    const innerRing = new THREE.Mesh(innerRingGeom, innerRingMat);
    innerRing.rotation.x = Math.PI / 2.5;
    mesh.add(innerRing);

    return mesh;
}

// === SPACE HELMET (for characters) ===
function createSpaceHelmet(): THREE.Object3D {
    const helmet = new THREE.Object3D();

    // Transparent dome
    const domeGeom = new THREE.IcosahedronGeometry(8, 1);
    const domeMat = new THREE.MeshPhongMaterial({
        shininess: 100,
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    const dome = new THREE.Mesh(domeGeom, domeMat);
    helmet.add(dome);

    // Ring at base
    const ringGeom = new THREE.TorusGeometry(7, 1, 8, 16);
    const ringMat = new THREE.MeshPhongMaterial({
        shininess: 80,
        color: 0xFFB347, // Amber
        flatShading: true
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -5;
    helmet.add(ring);

    return helmet;
}

// === PENGUIN CHARACTER ===
function createPenguin(): THREE.Object3D {
    const mesh = new THREE.Object3D();

    // Body - black flattened sphere
    const bodyGeom = new THREE.DodecahedronGeometry(6, 0);
    bodyGeom.scale(1, 1.3, 0.8);
    const bodyMat = new THREE.MeshPhongMaterial({
        shininess: 30,
        color: 0x1a1a1a, // Black
        flatShading: true
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.castShadow = true;
    mesh.add(body);

    // Belly - white
    const bellyGeom = new THREE.SphereGeometry(4, 8, 8);
    bellyGeom.scale(1, 1.2, 0.5);
    const bellyMat = new THREE.MeshPhongMaterial({
        shininess: 30,
        color: 0xffffff,
        flatShading: true
    });
    const belly = new THREE.Mesh(bellyGeom, bellyMat);
    belly.position.z = 3;
    belly.position.y = -1;
    mesh.add(belly);

    // Beak - orange cone
    const beakGeom = new THREE.ConeGeometry(1.5, 3, 6);
    const beakMat = new THREE.MeshPhongMaterial({
        shininess: 50,
        color: 0xFF6600, // Orange
        flatShading: true
    });
    const beak = new THREE.Mesh(beakGeom, beakMat);
    beak.position.z = 5;
    beak.position.y = 1;
    beak.rotation.x = Math.PI / 2;
    mesh.add(beak);

    // Eyes
    for (let side of [-1, 1]) {
        const eyeWhiteGeom = new THREE.SphereGeometry(1.2, 6, 6);
        const eyeWhiteMat = new THREE.MeshPhongMaterial({
            shininess: 50,
            color: 0xffffff,
            flatShading: true
        });
        const eyeWhite = new THREE.Mesh(eyeWhiteGeom, eyeWhiteMat);
        eyeWhite.position.set(side * 2, 3, 4);
        mesh.add(eyeWhite);

        const eyePupilGeom = new THREE.SphereGeometry(0.6, 6, 6);
        const eyePupilMat = new THREE.MeshPhongMaterial({
            shininess: 30,
            color: 0x000000,
            flatShading: true
        });
        const eyePupil = new THREE.Mesh(eyePupilGeom, eyePupilMat);
        eyePupil.position.set(side * 2, 3, 4.8);
        mesh.add(eyePupil);
    }

    // Flippers
    for (let side of [-1, 1]) {
        const flipperGeom = new THREE.SphereGeometry(2, 6, 6);
        flipperGeom.scale(0.3, 1, 0.6);
        const flipperMat = new THREE.MeshPhongMaterial({
            shininess: 30,
            color: 0x1a1a1a,
            flatShading: true
        });
        const flipper = new THREE.Mesh(flipperGeom, flipperMat);
        flipper.position.set(side * 5, -2, 1);
        flipper.rotation.z = side * 0.3;
        mesh.add(flipper);
    }

    // Space helmet
    const helmet = createSpaceHelmet();
    helmet.position.y = 4;
    mesh.add(helmet);

    mesh.scale.set(1.5, 1.5, 1.5);
    return mesh;
}

// === HEDGEHOG CHARACTER ===
function createHedgehog(): THREE.Object3D {
    const mesh = new THREE.Object3D();

    // Body - brown sphere
    const bodyGeom = new THREE.DodecahedronGeometry(6, 1);
    const bodyMat = new THREE.MeshPhongMaterial({
        shininess: 20,
        color: 0x8B4513, // Brown
        flatShading: true
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.castShadow = true;
    mesh.add(body);

    // Face - lighter tan color
    const faceGeom = new THREE.SphereGeometry(4, 8, 8);
    faceGeom.scale(1, 0.8, 0.6);
    const faceMat = new THREE.MeshPhongMaterial({
        shininess: 25,
        color: 0xD2B48C, // Tan
        flatShading: true
    });
    const face = new THREE.Mesh(faceGeom, faceMat);
    face.position.z = 4;
    face.position.y = -1;
    mesh.add(face);

    // Spines - small cones on back
    const spineCount = 20;
    for (let i = 0; i < spineCount; i++) {
        const spineGeom = new THREE.ConeGeometry(0.8, 4, 4);
        const spineMat = new THREE.MeshPhongMaterial({
            shininess: 30,
            color: 0x654321, // Dark brown
            flatShading: true
        });
        const spine = new THREE.Mesh(spineGeom, spineMat);

        // Position spines on upper hemisphere
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI * 0.5; // Only upper half
        const radius = 6;

        spine.position.x = radius * Math.sin(theta) * Math.cos(phi);
        spine.position.y = radius * Math.cos(theta);
        spine.position.z = radius * Math.sin(theta) * Math.sin(phi);

        // Point spines outward
        spine.lookAt(spine.position.x * 2, spine.position.y * 2, spine.position.z * 2);
        spine.rotateX(Math.PI / 2);

        mesh.add(spine);
    }

    // Ears
    for (let side of [-1, 1]) {
        const earGeom = new THREE.SphereGeometry(1.5, 6, 6);
        const earMat = new THREE.MeshPhongMaterial({
            shininess: 20,
            color: 0x8B4513,
            flatShading: true
        });
        const ear = new THREE.Mesh(earGeom, earMat);
        ear.position.set(side * 4, 5, 0);
        mesh.add(ear);
    }

    // Eyes
    for (let side of [-1, 1]) {
        const eyeGeom = new THREE.SphereGeometry(0.8, 6, 6);
        const eyeMat = new THREE.MeshPhongMaterial({
            shininess: 50,
            color: 0x000000,
            flatShading: true
        });
        const eye = new THREE.Mesh(eyeGeom, eyeMat);
        eye.position.set(side * 2, 1, 4);
        mesh.add(eye);
    }

    // Nose
    const noseGeom = new THREE.SphereGeometry(1, 6, 6);
    const noseMat = new THREE.MeshPhongMaterial({
        shininess: 40,
        color: 0x000000,
        flatShading: true
    });
    const nose = new THREE.Mesh(noseGeom, noseMat);
    nose.position.set(0, -1, 5);
    mesh.add(nose);

    // Space helmet
    const helmet = createSpaceHelmet();
    helmet.position.y = 5;
    mesh.add(helmet);

    mesh.scale.set(1.5, 1.5, 1.5);
    return mesh;
}

// === CREATE CHARACTERS ===
// === ADD CHARACTERS TO MARS POLES ===
function addCharactersToMars(): void {
    // Add penguin to North pole of Mars
    const penguin = createPenguin();
    // Mars radius is 40, so position on top
    penguin.position.set(0, 40, 0);
    penguin.scale.set(0.8, 0.8, 0.8); // Smaller for Mars
    marsPlanet.add(penguin);

    // Add hedgehog to South pole of Mars
    const hedgehog = createHedgehog();
    hedgehog.position.set(0, -40, 0);
    hedgehog.scale.set(0.8, 0.8, 0.8); // Smaller for Mars
    marsPlanet.add(hedgehog);
}

// === CREATE CHARACTERS (for Saturn orbit) ===
function createCharacters(): void {
    // Create penguins
    for (let i = 0; i < 2; i++) {
        const pivot = new THREE.Object3D();
        const penguin = createPenguin();
        penguin.position.set(120 + i * 20, 0, 0);
        pivot.add(penguin);
        saturnPlanet.add(pivot);
        characters.push({ mesh: penguin, pivot, speed: 0.005 + i * 0.002 });
    }

    // Create hedgehogs
    for (let i = 0; i < 2; i++) {
        const pivot = new THREE.Object3D();
        const hedgehog = createHedgehog();
        hedgehog.position.set(100 + i * 20, 0, 0);
        pivot.add(hedgehog);
        saturnPlanet.add(pivot);
        characters.push({ mesh: hedgehog, pivot, speed: 0.007 + i * 0.003 });
    }
}

// === COLOR ANIMATION FOR SATURN ===
let colorHue = 0.33; // Start at turquoise (roughly)
const colorPink = new THREE.Color(0xFF6B9D);
const colorTurquoise = new THREE.Color(0x4ECDC4);
const colorPurple = new THREE.Color(0x9B59B6);

function updateSaturnColor(): void {
    // Cycle through pink -> purple -> turquoise -> pink
    colorHue += 0.001;
    if (colorHue > 1) colorHue = 0;

    // Use HSL interpolation for smooth color cycling
    const time = Date.now() * 0.0003;
    const cycle = (Math.sin(time) + 1) / 2; // 0 to 1

    let color: THREE.Color;
    if (cycle < 0.33) {
        // Pink to Purple
        const t = cycle / 0.33;
        color = colorPink.clone().lerp(colorPurple, t);
    } else if (cycle < 0.66) {
        // Purple to Turquoise
        const t = (cycle - 0.33) / 0.33;
        color = colorPurple.clone().lerp(colorTurquoise, t);
    } else {
        // Turquoise to Pink
        const t = (cycle - 0.66) / 0.34;
        color = colorTurquoise.clone().lerp(colorPink, t);
    }

    saturnMaterial.color = color;
}

// === INITIALIZE SCENE ===
function initScene(): void {
    // Calculate positions based on viewport with 10% margin from corners
    // Visible range at z=0 with camera at z=500 and FOV=60:
    // height = 2 * 500 * tan(30°) ≈ 577 units
    // width = height * aspect ratio

    const visibleHeight = 2 * 500 * Math.tan((60 * Math.PI) / 180 / 2);
    const visibleWidth = visibleHeight * (WIDTH / HEIGHT);

    // Saturn: bottom-left (10% from left, 10% from bottom)
    const saturnX = -visibleWidth * 0.4;
    const saturnY = -visibleHeight * 0.4;

    // Mars: upper-right (10% from right, 10% from top)
    const marsX = visibleWidth * 0.4;
    const marsY = visibleHeight * 0.4;

    // Camera position
    camera.position.set(0, 0, 500);
    camera.lookAt(0, 0, 0);

    createLights();
    createCosmos();

    // Create Saturn planet (bottom-left corner)
    saturnPlanet = createSaturnPlanet();
    saturnPlanet.position.set(saturnX, saturnY, -100);
    scene.add(saturnPlanet);

    // Create Mars planet (upper-right corner)
    marsPlanet = createMarsPlanet();
    marsPlanet.position.set(marsX, marsY, -100);
    scene.add(marsPlanet);

    // Add characters to Mars poles
    addCharactersToMars();

    // Create characters orbiting Saturn
    createCharacters();

    render();
}

// === RENDER LOOP ===
function render(): void {
    // Animate stars
    closeStars.mesh.rotation.y += 0.00003;
    closeStars.mesh.children.forEach((child) => {
        if ((child as THREE.Mesh).material) {
            const star = child as THREE.Mesh;
            (star.material as THREE.MeshPhongMaterial).opacity = (Math.sin(Date.now() * 0.001)) / 2 + 0.5;
        }
    });
    distantStars.rotation.y += 0.00002;
    distantStars.rotation.x += 0.00003;
    distantStars.rotation.z += 0.00003;

    // Rotate Saturn planet
    saturnPlanet.rotation.y += 0.001;

    // Rotate Mars planet (slower)
    marsPlanet.rotation.y += 0.0005;

    // Animate Saturn color
    updateSaturnColor();

    // Animate characters orbiting Saturn
    characters.forEach((char) => {
        char.pivot.rotation.y += char.speed;
        // Characters also rotate on their own axis
        char.mesh.rotation.y += 0.01;
    });

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

// === START ===
window.onload = () => {
    // Update canvas size on load to ensure correct dimensions
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    // Set canvas display size using CSS (already handled by CSS width/height: 100%)
    // Set internal resolution to match window size
    renderer.setSize(WIDTH, HEIGHT);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();

    initScene();
};
window.addEventListener('resize', handleWindowResize, false);
