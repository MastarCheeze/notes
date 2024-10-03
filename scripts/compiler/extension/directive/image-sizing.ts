import { DirectiveExtension } from "./types.js";

import type { ExtensionArgs } from "../types.js";
import type { DirectiveConfig } from "marked-directive";

class ImageSizing extends DirectiveExtension {
    override directive: DirectiveConfig;

    constructor(args: ExtensionArgs) {
        super(args);

        this.directive = {
            level: "container",
            marker: ":::",
            renderer(token) {
                if (token.meta.name === "imgsize") {
                    return `<div style="width: ${token.attrs?.getTokens()[0]}; margin: 0 auto;">${args.marked.parse(token.text)}</div>`;
                }
                return false;
            },
        };
    }
}

export default ImageSizing;
