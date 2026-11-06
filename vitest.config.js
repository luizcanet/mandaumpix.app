import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs}",
      "test/**/*.{test,spec}.{js,mjs,cjs}",
    ],
    server: {
      deps: {
        inline: [/^@modnes\//],
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.js"],
      exclude: ["src/**/*.{test,spec,stories}.js"],
    },
  },
});
