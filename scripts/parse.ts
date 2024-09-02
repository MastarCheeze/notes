import assert from "node:assert";

const headerRegex = /^\s*---\s*(?<header>[\s\S]*?)\s*---\s*(?<content>[\s\S]*)/;
const metadataRegex = /(?<key>\w+)\s*:\s*(?<value>.+)/g;

function parseMetadata(header: string): Record<string, string> {
    const metadata: Record<string, string> = {};
    while (1) {
        const match = metadataRegex.exec(header);
        if (match === null) break;

        const key = match.groups?.key;
        const value = match.groups?.value;
        assert(key !== undefined && value !== undefined, "Error while parsing metadata");

        metadata[key] = value;
    }
    return metadata;
}

export function parse(markdown: string): { content: string; metadata: Record<string, string> | null } {
    const match = headerRegex.exec(markdown);
    if (match === null) return { content: markdown, metadata: null };

    const header = match.groups?.header;
    const content = match.groups?.content;
    assert(header !== undefined && content !== undefined, "Error while parsing markdown");

    return { content: content, metadata: parseMetadata(header) };
}
