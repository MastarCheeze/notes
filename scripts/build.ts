import fs from "node:fs";
import path from "node:path";

import { parse } from "./parse.js";
import { Compiler } from "./compile.js";
import { Logger, parseArgvFlag } from "./utils.js";

const SRC_DIR = "src";
const OUT_DIR = "build"; // use public folder for site building
const ABS_URL_PREFIX = parseArgvFlag("--abs-url-prefix")[1] ?? "";
const VERBOSE = parseArgvFlag("-v", "--verbose").length != 0;

const compiler = new Compiler();
const logger = new Logger(VERBOSE);
const stats = {
    success: 0,
    warning: 0,
    error: 0,
};

const titleRegex = /^\s*#\s+(.*)/;

function recursiveCompile(dirSrc: string) {
    let registerDirFlag = false;

    // loop through all entries in directory
    const entries = fs.readdirSync(dirSrc, { withFileTypes: true });
    for (const entry of entries) {
        const src = path.join(entry.parentPath, entry.name);

        if (entry.isDirectory()) {
            // recurse deeper if directory
            recursiveCompile(src);
        } else if (entry.name === "index.md") {
            // skip if index.md because already parsed
        } else if (entry.name.endsWith(".md")) {
            // directory contains md files, so register it a single time
            if (!registerDirFlag) {
                registerDir(dirSrc);
                registerDirFlag = true;
            }

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
}

function registerDir(dirSrc: string) {
    // create directory
    const dirOut = dirSrc.replace(SRC_DIR, OUT_DIR);
    const dirLink = path.relative(OUT_DIR, dirOut);
    fs.mkdirSync(dirOut, { recursive: true });

    // check if index.md exists
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

    return { dirOut, dirLink };
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