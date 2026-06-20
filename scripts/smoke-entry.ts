import { compileTypst } from "@floffah/astro-typst";

export const compiled = compileTypst(
    '#let astro = (title: "Vite SSR")\n= Hello',
);
