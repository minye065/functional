import * as three from "three";
import type { Mannequin, JointKey, Axis } from "./types";

export function createMannequin(): Mannequin
{
    const woodMaterial = new three.MeshStandardMaterial({ color: 0xd98a4b });
    const hips = new three.Group();
    hips.add(joint(0.12));
    const torso = new three.Group();
    torso.position.y = 0.12;
    const torsoJoint = joint(0.08);
    torsoJoint.userData.jointKey = "torso";
    torso.add(torsoJoint);
    const torsoMesh = new three.Mesh(new three.CylinderGeometry(0.22, 0.16, 0.5, 12), woodMaterial);
    torsoMesh.position.y = 0.25;
    torso.add(torsoMesh);
    hips.add(torso);
    const head = new three.Group();
    head.position.y = 0.5;
    const headMesh = new three.Mesh(new three.SphereGeometry(0.14, 16, 16), woodMaterial);
    headMesh.scale.set(0.85, 1.3, 0.85);
    headMesh.position.y = 0.18;
    headMesh.userData.jointKey = "head";
    head.add(headMesh);
    torso.add(head);

    function limb(radiusTop: number, radiusBottom: number, height: number): three.Mesh
    {
        const mesh = new three.Mesh(new three.CylinderGeometry(radiusTop, radiusBottom, height, 12), woodMaterial);
        mesh.position.y = -height / 2;
        return mesh;
    }

    function joint(radius: number): three.Mesh
    {
        return new three.Mesh(new three.SphereGeometry(radius, 12, 12), woodMaterial);
    }
    function arm(side: 1 | -1): { shoulder: three.Group; elbow: three.Group }
    {
        const shoulder = new three.Group();
        shoulder.position.set(0.26 * side, 0.42, 0);
        const shoulderMesh = joint(0.05);
        shoulderMesh.userData.jointKey = side === -1 ? "leftShoulder" : "rightShoulder";
        shoulder.add(shoulderMesh);
        shoulder.add(limb(0.05, 0.045, 0.32));
        const elbow = new three.Group();
        elbow.position.y = -0.32;
        const elbowMesh = joint(0.045);
        elbowMesh.userData.jointKey = side === -1 ? "leftElbow" : "rightElbow";
        elbow.add(elbowMesh);
        elbow.add(limb(0.045, 0.04, 0.3));
        const hand = new three.Mesh(new three.SphereGeometry(0.045, 10, 10), woodMaterial);
        hand.scale.set(1, 0.6, 0.8);
        hand.position.y = -0.32;
        elbow.add(hand);
        shoulder.add(elbow);
        torso.add(shoulder);
        return { shoulder, elbow };
    }

    function leg(side: 1 | -1): { hip: three.Group; knee: three.Group }
    {
        const hip = new three.Group();
        hip.position.set(0.12 * side, -0.05, 0);
        const hipMesh = joint(0.07);
        hipMesh.userData.jointKey = side === -1 ? "leftHip" : "rightHip";
        hip.add(hipMesh);
        hip.add(limb(0.09, 0.08, 0.45));
        const knee = new three.Group();
        knee.position.y = -0.45;
        const kneeMesh = joint(0.06);
        kneeMesh.userData.jointKey = side === -1 ? "leftKnee" : "rightKnee";
        knee.add(kneeMesh);
        knee.add(limb(0.08, 0.06, 0.42));
        const foot = new three.Mesh(new three.SphereGeometry(0.07, 10, 10), woodMaterial);
        foot.scale.set(0.9, 0.5, 1.4);
        foot.position.set(0, -0.42, 0.03);
        knee.add(foot);
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
        torso,
        head,
        leftShoulder: leftArm.shoulder,
        leftElbow: leftArm.elbow,
        rightShoulder: rightArm.shoulder,
        rightElbow: rightArm.elbow,
        leftHip: leftLeg.hip,
        leftKnee: leftLeg.knee,
        rightHip: rightLeg.hip,
        rightKnee: rightLeg.knee,
    };

    const axis: Record<JointKey, Axis> =
    {
        torso: "y", head: "y",
        leftShoulder: "x", leftElbow: "x",
        rightShoulder: "x", rightElbow: "x",
        leftHip: "x", leftKnee: "x",
        rightHip: "x", rightKnee: "x",
    };
    return { root: hips, joints, axis };
}