import path from "node:path";

type FileEntry = {
    isFolder: false;
    label: string;
    order: number | null;
    content: string;
};
type FolderEntry = {
    isFolder: true;
    label: string;
    order: number | null;
    indexLink: string;
    subdir: { [link: string]: Entry };
};
type Entry = FileEntry | FolderEntry;

class Registry {
    private root: FolderEntry;

    constructor(root: FolderEntry) {
        this.root = root;
    }

    register(link: string, details: Entry) {
        // add entry to parent folder
        const parentFolder = [...this.traverse(path.dirname(link))].at(-1);
        if (!parentFolder || !parentFolder.isFolder) throw `Path not found ${link}`;
        parentFolder.subdir[link] = details;
    }

    // "one/two/three" returns ["one", "one/two", "one/two/three"]
    private static *getTraversalLinks(link: string) {
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
        let curFolder = this.root;
        for (const curLink of Registry.getTraversalLinks(link)) {
            const curEntry = curFolder.subdir[curLink];
            if (!curEntry || !curEntry.isFolder) throw `Path not found: ${link}`;

            yield curEntry;
            curFolder = curEntry;
        }
    }
}

export { Registry };
export { FileEntry, FolderEntry, Entry };
