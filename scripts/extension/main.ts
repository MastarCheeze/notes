import { DirectiveConfig } from "marked-directive";
import { Extension } from "./extension.js";

class ExtensionCompiler {
    private extensions: Extension[];

    constructor(...args: Extension[]) {
        this.extensions = args;
    }

    directives(): DirectiveConfig[] {
        const directives: DirectiveConfig[] = [];
        for (const ext of this.extensions) {
            if (ext.directive) {
                directives.push(ext.directive);
            }
        }
        return directives;
    }

    compile(markdown: string, compileFunc: (markdown: string) => string): string {
        for (const ext of this.extensions) {
            if (ext.preprocess) {
                markdown = ext.preprocess(markdown);
            }
        }

        let html = compileFunc(markdown);
        for (const ext of this.extensions) {
            if (ext.postprocess) {
                html = ext.postprocess(html);
            }
        }

        return html;
    }
}
