import { DirectiveExtension } from "./types.js";

import type { ExtensionArgs } from "../types.js";
import type { DirectiveConfig } from "marked-directive";

class InvisibleText extends DirectiveExtension {
    override directive: DirectiveConfig;

    constructor(args: ExtensionArgs) {
        super(args);

        this.directive = {
            level: "inline",
            marker: ":",
            renderer(token) {
                if (token.meta.name === "invis") {
                    return `<span style="opacity: 0;">${args.marked.parseInline(token.text)}</span>`;
                }
                return false;
            },
        };
    }
}

export default InvisibleText;
