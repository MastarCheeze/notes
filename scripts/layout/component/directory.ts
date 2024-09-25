type DirectoryArgs = { label: string; link: string | null; subdir: DirectoryArgs | null }[];

function createDirectory(directory: DirectoryArgs) {
    const recursiveCreate = (curDirectory: DirectoryArgs) => {
        let html = `<ul style="display: none;">`; // collapse folder by default
        for (const entry of curDirectory) {
            let li = entry.label;
            if (entry.subdir === null) {
                li = `📄 ${li}`;
            }
            if (entry.link) {
                li = `<a href="${entry.link}">${li}</a>`;
            }
            if (entry.subdir) {
                li = `<a class="folderButton">📁 </a>${li}${recursiveCreate(entry.subdir)}`;
            }
            html += `<li>${li}</li>`;
        }
        html += "</ul>";
        return html;
    };

    let html = recursiveCreate(directory);
    html = html.replace(`<ul style="display: none;">`, "<ul>"); // expand outermost ul element
    return html;
}

export { createDirectory, DirectoryArgs };
