import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createMannequin } from "./modeler";
import type { Pose, RendererApi, JointKey, Axis } from "./types";

export function initRenderer(canvasContainer: HTMLDivElement): RendererApi
{
    let frameID: number;
    const webGl = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
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
    keyLight.shadow.bias = -0.001;
    keyLight.shadow.camera.left = -5;
    keyLight.shadow.camera.right = 5;
    keyLight.shadow.camera.top = 5;
    keyLight.shadow.camera.bottom = -5;
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
    userControls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
    userControls.maxPolarAngle = Math.PI * 0.495;
    userCamera.position.set(0, 1.5, 3);
    userControls.target.set(0, 1, 0);
    userControls.update();
    const mannequin = createMannequin();
    rendererScene.add(mannequin.root);

    function zeroRotation(): { x: number; y: number; z: number }
    {
        return { x: 0, y: 0, z: 0 };
    }

    let currentPose: Pose =
    {
        leftShoulder: zeroRotation(), leftElbow: zeroRotation(),
        rightShoulder: zeroRotation(), rightElbow: zeroRotation(),
        leftHip: zeroRotation(), leftKnee: zeroRotation(),
        rightHip: zeroRotation(), rightKnee: zeroRotation(),
        torso: zeroRotation(), head: zeroRotation(),
    };

    function applyPose()
    {
        for (const key of Object.keys(mannequin.joints) as JointKey[])
        {
            const rotation = currentPose[key];
            const group = mannequin.joints[key];
            group.rotation.set(rotation.x, rotation.y, rotation.z);
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
    const allRingMeshes: THREE.Mesh[] = [];
    const allLimbMeshes: THREE.Mesh[] = [];
    for (const key of Object.keys(mannequin.axisRings) as JointKey[])
    {
        const rings = mannequin.axisRings[key];
        allRingMeshes.push(rings.x, rings.y, rings.z);
        allLimbMeshes.push(...mannequin.limbMeshes[key]);
    }

    let selectedKey: JointKey | null = null;
    let dragAxis: Axis | null = null;
    let lastX = 0;
    const sensitivity = 0.01;
    const highlightColor = new THREE.Color(0xff2222);
    function selectJoint(key: JointKey)
    {
        if (selectedKey === key) return;
        if (selectedKey) deselectJoint();
        selectedKey = key;
        const rings = mannequin.axisRings[key];
        rings.x.visible = true;
        rings.y.visible = true;
        rings.z.visible = true;
        for (const mesh of mannequin.limbMeshes[key])
        {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            mat.emissive = highlightColor.clone();
            mat.emissiveIntensity = 0.6;
        }
    }

    function deselectJoint()
    {
        if (!selectedKey) return;
        const rings = mannequin.axisRings[selectedKey];
        rings.x.visible = false;
        rings.y.visible = false;
        rings.z.visible = false;
        for (const mesh of mannequin.limbMeshes[selectedKey])
        {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            mat.emissive.set(0x000000);
        }
        selectedKey = null;
    }
    function updateMouseFromEvent(event: PointerEvent)
    {
        const rect = webGl.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, userCamera);
    }
    function onPointerMove(event: PointerEvent)
    {
        if (!dragAxis || !selectedKey) return;
        const deltaX = event.clientX - lastX;
        lastX = event.clientX;
        currentPose[selectedKey][dragAxis] += deltaX * sensitivity;
        applyPose();
    }

    function onPointerDown(event: PointerEvent)
    {
        updateMouseFromEvent(event);

        if (selectedKey)
        {
            const rings = mannequin.axisRings[selectedKey];
            const ringIntersects = raycaster.intersectObjects([rings.x, rings.y, rings.z]);
            if (ringIntersects.length > 0)
            {
                dragAxis = ringIntersects[0].object.userData.axis as Axis;
                lastX = event.clientX;
                userControls.enabled = false;
                return;
            }
        }

        const limbIntersects = raycaster.intersectObjects(allLimbMeshes);
        if (limbIntersects.length > 0)
        {
            const hitKey = limbIntersects[0].object.userData.jointKey as JointKey;
            selectJoint(hitKey);
        }
        else
        {
            deselectJoint();
        }
    }

    function onPointerUp()
    {
        if (dragAxis)
        {
            dragAxis = null;
            userControls.enabled = true;
        }
    }

    function onKeyDown(event: KeyboardEvent)
    {
        if (event.key === "Escape")
        {
            deselectJoint();
        }
    }

    webGl.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown);

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
        window.removeEventListener('keydown', onKeyDown);
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