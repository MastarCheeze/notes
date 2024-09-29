import { Extension, ExtensionArgs } from "./main.js";
import katex from "marked-katex-extension";

class Katex extends Extension {
    init(args: ExtensionArgs) {
        args.marked.use(
            katex({
                macros: { "\\unit": "\\text{~#1}" },
            })
        );
    }
}

export default Katex;
