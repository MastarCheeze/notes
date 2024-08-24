import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert";

import { parse } from "./parse.js";
import { compile } from "./compile.js";
import type { CompileConfig, Breadcrumb, DirTree } from "./compile.js";

async function main() {
    let stats = {
        compiled: 0,
        error: 0,
    }
    const breadcrumb: Breadcrumb = []; // current location in the filesystem

    async function recursiveCompile(currDirSrc: string): Promise<DirTree[0] | undefined> {
        const dirTree: DirTree = []; // subtree of child files and folders

        // create directory
        const currDirOut = currDirSrc.replace(SRC_DIR, OUT_DIR);
        const currDirLink = path.relative(OUT_DIR, currDirOut);
        await fs.mkdir(currDirOut);

        // check if index.md exists
        const indexSrc = path.join(currDirSrc, "index.md");
        const indexOut = path.join(currDirOut, "index.html");
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
            try {
                ({ parsed: indexParsed, metadata: indexMetadata } = parse(markdown));
            } catch (error) {
                if (VERBOSE)
                    console.error(`An error occured while trying to parse ${indexSrc}: ${error}`);
            }
        }
        const currDirTitle = indexMetadata?.title ?? path.basename(currDirOut);

        // link to index.html
        breadcrumb.push([currDirTitle, currDirLink]);

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
                let parsed, metadata;
                try {
                    ({ parsed, metadata } = parse(markdown));
                } catch (error) {
                    if (VERBOSE)
                        console.error(`An error occured while trying to parse ${src}: ${error}`);
                    ++stats.error;
                    continue;
                }

                // compile
                const title = (metadata.title ?? path.basename(out)) + (entry.name.endsWith(".private.md") ? " 🔒" : "");
                const options: CompileConfig = {
                    title: title,
                    breadcrumb: [...breadcrumb, ["📄 " + title, null]],
                    baseUrl: BASE_URL,
                };
                const doc = compile(parsed, "page", options);

                // write
                await fs.writeFile(out, doc);
                if (VERBOSE)
                    console.debug(`Compiled ${src}`);
                ++stats.compiled;

                const link = path.relative(OUT_DIR, out);
                dirTree.push({
                    order: metadata.order ?? null,
                    label: title,
                    link: link,
                });

            } else {  // copy all other file types as is
                const out = src.replace(SRC_DIR, OUT_DIR);
                await fs.copyFile(src, out);
            }
        }

        // compile and write index.md
        const options: CompileConfig = {
            title: currDirTitle,
            breadcrumb: breadcrumb,
            baseUrl: BASE_URL,
            dirTree: dirTree,
        }
        const doc = compile(indexParsed ?? "", "index", options);
        await fs.writeFile(indexOut, doc);
        if (VERBOSE)
            console.debug(`Compiled ${indexSrc}`);
        ++stats.compiled;

        breadcrumb.pop();

        // join subtree with parent tree, only if folder has one or more compiled files
        if (dirTree.length > 0) {
            return {
                order: indexMetadata?.order ?? null,
                label: currDirTitle,
                link: currDirLink,
                subtree: dirTree,
            };
        }
    }

    await recursiveCompile(SRC_DIR);

    console.debug("========================");
    console.debug(`Compilation complete.\ncompiled: ${stats.compiled}\nerrors: ${stats.error}`);
    console.debug("========================");
}

function parseArgvFlag(...flags: string[]) {
    let flag;
    let idx = -1;
    for (flag of flags) {
        idx = process.argv.indexOf(flag);
        if (idx !== -1)
            break;
    }
    if (idx === -1)
        return [];
    assert(flag);

    const args: string[] = [flag];
    let currIdx = idx + 1;
    while (!(process.argv[currIdx] === undefined || process.argv[currIdx].startsWith("-"))) {
        args.push(process.argv[currIdx]);
        ++currIdx;
    }

    return args;
}

// parse cli args
const SRC_DIR = process.argv[2]!;
const OUT_DIR = parseArgvFlag("-o")[1]!;
const BASE_URL = parseArgvFlag("--base-url")[1]!;
const VERBOSE = parseArgvFlag("-v", "--verbose").length >= 1;

await main();
