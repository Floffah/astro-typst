import { createServer } from "vite";

const vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
    ssr: { noExternal: ["@floffah/astro-typst"] },
});

try {
    const module = await vite.ssrLoadModule("./scripts/smoke-entry.ts");
    const compiled = module.compiled;

    if (compiled.metadata.title !== "Vite SSR") {
        throw new Error("Vite SSR loaded astro-typst but compilation failed");
    }
} finally {
    await vite.close();
}
