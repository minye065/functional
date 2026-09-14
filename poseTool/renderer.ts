import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Pose } from "./types";

export function initRenderer(canvasContainer: HTMLDivElement)
{
    let frameID: number;
    const canvasWidth = canvasContainer.clientWidth;
    const canvasHeight = canvasContainer.clientHeight;
    const rendererScene = new THREE.Scene();
    const userCamera = new THREE.PerspectiveCamera(45, canvasWidth / canvasHeight, 1, 1000);
    const light = new THREE.AmbientLight(0x404040);
    const floorGeometry = new THREE.PlaneGeometry(50, 50);
    const material = new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide } );
    const floor = new THREE.Mesh( floorGeometry, material );
    floor.rotateX(-Math.PI / 2);
    const webGl = new THREE.WebGLRenderer();
    webGl.setSize(canvasWidth, canvasHeight);
    canvasContainer.appendChild(webGl.domElement as HTMLCanvasElement);
    const userControls = new OrbitControls(userCamera, webGl.domElement as HTMLCanvasElement);
    userCamera.position.set( 0, 20, 100);
    userControls.update();
    rendererScene.add(light, floor);
    function updateAnimationFrame()
    {
        frameID = requestAnimationFrame(updateAnimationFrame);
        userControls.update();
        webGl.render(rendererScene, userCamera);
    }
    updateAnimationFrame();


return { setPose: (pose: Pose) => {}, resetCamera: () => {}, getImage: () => "", dispose: () => {}, };
    
}

