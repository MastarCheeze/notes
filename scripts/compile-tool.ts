import { marked } from "marked";
import katex from "marked-katex-extension";

marked.use({ breaks: true }).use(katex());

export function compileTool(markdown: string) {
    return marked.parse(markdown) as string;
}
