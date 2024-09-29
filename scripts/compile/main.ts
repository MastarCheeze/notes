import { Marked } from "marked";
import { Extension, ExtensionArgs } from "./extension/main.js";
import Katex from "./extension/katex.js";
import FixUrls from "./extension/fix-urls.js";

class Compiler {
    private marked: Marked;
    private extensions: Extension[] = [];

    constructor(args: { rootSrc: string, rootOut: string, absUrlPrefix: string }) {
        this.marked = new Marked({ breaks: true });
        const extensionArgs: ExtensionArgs = {
            marked: this.marked,
            rootSrc: args.rootSrc,
            rootOut: args.rootOut,
            absUrlPrefix: args.absUrlPrefix,
        };

        // initialise extensions
        const extensionsClasses: (new (extensionArgs: ExtensionArgs) => Extension)[] = [
            Katex,
            FixUrls,
        ];
        for (const extensionClass of extensionsClasses) {
            this.extensions.push(new extensionClass(extensionArgs));
        }
    }

    compile(markdown: string): string {
        for (const ext of this.extensions) {
            markdown = ext.preprocess(markdown);
        }

        let html = this.marked.parse(markdown) as string;
        for (const ext of this.extensions) {
            html = ext.postprocess(html);
        }

        return html;
    }
}

export default Compiler;
