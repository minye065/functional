import { useEffect, useRef } from "react";
import { initRenderer } from "./renderer";
import { exportPng, exportPdf } from "./export";
import type { RendererApi } from "./types";
// @ts-expect-error
import "./styles.css";
 
export default function App()
{
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<RendererApi | null>(null);

  useEffect(() =>
  {
    if (!mountRef.current) return;
    apiRef.current = initRenderer(mountRef.current);
    return () => apiRef.current?.dispose();
  }, []);

  return(
    <div className="pose-tool">
      <div className="canvas-wrap" ref={mountRef} />
      <div className="tool-doc">
        <button onClick={() => apiRef.current?.resetCamera()}>Reset camera</button>
        <button onClick={() => { const img = apiRef.current?.getImage(); if (img) exportPng(img); }}>
          Download PNG
        </button>
        <button onClick={() => { const img = apiRef.current?.getImage(); if (img) exportPdf(img); }}>
          Download PDF
        </button>
      </div>
    </div>
  );
}