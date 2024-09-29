import { Extension, ExtensionArgs } from "../types.js";
import { createDirectives, DirectiveConfig, presetDirectiveConfigs } from "marked-directive";

import { Columns } from "./columns.js";
import { DirectiveExtension } from "./types.js";

class Directive extends Extension {
    private extensions: DirectiveExtension[] = [];

    private static extensionsClasses: (new (extensionArgs: ExtensionArgs) => DirectiveExtension)[] = [
        Columns,
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
}

export default Directive;
