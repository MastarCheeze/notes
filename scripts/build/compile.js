import fs from "node:fs/promises";
const templatePaths = {
    "page": "scripts/src/templates/page.html",
    "index": "scripts/src/templates/index.html",
};
const templates = Object.fromEntries(Object.keys(templatePaths).map((key) => [key, ""]));
for (const [key, path] of Object.entries(templatePaths)) {
    templates[key] = await fs.readFile(path, { encoding: "utf-8" });
}
export function compile(contents, template, config) {
    let doc = templates[template];
    doc = doc.replace("$$content$$", contents);
    doc = doc.replace("$$title$$", config.title);
    doc = doc.replace("$$baseUrl$$", config.baseUrl);
    doc = doc.replace("$$breadcrumb$$", createBreadcrumb(config.breadcrumb));
    if (template === "index") {
        doc = doc.replace("$$dirTree$$", createDirTree(config.dirTree));
    }
    return doc;
}
function createBreadcrumb(breadcrumb) {
    let html = "";
    for (const [label, link] of breadcrumb) {
        if (link !== null)
            html += `<li><a href="${link}">${label}</a></li>`;
        else
            html += `<li>${label}</li>`;
    }
    return html;
}
function createDirTree(dirTree) {
    if (dirTree === undefined)
        return "";
    function recursiveCreate(dirTree) {
        let html = `<ul style="display: none;">`;
        for (const [label, link, subtree] of dirTree) {
            if (subtree === undefined)
                html += `<li><a href="${link}">📄 ${label}</a></li>`;
            else {
                html += `<li><a class="folderButton">📁 </a>`;
                if (link !== null)
                    html += `<a href="${link}">${label}</a>`;
                else
                    html += `<span>${label}</span>`;
                html += `${recursiveCreate(subtree)}</li>`;
            }
        }
        html += "</ul>";
        return html;
    }
    let html = recursiveCreate(dirTree);
    html = html.replace(`<ul style="display: none;">`, "<ul>");
    return html;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21waWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBWWxDLE1BQU0sYUFBYSxHQUFrQztJQUNqRCxNQUFNLEVBQUUsaUNBQWlDO0lBQ3pDLE9BQU8sRUFBRSxrQ0FBa0M7Q0FDOUMsQ0FBQTtBQUVELE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQXlCLENBQUM7QUFDakgsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztJQUN0RCxTQUFTLENBQUMsR0FBZSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFBO0FBQy9FLENBQUM7QUFFRCxNQUFNLFVBQVUsT0FBTyxDQUFDLFFBQWdCLEVBQUUsUUFBa0IsRUFBRSxNQUFxQjtJQUsvRSxJQUFJLEdBQUcsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFOUIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzNDLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDN0MsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNqRCxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUV6RSxJQUFJLFFBQVEsS0FBSyxPQUFPLEVBQUUsQ0FBQztRQUN2QixHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3BFLENBQUM7SUFFRCxPQUFPLEdBQUcsQ0FBQztBQUNmLENBQUM7QUFFRCxTQUFTLGdCQUFnQixDQUFDLFVBQXVDO0lBQzdELElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUNkLEtBQUssTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSSxVQUFVLEVBQUUsQ0FBQztRQUNyQyxJQUFJLElBQUksS0FBSyxJQUFJO1lBQ2IsSUFBSSxJQUFJLGdCQUFnQixJQUFJLEtBQUssS0FBSyxXQUFXLENBQUM7O1lBRWxELElBQUksSUFBSSxPQUFPLEtBQUssT0FBTyxDQUFDO0lBQ3BDLENBQUM7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNoQixDQUFDO0FBRUQsU0FBUyxhQUFhLENBQUMsT0FBaUM7SUFDcEQsSUFBSSxPQUFPLEtBQUssU0FBUztRQUNyQixPQUFPLEVBQUUsQ0FBQztJQUVkLFNBQVMsZUFBZSxDQUFDLE9BQWdCO1FBQ3JDLElBQUksSUFBSSxHQUFHLDZCQUE2QixDQUFDO1FBQ3pDLEtBQUssTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksT0FBTyxFQUFFLENBQUM7WUFDM0MsSUFBSSxPQUFPLEtBQUssU0FBUztnQkFDckIsSUFBSSxJQUFJLGdCQUFnQixJQUFJLFFBQVEsS0FBSyxXQUFXLENBQUM7aUJBQ3BELENBQUM7Z0JBQ0YsSUFBSSxJQUFJLHFDQUFxQyxDQUFDO2dCQUM5QyxJQUFJLElBQUksS0FBSyxJQUFJO29CQUNiLElBQUksSUFBSSxZQUFZLElBQUksS0FBSyxLQUFLLE1BQU0sQ0FBQzs7b0JBRXpDLElBQUksSUFBSSxTQUFTLEtBQUssU0FBUyxDQUFDO2dCQUNwQyxJQUFJLElBQUksR0FBRyxlQUFlLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztZQUMvQyxDQUFDO1FBQ0wsQ0FBQztRQUNELElBQUksSUFBSSxPQUFPLENBQUM7UUFDaEIsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUNELElBQUksSUFBSSxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNwQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyw2QkFBNkIsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMzRCxPQUFPLElBQUksQ0FBQztBQUNoQixDQUFDIn0=