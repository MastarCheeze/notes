import fs from "node:fs/promises";
import type { PageType } from "./parse.js";

export type Breadcrumb = [label: string, link: string | null][];
export type DirTree = ([label: string, link: string] | [label: string, link: string | null, subtree: DirTree])[];
export type CompileConfig = {
    title: string;
    breadcrumb: Breadcrumb;
    baseUrl: string;
    dirTree?: DirTree;
}

const BASE_TEMPLATE_PATH = "scripts/src/templates/base.html";
const TEMPLATE_PATHS: { [key in PageType]: string } = {
    "page": "scripts/src/templates/page.html",
    "index": "scripts/src/templates/index.html",
}

const baseTemplate = (await fs.readFile(BASE_TEMPLATE_PATH, { encoding: "utf-8" })).normalize();
const templates = Object.fromEntries(Object.keys(TEMPLATE_PATHS).map((key) => [key, ""])) as typeof TEMPLATE_PATHS;
for (const [key, path] of Object.entries(TEMPLATE_PATHS)) {
    templates[key as PageType] = (await fs.readFile(path, { encoding: "utf-8" })).normalize();
    console.log(templates[key as PageType]);
}
console.log(baseTemplate);

export function compile(contents: string, template: PageType, config: CompileConfig) {
    /**
     * Compile html elements parsed from markdown into a html page
     */

    let doc = baseTemplate;
    doc = doc.replace("{{template}}", templates[template]);
    console.log(doc)

    doc = doc.replace("{{content}}", contents);
    doc = doc.replace("{{title}}", config.title);
    doc = doc.replace("{{baseUrl}}", config.baseUrl);
    doc = doc.replace("{{breadcrumb}}", createBreadcrumb(config.breadcrumb));

    if (template === "index") {
        doc = doc.replace("{{dirTree}}", createDirTree(config.dirTree));
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
                html += `<li><a class="folderButton">📁 </a>`;
                if (link !== null)
                    html += `<a href="${link}">${label}</a>`;
                else
                    html += `<span>${label}</span>`;
                html += `${recursiveCreate(subtree)}</li>`;
            }
        }
        html += "</ul>";
        return html;
    }
    let html = recursiveCreate(dirTree);
    html = html.replace(`<ul style="display: none;">`, "<ul>"); // unhide outermost ul element
    return html;
}
