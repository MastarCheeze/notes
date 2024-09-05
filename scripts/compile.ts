import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

import { compileTool } from "./compile-tool.js";
import { createBreadcrumb, createDirTree } from "./compile-components.js";
import type { Breadcrumb, DirTree } from "./compile-components.js";

type FileMap = {
    [link: string]: {
        content: string;
        label: string;
        order: number | null;
        isDir: boolean;
    };
};
type DirTreeMap = { [link: string]: DirTreeMap | null };

// === templates ===
const baseTemplate = fs.readFileSync("templates/base.html", { encoding: "utf-8" });
const templateNames = {
    page: "templates/page.html",
    index: "templates/index.html",
};
const templates = Object.fromEntries(
    Object.entries(templateNames).map(([key, value]) => [
        key,
        replaceVariables(baseTemplate, { template: fs.readFileSync(value, { encoding: "utf-8" }) }),
    ])
) as typeof templateNames;

// === helper functions ===
function normalizeRelPath(link: string) {
    // add a ./ in front of all relative paths to standardize file registration
    // path.join and path.relative removes the leading ./, so always use this function afterwards
    if (link === "") {
        return ".";
    } else if (link.split(path.sep)[0] !== ".") {
        return [".", link].join(path.sep);
    }
    return link;
}

function replaceVariables(str: string, vars: Record<string, string>): string {
    let ret = str;
    for (const [key, value] of Object.entries(vars)) {
        ret = ret.replaceAll(new RegExp(`\\$\\{\\s*${key}\\s*\\}`, "g"), value);
    }
    return ret;
}

function compileFile(markdown: string, template: string, vars: Record<string, string>): string {
    const content = compileTool(markdown);
    let doc = template;
    doc = replaceVariables(doc, vars);
    doc = replaceVariables(doc, { content });
    // doc = replaceVariables(doc, { ".*": "" });
    return doc;
}

export class Compiler {
    private fileMap: FileMap;
    private dirTreeMap: DirTreeMap;

    constructor() {
        this.fileMap = {};
        this.dirTreeMap = {};
    }

    register(link: string, details: FileMap[0]): void {
        link = normalizeRelPath(link);

        // === add to filemap ===
        this.fileMap[link] = details;

        // === add to dirtreemap ===
        // follow list of parts to get parent dirtreemap
        const parts = link.split(path.sep);
        let curDirTreeMap = this.dirTreeMap;
        for (const part of parts.slice(0, -1)) {
            curDirTreeMap = curDirTreeMap[part]!;
            assert(curDirTreeMap !== null, `Directory ${part} for file ${link} is not registered`);
        }
        // add entry to parent dirtreemap
        curDirTreeMap[parts.at(-1)!] = details.isDir ? {} : null;
    }

    compile(link: string): string {
        const fileEntry = this.fileMap[normalizeRelPath(link)];
        const doc = compileFile(fileEntry.content, templates.page, {
            title: fileEntry.label,
            breadcrumb: this.compileBreadcrumb(link, false),
        });
        return doc;
    }

    compileIndex(link: string): string {
        const fileEntry = this.fileMap[normalizeRelPath(link)];
        const doc = compileFile(fileEntry.content, templates.index, {
            title: fileEntry.label,
            breadcrumb: this.compileBreadcrumb(link, true),
            dirTree: this.compileDirTree(link),
        });
        return doc;
    }

    private compileBreadcrumb(link: string, isDir: boolean) {
        link = normalizeRelPath(link);

        const breadcrumb: Breadcrumb = [];
        let curLink = link;
        do {
            breadcrumb.splice(0, 0, {
                link: (() => {
                    if (!isDir) return normalizeRelPath(path.relative(path.dirname(link), curLink));
                    // the link of a dir is the dirname, so no need for path.dirname
                    // might be avoidable if index.md is registered instead of the dir?
                    else return normalizeRelPath(path.relative(link, curLink));
                })(),
                label: this.fileMap[curLink].label,
                isDir: this.fileMap[curLink].isDir,
            });
            curLink = normalizeRelPath(path.join(curLink, ".."));
        } while (curLink !== "./..");
        return createBreadcrumb(breadcrumb);
    }

    private compileDirTree(link: string): string {
        link = normalizeRelPath(link);

        // recursive create dirtree
        const recursiveConvert = (curPart: string, curDirTree: DirTreeMap) => {
            // convert dirtreemap into list for sorting
            const dirTree = Object.keys(curDirTree).reduce((result, part) => {
                const curLink = [curPart, part].join(path.sep);
                result.push({
                    link: curLink,
                    label: this.fileMap[normalizeRelPath(path.join(link, curLink))].label,
                    subtree: curDirTree[part] ? recursiveConvert(curLink, curDirTree[part]) : null,
                });
                return result;
            }, [] as DirTree);

            // sort dirtree
            dirTree.sort((a, b) => {
                // sort by explicit order first
                assert(a.link !== null && b.link !== null); // temporary until linkless dirs are added
                const aOrder = this.fileMap[normalizeRelPath(path.join(link, a.link))].order;
                const bOrder = this.fileMap[normalizeRelPath(path.join(link, b.link))].order;
                const orderScore = (aOrder ?? Number.POSITIVE_INFINITY) - (bOrder ?? Number.POSITIVE_INFINITY);
                if (!Number.isNaN(orderScore) && orderScore !== 0) {
                    return orderScore;
                }

                // sort by folder/file
                const folderScore = (a.subtree ? 0 : 1) - (b.subtree ? 0 : 1);
                if (!Number.isNaN(folderScore) && folderScore !== 0) {
                    return folderScore;
                }

                // sort alphabetically
                return a.label.localeCompare(b.label);
            });

            return dirTree;
        };

        // get dirtreemap
        const parts = link.split(path.sep);
        let curDirTreeMap = this.dirTreeMap;
        for (const part of parts) {
            curDirTreeMap = curDirTreeMap[part]!;
            assert(curDirTreeMap !== null, `Directory ${part} does not exist for file ${link}`);
        }

        return createDirTree(recursiveConvert(".", curDirTreeMap));
    }
}
