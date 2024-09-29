import path from "node:path";

type Entry = {
    subdir: { [link: string]: Entry } | null;
    title: string;
    order: number | null;
};

class Registry {
    private root: Entry = { subdir: {}, title: "Root", order: null };

    constructor() {}

    register(link: string, details: Entry) {
        link = Registry.normalize(link);

        // add entry to parent entry
        const parentEntry = this.get(path.dirname(link));
        if (!parentEntry || parentEntry.subdir === null) throw `Path not found ${link}`;
        parentEntry.subdir[link] = details;
    }

    unregister(link: string) {
        link = Registry.normalize(link);

        const parentEntry = this.get(path.dirname(link));
        if (!parentEntry || parentEntry.subdir === null) throw `Path not found ${link}`;
        delete parentEntry.subdir[link];
    }

    // "/one/two/three" returns ["/one", "/one/two", "/one/two/three"]
    static *traverseLinks(link: string) {
        link = Registry.normalize(link);
        if (link === "/") return;

        let lastIndex = 1;
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
    *traverse(link: string) {
        let curEntry: Entry | undefined = this.root;
        for (const curLink of Registry.traverseLinks(link)) {
            if (curEntry === undefined) throw `Path not found: ${link}`;

            yield curEntry;
            curEntry = curEntry.subdir?.[curLink];
        }
        yield curEntry!;
    }

    // follows the link and return the last entry
    get(link: string) {
        let entry = null;
        for (entry of this.traverse(link)) {
            // do nothing
        }
        return entry!;
    }

    private static normalize(link: string) {
        return path.join("/", path.normalize(link));
    }
}

export { Registry, Entry };
6;
