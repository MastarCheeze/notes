const absUrlRegex = /\b(href|src)=["'](\/.*?)["']/g;
const mdExtensionRegex = /\bhref=["'](.*\.md?)(#.*)?["']/g;
const customListBulletsRegex = /<li>((?<symbol>.)\. ).*/g;

export class PostCompiler {
    absUrlPrefix: string;

    constructor(absUrlprefix: string) {
        this.absUrlPrefix = absUrlprefix;
    }

    compile(doc: string): string {
        doc = this.fixUrls(doc);
        doc = this.customListBullets(doc);
        return doc;
    }

    private fixUrls(doc: string) {
        // append root directory prefix to absolute url
        while (1) {
            const match = absUrlRegex.exec(doc);
            if (match === null) break;

            const url = match[2];
            doc = doc.slice(0, match.index) + doc.slice(match.index).replace(url, this.absUrlPrefix + url);
        }

        // change all .md links to .html
        while (1) {
            const match = mdExtensionRegex.exec(doc);
            if (match === null) break;

            doc = doc.slice(0, match.index) + doc.slice(match.index).replace(".md", ".html");
        }

        return doc;
    }

    private customListBullets(doc: string) {
        // change all list items with a symbol + a period at the start to custom bullet point

        while (1) {
            const match = customListBulletsRegex.exec(doc);
            if (match === null) break;
            doc = doc.slice(0, match.index) + doc.slice(match.index).replace("<li>", `<li style="list-style-type:'${match.groups!.symbol!} ';">`).replace(match[1], "");
        }

        return doc;
    }
}
