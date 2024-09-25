import fs from "node:fs";
import path from "node:path";

const baseDir = "templates";

const baseTemplateSrc = "base.html";
const baseTemplate = readFile(baseTemplateSrc);

const templateSrc = {
    page: "page.html",
    index: "index.html",
};
const templates = (() => {
    const temp: Record<string, string> = {};
    for (const [key, src] of Object.entries(templateSrc)) {
        temp[key] = replaceVariables(baseTemplate, { template: readFile(src) });
    }
    return temp as typeof templateSrc;
})();

function readFile(src: string): string {
    return fs.readFileSync(path.join(baseDir, src), { encoding: "utf-8" });
}

function replaceVariables(str: string, args: Record<string, string>): string {
    let ret = str;
    for (const [key, value] of Object.entries(args)) {
        ret = ret.replaceAll(new RegExp(`\\$\\{\\s*${key}\\s*\\}`, "g"), value);
    }
    return ret;
}

function template(type: keyof typeof templates, args: Record<string, string>): string {
    return replaceVariables(templates[type], args);
}

export default template
