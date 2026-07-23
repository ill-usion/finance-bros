import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync("./certs/localhost+3-key.pem"),
      cert: fs.readFileSync("./certs/localhost+3.pem"),
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png", "assets/rial.webp"],
      manifest: {
        name: "MEEZAN — Student Spending",
        short_name: "MEEZAN",
        description: "Track and balance your student spending in OMR.",
        lang: "en",
        theme_color: "#7b1e23",
        background_color: "#fbf8f2",
        display: "fullscreen",
        display_override: ["fullscreen", "standalone"],
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff2,png,webp,svg}"],
      },
    }),
  ],
});
