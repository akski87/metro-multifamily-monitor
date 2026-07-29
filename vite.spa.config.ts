import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

// Static SPA build for GitHub Pages (project site).
// Output: dist-gh/  →  https://akski87.github.io/metro-multifamily-monitor/
export default defineConfig({
  base: "/metro-multifamily-monitor/",
  plugins: [
    TanStackRouterVite({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    tailwindcss(),
    viteReact(),
  ],
  resolve: { tsconfigPaths: true },
  build: {
    outDir: "dist-gh",
    emptyOutDir: true,
    rollupOptions: {
      input: "index.spa.html",
    },
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
  },
});
