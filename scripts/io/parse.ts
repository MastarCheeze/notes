const headerRegex = /^\s*---\s*(?<header>[\s\S]*?)\s*---\s*(?<content>[\s\S]*)/;
const metadataRegex = /(?<key>\w+)\s*:\s*(?<value>.+)/g;

function parseMetadata(header: string) {
    const metadata: Record<string, string> = {};
    while (1) {
        const match = metadataRegex.exec(header);
        if (match === null) break;

        const key = match.groups?.key;
        const value = match.groups?.value;
        if (key === undefined || value === undefined) throw "Error while parsing metadata";

        metadata[key] = value;
    }
    return metadata;
}

function parse(raw: string) {
    const match = headerRegex.exec(raw);
    if (match === null) return { markdown: raw, metadata: null };

    const header = match.groups?.header;
    const markdown = match.groups?.content;
    if (header === undefined || markdown === undefined) throw "Error while parsing markdown";

    return { markdown: markdown, metadata: parseMetadata(header) };
}

export { parse };
