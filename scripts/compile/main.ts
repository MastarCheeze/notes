import { Marked } from "marked";
import { Extension, ExtensionArgs } from "./extension/types.js";

import Katex from "./extension/katex.js";
import FixUrls from "./extension/fix-urls.js";
import Directive from "./extension/directive/main.js";

class Compiler {
    private marked: Marked;
    private extensions: Extension[] = [];

    private static extensionsClasses: (new (extensionArgs: ExtensionArgs) => Extension)[] = [
        Katex,
        FixUrls,
        Directive
    ];

    constructor(args: { rootSrc: string, rootOut: string, absUrlPrefix: string }) {
        this.marked = new Marked({ breaks: true });
        const extensionArgs: ExtensionArgs = {
            marked: this.marked,
            rootSrc: args.rootSrc,
            rootOut: args.rootOut,
            absUrlPrefix: args.absUrlPrefix,
        };

        // initialise extensions
        for (const extensionClass of Compiler.extensionsClasses) {
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
