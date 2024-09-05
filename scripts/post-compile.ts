const absUrlRegex = /\b(href|src)=["'](\/.*?)["']/g;
const mdExtensionRegex = /\bhref=["'](.*\.md?)["']/g;

export class PostCompiler {
    absUrlPrefix: string;

    constructor(absUrlprefix: string) {
        this.absUrlPrefix = absUrlprefix;
    }

    compile(doc: string): string {
        doc = this.fixUrls(doc);
        return doc;
    }

    private fixUrls(doc: string) {
        absUrlRegex.lastIndex = 0;
        while (1) {
            const match = absUrlRegex.exec(doc);
            if (match === null) break;

            const url = match[2];
            doc = doc.slice(0, match.index) + doc.slice(match.index).replace(url, this.absUrlPrefix + url, );
        }

        mdExtensionRegex.lastIndex = 0;
        while (1) {
            const match = mdExtensionRegex.exec(doc);
            if (match === null) break;

            doc = doc.slice(0, match.index) + doc.slice(match.index).replace(".md", ".html");
        }

        return doc;
    }
}
