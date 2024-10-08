import fs from "node:fs";
import path from "node:path";

import { parse } from "./parse.js";

import { Entry, Registry } from "./registry.js";
import Compiler from "../compiler/main.js";
import { buildPage, buildIndex } from "../layout/main.js";
import type { BreadcrumbArgs, DirectoryArgs } from "../layout/main.js";

const INDEX_FILE = "_index.md";
const TITLE_REGEX = /^\s*#\s+(.*)/; // regex to find the first h1 in a markdown file
const ABS_URL_REGEX = /\b(href|src)=["'](?<url>\/.*?)["']/g;

class SiteBuilder {
    private rootSrc: string;
    private rootOut: string;
    private absUrlPrefix: string;

    private compiler: Compiler;

    private registry: Registry = new Registry();
    private registerFolderFuncStack: (() => void)[] = [];
    private registerFolderStatusStack: boolean[] = [];

    private logger: ((text: string) => void) | null = null;
    private loggerStats = {
        success: 0,
        error: 0,
    };

    constructor(rootSrc: string, rootOut: string, absUrlPrefix: string) {
        this.rootSrc = rootSrc;
        this.rootOut = rootOut;
        this.absUrlPrefix = absUrlPrefix;

        this.compiler = new Compiler({ rootSrc, rootOut, absUrlPrefix });
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
                try {
                    const success = this.compileFolder(src, link);
                    if (success) {
                        this.log(`Compiled: ${link}`);
                        this.loggerStats.success += 1;
                    }
                } catch (e) {
                    this.log(`Error while compiling ${link}: ${e}`);
                    this.loggerStats.error += 1;
                }
            } else if (src.endsWith(".md")) {
                this.registerFolder();

                if (src.endsWith(INDEX_FILE)) {
                    // skip index page for later because all files in the folder need to be registered first
                    continue;
                }

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

    private compileFolder(src: string, link: string) {
        // check for index file
        let markdown: string = "";
        let metadata: Record<string, string> | null = null;

        const indexSrc = path.join(src, INDEX_FILE);
        const indexLink = path.join(link, "index.html");
        if (fs.existsSync(indexSrc)) {
            const raw = fs.readFileSync(indexSrc, { encoding: "utf-8" });
            ({ markdown, metadata } = parse(raw));
        }

        const title = metadata?.title ?? markdown.match(TITLE_REGEX)?.[1] ?? path.basename(src);
        const order = metadata?.order ? Number.parseInt(metadata.order) : null;

        // register folder
        const entry = {
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
            this.compileIndex(indexSrc, indexLink, markdown, entry);
        }
        return success;
    }

    private registerFolder() {
        // register all parent directories if contains at least 1 child that is a .md file
        for (const func of this.registerFolderFuncStack) {
            func();
        }
    }

    private compileIndex(src: string, link: string, markdown: string, entry: Entry) {
        const parentSrc = path.dirname(link);

        // compile page
        const content = this.compiler.compile(markdown);
        const breadcrumb = this.buildBreadcrumbArgs(parentSrc, false);
        const directory = this.buildDirectoryArgs(entry.subdir!);
        const html = this.fixAbsUrl(buildIndex(content, entry.title, breadcrumb, directory));

        // write file
        const out = src.replace(this.rootSrc, this.rootOut).replace(INDEX_FILE, "index.html");
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, html);
    }

    private compilePage(src: string, link: string) {
        // read and compile markdown
        const raw = fs.readFileSync(src, { encoding: "utf-8" });
        const { markdown, metadata } = parse(raw);

        const title = metadata?.title ?? markdown.match(TITLE_REGEX)?.[1] ?? path.basename(src).replace(".md", ".html");
        const order = metadata?.order ? Number.parseInt(metadata.order) : null;

        // register file
        link = link.replace(".md", ".html");
        const entry = {
            subdir: null,
            title: title,
            order: order,
        };
        this.registry.register(link, entry);

        // compile page
        const content = this.compiler.compile(markdown);
        const breadcrumb = this.buildBreadcrumbArgs(link, true);
        const html = this.fixAbsUrl(buildPage(content, entry.title, breadcrumb));

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
        for (const entryLink of Registry.traverseLinks(link)) {
            const entry = this.registry.get(entryLink);
            breadcrumb.push({
                title: entry.title,
                link: path.join("/", this.rootSrc, entryLink),
            });
        }
        return { breadcrumb, lastEntryIsFile };
    }

    private buildDirectoryArgs(subdir: NonNullable<Entry["subdir"]>): DirectoryArgs {
        return this.buildDirectoryArgsRecursive(subdir);
    }

    private buildDirectoryArgsRecursive(subdir: NonNullable<Entry["subdir"]>): DirectoryArgs {
        const unsortedDirectory: [DirectoryArgs[0], number | null][] = [];

        for (const [childLink, childEntry] of Object.entries(subdir)) {
            if (childLink.endsWith("index.html")) continue;

            const link = path.join("/", this.rootSrc, childLink);
            unsortedDirectory.push([
                {
                    title: childEntry.title,
                    link: link,
                    subdir: childEntry.subdir === null ? null : this.buildDirectoryArgsRecursive(childEntry.subdir),
                },
                childEntry.order,
            ]);
        }

        const sortedDirectory = this.sortDirectoryArgs(unsortedDirectory);

        return sortedDirectory;
    }

    private sortDirectoryArgs(directory: [DirectoryArgs[0], number | null][]): DirectoryArgs {
        // sort directory
        directory.sort((a, b) => {
            // sort by explicit order
            const aOrder = a[1];
            const bOrder = b[1];
            const orderScore = (aOrder ?? Number.POSITIVE_INFINITY) - (bOrder ?? Number.POSITIVE_INFINITY);
            if (!Number.isNaN(orderScore) && orderScore !== 0) {
                return orderScore;
            }

            // sort by folder/file
            const folderScore = (a[0].subdir ? 0 : 1) - (b[0].subdir ? 0 : 1);
            if (!Number.isNaN(folderScore) && folderScore !== 0) {
                return folderScore;
            }

            // sort by title alphabetically
            return a[0].title.localeCompare(b[0].title);
        });

        return directory.map((value) => value[0]); // return DirectoryArgs without the order value
    }

    private fixAbsUrl(html: string): string {
        while (1) {
            // find all urls in html
            const match = ABS_URL_REGEX.exec(html);
            if (match === null) break;

            // replace all absolute urls to start with the new absolute prefix
            const url = match.groups!.url!;
            let newUrl = path.normalize(url.replace("/" + this.rootSrc, "/" + this.absUrlPrefix));

            html = html.slice(0, match.index) + html.slice(match.index).replace(url, newUrl);
        }
        return html;
    }

    attachLogger(logger: (text: string) => void) {
        this.logger = logger;
    }

    private log(text: string) {
        this.logger?.(text);
    }
}

export { SiteBuilder };
