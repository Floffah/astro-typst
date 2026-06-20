import { renderTypst } from "./render.js";
import type { PluginOption } from "vite";

export interface TypstPluginOptions {
    include?: RegExp;
}

/** Transform imported `.typ` files into modules whose default export is HTML. */
export function typst({
    include = /\.typ$/,
}: TypstPluginOptions = {}): PluginOption {
    return {
        name: "astro-typst",
        enforce: "pre",
        transform: {
            filter: { id: include },
            handler(source) {
                const html = renderTypst(source);
                return {
                    code: `export default ${JSON.stringify(html)};`,
                    map: null,
                };
            },
        },
    };
}
