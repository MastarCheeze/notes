type BreadcrumbArgs = { breadcrumb: { title: string; link: string | null }[], lastFileIsDir: boolean};

function createBreadcrumb(breadcrumb: BreadcrumbArgs) {
    let html = "";
    for (const [i, entry] of breadcrumb.breadcrumb.entries()) {
        let icon = "";
        if (i === breadcrumb.breadcrumb.length && breadcrumb.lastFileIsDir) {
            icon = "📄 ";
        }

        if (entry.link) {
            html += `<li><a href="${entry.link}">${icon}${entry.title}</a></li>`;
        } else {
            html += `<li>${icon}${entry.title}</li>`;
        }
    }
    return html;
}

export { createBreadcrumb, BreadcrumbArgs };
