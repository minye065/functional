import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createMannequin } from "./modeler";
import type { Pose, RendererApi, JointKey, Axis } from "./types";

export function initRenderer(canvasContainer: HTMLDivElement): RendererApi
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

    function animate()
    {
        frameID = requestAnimationFrame(animate);
        userControls.update();
        webGl.render(rendererScene, userCamera);
    }
    animate();

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
        userControls.target.set(0, 0, 0);
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
