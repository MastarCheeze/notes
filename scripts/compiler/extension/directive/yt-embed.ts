import { DirectiveExtension } from "./types.js";

import type { ExtensionArgs } from "../types.js";
import type { DirectiveConfig } from "marked-directive";

class YTEmbed extends DirectiveExtension {
    override directive: DirectiveConfig = {
        level: "block",
        marker: "::",
        renderer(token) {
            if (token.meta.name === "youtube") {
                return `<iframe width="560" height="315" style="margin: 0 auto; display: block;" src="https://www.youtube.com/embed/${
                    token.attrs?.vid || ""
                }" title="${
                    token.text
                }" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
            }
            return false;
        },
    };
}

export default YTEmbed;
