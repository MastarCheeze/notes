import { DirectiveConfig } from "marked-directive";
import { Extension } from "../types.js";

abstract class DirectiveExtension extends Extension {
    abstract directive: DirectiveConfig;
}

export { DirectiveExtension };
