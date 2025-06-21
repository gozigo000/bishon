import { ONode } from "../2-xmlParser/nodes";

const fallbackContentTypes: Record<string, string> = {
    "png": "png",
    "gif": "gif",
    "jpeg": "jpeg",
    "jpg": "jpeg",
    "tif": "tiff",
    "tiff": "tiff",
    "bmp": "bmp"
};

export type ContentTypes = {
    findContentType: (path: string) => string;
}

export function readContentTypes(element: ONode): ContentTypes {
    const extensionDefaults: Record<string, string> = {};
    const overrides: Record<string, string> = {};

    element.children.forEach(child => {
        if (child.type !== "element") return;
        if (child.name === "content-types:Default") {
            extensionDefaults[child.attributes.Extension] = child.attributes.ContentType;
        }
        if (child.name === "content-types:Override") {
            let name: string = child.attributes.PartName;
            if (name.charAt(0) === "/") {
                name = name.substring(1);
            }
            overrides[name] = child.attributes.ContentType;
        }
    });
    return makeContentTypeFinder(overrides, extensionDefaults);
}

export const defaultContentTypes: ContentTypes = makeContentTypeFinder({}, {});

function makeContentTypeFinder(
    overrides: Record<string, string>,
    extensionDefaults: Record<string, string>
): ContentTypes {
    return {
        findContentType: function (path: string): string {
            const overrideContentType = overrides[path];
            if (overrideContentType) {
                return overrideContentType;
            }
            const pathParts = path.split(".");
            const extension = pathParts[pathParts.length - 1];
            if (extensionDefaults.hasOwnProperty(extension)) {
                return extensionDefaults[extension];
            }
            const fallback = fallbackContentTypes[extension.toLowerCase()];
            if (fallback) {
                return "image/" + fallback;
            }
            return '';
        }
    };
}
