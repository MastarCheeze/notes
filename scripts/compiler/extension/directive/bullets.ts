import { DirectiveExtension } from "./types.js";

import type { ExtensionArgs } from "../types.js";
import type { DirectiveConfig } from "marked-directive";

const META_REGEX =
    /<li>\s*(?<meta>\<compiler-meta type="bullets"\>(?<bullet>.*)\<\/compiler-meta\>)/g;

class Bullets extends DirectiveExtension {
    override directive: DirectiveConfig;

    constructor(args: ExtensionArgs) {
        super(args);

        this.directive = {
            level: "inline",
            marker: ":",
            renderer(token) {
                if (token.meta.name === "bullet") {
                    return `<compiler-meta type="bullets">${token.text}</compiler-meta>`;
                }

                return false;
            },
        };
    }

    override postprocess(html: string): string {
        while (1) {
            // find all li tags that has a compiler-meta in it
            const match = META_REGEX.exec(html);
            if (match === null) break;

            let newStr = match[0];
            newStr = newStr.replace(
                "<li",
                `<li style="list-style-type: '${match.groups!.bullet} ';"`
            );
            newStr = newStr.replace(match.groups!.meta, "");

            html =
                html.slice(0, match.index) +
                html.slice(match.index).replace(match[0], newStr);
        }
        return html;
    }
}

export default Bullets;
