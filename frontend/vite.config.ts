import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const offlineAssetManifest = {
  name: 'sevasetu-offline-asset-manifest',
  generateBundle(this: { emitFile: (file: { type: 'asset'; fileName: string; source: string }) => void }, _options: unknown, bundle: Record<string, { type: string; fileName: string }>) {
    const files = Object.values(bundle)
      .filter((item) => item.type === 'chunk' || /\.(css|woff2?|ttf|otf|svg|png|jpe?g|webp)$/i.test(item.fileName))
      .map((item) => `/${item.fileName}`);
    this.emitFile({ type: 'asset', fileName: 'precache-manifest.json', source: JSON.stringify(files) });
  },
};

export default defineConfig({
  plugins: [react(), offlineAssetManifest],
  resolve: {
    alias: {
      nothing: "/src/fallbacks/missingModule.ts",
      "@": path.resolve(dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: { "/api": { target: process.env.VITE_API_PROXY || "http://localhost:3000", changeOrigin: true } },
  },
  preview: { host: "0.0.0.0", port: 4173 },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          motion: ["motion"],
        },
      },
    },
  },
});
