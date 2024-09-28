import katex from "marked-katex-extension";

export default katex({
    macros: { "\\unit": "\\text{~#1}" },
});
