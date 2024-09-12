import fs from "node:fs";
import path from "node:path";

import { DirCompiler } from "./compile-dir.js";
import { Compiler } from "./compile.js";
import { Logger, parseArgvFlag } from "./utils.js";
import { PostCompiler } from "./post-compile.js";

const CONTENT_DIR_NAME = "content";

// parse argv
const SRC_DIR = process.argv[2]; // src
const OUT_DIR = parseArgvFlag("-o", "--output")[1]; // build/public
const ABS_URL_PREFIX = parseArgvFlag("--abs-url-prefix")[1] ?? "";
const VERBOSE = parseArgvFlag("-v", "--verbose").length != 0;

if (SRC_DIR === undefined) {
    throw "Please provide a source folder";
} else if (OUT_DIR === undefined) {
    throw "Please provide an output folder";
}

// create directories
try {
    fs.rmSync(OUT_DIR, { recursive: true });
} catch {}
fs.mkdirSync(OUT_DIR);

// copy all folders except content
for (const filename of fs.readdirSync(SRC_DIR)) {
    if (filename === CONTENT_DIR_NAME) continue;
    fs.cpSync(
        path.join(SRC_DIR, filename),
        path.join(OUT_DIR, filename),
        { recursive: true }
    );
}

// compile contents
const compiler = new Compiler();
const postCompiler = new PostCompiler(ABS_URL_PREFIX);
const logger = new Logger(VERBOSE);

const dirCompiler = new DirCompiler(
    path.join(SRC_DIR, CONTENT_DIR_NAME),
    path.join(OUT_DIR, CONTENT_DIR_NAME),
    compiler,
    postCompiler,
    logger
);
dirCompiler.compile();

logger.log("========================");
logger.log("Compilation complete.");
logger.log(`compiled: ${dirCompiler.stats.success}`);
logger.log(`warnings: ${dirCompiler.stats.warning}`);
logger.log(`errors: ${dirCompiler.stats.error}`);
logger.log("========================");
