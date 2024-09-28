import { Marked } from "marked";
import katex from "./katex.js";

const marked = new Marked();
marked.use({ breaks: true });
marked.use(katex);

function compile(markdown: string) {
    return marked.parse(markdown) as string;
}

export { marked, compile };
