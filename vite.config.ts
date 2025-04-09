import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

function generateManifest() {
  const manifest = readJsonFile("src/app/manifest.json");
  const pkg = readJsonFile("package.json");
  const target = process.env.BROWSER || "chrome";

  return {
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    ...resolveBrowserFields(manifest, target),
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    webExtension({
      manifest: generateManifest,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg"],
  },
  build: {
    rollupOptions: {
      input: {
        background: "src/app/background.ts",
        contentScript: "src/app/contentScript.ts",
      },
      output: {
        entryFileNames: "src/app/[name].js",
        inlineDynamicImports: false,
      },
      external: ["@ffmpeg/ffmpeg"],
    },
  },
});

function resolveBrowserFields(manifest: any, target: string) {
  const result = JSON.parse(JSON.stringify(manifest)); // deep clone
  const prefix = `{{${target}}}.`;

  Object.keys(result).forEach((key) => {
    if (key.startsWith("{{")) delete result[key];
  });

  for (const [key, value] of Object.entries(manifest)) {
    if (key.startsWith(`{{${target}}}.`)) {
      const cleanKey = key.replace(`{{${target}}}.`, "");
      result[cleanKey] = value;
    }
  }

  return result;
}
