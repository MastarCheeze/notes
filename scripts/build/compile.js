import fs from "node:fs/promises";
const TEMPLATE_PATH = "scripts/src/template.html";
const template = await fs.readFile(TEMPLATE_PATH, { encoding: "utf-8" });
export function compile(contents, config) {
    let doc = template;
    doc = doc.replace("$$content$$", contents);
    doc = doc.replace("$$title$$", config.title);
    doc = doc.replace("$$baseUrl$$", config.baseUrl);
    doc = doc.replace("$$breadcrumb$$", createBreadcrumb(config.breadcrumb));
    doc = doc.replace("$$dirTree$$", createDirTree(config.dirTree));
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
        let html = "<ul>";
        for (const [label, link, subtree] of dirTree) {
            if (subtree === undefined)
                html += `<li class="file"><a href="${link}">${label}</a></li>`;
            else {
                html += `<li class="folder"><a href="${link}">${label}</a>${recursiveCreate(subtree)}</li>`;
            }
        }
        html += "</ul>";
        return html;
    }
    return recursiveCreate(dirTree);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21waWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBVWxDLE1BQU0sYUFBYSxHQUFHLDJCQUEyQixDQUFDO0FBQ2xELE1BQU0sUUFBUSxHQUFHLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztBQUV6RSxNQUFNLFVBQVUsT0FBTyxDQUFDLFFBQWdCLEVBQUUsTUFBcUI7SUFLM0QsSUFBSSxHQUFHLEdBQUcsUUFBUSxDQUFDO0lBRW5CLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMzQyxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzdDLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDakQsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDekUsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUVoRSxPQUFPLEdBQUcsQ0FBQztBQUNmLENBQUM7QUFFRCxTQUFTLGdCQUFnQixDQUFDLFVBQXVDO0lBQzdELElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUNkLEtBQUssTUFBTSxDQUFFLEtBQUssRUFBRSxJQUFJLENBQUUsSUFBSSxVQUFVLEVBQUUsQ0FBQztRQUN2QyxJQUFJLElBQUksS0FBSyxJQUFJO1lBQ2IsSUFBSSxJQUFJLGdCQUFnQixJQUFJLEtBQUssS0FBSyxXQUFXLENBQUM7O1lBRWxELElBQUksSUFBSSxPQUFPLEtBQUssT0FBTyxDQUFDO0lBQ3BDLENBQUM7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNoQixDQUFDO0FBRUQsU0FBUyxhQUFhLENBQUMsT0FBaUM7SUFDcEQsSUFBSSxPQUFPLEtBQUssU0FBUztRQUNyQixPQUFPLEVBQUUsQ0FBQztJQUVkLFNBQVMsZUFBZSxDQUFDLE9BQWdCO1FBQ3JDLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQztRQUNsQixLQUFLLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQzNDLElBQUksT0FBTyxLQUFLLFNBQVM7Z0JBQ3JCLElBQUksSUFBSSw2QkFBNkIsSUFBSSxLQUFLLEtBQUssV0FBVyxDQUFDO2lCQUM5RCxDQUFDO2dCQUVGLElBQUksSUFBSSwrQkFBK0IsSUFBSSxLQUFLLEtBQUssT0FBTyxlQUFlLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztZQUNoRyxDQUFDO1FBQ0wsQ0FBQztRQUNELElBQUksSUFBSSxPQUFPLENBQUM7UUFDaEIsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUNELE9BQU8sZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3BDLENBQUMifQ==