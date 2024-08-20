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
        if (indexMetadata?.dirTree)
            breadcrumb.push([currDirTitle, currDirLink]);
        else
            breadcrumb.push([currDirTitle, null]);
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
                    console.debug(`Successfully compiled ${src}`);
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
        if (indexMetadata?.dirTree) {
            assert(indexParsed !== null && indexMetadata !== null);
            const indexOut = path.join(currDirOut, "index.html");
            const options = {
                title: currDirTitle,
                breadcrumb: breadcrumb,
                baseUrl: BASE_URL,
                dirTree: dirTree,
            };
            const doc = compile(indexParsed, "index", options);
            await fs.writeFile(indexOut, doc);
            if (VERBOSE)
                console.debug(`Successfully compiled ${indexSrc}`);
            ++stats.compiled;
        }
        breadcrumb.pop();
        if (dirTree.length > 0) {
            return {
                order: indexMetadata?.order ?? null,
                label: currDirTitle,
                link: indexMetadata?.dirTree ? currDirLink : null,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZS1kaXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvY29tcGlsZS1kaXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDbEMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sTUFBTSxNQUFNLGFBQWEsQ0FBQztBQUVqQyxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBQ25DLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFHdkMsS0FBSyxVQUFVLElBQUk7SUFDZixJQUFJLEtBQUssR0FBRztRQUNSLFFBQVEsRUFBRSxDQUFDO1FBQ1gsS0FBSyxFQUFFLENBQUM7S0FDWCxDQUFBO0lBQ0QsTUFBTSxVQUFVLEdBQWUsRUFBRSxDQUFDO0lBRWxDLEtBQUssVUFBVSxnQkFBZ0IsQ0FBQyxVQUFrQjtRQUM5QyxNQUFNLE9BQU8sR0FBWSxFQUFFLENBQUM7UUFHNUIsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDeEQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDdkQsTUFBTSxFQUFFLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRzNCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ25ELElBQUksVUFBVSxHQUFHLElBQUksQ0FBQztRQUN0QixJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDdkIsSUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLElBQUksQ0FBQztZQUNELE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1QixDQUFDO1FBQUMsTUFBTSxDQUFDO1lB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