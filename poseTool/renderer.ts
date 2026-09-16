import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createMannequin } from "./modeler";
import type { Pose, RendererApi, JointKey, Axis } from "./types";

export function initRenderer(canvasContainer: HTMLDivElement): RendererApi
{
    let frameID: number;
    const webGl = new THREE.WebGLRenderer()
    const canvasWidth = canvasContainer.clientWidth;
    const canvasHeight = canvasContainer.clientHeight;
    const rendererScene = new THREE.Scene();
    const floorGeometry = new THREE.PlaneGeometry(50, 50);
    rendererScene.background = new THREE.Color(0xd9d8d3);

    const hemiLight = new THREE.HemisphereLight(0xfffbef, 0x575452, 2.3);
    const keyLight = new THREE.DirectionalLight(0xfff1d6, 4.2);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    const rimLight = new THREE.DirectionalLight(0xdde8ef, 2);
    rimLight.position.set(-5, 4, -4);

    webGl.shadowMap.enabled = true;
    webGl.shadowMap.type = THREE.PCFSoftShadowMap;

    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xd9d8d3, roughness: 1 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotateX(-Math.PI / 2);
    floor.receiveShadow = true;

    rendererScene.add(hemiLight, keyLight, rimLight, floor); 
    webGl.setSize(canvasWidth, canvasHeight);
    canvasContainer.appendChild(webGl.domElement as HTMLCanvasElement);
    const userCamera = new THREE.PerspectiveCamera(45, canvasWidth / canvasHeight, 0.1, 1000);
    const userControls = new OrbitControls(userCamera, webGl.domElement as HTMLCanvasElement);
    userControls.maxPolarAngle = Math.PI * 0.495;
    userCamera.position.set( 0, 1.5, 3);
    userControls.update();

    const mannequin = createMannequin();
    rendererScene.add(mannequin.root);
    let currentPose: Pose =
    {
        leftShoulder: 0, leftElbow: 0,
        rightShoulder: 0, rightElbow: 0,
        leftHip: 0, leftKnee: 0,
        rightHip: 0, rightKnee: 0,
        torso: 0, head: 0,
    };

    function applyPose()
    {
        for (const [key, axis] of Object.entries(mannequin.axis) as [JointKey, Axis][])
        {
            const angle = currentPose[key];
            const group = mannequin.joints[key];
            if (axis === "x") group.rotation.x = angle;
            else if (axis === "y") group.rotation.y = angle;
            else if (axis === "z") group.rotation.z = angle;
        }
    }
    function updateAnimationFrame()
    {
        frameID = requestAnimationFrame(updateAnimationFrame);
        userControls.update();
        webGl.render(rendererScene, userCamera);
    }
    updateAnimationFrame();

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();


    let dragKey: JointKey | null = null;
    let lastX = 0;
    const sensitivity = 0.01;

    function onPointerMove(event: PointerEvent)
    {
        if (!dragKey) return;
        const deltaX = event.clientX - lastX;
        lastX = event.clientX;
        currentPose[dragKey] += deltaX * sensitivity;
        applyPose();
    }
    function onPointerDown(event: PointerEvent)
    {
        const rect = webGl.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, userCamera);

        const jointMeshes: THREE.Mesh[] = [];
        mannequin.root.traverse((obj) =>
        {
            if (obj instanceof THREE.Mesh && obj.userData?.jointKey)
            {
                jointMeshes.push(obj);
            }
        });

        const intersects = raycaster.intersectObjects(jointMeshes);
        if (intersects.length > 0)
        {
            dragKey = intersects[0].object.userData.jointKey as JointKey;
            lastX = event.clientX;
            userControls.enabled = false;
        }
    }

    function onPointerUp()
    {
        dragKey = null;
        userControls.enabled = true;
    }

    webGl.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    function setPose(pose: Pose)
    {
        currentPose = pose;
        applyPose();
    }

    function resetCamera()
    {
        userCamera.position.set(0, 1.5, 3);
        userControls.target.set(0, 1, 0);
        userControls.update();
    }

    function getImage(): string
    {
        return webGl.domElement.toDataURL("image/png");
    }

    function dispose()
    {
        cancelAnimationFrame(frameID);
        webGl.dispose();
        webGl.domElement.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        rendererScene.traverse((obj) =>
        {
            if (obj instanceof THREE.Mesh)
            {
                obj.geometry.dispose();
                if (Array.isArray(obj.material))
                {
                    obj.material.forEach((m) => m.dispose());
                }
                else if (obj.material)
                {
                    obj.material.dispose();
                }
            }
        });
        canvasContainer.removeChild(webGl.domElement);
    }

    return { setPose, resetCamera, getImage, dispose };
}
