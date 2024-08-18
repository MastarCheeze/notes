import fs from "node:fs/promises";
import path from "node:path";

import { parse } from "./parse.js";
import { compile } from "./compile.js";
import type { CompileConfig, DirTree } from "./compile.js";

async function main() {
    const breadcrumb: CompileConfig["breadcrumb"] = [];

    async function recursiveCompile(dir: string) {
        const dirTree: DirTree = [];

        const dirOut = dir.replace(SRC_DIR, OUT_DIR);
        const dirRel = path.relative(OUT_DIR, dirOut);
        await fs.mkdir(dirOut);

        breadcrumb.push([path.basename(dirOut), dirRel]);

        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const src = path.join(entry.parentPath, entry.name);

            if (entry.isDirectory()) {
                const subDirTree = await recursiveCompile(src);
                if (subDirTree !== undefined)
                    dirTree.push(subDirTree);
            } else if (entry.name.endsWith(".md")) {
                const out = src.replace(SRC_DIR, OUT_DIR).replace(".md", ".html");
                const rel = path.relative(OUT_DIR, out);

                const title = await compileMarkdownFile(src, out, breadcrumb);

                dirTree.push([title, rel]);
            } else {
                const out = src.replace(SRC_DIR, OUT_DIR);
                await fs.copyFile(src, out);
            }
        }

        breadcrumb.pop();

        if (dirTree.length > 0) {
            await compileIndexFile(dirOut, breadcrumb, dirTree);
            return [path.basename(dirOut), dirRel, dirTree] as [string, string, DirTree];
        }
    }

    await recursiveCompile(SRC_DIR);
}

async function compileMarkdownFile(src: string, out: string, breadcrumb: CompileConfig["breadcrumb"]) {
    // read
    const markdown = await fs.readFile(src, { encoding: "utf-8" });

    // parse and compile
    const { parsed, metadata } = parse(markdown);
    const options: { [key: string]: any } = {};
    options.title = metadata.title ?? path.basename(out);
    options.breadcrumb = [...breadcrumb, [options.title, null]];
    options.baseUrl = BASE_URL;
    const doc = compile(parsed, "page", options as CompileConfig);

    // write
    await fs.writeFile(out, doc);

    return options.title;
}

async function compileIndexFile(
    dirOut: string,
    breadcrumb: CompileConfig["breadcrumb"],
    dirTree: DirTree,
) {
    // compile
    const options: { [key: string]: any } = {};
    options.title = path.basename(dirOut);
    options.breadcrumb = [...breadcrumb, [options.title, null]];
    options.baseUrl = BASE_URL;
    options.dirTree = dirTree;
    const doc = compile("", "index", options as CompileConfig);

    // write
    await fs.writeFile(path.join(dirOut, "index.html"), doc);
}

function parseArgvAfterFlag(flag: string) {
    const args: string[] = [];
    const idx = process.argv.indexOf(flag);
    if (idx === -1) return args;

    let currIdx = idx + 1;
    while (!(process.argv[currIdx] === undefined || process.argv[currIdx].startsWith("-"))) {
        args.push(process.argv[currIdx]);
        ++currIdx;
    }

    return args;
}

// parse cli args
const SRC_DIR = process.argv[2];
const OUT_DIR = parseArgvAfterFlag("-o")[0];
const BASE_URL = parseArgvAfterFlag("--base-url")[0];

await main();

// TODO index.md files for custom folder titles
// TODO sort files by alphabetical order, folders always on top
// TODO order metadata for ordering files/folders within toc pages
// TODO make the first h1 the title if does not have title metadata
// TODO make expandable/collapsible file structure
