import { marked } from "marked";
import katex from "marked-katex-extension";
import parseMeta from "parse-md";

type Metadata = { [key: string]: string };

marked.use({ breaks: true });
marked.use(katex());

export function parse(markdown: string): { parsed: string, metadata: Metadata } {
    /**
     * Parse a markdown file into a string of html elements and a metadata object
     */

    markdown = markdown.replace(
        /^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ""
    ); // remove the most common zerowidth characters from the start of the file
    const { content, metadata } = parseMeta(markdown);
    const parsed = marked.parse(content) as string;

    return { parsed, metadata: (metadata ?? {}) as Metadata }; // TODO sanitise output
}
