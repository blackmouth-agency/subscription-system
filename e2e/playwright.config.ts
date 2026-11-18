import path from "node:path";
import { defineConfig } from "@playwright/test";

process.loadEnvFile(path.resolve(__dirname, "../supabase/.env.test"));

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://localhost:5173" },
  webServer: {
    command: "npm run dev -w conoce-mas",
    cwd: path.resolve(__dirname, ".."),
    url: "http://localhost:5173",
    // En CI siempre arranca uno nuevo, apuntando al Supabase de esta corrida.
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_SUPABASE_URL: process.env.API_URL!,
      VITE_SUPABASE_PUBLISHABLE_KEY: process.env.PUBLISHABLE_KEY!,
    },
  },
});
