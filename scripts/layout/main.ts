import template from "./template.js";
import { createBreadcrumb } from "./component/breadcrumb.js";
import type { BreadcrumbArgs } from "./component/breadcrumb.js";
import { createDirectory } from "./component/directory.js";
import type { DirectoryArgs } from "./component/directory.js";

function buildPage(content: string, title: string, breadcrumb: BreadcrumbArgs): string {
    return template("page", {
        content: content,
        title: title,
        breadcrumb: createBreadcrumb(breadcrumb),
    });
}

function buildIndex(content: string, title: string, breadcrumb: BreadcrumbArgs, directory: DirectoryArgs): string {
    return template("index", {
        content: content,
        title: title,
        breadcrumb: createBreadcrumb(breadcrumb),
        directory: createDirectory(directory),
    });
}

export { buildPage, buildIndex };
export { BreadcrumbArgs, DirectoryArgs };
