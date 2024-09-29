import { Extension, ExtensionArgs } from "./types.js";
import path from "node:path";

const URL_REGEX = /\b(href|src)=["'](?<url>.*?)["']/g;

class FixUrls extends Extension {
    private oldAbsRoot: string;
    private newAbsRoot: string;

    constructor(args: ExtensionArgs) {
        super(args);
        this.oldAbsRoot = "/" + args.rootSrc;
        this.newAbsRoot = "/" + args.absUrlPrefix;
    }

    override postprocess(html: string): string {
        while (1) {
            // find all urls in html
            const match = URL_REGEX.exec(html);
            if (match === null) break;
            const url = match.groups!.url!;
            let newUrl = url;

            // replace all absolute urls to start with the new absolute prefix
            if (newUrl.startsWith(this.oldAbsRoot)) {
                newUrl = path.normalize(newUrl.replace(this.oldAbsRoot, this.newAbsRoot));
            }

            // replace all urls to .md files with their .html equivalents
            newUrl = newUrl.replace(".md", ".html");

            html = html.slice(0, match.index) + html.slice(match.index).replace(url, newUrl);
        }
        return html;
    }
}

export default FixUrls;
