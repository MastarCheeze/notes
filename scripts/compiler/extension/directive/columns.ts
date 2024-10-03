import { DirectiveExtension } from "./types.js";

import type { ExtensionArgs } from "../types.js";
import type { DirectiveConfig } from "marked-directive";

class Columns extends DirectiveExtension {
    override directive: DirectiveConfig;

    constructor(args: ExtensionArgs) {
        super(args);

        this.directive = {
            level: "container",
            marker: "::::",
            renderer(token) {
                if (token.meta.name === "columns") {
                    return `<div class="columns">${args.marked.parse(
                        token.text
                    )}</div>`;
                }

                return false;
            },
        };
    }
}

export default Columns;
