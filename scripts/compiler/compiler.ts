import { marked } from "marked";
import katex from "./katex.js";

marked.use({ breaks: true }).use(katex);

class Compiler {
    constructor() {

    }

    compile(markdown: string): string {
        return marked.parse(markdown) as string;
    }
}

const compiler = new Compiler();
export default compiler;
