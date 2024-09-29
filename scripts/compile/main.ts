import { Marked } from "marked";
import { Extension, ExtensionArgs } from "./extension/main.js";
import KatexExtension from "./extension/katex.js";

class Compiler {
    private marked: Marked;
    private extensions: Extension[];

    constructor() {
        this.marked = new Marked({ breaks: true });
        const args: ExtensionArgs = {
            marked: this.marked,
            rootSrc: "",
            rootOut: "",
            absUrlPrefix: "",
        };

        // initialise extensions
        const extensionsClasses: (new (args: ExtensionArgs) => Extension)[] = [
            KatexExtension
        ];
        this.extensions = [];
        for (const extensionClass of extensionsClasses) {
            this.extensions.push(new extensionClass(args));
        }
    }

    compile(markdown: string): string {
        for (const ext of this.extensions) {
            markdown = ext.preprocess(markdown);
        }

        let html = this.marked.parse(markdown) as string;
        for (const ext of this.extensions) {
            if (ext.postprocess) {
                html = ext.postprocess(html);
            }
        }

        return html;
    }
}

export default Compiler;
