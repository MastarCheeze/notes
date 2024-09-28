const URL_REGEX = /\b(href|src)=["'](?<url>\/.*?)["']/g;

function fixUrls(html: string, oldAbsRoot: string, newAbsRoot: string): string {
    // find all urls in html
    while (1) {
        const match = URL_REGEX.exec(html);
        if (match === null) break;
        const url = match.groups!.url!;
        let newUrl = url;

        // replace all absolute urls with the new root directory
        if (newUrl.startsWith("/")) {
            newUrl = newUrl.replace(oldAbsRoot, newAbsRoot);
        }

        // replace all urls to .md files with their .html equivalents
        if (newUrl.endsWith(".md")) {
            newUrl = newUrl.replace(".md", ".html");
        }

        html = html.slice(0, match.index) + html.slice(match.index).replace(url, newUrl);
    }
    return html
}

export { fixUrls };
