import { marked } from "marked";
import { createDirectives, presetDirectiveConfigs } from "marked-directive";

export default createDirectives([
    ...presetDirectiveConfigs,
    {
        level: "container",
        marker: "::::",
        renderer(token) {
            if (token.meta.name === "columns") {
                return `<div class="columns">${marked.parse(token.text)}</span>`;
            }

            return false;
        },
    },
]);
