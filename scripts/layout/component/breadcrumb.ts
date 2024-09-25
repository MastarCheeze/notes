type BreadcrumbArgs = { breadcrumb: { label: string; link: string | null }[], lastFileIsDir: boolean};

function createBreadcrumb(breadcrumb: BreadcrumbArgs) {
    let html = "";
    for (const [i, entry] of breadcrumb.breadcrumb.entries()) {
        let icon = "";
        if (i === breadcrumb.breadcrumb.length && breadcrumb.lastFileIsDir) {
            icon = "📄 ";
        }

        if (entry.link) {
            html += `<li><a href="${entry.link}">${icon}${entry.label}</a></li>`;
        } else {
            html += `<li>${icon}${entry.label}</li>`;
        }
    }
    return html;
}

export { createBreadcrumb, BreadcrumbArgs };
