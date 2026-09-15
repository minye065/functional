import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "poseTool",
  build: { outDir: "../dist" },
  base: process.env.VITE_BASE_PATH || "/functional/",
});