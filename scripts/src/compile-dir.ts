import fs from "node:fs/promises";
import path from "node:path";

import { parse } from "./parse.js";
import { compile } from "./compile.js";
import type { Metadata } from "./parse.js";
import type { CompileConfig, DirTree } from "./compile.js";

async function main() {
    const breadcrumb: CompileConfig["breadcrumb"] = []; // current location in the filesystem

    async function recursiveCompile(dirSrc: string) {
        const dirTree: DirTree = []; // subtree of child files and folders

        // create directory
        const dirOut = dirSrc.replace(SRC_DIR, OUT_DIR);
        const dirRel = path.relative(OUT_DIR, dirOut);
        let dirName = path.basename(dirOut);
        await fs.mkdir(dirOut);

        // check if index.md exists
        let hasIndexFile = true;
        let compileIndexFileFunc;
        try {
            await fs.stat(path.join(dirSrc, "index.md"));
        } catch {
            hasIndexFile = false;
        }
        if (hasIndexFile) {
            const src = path.join(dirSrc, "index.md");
            const out = path.join(dirOut, "index.html");

            const markdown = await fs.readFile(src, { encoding: "utf-8" });
            const { parsed, metadata } = parse(markdown);

            if (parsed.length !== 0) {
                compileIndexFileFunc = compileIndexFile.bind(
                    null,
                    parsed,
                    metadata,
                    out,
                    {
                        dirName,
                        dirRel,
                        breadcrumb,
                        dirTree,
                    }
                );

                breadcrumb.push([metadata.title ?? dirName, dirRel]);
                dirName = metadata.title ?? dirName;
            } else {
                breadcrumb.push([metadata.title ?? dirName, null]);
                dirName = metadata.title ?? dirName;
                hasIndexFile = false
            }

        } else {
            breadcrumb.push([dirName, null]);
        }

        // loop through all files in directory
        const entries = await fs.readdir(dirSrc, { withFileTypes: true });
        for (const entry of entries) {
            const src = path.join(entry.parentPath, entry.name);

            if (entry.isDirectory()) {
                const subDirTree = await recursiveCompile(src);
                if (subDirTree !== undefined)
                    dirTree.push(subDirTree);
            } else if (entry.name === "index.md") {
                ; // skip index.md to compile later
            } else if (entry.name.endsWith(".md")) {
                const out = src.replace(SRC_DIR, OUT_DIR).replace(".md", ".html");
                const rel = path.relative(OUT_DIR, out);

                const markdown = await fs.readFile(src, { encoding: "utf-8" });
                const { parsed, metadata } = parse(markdown);

                const title = await compileMarkdownFile(parsed, metadata, out, { breadcrumb });

                dirTree.push([title, rel]);
            } else {
                const out = src.replace(SRC_DIR, OUT_DIR);
                await fs.copyFile(src, out);
            }
        }

        breadcrumb.pop();

        if (dirTree.length > 0) {
            if (hasIndexFile) {
                await compileIndexFileFunc!();
            }
            return [dirName, (hasIndexFile) ? dirRel : null, dirTree] as [string, string, DirTree]; // join subtree with parent tree
        }
    }

    await recursiveCompile(SRC_DIR);
}

async function compileIndexFile(
    parsed: string,
    metadata: Metadata,
    out: string,
    config: {
        dirName: string,
        dirRel: string,
        breadcrumb: CompileConfig["breadcrumb"],
        dirTree: DirTree,
    }
) {
    const options: Record<string, any> = {};
    options.title = metadata.title ?? config.dirName;
    options.breadcrumb = [...config.breadcrumb, [options.title, config.dirRel]];
    options.baseUrl = BASE_URL;

    let doc;
    if (metadata.dirTree) {
        options.dirTree = config.dirTree;
        doc = compile(parsed, "index", options as CompileConfig);
    } else {
        doc = compile(parsed, "page", options as CompileConfig);  // compile as normal page if directory tree not needed
    }

    // write
    await fs.writeFile(out, doc);
}

async function compileMarkdownFile(
    parsed: string,
    metadata: Metadata,
    out: string,
    config: {
        breadcrumb: CompileConfig["breadcrumb"],
    },
) {
    // compile
    const options: Record<string, any> = {};
    options.title = metadata.title ?? path.basename(out);
    options.breadcrumb = [...config.breadcrumb, ["📄 " + options.title, null]];
    options.baseUrl = BASE_URL;
    const doc = compile(parsed, "page", options as CompileConfig);

    // write
    await fs.writeFile(out, doc);

    return options.title;
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
const SRC_DIR = process.argv[2]!;
const OUT_DIR = parseArgvAfterFlag("-o")[0]!;
const BASE_URL = parseArgvAfterFlag("--base-url")[0]!;

await main();

// TODO sort files by alphabetical order, folders always on top
// TODO order metadata for ordering files/folders within toc pages
