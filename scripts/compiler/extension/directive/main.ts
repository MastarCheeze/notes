import { Extension, ExtensionArgs } from "../types.js";
import { createDirectives, DirectiveConfig, presetDirectiveConfigs } from "marked-directive";
import { DirectiveExtension } from "./types.js";

import Columns from "./columns.js";
import Bullets from "./bullets.js";
import YTEmbed from "./yt-embed.js";
import InvisibleText from "./invisible-text.js";

class Directive extends Extension {
    private extensions: DirectiveExtension[] = [];

    private static extensionsClasses: (new (extensionArgs: ExtensionArgs) => DirectiveExtension)[] = [
        Columns,
        Bullets,
        YTEmbed,
        InvisibleText,
    ];

    constructor(args: ExtensionArgs) {
        super(args);

        // initialise extensions
        for (const extensionClass of Directive.extensionsClasses) {
            this.extensions.push(new extensionClass(args));
        }

        // use directives
        const directives: DirectiveConfig[] = [];
        for (const ext of this.extensions) {
            directives.push(ext.directive);
        }

        args.marked.use(createDirectives([
            ...presetDirectiveConfigs,
            ...directives,
        ]))
    }

    override preprocess(markdown: string): string {
        for (const ext of this.extensions) {
            markdown = ext.preprocess(markdown);
        }
        return markdown;
    }

    override postprocess(html: string): string {
        for (const ext of this.extensions) {
            html = ext.postprocess(html);
        }
        return html;
    }
}

export default Directive;
