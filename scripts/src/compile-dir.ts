import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert";

import { parse } from "./parse.js";
import { compile } from "./compile.js";
import type { CompileConfig, Breadcrumb, DirTree } from "./compile.js";

async function main() {
    const breadcrumb: Breadcrumb = []; // current location in the filesystem

    async function recursiveCompile(currDirSrc: string) {
        const dirTree: DirTree = []; // subtree of child files and folders

        // create directory
        const currDirOut = currDirSrc.replace(SRC_DIR, OUT_DIR);
        const currDirLink = path.relative(OUT_DIR, currDirOut);
        await fs.mkdir(currDirOut);

        // check if index.md exists
        const indexSrc = path.join(currDirSrc, "index.md");
        let hasIndexMd = true;
        let indexParsed = null;
        let indexMetadata = null;
        try {
            await fs.stat(indexSrc);
        } catch {
            hasIndexMd = false;
        }
        if (hasIndexMd) {  // parse index.md to prepare for compiling
            const markdown = await fs.readFile(indexSrc, { encoding: "utf-8" });
            ({ parsed: indexParsed, metadata: indexMetadata } = parse(markdown));
        }
        const currDirTitle = indexMetadata?.title ?? path.basename(currDirOut);

        // link to index.html only if render dir tree is enabled
        if (indexMetadata?.dirTree)
            breadcrumb.push([currDirTitle, currDirLink]);
        else
            breadcrumb.push([currDirTitle, null]);

        // loop through all entries in directory
        const entries = await fs.readdir(currDirSrc, { withFileTypes: true });
        for (const entry of entries) {
            const src = path.join(entry.parentPath, entry.name);

            if (entry.isDirectory()) {  // deeper recursion if directory
                const subDirTree = await recursiveCompile(src);
                if (subDirTree !== undefined)
                    dirTree.push(subDirTree);

            } else if (entry.name === "index.md") {  // skip if index.md because already parsed
                ;

            } else if (entry.name.endsWith(".md")) {  // parse and compile all other md files
                const out = src.replace(SRC_DIR, OUT_DIR).replace(".md", ".html");

                // parse
                const markdown = await fs.readFile(src, { encoding: "utf-8" });
                const { parsed, metadata } = parse(markdown);

                // compile
                const title = metadata.title ?? path.basename(out);
                const options: CompileConfig = {
                    title: title,
                    breadcrumb: [...breadcrumb, ["📄 " + title, null]],
                    baseUrl: BASE_URL,
                };
                const doc = compile(parsed, "page", options);

                // write
                await fs.writeFile(out, doc);

                const link = path.relative(OUT_DIR, out);
                dirTree.push([title, link]);

            } else {  // copy all other file types as is
                const out = src.replace(SRC_DIR, OUT_DIR);
                await fs.copyFile(src, out);
            }
        }

        // compile index.md if only if render dir tree is enabled
        if (indexMetadata?.dirTree) {
            assert(indexParsed !== null && indexMetadata !== null);
            const indexOut = path.join(currDirOut, "index.html");

            // compile
            const options: CompileConfig = {
                title: currDirTitle,
                breadcrumb: breadcrumb,
                baseUrl: BASE_URL,
                dirTree: dirTree,
            };
            const doc = compile(indexParsed, "index", options);

            // write
            await fs.writeFile(indexOut, doc);

            dirTree.push([currDirTitle, currDirLink]);
        }
        breadcrumb.pop();

        // join subtree with parent tree, only if folder has one or more compiled files
        if (dirTree.length > 0) {
            return [
                currDirTitle,
                // link to index.html only if render dir tree is enabled
                indexMetadata?.dirTree ? currDirLink : null,
                dirTree,
            ] as [string, string, DirTree];
        }
    }

    await recursiveCompile(SRC_DIR);
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
