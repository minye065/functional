// @ts-ignore
import type * as three from "three";

export type Axis = "x" | "y" | "z";

export interface Mannequin
{
    root: three.Group;
    joints: Record<JointKey, three.Group>;
    axis: Record<JointKey, Axis>;
}
export type JointKey =
  | "leftShoulder" | "leftElbow"
  | "rightShoulder" | "rightElbow"
  | "leftHip" | "leftKnee"
  | "rightHip" | "rightKnee"
  | "torso" | "head";

export type Pose = Record<JointKey, number>;

export interface RendererApi
{
  setPose: (pose: Pose) => void;
  resetCamera: () => void;
  getImage: () => string;
  dispose: () => void;
}