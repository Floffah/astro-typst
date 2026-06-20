import {
    initSync,
    typstToHtml,
    typstToHtmlWithMetadata,
} from "../wasm/typst_wasm.js";
import { readFileSync } from "node:fs";

initSync({
    module: readFileSync(
        new URL("../wasm/typst_wasm_bg.wasm", import.meta.url),
    ),
});

export { typstToHtml, typstToHtmlWithMetadata };
