import path from "node:path";

type Entry = {
    link: string;
    subdir: { [link: string]: Entry } | null;
    [prop: string]: any;
};

class Registry {
    private root: Entry = { link: "", subdir: {} };

    constructor() {}

    register(link: string, details: Entry) {
        link = Registry.normalize(link);

        // add entry to parent folder
        const parentFolder = [...this.traverse(path.dirname(link))].at(-1);
        if (!parentFolder || parentFolder.subdir === null) throw `Path not found ${link}`;
        parentFolder.subdir[link] = details;
    }

    unregister(link: string) {
        link = Registry.normalize(link);

        const parentFolder = [...this.traverse(path.dirname(link))].at(-1);
        if (!parentFolder || parentFolder.subdir === null) throw `Path not found ${link}`;
        delete parentFolder.subdir[link];
    }

    // "one/two/three" returns ["one", "one/two", "one/two/three"]
    private static *getTraversalLinks(link: string) {
        if (link === ".") return;

        let lastIndex = 0;
        while (true) {
            lastIndex = link.indexOf(path.sep, lastIndex);
            if (lastIndex === -1) {
                yield link;
                return;
            }
            yield link.substring(0, lastIndex);
            lastIndex += 1;
        }
    }

    // follows the link and return all its parent folders and the file
    private *traverse(link: string) {
        let curEntry: Entry | undefined = this.root;
        for (const curLink of Registry.getTraversalLinks(link)) {
            if (curEntry === undefined) throw `Path not found: ${link}`;

            yield curEntry;
            curEntry = curEntry.subdir?.[curLink];
        }
        yield curEntry;
    }

    private static normalize(link: string) {
        return path.normalize(link);
    }
}

export { Registry, Entry };
