import type { Marked } from "marked";

type ExtensionArgs = {
    marked: Marked;
    rootSrc: string;
    rootOut: string;
    absUrlPrefix: string;
};

abstract class Extension {
    constructor(args: ExtensionArgs) {
        this.init(args);
    }

    init(args: ExtensionArgs) {}

    preprocess(markdown: string): string {
        return markdown;
    }

    postprocess(html: string): string {
        return html;
    }
}

export { Extension, ExtensionArgs };
