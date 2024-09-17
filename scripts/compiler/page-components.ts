export type Breadcrumb = { link: string | null; label: string; isDir: boolean }[];
export function createBreadcrumb(breadcrumb: Breadcrumb) {
    let html = "";
    for (const entry of breadcrumb) {
        const icon = entry.isDir ? "" : "📄 ";
        if (entry.link) {
            html += `<li><a href="${entry.link}">${icon}${entry.label}</a></li>`;
        } else {
            html += `<li>${icon}${entry.label}</li>`;
        }
    }
    return html;
}

export type DirTree = { link: string | null; label: string; subtree: DirTree | null }[];
export function createDirTree(dirTree: DirTree) {
    const recursiveCreate = (curDirTree: DirTree) => {
        // create dirtree
        let html = `<ul style="display: none;">`; // collapse folder by default
        for (const entry of curDirTree) {
            let li = entry.label;
            if (entry.subtree === null) {
                li = `📄 ${li}`;
            }
            if (entry.link) {
                li = `<a href="${entry.link}">${li}</a>`;
            }
            if (entry.subtree) {
                li = `<a class="folderButton">📁 </a>${li}${recursiveCreate(entry.subtree)}`;
            }
            html += `<li>${li}</li>`;
        }
        html += "</ul>";
        return html;
    };

    let html = recursiveCreate(dirTree);
    html = html.replace(`<ul style="display: none;">`, "<ul>"); // expand outermost ul element
    return html;
}
