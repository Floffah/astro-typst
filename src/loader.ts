import { isTypstEntryPath, toPosixPath, typstEntryId } from "./paths.js";
import { type CompiledTypst, compileTypst } from "./render.js";
import type { Loader } from "astro/loaders";
import { glob, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface TypstLoaderOptions {
    /** Directory containing Typst entries, resolved relative to Astro's root. */
    base?: string;
}

interface CompiledEntry {
    id: string;
    source: string;
    data: Record<string, unknown>;
    html: string;
    headings: CompiledTypst["headings"];
    filePath: string;
    digest: string;
}

export function typstLoader({
    base = "src/content",
}: TypstLoaderOptions = {}): Loader {
    return {
        name: "astro-typst-loader",
        async load({
            config,
            generateDigest,
            logger,
            parseData,
            store,
            watcher,
        }) {
            const rootPath = fileURLToPath(config.root);
            const basePath = fileURLToPath(
                new URL(base.endsWith("/") ? base : `${base}/`, config.root),
            );

            async function rebuildAll(): Promise<void> {
                const filePaths: string[] = [];
                for await (const entry of glob("**/*.typ", { cwd: basePath })) {
                    const entryPath = toPosixPath(entry);
                    if (isTypstEntryPath(entryPath))
                        filePaths.push(resolve(basePath, entry));
                }

                if (filePaths.length === 0)
                    logger.warn(`No Typst files found in ${basePath}`);

                const entries = await Promise.all(
                    filePaths.map(async (filePath): Promise<CompiledEntry> => {
                        const entryPath = toPosixPath(
                            relative(basePath, filePath),
                        );
                        const id = typstEntryId(entryPath);
                        const source = await readFile(filePath, "utf8");
                        const compiled = compileTypst(source);
                        const data = (await parseData({
                            id,
                            data: compiled.metadata,
                            filePath,
                        })) as Record<string, unknown>;

                        return {
                            id,
                            source,
                            data,
                            html: compiled.html,
                            headings: compiled.headings,
                            filePath: toPosixPath(relative(rootPath, filePath)),
                            digest: generateDigest(
                                JSON.stringify({ source, html: compiled.html }),
                            ),
                        };
                    }),
                );

                entries.sort((left, right) => left.id.localeCompare(right.id));
                const entryIds = new Set<string>();
                for (const entry of entries) {
                    if (entryIds.has(entry.id)) {
                        throw new Error(
                            `More than one Typst content file resolves to id "${entry.id}"`,
                        );
                    }
                    entryIds.add(entry.id);
                }

                const untouchedEntries = new Set(store.keys());
                for (const entry of entries) {
                    untouchedEntries.delete(entry.id);
                    store.set({
                        id: entry.id,
                        data: entry.data,
                        body: entry.source,
                        digest: entry.digest,
                        filePath: entry.filePath,
                        rendered: {
                            html: entry.html,
                            metadata: { headings: entry.headings },
                        },
                    });
                }
                untouchedEntries.forEach((id) => store.delete(id));
            }

            await rebuildAll();
            if (!watcher) return;

            watcher.add(basePath);
            let activeRebuild: Promise<void> | undefined;
            let rebuildAgain = false;

            const reload = async (filePath: string): Promise<void> => {
                const entryPath = toPosixPath(relative(basePath, filePath));
                if (!isTypstEntryPath(entryPath)) return;

                try {
                    rebuildAgain = true;
                    activeRebuild ??= (async () => {
                        while (rebuildAgain) {
                            rebuildAgain = false;
                            await rebuildAll();
                        }
                    })().finally(() => {
                        activeRebuild = undefined;
                    });
                    await activeRebuild;
                    logger.info(`Reloaded Typst content after ${entryPath}`);
                } catch (error) {
                    const message =
                        error instanceof Error ? error.message : String(error);
                    logger.error(
                        `Failed to reload Typst content after ${entryPath}: ${message}`,
                    );
                }
            };

            watcher.on("add", reload);
            watcher.on("change", reload);
            watcher.on("unlink", reload);
        },
    };
}
