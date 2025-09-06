import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "/workforce/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@utils": path.resolve(__dirname, "src/utils"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "020f77fa8425.ngrok-free.app",
    ],
    proxy: {
      "/workforce/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/workforce\/api/, "/api"),
      },
      // Corrected proxy for static files (images)
      "/workforce/uploads": {
        target: "http://127.0.0.1:8000", // 👈 Corrected IP address
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/workforce\/uploads/, "/workforce/uploads"),
      },
    },
  },
});