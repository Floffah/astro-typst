import { defineConfig } from "tsdown";

export default defineConfig({
    entry: ["src/index.ts", "src/loader.ts", "src/vite.ts", "src/wasm.ts"],
    dts: true,
    format: ["esm", "cjs"],
    platform: "node",
    target: "node22",
    sourcemap: true,
    minify: process.env.CI === "true",
    deps: {
        neverBundle: ["astro", "vite", /^\.\.\/wasm\//],
    },
    outExtensions: (context) => {
        if (context.format === "cjs") {
            return {
                js: ".cjs",
                dts: ".d.cts",
            };
        }

        return {
            js: ".js",
            dts: ".d.ts",
        };
    },
});
