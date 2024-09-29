import katex from "marked-katex-extension";
import { Extension, ExtensionArgs } from "./main.js";

class KatexExtension extends Extension {
    init(args: ExtensionArgs) {
        args.marked.use(
            katex({
                macros: { "\\unit": "\\text{~#1}" },
            })
        );
    }
}

export default KatexExtension;
