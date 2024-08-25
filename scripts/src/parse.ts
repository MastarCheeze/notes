import { marked } from "marked";
import katex from "marked-katex-extension";
import parseMeta from "parse-md";

export type PageType = "page" | "index";
export type Metadata = {
    title?: string;
    order?: number;
    type?: PageType;
    dirTree: boolean;
};

marked.use({ breaks: true }).use(katex());

export function parse(markdown: string): { parsed: string; metadata: Metadata } {
    /**
     * Parse a markdown file into a string of html elements and a metadata object
     */

    markdown = markdown.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ""); // remove the most common zerowidth characters from the start of the file
    const { content, metadata: rawMetadata } = parseMeta(markdown) as {
        content: string;
        metadata: Record<string, string>;
    };
    const parsed = marked.parse(content) as string;

    // process metadata
    const metadata: Metadata = {
        title: rawMetadata.title ?? parsed.match(/<h1>(.*)<\/h1>/)?.[1],
        order: rawMetadata.order ? parseInt(rawMetadata.order) : undefined,
        type: rawMetadata.type as PageType | undefined,
        dirTree: rawMetadata.dirTree !== undefined,
    };

    return { parsed, metadata }; // TODO sanitise output
}
