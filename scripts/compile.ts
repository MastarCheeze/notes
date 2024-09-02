import fs from "node:fs";
import { marked } from "marked";
import katex from "marked-katex-extension";

type FileMap = {
    [key: string]: {
        content: string;
        label: string;
        order: number | null;
        isDir: boolean;
    };
};
type DirTree = { [key: string]: DirTree | null };

marked.use({ breaks: true }).use(katex());

const baseTemplate = fs.readFileSync("templates/base.html", { encoding: "utf-8" });
const templates = {
    page: fs.readFileSync("templates/page.html", { encoding: "utf-8" }),
    index: fs.readFileSync("templates/index.html", { encoding: "utf-8" }),
};

function replaceVariables(str: string, vars: Record<string, string>): string {
    let ret = str;
    for (const [key, value] of Object.entries(vars)) {
        ret.replaceAll(new RegExp(`\\$\\{\\s*${key}\\s*\\}`), value);
    }
    return ret;
}

function compile(markdown: string, template: string, vars: Record<string, string>): string {
    const content = marked.parse(markdown) as string;
    let doc = baseTemplate;
    doc = replaceVariables(doc, { template });
    doc = replaceVariables(doc, vars);
    doc = replaceVariables(doc, { content });
    doc = replaceVariables(doc, { ".*": "undefined" });
    return doc;
}

export class Compiler {
    private fileMap: FileMap;
    private dirTree: DirTree;

    constructor() {
        this.fileMap = {};
        this.dirTree = {};
    }
}
