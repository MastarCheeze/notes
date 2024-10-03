import { Extension, ExtensionArgs } from "./types.js";

const URL_REGEX = /\b(href|src)=["'](?<url>[^"'\s]*?\.md)["']/g;

// replace all urls to .md files with their .html equivalents
class FixMdUrls extends Extension {
    private oldAbsRoot: string;
    private newAbsRoot: string;

    constructor(args: ExtensionArgs) {
        super(args);
        this.oldAbsRoot = "/" + args.rootSrc;
        this.newAbsRoot = "/" + args.absUrlPrefix;
    }

    override postprocess(html: string): string {
        while (1) {
            // find all urls to markdown files
            const match = URL_REGEX.exec(html);
            if (match === null) break;

            const url = match.groups!.url!;
            let newUrl = url.replace(".md", ".html");

            html = html.slice(0, match.index) + html.slice(match.index).replace(url, newUrl);
        }

        return html
    }
}

export default FixMdUrls;
