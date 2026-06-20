await Bun.write(
    new URL("../wasm/package.json", import.meta.url),
    `${JSON.stringify({ type: "module", private: true }, null, 2)}\n`,
);

// wasm-pack writes a `*` .gitignore into its output. npm also observes nested
// gitignore files, so give the generated package an explicit publish policy.
await Bun.write(new URL("../wasm/.npmignore", import.meta.url), ".gitignore\n");
