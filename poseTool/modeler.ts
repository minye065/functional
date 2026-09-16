import * as three from "three";
import type { Mannequin, JointKey, Axis } from "./types";

const ringColors: Record<Axis, number> = { x: 0xdb5a42, y: 0x4a9e5c, z: 0x4a7fdb };

export function createMannequin(): Mannequin
{
    function newWoodMaterial(): three.MeshStandardMaterial
    {
        return new three.MeshStandardMaterial({ color: 0xd98a4b });
    }

    function limb(radiusTop: number, radiusBottom: number, height: number): three.Mesh
    {
        const mesh = new three.Mesh(new three.CylinderGeometry(radiusTop, radiusBottom, height, 12), newWoodMaterial());
        mesh.position.y = -height / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    function joint(radius: number): three.Mesh
    {
        const mesh = new three.Mesh(new three.SphereGeometry(radius, 12, 12), newWoodMaterial());
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    function ringMesh(radius: number, axis: Axis): three.Mesh
    {
        const mesh = new three.Mesh(
            new three.TorusGeometry(radius, radius * 0.08, 8, 32),
            new three.MeshBasicMaterial({ color: ringColors[axis], transparent: true, opacity: 0.85 })
        );
        if (axis === "x") mesh.rotation.y = Math.PI / 2;
        else if (axis === "y") mesh.rotation.x = Math.PI / 2;
        mesh.visible = false;
        return mesh;
    }

    function ringSet(radius: number): Record<Axis, three.Mesh>
    {
        return { x: ringMesh(radius, "x"), y: ringMesh(radius, "y"), z: ringMesh(radius, "z") };
    }

    const limbMeshes = {} as Record<JointKey, three.Mesh[]>;
    const axisRings = {} as Record<JointKey, Record<Axis, three.Mesh>>;

    const hips = new three.Group();
    hips.position.y = 1;
    hips.add(joint(0.12));

    const torso = new three.Group();
    torso.position.y = 0.12;
    const torsoJoint = joint(0.08);
    torsoJoint.userData.jointKey = "torso";
    torso.add(torsoJoint);
    const torsoRings = ringSet(0.11);
    torso.add(torsoRings.x, torsoRings.y, torsoRings.z);
    axisRings.torso = torsoRings;
    const torsoMesh = new three.Mesh(new three.CylinderGeometry(0.22, 0.16, 0.5, 12), newWoodMaterial());
    torsoMesh.position.y = 0.25;
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    torso.add(torsoMesh);
    limbMeshes.torso = [torsoJoint, torsoMesh];
    hips.add(torso);

    const head = new three.Group();
    head.position.y = 0.5;
    const headMesh = new three.Mesh(new three.SphereGeometry(0.14, 16, 16), newWoodMaterial());
    headMesh.scale.set(0.85, 1.3, 0.85);
    headMesh.position.y = 0.18;
    headMesh.userData.jointKey = "head";
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    head.add(headMesh);
    const headRings = ringSet(0.11);
    head.add(headRings.x, headRings.y, headRings.z);
    axisRings.head = headRings;
    limbMeshes.head = [headMesh];
    torso.add(head);

    function arm(side: 1 | -1): { shoulder: three.Group; elbow: three.Group }
    {
        const shoulderKey: JointKey = side === -1 ? "leftShoulder" : "rightShoulder";
        const elbowKey: JointKey = side === -1 ? "leftElbow" : "rightElbow";

        const shoulder = new three.Group();
        shoulder.position.set(0.26 * side, 0.42, 0);
        const shoulderMesh = joint(0.05);
        shoulderMesh.userData.jointKey = shoulderKey;
        shoulder.add(shoulderMesh);
        const shoulderRings = ringSet(0.07);
        shoulder.add(shoulderRings.x, shoulderRings.y, shoulderRings.z);
        axisRings[shoulderKey] = shoulderRings;
        const upperArmMesh = limb(0.05, 0.045, 0.32);
        shoulder.add(upperArmMesh);
        limbMeshes[shoulderKey] = [shoulderMesh, upperArmMesh];

        const elbow = new three.Group();
        elbow.position.y = -0.32;
        const elbowMesh = joint(0.045);
        elbowMesh.userData.jointKey = elbowKey;
        elbow.add(elbowMesh);
        const elbowRings = ringSet(0.065);
        elbow.add(elbowRings.x, elbowRings.y, elbowRings.z);
        axisRings[elbowKey] = elbowRings;
        const lowerArmMesh = limb(0.045, 0.04, 0.3);
        elbow.add(lowerArmMesh);
        const hand = new three.Mesh(new three.SphereGeometry(0.045, 10, 10), newWoodMaterial());
        hand.scale.set(1, 0.6, 0.8);
        hand.position.y = -0.32;
        hand.castShadow = true;
        hand.receiveShadow = true;
        elbow.add(hand);
        limbMeshes[elbowKey] = [elbowMesh, lowerArmMesh, hand];

        shoulder.add(elbow);
        torso.add(shoulder);
        return { shoulder, elbow };
    }

    function leg(side: 1 | -1): { hip: three.Group; knee: three.Group }
    {
        const hipKey: JointKey = side === -1 ? "leftHip" : "rightHip";
        const kneeKey: JointKey = side === -1 ? "leftKnee" : "rightKnee";

        const hip = new three.Group();
        hip.position.set(0.12 * side, -0.05, 0);
        const hipMesh = joint(0.07);
        hipMesh.userData.jointKey = hipKey;
        hip.add(hipMesh);
        const hipRings = ringSet(0.09);
        hip.add(hipRings.x, hipRings.y, hipRings.z);
        axisRings[hipKey] = hipRings;
        const upperLegMesh = limb(0.09, 0.08, 0.45);
        hip.add(upperLegMesh);
        limbMeshes[hipKey] = [hipMesh, upperLegMesh];

        const knee = new three.Group();
        knee.position.y = -0.45;
        const kneeMesh = joint(0.06);
        kneeMesh.userData.jointKey = kneeKey;
        knee.add(kneeMesh);
        const kneeRings = ringSet(0.08);
        knee.add(kneeRings.x, kneeRings.y, kneeRings.z);
        axisRings[kneeKey] = kneeRings;
        const lowerLegMesh = limb(0.08, 0.06, 0.42);
        knee.add(lowerLegMesh);
        const foot = new three.Mesh(new three.SphereGeometry(0.07, 10, 10), newWoodMaterial());
        foot.scale.set(0.9, 0.5, 1.4);
        foot.position.set(0, -0.42, 0.03);
        foot.castShadow = true;
        foot.receiveShadow = true;
        knee.add(foot);
        limbMeshes[kneeKey] = [kneeMesh, lowerLegMesh, foot];

        hip.add(knee);
        hips.add(hip);
        return { hip, knee };
    }

    const leftArm = arm(-1);
    const rightArm = arm(1);
    const leftLeg = leg(-1);
    const rightLeg = leg(1);

    const joints: Record<JointKey, three.Group> =
    {
        torso, head,
        leftShoulder: leftArm.shoulder, leftElbow: leftArm.elbow,
        rightShoulder: rightArm.shoulder, rightElbow: rightArm.elbow,
        leftHip: leftLeg.hip, leftKnee: leftLeg.knee,
        rightHip: rightLeg.hip, rightKnee: rightLeg.knee,
    };

    const axis: Record<JointKey, Axis> =
    {
        torso: "y", head: "y",
        leftShoulder: "x", leftElbow: "x",
        rightShoulder: "x", rightElbow: "x",
        leftHip: "x", leftKnee: "x",
        rightHip: "x", rightKnee: "x",
    };

    return { root: hips, joints, axis, limbMeshes, axisRings };
}