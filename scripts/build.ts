import fs from "node:fs";
import path from "node:path";

import { parse } from "./parse.js";
import { Compiler } from "./compile.js";
import { Logger, parseArgvFlag } from "./utils.js";

const SRC_DIR = process.argv[1];
const OUT_DIR = parseArgvFlag("-o", "--output")[1];
const ABS_URL_PREFIX = parseArgvFlag("--abs-url-prefix")[1] ?? "";
const VERBOSE = parseArgvFlag("-v", "--verbose").length != 0;

if (SRC_DIR === undefined) {
    throw "Please provide a source folder";
} else if (OUT_DIR === undefined) {
    throw "Please provide an output folder";
}

const compiler = new Compiler();
const logger = new Logger(VERBOSE);
const stats = {
    success: 0,
    warning: 0,
    error: 0,
};

const titleRegex = /^\s*#\s+(.*)/;

const registerDirFuncs: (() => ReturnType<typeof registerDir>)[] = [];
function recursiveCompile(dirSrc: string) {
    // setup for directory registration
    registerDirFuncs.push(registerDir.bind(null, dirSrc));
    let dirFilePaths: ReturnType<typeof registerDir>[] = [];

    // loop through all entries in directory
    const entries = fs.readdirSync(dirSrc, { withFileTypes: true });
    for (const entry of entries) {
        const src = path.join(entry.parentPath, entry.name);

        if (entry.isDirectory()) {
            // recurse deeper if directory
            recursiveCompile(src);
        } else if (entry.name.endsWith(".md")) {
            // register all directories that are pending
            while (registerDirFuncs.length !== 0) {
                const registerDirFunc = registerDirFuncs.shift()!;
                dirFilePaths.push(registerDirFunc());
            }

            if (entry.name === "index.md") continue; // compile index file only after all children files are registered

            // compile md file
            const { link, out } = registerMarkdownFile(src);
            const compiled = compiler.compile(link);
            fs.writeFileSync(out, compiled);

            logger.log(`Compiled ${link}`);
            ++stats.success;
        } else {
            // copy all other files as is
            const out = src.replace(SRC_DIR, OUT_DIR);
            fs.cpSync(src, out, { recursive: true });
        }
    }

    // pop off current registerDirFunc because there are no md files
    registerDirFuncs.pop();

    // compile all index files that are pending
    for (const { dirLink, dirOut } of dirFilePaths) {
        const link = path.join(dirLink, "index.md");
        const out = path.join(dirOut, "index.html");
        const compiled = compiler.compileIndex(dirLink);
        fs.writeFileSync(out, compiled);

        logger.log(`Compiled ${link}`);
        ++stats.success;
    }
}

function registerDir(dirSrc: string) {
    // HERE separate register dir with register index.md

    // create directory
    const dirOut = dirSrc.replace(SRC_DIR, OUT_DIR);
    const dirLink = path.relative(OUT_DIR, dirOut);
    fs.mkdirSync(dirOut, { recursive: true });

    // compile index.md
    const src = path.join(dirSrc, "index.md");
    if (fs.existsSync(src)) {
        const markdown = fs.readFileSync(src, { encoding: "utf-8" });
        const { content, metadata } = parse(markdown);
        compiler.register(dirLink, {
            content,
            label: metadata?.label ?? content.match(titleRegex)?.[1] ?? path.basename(dirOut),
            order: metadata?.order ? parseInt(metadata.order) : null,
            isDir: true,
        });
    } else {
        compiler.register(dirLink, {
            content: "",
            label: path.basename(dirOut),
            order: null,
            isDir: true,
        });
    }

    return { dirLink, dirOut };
}

function registerMarkdownFile(src: string) {
    const out = src.replace(SRC_DIR, OUT_DIR).replace(".md", ".html");
    const link = path.relative(OUT_DIR, out);

    const markdown = fs.readFileSync(src, { encoding: "utf-8" });
    const { content, metadata } = parse(markdown);
    compiler.register(link, {
        content,
        label: metadata?.label ?? content.match(titleRegex)?.[1] ?? path.basename(out),
        order: metadata?.order ? parseInt(metadata.order) : null,
        isDir: false,
    });

    return { link, out };
}

// === MAIN ===
recursiveCompile(SRC_DIR);
