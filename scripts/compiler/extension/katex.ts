import { Extension, ExtensionArgs } from "./types.js";
import katex from "marked-katex-extension";

class Katex extends Extension {
    constructor(args: ExtensionArgs) {
        super(args);
        args.marked.use(
            katex({
                macros: { "\\unit": "\\,\\mathrm{#1}" },
            })
        );
    }
}

export default Katex;
