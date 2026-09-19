import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolves the "@/*" alias from tsconfig.json natively; Vite supports this
    // directly, so no vite-tsconfig-paths plugin is needed.
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    // `publicEnv` in lib/env.ts is evaluated at module scope, and Vitest does
    // not load .env.local into process.env. Without these, importing
    // "@/lib/env" throws in every test that touches it.
    //
    // Server secrets are deliberately absent: getServerEnv() is lazy, and the
    // env test supplies its own values directly to parseServerEnv.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    },
  },
});
