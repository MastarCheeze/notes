import { Extension, ExtensionArgs } from "../main.js";
import { createDirectives, DirectiveConfig, presetDirectiveConfigs } from "marked-directive";

class Directive extends Extension {
    private extensions: DirectiveExtension[] = [];

    constructor(args: ExtensionArgs) {
        super(args);

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

abstract class DirectiveExtension extends Extension {
    abstract directive: DirectiveConfig;
}

export default Directive;
export { DirectiveExtension };
