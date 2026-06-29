import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Project page served at https://kitay-sudo.github.io/yata/
export default defineConfig({
  base: "/yata/",
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    outDir: fileURLToPath(new URL("../docs", import.meta.url)),
    emptyOutDir: true,
  },
});
