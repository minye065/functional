import { useEffect, useRef, useState } from "react";
import { initRenderer } from "./renderer";
// import { exportPng, exportPdf } from "./export";
import type { Pose, RendererApi } from "./types";

const DEFAULT_POSE: Pose = {
  leftShoulder: 0, leftElbow: 0,
  rightShoulder: 0, rightElbow: 0,
  leftHip: 0, leftKnee: 0,
  rightHip: 0, rightKnee: 0,
  torso: 0, head: 0,
};

export default function App()
{
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<RendererApi | null>(null);
  const [pose, setPose] = useState<Pose>(DEFAULT_POSE);

  useEffect(() =>
  {
    if (!mountRef.current) return;
    apiRef.current = initRenderer(mountRef.current);
    return () => apiRef.current?.dispose();
  }, []);

  useEffect(() =>
  {
    apiRef.current?.setPose(pose);
  }, [pose]);

  function updateJoint(key: keyof Pose, value: number)
  {
    setPose((prev) => ({ ...prev, [key]: value }));
  }

  return(
    <div className="pose-tool">
      <div className="canvas-wrap" ref={mountRef} />
      <div className="sidebar">
        <button onClick={() => { setPose(DEFAULT_POSE); apiRef.current?.resetCamera(); }}>
          Reset pose
        </button>
        {/* <button onClick={() => { const img = apiRef.current?.getImage(); if (img) exportPng(img); }}>
          Download PNG
        </button>
        <button onClick={() => { const img = apiRef.current?.getImage(); if (img) exportPdf(img); }}>
          Download PDF
        </button> */}
      </div>
    </div>
  );
}