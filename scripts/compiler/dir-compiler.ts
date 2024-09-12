import fs from "node:fs";
import path from "node:path";

import { parse } from "./parse.js";
import type { Compiler } from "./compiler.js";
import type { PostCompiler } from "./post-compiler.js";

const titleRegex = /^\s*#\s+(.*)/;

export class DirCompiler {
    stats: { success: number; warning: number; error: number };
    private registerDirFuncs: [
        dirSrc: string,
        dirFunc: () => ReturnType<InstanceType<typeof DirCompiler>["registerDir"]>
    ][];
    private dirFilePaths: { [dirSrc: string]: ReturnType<InstanceType<typeof DirCompiler>["registerDir"]> };

    constructor(
        public srcDir: string,
        public outDir: string,
        public compiler: Compiler,
        public postCompiler: PostCompiler,
        public log: (msg: string) => void,
    ) {
        this.stats = {
            success: 0,
            warning: 0,
            error: 0,
        };

        this.registerDirFuncs = [];
        this.dirFilePaths = {};
    }

    compile() {
        this.recursiveCompile(this.srcDir);
    }

    private recursiveCompile(dirSrc: string) {
        // setup for directory registration
        this.registerDirFuncs.push([dirSrc, this.registerDir.bind(this, dirSrc)]);

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
                    const [registerDirSrc, registerDirFunc] = this.registerDirFuncs.shift()!;
                    this.dirFilePaths[registerDirSrc] = registerDirFunc();
                }

                if (entry.name === "index.md") continue; // compile index file only after all children files are registered

                // compile md file
                const { link, out } = this.registerMarkdownFile(src);
                const compiled = this.postCompiler.compile(this.compiler.compile(link));
                fs.writeFileSync(out, compiled);

                this.log(`Compiled ${link}`);
                ++this.stats.success;
            } else {
                // copy all other files as is
                const out = src.replace(this.srcDir, this.outDir);
                fs.cpSync(src, out, { recursive: true });
            }
        }

        // compile index file
        if (this.dirFilePaths[dirSrc]) {
            const { dirLink, dirOut } = this.dirFilePaths[dirSrc];
            const link = path.join(dirLink, "index.md");
            const out = path.join(dirOut, "index.html");
            const compiled = this.postCompiler.compile(this.compiler.compileIndex(dirLink));
            fs.writeFileSync(out, compiled);

            this.log(`Compiled ${link}`);
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
                label: metadata?.title ?? content.match(titleRegex)?.[1] ?? path.basename(dirOut),
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
            label: metadata?.title ?? content.match(titleRegex)?.[1] ?? path.basename(out),
            order: metadata?.order ? parseInt(metadata.order) : null,
            isDir: false,
        });

        return { link, out };
    }
}
