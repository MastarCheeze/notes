import fs from "node:fs";
import path from "node:path";

import { DirCompiler } from "./compile-dir.js";
import { Compiler } from "./compile.js";
import { Logger, parseArgvFlag } from "./utils.js";

const CONTENT_DIR_NAME = "content";
const ASSETS_DIR_NAME = "assets";

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

// copy assets folder
fs.cpSync(path.join(SRC_DIR, ASSETS_DIR_NAME), path.join(OUT_DIR, ASSETS_DIR_NAME), { recursive: true });

// compile contents
const compiler = new Compiler();
const logger = new Logger(VERBOSE);

const dirCompiler = new DirCompiler(
    path.join(SRC_DIR, CONTENT_DIR_NAME),
    path.join(OUT_DIR, CONTENT_DIR_NAME),
    compiler,
    logger
);
dirCompiler.compile();

logger.log("========================");
logger.log("Compilation complete.");
logger.log(`compiled: ${dirCompiler.stats.success}`);
logger.log(`warnings: ${dirCompiler.stats.warning}`);
logger.log(`errors: ${dirCompiler.stats.error}`);
logger.log("========================");
