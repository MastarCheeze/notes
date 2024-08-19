import fs from "node:fs/promises";
const BASE_TEMPLATE_PATH = "scripts/src/templates/base.html";
const TEMPLATE_PATHS = {
    "page": "scripts/src/templates/page.html",
    "index": "scripts/src/templates/index.html",
};
const baseTemplate = (await fs.readFile(BASE_TEMPLATE_PATH, { encoding: "utf-8" })).normalize();
const templates = Object.fromEntries(Object.keys(TEMPLATE_PATHS).map((key) => [key, ""]));
for (const [key, path] of Object.entries(TEMPLATE_PATHS)) {
    templates[key] = (await fs.readFile(path, { encoding: "utf-8" })).normalize();
    console.log(templates[key]);
}
console.log(baseTemplate);
export function compile(contents, template, config) {
    let doc = baseTemplate;
    doc = doc.replace("{{template}}", templates[template]);
    console.log(doc);
    doc = doc.replace("{{content}}", contents);
    doc = doc.replace("{{title}}", config.title);
    doc = doc.replace("{{baseUrl}}", config.baseUrl);
    doc = doc.replace("{{breadcrumb}}", createBreadcrumb(config.breadcrumb));
    if (template === "index") {
        doc = doc.replace("{{dirTree}}", createDirTree(config.dirTree));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21waWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBWWxDLE1BQU0sa0JBQWtCLEdBQUcsaUNBQWlDLENBQUM7QUFDN0QsTUFBTSxjQUFjLEdBQWtDO0lBQ2xELE1BQU0sRUFBRSxpQ0FBaUM7SUFDekMsT0FBTyxFQUFFLGtDQUFrQztDQUM5QyxDQUFBO0FBRUQsTUFBTSxZQUFZLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ2hHLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQTBCLENBQUM7QUFDbkgsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQztJQUN2RCxTQUFTLENBQUMsR0FBZSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUMxRixPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFlLENBQUMsQ0FBQyxDQUFDO0FBQzVDLENBQUM7QUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBRTFCLE1BQU0sVUFBVSxPQUFPLENBQUMsUUFBZ0IsRUFBRSxRQUFrQixFQUFFLE1BQXFCO0lBSy9FLElB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