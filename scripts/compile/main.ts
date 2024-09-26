import { marked } from "marked";
import katex from "./katex.js";
import directive from "./directive/directive.js";

marked.use({ breaks: true }).use(katex).use(directive);

function compile(markdown: string) {
    return marked.parse(markdown) as string;
}

export { compile };
