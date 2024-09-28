import { DirectiveConfig } from "marked-directive";

type Extension = {
    directive: DirectiveConfig | null;
    preprocess: ((markdown: string) => string) | null;
    postprocess: ((html: string) => string) | null;
};

export { Extension };
