import fs from "node:fs";
import path from "node:path";

import { parse } from "./parse.js";
import type { Compiler } from "./compile.js";
import type { Logger } from "./utils.js";

const titleRegex = /^\s*#\s+(.*)/;

export class DirCompiler {
    srcDir: string;
    outDir: string;
    compiler: Compiler;
    logger: Logger;
    stats: { success: number; warning: number; error: number };
    private registerDirFuncs: (() => ReturnType<(InstanceType<typeof DirCompiler>)["registerDir"]>)[];

    constructor(srcDir:string, outDir:string, compiler: Compiler, logger: Logger) {
        this.srcDir = srcDir;
        this.outDir = outDir;

        this.compiler = compiler;
        this.logger = logger;
        this.stats = {
            success: 0,
            warning: 0,
            error: 0,
        };

        this.registerDirFuncs = [];
    }

    compile() {
        this.recursiveCompile(this.srcDir);
    }

    private recursiveCompile(dirSrc: string) {
        // setup for directory registration
        this.registerDirFuncs.push(this.registerDir.bind(this, dirSrc));
        let dirFilePaths: ReturnType<typeof this.registerDir>[] = [];

        // loop through all entries in directory
        const entries = fs.readdirSync(dirSrc, { withFileTypes: true });
        for (const entry of entries) {
            const src = path.join(entry.parentPath, entry.name);

            if (entry.isDirectory()) {
                // recurse deeper if directory
                this.recursiveCompile(src);
            } else if (entry.name.endsWith(".md")) {
                // register all directories that are pending
                while (this.registerDirFuncs.length !== 0) {
                    const registerDirFunc = this.registerDirFuncs.shift()!;
                    dirFilePaths.push(registerDirFunc());
                }

                if (entry.name === "index.md") continue; // compile index file only after all children files are registered

                // compile md file
                const { link, out } = this.registerMarkdownFile(src);
                const compiled = this.compiler.compile(link);
                fs.writeFileSync(out, compiled);

                this.logger.log(`Compiled ${link}`);
                ++this.stats.success;
            } else {
                // copy all other files as is
                const out = src.replace(this.srcDir, this.outDir);
                fs.cpSync(src, out, { recursive: true });
            }
        }

        // pop off current registerDirFunc because there are no md files
        this.registerDirFuncs.pop();

        // compile all index files that are pending
        for (const { dirLink, dirOut } of dirFilePaths) {
            const link = path.join(dirLink, "index.md");
            const out = path.join(dirOut, "index.html");
            const compiled = this.compiler.compileIndex(dirLink);
            fs.writeFileSync(out, compiled);

            this.logger.log(`Compiled ${link}`);
            ++this.stats.success;
        }
    }

    private registerDir(dirSrc: string) {
        // create directory
        const dirOut = dirSrc.replace(this.srcDir, this.outDir);
        const dirLink = path.relative(this.outDir, dirOut);
        fs.mkdirSync(dirOut, { recursive: true });

        // compile index.md
        const src = path.join(dirSrc, "index.md");
        if (fs.existsSync(src)) {
            const markdown = fs.readFileSync(src, { encoding: "utf-8" });
            const { content, metadata } = parse(markdown);
            this.compiler.register(dirLink, {
                content,
                label: metadata?.label ?? content.match(titleRegex)?.[1] ?? path.basename(dirOut),
                order: metadata?.order ? parseInt(metadata.order) : null,
                isDir: true,
            });
        } else {
            this.compiler.register(dirLink, {
                content: "",
                label: path.basename(dirOut),
                order: null,
                isDir: true,
            });
        }

        return { dirLink, dirOut };
    }

    private registerMarkdownFile(src: string) {
        const out = src.replace(this.srcDir, this.outDir).replace(".md", ".html");
        const link = path.relative(this.outDir, out);

        const markdown = fs.readFileSync(src, { encoding: "utf-8" });
        const { content, metadata } = parse(markdown);
        this.compiler.register(link, {
            content,
            label: metadata?.label ?? content.match(titleRegex)?.[1] ?? path.basename(out),
            order: metadata?.order ? parseInt(metadata.order) : null,
            isDir: false,
        });

        return { link, out };
    }
}
