import fs from "node:fs/promises";

export type PageType = "page" | "index";
export type DirTree = ([label: string, link: string] | [label: string, link: string, DirTree])[];
export interface CompileConfig {
    type: PageType;
    title: string;
    breadcrumb: [label: string, link: string | null][];
    baseUrl: string;
    dirTree?: DirTree;
}

const templatePaths: { [key in PageType]: string } = {
    "page": "scripts/src/templates/page.html",
    "index": "scripts/src/templates/index.html",
}

const templates = Object.fromEntries(Object.keys(templatePaths).map((key) => [key, ""])) as typeof templatePaths;
for (const [key, path] of Object.entries(templatePaths)) {
    templates[key as PageType] = await fs.readFile(path, { encoding: "utf-8" })
}

export function compile(contents: string, template: PageType, config: CompileConfig) {
    /**
     * Compile html elements parsed from markdown into a html page
     */

    let doc = templates[template];

    doc = doc.replace("$$content$$", contents);
    doc = doc.replace("$$title$$", config.title);
    doc = doc.replace("$$baseUrl$$", config.baseUrl);
    doc = doc.replace("$$breadcrumb$$", createBreadcrumb(config.breadcrumb));

    if (template === "index") {
        doc = doc.replace("$$dirTree$$", createDirTree(config.dirTree));
    }

    return doc;
}

function createBreadcrumb(breadcrumb: CompileConfig["breadcrumb"]) {
    let html = "";
    for (const [label, link] of breadcrumb) {
        if (link !== null)
            html += `<li><a href="${link}">${label}</a></li>`;
        else
            html += `<li>${label}</li>`;
    }
    return html;
}

function createDirTree(dirTree: CompileConfig["dirTree"]) {
    if (dirTree === undefined)
        return "";

    function recursiveCreate(dirTree: DirTree) {
        let html = `<ul style="display: none;">`;
        for (const [label, link, subtree] of dirTree) {
            if (subtree === undefined)
                html += `<li><a href="${link}">📄 ${label}</a></li>`;
            else {
                // html += `<li><details><summary><a href="${link}">${label}</a></summary>${recursiveCreate(subtree)}</details></li>`;
                html += `<li><a class="folderButton">📁 </a><a href="${link}">${label}</a>${recursiveCreate(subtree)}</li>`;
            }
        }
        html += "</ul>";
        return html;
    }
    let html = recursiveCreate(dirTree);
    html = html.replace(`<ul style="display: none;">`, "<ul>"); // unhide outermost ul element
    return html;
}
