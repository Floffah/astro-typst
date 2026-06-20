# @floffah/astro-typst

Typst HTML rendering primitives, an Astro content loader, and a Vite plugin powered by WebAssembly.

This package differs from the real astro-typst as it is targeted at Astro content collections and rendering to true HTML rather than SVGs. If you want to be able to import Typst documents as Astro components or use a more configurable vite plugin, this project is not for you.

You can see this project in action at https://github.com/Floffah/luminous! I also have a full Astro theme for worldbuilding based on Typst at https://github.com/Floffah/astro-world

```ts
// src/content.config.ts
import { typstLoader } from "@floffah/astro-typst/loader";
import { defineCollection, z } from "astro:content";

export const collections = {
    docs: defineCollection({
        loader: typstLoader({ base: "../docs" }),
        schema: z.object({ title: z.string() }),
    }),
};
```

```ts
// astro.config.ts
import { typst } from "@floffah/astro-typst/vite";
import { defineConfig } from "astro/config";

export default defineConfig({ vite: { plugins: [typst()] } });
```

Typst content can define an `astro` dictionary. Its JSON-compatible value is passed to the collection schema:

```typst
#let astro = (title: "Hello", draft: false)

= Hello
```

The root package exports `renderTypst`, `compileTypst`, `typstLoader`, and `typst`. The raw `typstToHtml` and `typstToHtmlWithMetadata` WebAssembly entrypoints are also available from `@floffah/astro-typst/wasm`.
