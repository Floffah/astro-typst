import { typstToHtml, typstToHtmlWithMetadata } from "./wasm.js";
import type { MarkdownHeading } from "astro";
import { load } from "cheerio";

export interface CompiledTypst {
    html: string;
    headings: MarkdownHeading[];
    metadata: Record<string, unknown>;
}

export function renderTypst(typst: string): string {
    return prepareHtml(typstToHtml(typst)).html;
}

export function compileTypst(typst: string): CompiledTypst {
    const compiled: unknown = JSON.parse(typstToHtmlWithMetadata(typst));

    if (!isRecord(compiled) || typeof compiled.html !== "string") {
        throw new TypeError(
            "Typst WASM returned an invalid compilation result",
        );
    }

    if (!isRecord(compiled.metadata)) {
        throw new TypeError("the Typst `astro` variable must be a dictionary");
    }

    const rendered = prepareHtml(compiled.html);
    return {
        html: rendered.html,
        headings: rendered.headings,
        metadata: compiled.metadata,
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function prepareHtml(html: string): {
    html: string;
    headings: MarkdownHeading[];
} {
    const $ = load(html, null, false);
    const headings: MarkdownHeading[] = [];
    const usedIds = new Set(
        $("[id]")
            .map((_, element) => $(element).attr("id"))
            .get()
            .filter((id): id is string => Boolean(id)),
    );

    $("h1, h2, h3, h4, h5, h6").each((_, heading) => {
        const element = $(heading);
        const text = element.text().trim();
        let id = element.attr("id");

        if (!id) {
            const base = slugify(text) || "heading";
            id = base;
            let suffix = 2;
            while (usedIds.has(id)) {
                id = `${base}-${suffix}`;
                suffix += 1;
            }
            element.attr("id", id);
            usedIds.add(id);
        }

        headings.push({
            depth: Number(heading.tagName.slice(1)),
            slug: id,
            text,
        });
    });

    return { html: $.html(), headings };
}

function slugify(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/\p{Mark}+/gu, "")
        .toLocaleLowerCase("en")
        .replace(/[’']/gu, "")
        .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
        .replace(/^-+|-+$/gu, "");
}
