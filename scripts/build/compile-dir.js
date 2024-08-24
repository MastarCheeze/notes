import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert";
import { parse } from "./parse.js";
import { compile } from "./compile.js";
async function main() {
    let stats = {
        compiled: 0,
        error: 0,
    };
    const breadcrumb = [];
    async function recursiveCompile(currDirSrc) {
        const dirTree = [];
        const currDirOut = currDirSrc.replace(SRC_DIR, OUT_DIR);
        const currDirLink = path.relative(OUT_DIR, currDirOut);
        await fs.mkdir(currDirOut);
        const indexSrc = path.join(currDirSrc, "index.md");
        const indexOut = path.join(currDirOut, "index.html");
        let hasIndexMd = true;
        let indexParsed = null;
        let indexMetadata = null;
        try {
            await fs.stat(indexSrc);
        }
        catch {
            hasIndexMd = false;
        }
        if (hasIndexMd) {
            const markdown = await fs.readFile(indexSrc, { encoding: "utf-8" });
            try {
                ({ parsed: indexParsed, metadata: indexMetadata } = parse(markdown));
            }
            catch (error) {
                if (VERBOSE)
                    console.error(`An error occured while trying to parse ${indexSrc}: ${error}`);
            }
        }
        const currDirTitle = indexMetadata?.title ?? path.basename(currDirOut);
        breadcrumb.push([currDirTitle, currDirLink]);
        const entries = await fs.readdir(currDirSrc, { withFileTypes: true });
        for (const entry of entries) {
            const src = path.join(entry.parentPath, entry.name);
            if (entry.isDirectory()) {
                const subDirTree = await recursiveCompile(src);
                if (subDirTree !== undefined)
                    dirTree.push(subDirTree);
            }
            else if (entry.name === "index.md") {
                ;
            }
            else if (entry.name.endsWith(".md")) {
                const out = src.replace(SRC_DIR, OUT_DIR).replace(".md", ".html");
                const markdown = await fs.readFile(src, { encoding: "utf-8" });
                let parsed, metadata;
                try {
                    ({ parsed, metadata } = parse(markdown));
                }
                catch (error) {
                    if (VERBOSE)
                        console.error(`An error occured while trying to parse ${src}: ${error}`);
                    ++stats.error;
                    continue;
                }
                const title = metadata.title ?? path.basename(out);
                const options = {
                    title: title,
                    breadcrumb: [...breadcrumb, ["📄 " + title, null]],
                    baseUrl: BASE_URL,
                };
                const doc = compile(parsed, "page", options);
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
            }
            else {
                const out = src.replace(SRC_DIR, OUT_DIR);
                await fs.copyFile(src, out);
            }
        }
        const options = {
            title: currDirTitle,
            breadcrumb: breadcrumb,
            baseUrl: BASE_URL,
            dirTree: dirTree,
        };
        const doc = compile(indexParsed ?? "", "index", options);
        await fs.writeFile(indexOut, doc);
        if (VERBOSE)
            console.debug(`Compiled ${indexSrc}`);
        ++stats.compiled;
        breadcrumb.pop();
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
function parseArgvFlag(...flags) {
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
    const args = [flag];
    let currIdx = idx + 1;
    while (!(process.argv[currIdx] === undefined || process.argv[currIdx].startsWith("-"))) {
        args.push(process.argv[currIdx]);
        ++currIdx;
    }
    return args;
}
const SRC_DIR = process.argv[2];
const OUT_DIR = parseArgvFlag("-o")[1];
const BASE_URL = parseArgvFlag("--base-url")[1];
const VERBOSE = parseArgvFlag("-v", "--verbose").length >= 1;
await main();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZS1kaXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvY29tcGlsZS1kaXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDbEMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sTUFBTSxNQUFNLGFBQWEsQ0FBQztBQUVqQyxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBQ25DLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFJdkMsS0FBSyxVQUFVLElBQUk7SUFDZixJQUFJLEtBQUssR0FBRztRQUNSLFFBQVEsRUFBRSxDQUFDO1FBQ1gsS0FBSyxFQUFFLENBQUM7S0FDWCxDQUFBO0lBQ0QsTUFBTSxVQUFVLEdBQWUsRUFBRSxDQUFDO0lBRWxDLEtBQUssVUFBVSxnQkFBZ0IsQ0FBQyxVQUFrQjtRQUM5QyxNQUFNLE9BQU8sR0FBWSxFQUFFLENBQUM7UUFHNUIsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDeEQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDdkQsTUFBTSxFQUFFLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRzNCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3JELElBQUksVUFBVSxHQUFHLElBQUksQ0FBQztRQUN0QixJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDdkIsSUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLElBQUksQ0FBQztZQUNELE1B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