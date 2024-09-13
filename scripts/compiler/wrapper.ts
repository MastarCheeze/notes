import { marked } from "marked";
import katex from "marked-katex-extension";

marked.use({ breaks: true }).use(
    katex({
        macros: { "\\unit": "\\text{~#1}" },
    })
);

export function compile(markdown: string) {
    return marked.parse(markdown) as string;
}
