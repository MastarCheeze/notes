import { SiteBuilder } from "./sitebuilder/main.js";
import { parseArgv } from "./argv.js";

// parse argv
const SRC = process.argv[2]; // src
const OUT = parseArgv("-o", "--output")[1]; // build/public
const ABS_URL_PREFIX = parseArgv("--abs-url-prefix")[1] ?? "";
const VERBOSE = parseArgv("-v", "--verbose").length != 0;

if (SRC === undefined) {
    throw "Please provide a source folder";
} else if (OUT === undefined) {
    throw "Please provide an output folder";
}

const siteBuilder = new SiteBuilder(SRC, OUT, ABS_URL_PREFIX);
if (VERBOSE) siteBuilder.attachLogger(console.log);

siteBuilder.build();
