import fs from "node:fs/promises";

export type DirTree = ([label: string, link: string] | [label: string, link: string, DirTree])[];
export interface CompileConfig {
    title: string;
    breadcrumb: [label: string, link: string | null][];
    baseUrl: string;
    dirTree?: DirTree;
}

const TEMPLATE_PATH = "scripts/src/template.html";
const template = await fs.readFile(TEMPLATE_PATH, { encoding: "utf-8" });

export function compile(contents: string, config: CompileConfig) {
    /**
     * Compile html elements parsed from markdown into a html page
     */

    let doc = template;

    doc = doc.replace("$$content$$", contents);
    doc = doc.replace("$$title$$", config.title);
    doc = doc.replace("$$baseUrl$$", config.baseUrl);
    doc = doc.replace("$$breadcrumb$$", createBreadcrumb(config.breadcrumb));
    doc = doc.replace("$$dirTree$$", createDirTree(config.dirTree));

    return doc;
}

function createBreadcrumb(breadcrumb: CompileConfig["breadcrumb"]) {
    let html = "";
    for (const [ label, link ] of breadcrumb) {
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
        let html = "<ul>";
        for (const [label, link, subtree] of dirTree) {
            if (subtree === undefined)
                html += `<li class="file"><a href="${link}">${label}</a></li>`;
            else {
                // html += `<li><details><summary><a href="${link}">${label}</a></summary>${recursiveCreate(subtree)}</details></li>`;
                html += `<li class="folder"><a href="${link}">${label}</a>${recursiveCreate(subtree)}</li>`;
            }
        }
        html += "</ul>";
        return html;
    }
    return recursiveCreate(dirTree);
}
