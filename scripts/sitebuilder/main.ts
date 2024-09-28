import fs from "node:fs";
import path from "node:path";

import { parse } from "./parse.js";

import { Entry, Registry } from "./registry.js";
import { compile } from "../compile/main.js";
import { buildPage, buildIndex } from "../layout/main.js";
import type { BreadcrumbArgs, DirectoryArgs } from "../layout/main.js";

const INDEX_FILE = "index.md"; // TODO change this to __index.md to make it at the top of the directory
const TITLE_REGEX = /^\s*#\s+(.*)/; // regex to find the first h1 in a markdown file

class SiteBuilder {
    private rootSrc: string;
    private rootOut: string;

    private registry: Registry = new Registry();
    private registerFolderFuncStack: (() => void)[] = [];
    private registerFolderStatusStack: boolean[] = [];

    private logger: ((text: string) => void) | null = null;
    private loggerStats = {
        success: 0,
        error: 0,
    };

    constructor(rootSrc: string, rootOut: string) {
        this.rootSrc = rootSrc;
        this.rootOut = rootOut;
    }

    build() {
        this.log("Compiling...");
        this.buildRecursive(this.rootSrc);
        this.log(`Done compiling: ${this.loggerStats.success} compiled, ${this.loggerStats.error} failed`);
    }

    private buildRecursive(dirSrc: string) {
        const entries = fs.readdirSync(dirSrc, { withFileTypes: true });
        for (const entry of entries) {
            const src = path.join(entry.parentPath, entry.name);
            const link = path.relative(this.rootSrc, src);

            if (entry.isDirectory()) {
                this.initRegisterFolder(src, link);
            } else if (src.endsWith(".md")) {
                this.registerFolder();
                try {
                    this.compilePage(src, link);
                    this.log(`Compiled: ${link}`);
                    this.loggerStats.success += 1;
                } catch (e) {
                    this.log(`Error while compiling ${link}: ${e}`);
                    this.loggerStats.error += 1;
                }
            } else {
                this.compileAsset(src, link);
            }
        }
    }

    private initRegisterFolder(src: string, link: string) {
        // check for index file
        let metadata: Record<string, string> | null = null;
        let content = "";

        const indexSrc = path.join(src, INDEX_FILE);
        const indexLink = path.join(link, "index.html");
        if (fs.existsSync(indexSrc)) {
            const raw = fs.readFileSync(indexSrc, { encoding: "utf-8" });
            let markdown;
            ({ markdown, metadata } = parse(raw));
            content = compile(markdown);
        }

        const title = metadata?.title ?? content.match(TITLE_REGEX)?.[1] ?? path.basename(src).replace(".md", ".html");
        const order = metadata?.order ? Number.parseInt(metadata.order) : null;

        // register folder
        const entry = {
            link: link,
            subdir: {},
            title: title ?? path.basename(src),
            order: order,
        };
        this.registerFolderFuncStack.push(() => {
            this.registry.register(link, entry);
            this.registerFolderStatusStack[this.registerFolderStatusStack.length - 1] = true;
        });
        this.registerFolderStatusStack.push(false);

        // recurse
        this.buildRecursive(src);

        // compile index file if registration is successful
        this.registerFolderFuncStack.pop();
        const success = this.registerFolderStatusStack.pop();
        if (success) {
            this.compileIndex(indexSrc, indexLink, content, entry);
        }
    }

    private registerFolder() {
        // register all parent directories if contains at least 1 child that is a .md file
        for (const func of this.registerFolderFuncStack) {
            func();
        }
    }

    private compileIndex(src: string, link: string, content: string, entry: Entry) {
        const parentSrc = path.dirname(link);

        // build site components and html page
        const breadcrumb = this.buildBreadcrumbArgs(parentSrc, false);
        const directory = this.buildDirectoryArgs();
        const html = buildIndex(content, entry.title, breadcrumb, directory);

        // write file
        const out = src.replace(this.rootSrc, this.rootOut).replace(INDEX_FILE, "index.html");
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, html);
    }

    private compilePage(src: string, link: string) {
        // read and compile markdown
        const raw = fs.readFileSync(src, { encoding: "utf-8" });
        const { markdown, metadata } = parse(raw);
        const content = compile(markdown);

        const title = metadata?.title ?? content.match(TITLE_REGEX)?.[1] ?? path.basename(src).replace(".md", ".html");
        const order = metadata?.order ? Number.parseInt(metadata.order) : null;

        // register file
        const entry = {
            link: link,
            subdir: null,
            title: title,
            order: order,
        };
        this.registry.register(link, entry);

        if (src.endsWith(INDEX_FILE)) {
            // skip index page for later because all files in the folder need to be registered first
            return;
        }

        // build site components and html page
        const breadcrumb = this.buildBreadcrumbArgs(link, true);
        const html = buildPage(content, entry.title, breadcrumb);

        // write file
        const out = src.replace(this.rootSrc, this.rootOut).replace(".md", ".html");
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, html);
    }

    private compileAsset(src: string, link: string) {
        // copy all other files as is
        const out = src.replace(this.rootSrc, this.rootOut);
        fs.cpSync(src, out, { recursive: true });
    }

    private buildBreadcrumbArgs(link: string, lastEntryIsFile: boolean): BreadcrumbArgs {
        const breadcrumb = [];
        for (const entry of this.registry.traverse(link)) {
            breadcrumb.push({ title: entry.title, link: entry.link });
        }
        breadcrumb.splice(0, 1); // first item is the root entry, delete it
        return { breadcrumb, lastEntryIsFile };
    }

    private buildDirectoryArgs(link: string): DirectoryArgs {}

    private buildDirectoryArgsRecursive(link: string, entry: DirectoryArgs) {
        for (const [link, childEntry] of Object.entries(entry.subdir!)) {
        }
    }

    attachLogger(logger: (text: string) => void) {
        this.logger = logger;
    }

    private log(text: string) {
        this.logger?.(text);
    }
}

export { SiteBuilder };
