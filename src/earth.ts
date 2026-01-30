import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

"use strict";

let HEIGHT = window.innerHeight;
let WIDTH = window.innerWidth;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 1, 10000);
const renderer = new THREE.WebGLRenderer({canvas: document.getElementById('myCanvas') as HTMLCanvasElement, antialias: true, alpha: true});
renderer.shadowMap.enabled = true;
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(WIDTH, HEIGHT);

// global vars
let ambientLight: THREE.AmbientLight, hemisphereLight: THREE.HemisphereLight, shadowLight: THREE.DirectionalLight, shadowLight2: THREE.DirectionalLight;


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
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
}

function createLights(): void {
    ambientLight = new THREE.AmbientLight(0xE5D5D5);
    ambientLight.intensity = 0.5;
    hemisphereLight = new THREE.HemisphereLight(0x2F586D, 0x0E4A6D, .7);
    shadowLight = new THREE.DirectionalLight(0xE5CC20, .8);
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

const CreateDistantStars = function() {
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
    this.mesh = new THREE.Points(geom, mat);
};

const CreateCloseStars = function() {
    this.mesh = new THREE.Object3D();
    const geom = new THREE.SphereGeometry(2, 6, 6);
    this.mat = new THREE.MeshPhongMaterial({
        shininess: 100,
        specular: 0xffffff,
        transparent: true
    });

    let star: THREE.Mesh;
    const startCount = 155;

    for (let i = 0; i < startCount; i++) {
        star = new THREE.Mesh(geom, this.mat.clone());
        star.position.x = Math.random() * (WIDTH + 1) - WIDTH / 2;
        star.position.y = Math.random() * (HEIGHT + 1) - HEIGHT / 2;
        star.position.z = Math.floor(Math.random() * (1200 - 1)) - 1500;
        star.scale.set(.5, .5, .5);
        this.mesh.add(star);
    }
};

let closeStars: CreateCloseStars;
let distantStars: CreateDistantStars;

function createCosmos(): void {
    distantStars = new CreateDistantStars();
    closeStars = new CreateCloseStars();
    closeStars.mesh.position.set(0, 0, 0);
    distantStars.mesh.position.set(0, 0, 0);
    scene.add(distantStars.mesh, closeStars.mesh);
}

const Cloud = function() {
    this.mesh = new THREE.Object3D();

    const geom = new THREE.DodecahedronGeometry(4, 0);
    const mat = new THREE.MeshPhongMaterial({
        color: 0xD0E3EE,
        shininess: 10,
        flatShading: true
    });

    const nBlocs = 5 + Math.floor(Math.random() * 7);

    for (let i = 0; i < nBlocs; i++) {
        const m = new THREE.Mesh(geom, mat);

        m.position.x = Math.sin(i) * 3;
        m.position.y = Math.random() * 1.1;
        m.position.z = Math.random() * 0.7;
        m.rotation.y = Math.random() * Math.PI * 1.5;
        m.rotation.z = Math.random() * Math.PI * 1.5;

        const s = .3 + Math.random() * .3;
        m.scale.set(s, s, s);

        m.castShadow = true;

        this.mesh.add(m);
    }
};

const Sky = function() {
    this.mesh = new THREE.Object3D();

    const Pivot = function() {
        this.mesh = new THREE.Object3D();
        this.mesh.position.set(0, 0, 0);
    };

    this.mesh.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));

    this.nClouds = 23;

    const stepAngle = Math.PI * 2 / this.nClouds;

    for (let i = 0; i < this.nClouds; i++) {
        const p = new Pivot();

        const c = new Cloud();

        const a = stepAngle * i;
        const h = 62 + Math.random() * 5;

        c.mesh.position.y = Math.sin(a) * h;
        c.mesh.position.x = Math.cos(a) * h;

        // rotate the clouds facing the surface of planet
        c.mesh.rotation.z = a + Math.PI / 2;

        const s = Math.random() * 2;
        c.mesh.scale.set(s, s, s);

        p.mesh.add(c.mesh);

        p.mesh.rotation.x = (Math.PI / 180) * (Math.random() * 360);
        p.mesh.rotation.y = -(Math.PI / 180) * (Math.random() * 360);
        p.mesh.rotation.z = (Math.PI / 180) * (Math.random() * 360);

        this.mesh.add(p.mesh);
    }


};

let sky: Sky;

function createSky(): void {
    sky = new Sky();
    sky.mesh.position.set(0, 0, 0);
    earth.mesh.add(sky.mesh);
}

const Earth = function() {
    this.mesh = new THREE.Object3D();

    // create earthSphere with ocean color
    const geom = new THREE.OctahedronGeometry(55, 2);
    const mat = new THREE.MeshPhongMaterial({
        shininess: 15,
        color: 0x004D6D,
        flatShading: true
    });
    const earthSphere = new THREE.Mesh(geom, mat);

    earthSphere.receiveShadow = true;


    //create northPole
    const northPoleGeom = new THREE.SphereGeometry(35, 5, 5);

    const northPolePositions = northPoleGeom.attributes.position;
    if (northPolePositions) {
        for (let i = 0; i < northPolePositions.count; i++) {
            const y = northPolePositions.getY(i);
            if (i === 0) {
                northPolePositions.setY(i, y - 2);
            } else if (i >= 7 && i <= 11) {
                northPolePositions.setY(i, y + 5);
            }
        }
        northPoleGeom.computeVertexNormals();
    }

    const northPoleMat = new THREE.MeshPhongMaterial({
        shininess: 15,
        color: 0xF7F7F3,
        flatShading: true
    });

    const northPole = new THREE.Mesh(northPoleGeom, northPoleMat);
    northPole.position.set(0, 24, 0);


    //create southPole
    const southPoleGeom = new THREE.SphereGeometry(35, 5, 5);

    const southPolePositions = southPoleGeom.attributes.position;
    if (southPolePositions) {
        for (let i = 0; i < southPolePositions.count; i++) {
            const y = southPolePositions.getY(i);
            if (i === 0) {
                southPolePositions.setY(i, y - 2);
            } else if (i >= 7 && i <= 11) {
                southPolePositions.setY(i, y + 5);
            }
        }
        southPoleGeom.computeVertexNormals();
    }

    southPoleGeom.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI));

    const southPoleMat = new THREE.MeshPhongMaterial({
        shininess: 15,
        color: 0xF7F7F3,
        flatShading: true
    });

    const southPole = new THREE.Mesh(southPoleGeom, southPoleMat);
    southPole.position.set(0, -24, 0);

    // create continent
    let contiGeom = new THREE.DodecahedronGeometry(25, 1);

    contiGeom.deleteAttribute('normal');
    contiGeom.deleteAttribute('uv');
    // FIX: Use mergeVertices from BufferGeometryUtils instead of the removed method
    contiGeom = mergeVertices(contiGeom) as THREE.DodecahedronGeometry;

    const l = contiGeom.attributes.position.count;

    for (let i = 0; i < l; i++) {
        const v = new THREE.Vector3();
        v.fromBufferAttribute(contiGeom.attributes.position, i);

        if (i < l / 2) {
            v.y -= 5;
            v.z += Math.random() * 5;
            v.x += Math.random() * 5;
        } else {
            v.y += 7;
            v.z -= Math.random() * 5;
            v.x -= Math.random() * 5;
        }

        contiGeom.attributes.position.setXYZ(i, v.x, v.y, v.z);
    }
    contiGeom.computeVertexNormals();

    contiGeom.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI));

    const contiMat = new THREE.MeshPhongMaterial({
        shininess: 15,
        color: 0x129B40,
        flatShading: true
    });

    const continent1 = new THREE.Mesh(contiGeom, contiMat);
    continent1.position.set(0, 10, 33);

    const continent2 = new THREE.Mesh(contiGeom, contiMat);
    continent2.position.set(0, -3, -33);
    continent2.rotation.x = (Math.PI / 180) * 6;

    const continent3 = new THREE.Mesh(contiGeom, contiMat);
    continent3.position.set(30, 15, 0);
    continent3.rotation.x = (Math.PI / 180) * 180;

    const continent4 = new THREE.Mesh(contiGeom, contiMat);
    continent4.position.set(28, -15, 0);
    continent4.rotation.x = (Math.PI / 180) * 270;
    continent4.rotation.y = (Math.PI / 180) * 50;

    const continent5 = new THREE.Mesh(contiGeom, contiMat);
    continent5.position.set(28, 0, 20);
    continent5.rotation.x = (Math.PI / 180) * 270;

    const continent6 = new THREE.Mesh(contiGeom, contiMat);
    continent6.position.set(-28, 20, 0);
    continent6.rotation.x = (Math.PI / 180) * 30;

    const atmopshereSphere = new THREE.SphereGeometry(75, 20, 20);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
        shininess: 100,
        flatShading: false,
        color: 0x109EB4,
        transparent: true,
        opacity: .12
    });

    const atmosphere = new THREE.Mesh(atmopshereSphere, atmosphereMaterial);

    northPole.receiveShadow = true;
    southPole.receiveShadow = true;
    continent1.receiveShadow = true;
    continent2.receiveShadow = true;
    continent3.receiveShadow = true;
    continent4.receiveShadow = true;
    continent5.receiveShadow = true;
    continent6.receiveShadow = true;

    this.mesh.add(earthSphere, northPole, southPole, continent1, continent2, continent3, continent4, continent5, continent6, atmosphere);
};


let earth: Earth;

function createEarth(): void {
    earth = new Earth();
    earth.mesh.position.set(0, 0, -150);
    scene.add(earth.mesh);
}

const Sputnik = function() {
    this.mesh = new THREE.Object3D();
    this.pivot = new THREE.Object3D();


    const mainModuleGeom = new THREE.CylinderGeometry(17, 13, 50, 7, 1);
    const mainModuleMat = new THREE.MeshPhongMaterial({
        shininess: 100,
        color: 0xB2B8AF,
        flatShading: true
    });

    const mainModule = new THREE.Mesh(mainModuleGeom, mainModuleMat);

    const wingsGeom = new THREE.BoxGeometry(300, 20, 1, 11, 1, 1);

    const wingsPositions = wingsGeom.attributes.position;
    if (wingsPositions) {
        for (let i = 0; i < wingsPositions.count; i++) {
            if (i % 2 === 0) {
                const z = wingsPositions.getZ(i);
                wingsPositions.setZ(i, z + 5);
            } else {
                const z = wingsPositions.getZ(i);
                wingsPositions.setZ(i, z - 5);
            }
        }
        wingsGeom.computeVertexNormals();
    }

    const wingsMat = new THREE.MeshPhongMaterial({
        shininess: 100,
        color: 0xD3C545,
        flatShading: true
    });


    const wings = new THREE.Mesh(wingsGeom, wingsMat);
    wings.position.set(0, 0, 0);

    const antenaGeom = new THREE.CylinderGeometry(40, 10, 20, 10);


    const antenaMat = new THREE.MeshPhongMaterial({
        shininess: 100,
        color: 0xAED3BE,
        flatShading: true
    });

    const antena = new THREE.Mesh(antenaGeom, antenaMat);
    antena.position.y = 35;



    this.mesh.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 3));
    this.mesh.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI / 3));

    this.mesh.scale.set(0.1, 0.1, 0.1);
    this.mesh.add(mainModule, wings, antena);

    this.pivot.add(this.mesh);

};

let sputnik: Sputnik;

function createSatelites(): void {
    sputnik = new Sputnik();
    sputnik.mesh.position.set(-100, 0, -100);
    earth.mesh.add(sputnik.pivot);
}




function initScene(): void {
    // var axisHelper = new THREE.AxisHelper( 1000 );
    // scene.add( axisHelper );


    camera.position.set(0, 40, 130);
    camera.rotation.x -= (Math.PI / 180) * 7;
    createLights();
    createCosmos();
    createEarth();
    createSky();

    createSatelites();

    render();
}

function render(): void {
    closeStars.mesh.rotation.y += 0.00003;
    closeStars.mesh.children.forEach(function(star: THREE.Mesh) {
        star.material.opacity = (Math.sin(Date.now() * 0.001)) / 2 + 0.5;
    });
    distantStars.mesh.rotation.y += 0.00002;
    distantStars.mesh.rotation.x += 0.00003;
    distantStars.mesh.rotation.z += 0.00003;
    earth.mesh.rotation.y += 0.002;
    sky.mesh.rotation.y -= 0.0003;
    sky.mesh.rotation.z += 0.0003;

    sputnik.pivot.rotation.y -= 0.01;
    sputnik.pivot.rotation.x -= 0.001;
    // sputnik.pivot.rotation.z += 0.008;




    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

window.onload = initScene;
window.addEventListener('resize', handleWindowResize, false);
