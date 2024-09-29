import { Extension, ExtensionArgs } from "./types.js";

const URL_REGEX = /\[.*\]\((?<url>.*\.md)\)/g;

// replace all urls to .md files with their .html equivalents
class FixUrls extends Extension {
    private oldAbsRoot: string;
    private newAbsRoot: string;

    constructor(args: ExtensionArgs) {
        super(args);
        this.oldAbsRoot = "/" + args.rootSrc;
        this.newAbsRoot = "/" + args.absUrlPrefix;
    }

    override preprocess(markdown: string): string {
        while (1) {
            // find all urls to markdown files and images in markdown
            const match = URL_REGEX.exec(markdown);
            if (match === null) break;

            const url = match.groups!.url!;
            let newUrl = url.replace(".md", ".html");

            markdown = markdown.slice(0, match.index) + markdown.slice(match.index).replace(url, newUrl);
        }

        return markdown
    }
}

export default FixUrls;
